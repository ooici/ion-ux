from flask import json, Flask, request, session, jsonify, render_template, redirect, url_for, escape, send_file, g, make_response
import requests #, json
from functools import wraps
import base64
import hashlib
import time
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime

from config import FLASK_HOST, FLASK_PORT, GATEWAY_HOST, GATEWAY_PORT, LOGGED_IN, PRODUCTION, SECRET_KEY, UI_MODE, PORTAL_ROOT
from service_api import ServiceApi, error_message
from layout_api import LayoutApi
from jinja2 import Template
from urlparse import urlparse, parse_qs
import re
import os
from config import *
from logging import Formatter

# Attachments
from StringIO import StringIO
from mimetypes import guess_extension


app = Flask(__name__)
app.secret_key = SECRET_KEY
app.debug = True
app.logger.setLevel(LOGGING_LEVEL)


def get_versions():
    if not hasattr(g, "ion_ux_version"):
        g.ion_ux_version = "unknown"

        try:
            with open(os.path.join(PORTAL_ROOT, "VERSION.txt")) as f:
                g.ion_ux_version = f.readline().strip()
        except IOError:
            pass

    return g.ion_ux_version

def clean_session():
    session.clear()

def render_app_template(current_url):
    tmpl = Template(LayoutApi.process_layout())
    return render_template(tmpl)

def render_json_response(service_api_response):
    def decorate_error_response(response):
        if PRODUCTION:
            del response['GatewayError']['Trace']

        # if we've expired, that means we need to relogin
        if response['GatewayError']['Exception'] == "Unauthorized" and "expired" in response['GatewayError']['Message']:
            clean_session()
            response['GatewayError']['NeedLogin'] = True

        return response

    def is_error_response(response):
        return isinstance(response, dict) and response.has_key('GatewayError')

    if isinstance(service_api_response, list):
        for r in service_api_response:
            if is_error_response(r):
                decorate_error_response(r)

        if any(map(is_error_response, service_api_response)):
            error_response = make_response(json.dumps({'data': service_api_response}), 400)
            error_response.headers['Content-Type'] = 'application/json'

            return error_response

    if is_error_response(service_api_response):

        decorate_error_response(service_api_response)

        error_response = make_response(json.dumps({'data': service_api_response}), 400)
        error_response.headers['Content-Type'] = 'application/json'

        return error_response
    else:
        return jsonify(data=service_api_response)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not 'user_id' in session:
            return render_json_response(error_message(msg='You must be signed in to use this feature.'))
        return f(*args, **kwargs)
    return decorated_function



# -----------------------------------------------------------------------------
# ROUTES
# -----------------------------------------------------------------------------

@app.route('/')
def index():
    return render_app_template(request.path)

@app.route('/failed')
def failed_login():
     return redirect(url_for('index', cl="cf"))

# -----------------------------------------------------------------------------
# SEARCH & ATTACHMENTS
# -----------------------------------------------------------------------------

@app.route('/search/', methods=['GET', 'POST'])
def search(query=None):
    if request.is_xhr:
        if request.method == "GET":
            search_query = request.args.get('query')
            search_results = ServiceApi.search(search_query)
            return render_json_response(search_results)
        else:
            adv_query_string = request.form['adv_query_string']
            adv_query_chunks = parse_qs(adv_query_string)

            geospatial_bounds = {'north': adv_query_chunks.get('north', [''])[0],
                                  'east': adv_query_chunks.get('east', [''])[0],
                                 'south': adv_query_chunks.get('south', [''])[0],
                                  'west': adv_query_chunks.get('west', [''])[0]}

            vertical_bounds   = {'lower': adv_query_chunks.get('vertical-lower-bound', [''])[0],
                                 'upper': adv_query_chunks.get('vertical-upper-bound', [''])[0]}

            temporal_bounds   = {'from': adv_query_chunks.get('temporal-from-ctrl', [''])[0],
                                   'to': adv_query_chunks.get('temporal-to-ctrl', [''])[0]}

            search_criteria   = zip(adv_query_chunks.get('filter_var', []),
                                    adv_query_chunks.get('filter_operator', []),
                                    adv_query_chunks.get('filter_arg', []))

            search_results    = ServiceApi.adv_search(geospatial_bounds,
                                                      vertical_bounds,
                                                      temporal_bounds,
                                                      search_criteria)

        return render_json_response(search_results)
    else:
        return render_app_template(request.path)

@app.route('/attachment/<attachment_id>/', methods=['GET'])
def attachment(attachment_id):
    url = 'http://%s:%d/ion-service/attachment/%s' % (GATEWAY_HOST, GATEWAY_PORT, attachment_id)
    attachment_response = requests.get(url)
    attachment = StringIO(attachment_response.content)
    attachment_ext = guess_extension(attachment_response.headers.get('content-type'))
    attachment_name = request.args.get('name') if request.args.get('name') else 'OOI_%s' % attachment_id
    
    #check ext not invalid
    if attachment_ext is not None:
        if (attachment_filename.endswith(attachment_ext)):
            attachment_filename = '%s' % (attachment_name)
        else: 
            attachment_filename = '%s%s' % (attachment_name, attachment_ext)
    else:   
        attachment_filename = '%s' % (attachment_name)
    
    #return string 
    return send_file(attachment, attachment_filename=attachment_filename, as_attachment=True)

@app.route('/attachment/', methods=['POST'])
def attachment_create():
    fd = request.files['attachment']
    attachment_type = 2
    if fd.mimetype.startswith("text/"):
        attachment_type = 1

    retval = ServiceApi.create_resource_attachment(request.form['resource_id'],
                                                   fd.filename,
                                                   request.form['description'],
                                                   attachment_type,
                                                   fd.mimetype,
                                                   fd,
                                                   request.form['keywords'],
                                                   request.form['created_by'],
                                                   request.form['modified_by'])

    dat = {'files':[{'name':fd.filename, 'size':fd.content_length}]}
    return jsonify(dat)

@app.route('/attachment/<attachment_id>/', methods=['DELETE'])
def attachment_delete(attachment_id):
    resp = ServiceApi.delete_resource_attachment(attachment_id)
    return render_json_response(resp)

@app.route('/attachment/<attachment_id>/is_owner/<actor_id>/', methods=['GET'])
def attachment_is_owner(attachment_id, actor_id):
    if not actor_id:
        return jsonify({'data':False})

    return ServiceApi.attachment_is_owner(attachment_id, actor_id)

# -----------------------------------------------------------------------------
# EVENT SUBSCRIPTIONS
# -----------------------------------------------------------------------------

@app.route('/event_types/', methods=['GET'])
@login_required
def event_types():
    event_types = ServiceApi.get_event_types()
    return jsonify(data=event_types)

@app.route('/create/', methods=['POST'])
@login_required
def create_resource():
    resp = ServiceApi.create_resource(request.form.get('resource_type', None), request.form.get('org_id', None))
    return render_json_response(resp)

@app.route('/<resource_type>/face/<resource_id>/subscribe/', methods=['GET'])
@app.route('/<resource_type>/command/<resource_id>/subscribe/', methods=['GET'])
@login_required
def subscribe_to_resource(resource_type, resource_id):
    resource_name = request.args.get('resource_name')
    event_type = request.args.get('event_type')
    resp = ServiceApi.create_user_notification(resource_type, resource_id, event_type, session['user_id'], resource_name)
    return render_json_response(resp)

@app.route('/<resource_type>/face/<resource_id>/unsubscribe/', methods=['GET'])
@app.route('/<resource_type>/command/<resource_id>/unsubscribe/', methods=['GET'])
@login_required
def unsubscribe_to_resource(resource_type, resource_id):
    notification_id = request.args.get('notification_id')
    resp = ServiceApi.delete_user_subscription(notification_id)
    return render_json_response(resp)

@app.route('/<resource_type>/face/<resource_id>/enroll/', methods=['POST'])
@app.route('/<resource_type>/command/<resource_id>/enroll/', methods=['POST'])
@login_required
def enroll_request(resource_type, resource_id):
    actor_id = session.get('actor_id') if session.has_key('actor_id') else None
    resp = ServiceApi.enroll_request(resource_id, actor_id)
    return render_json_response(resp)

@app.route('/<resource_type>/face/<resource_id>/request_role/', methods=['POST'])
@app.route('/<resource_type>/command/<resource_id>/request_role/', methods=['POST'])
@login_required
def request_role(resource_type, resource_id):
    actor_id = session.get('actor_id') if session.has_key('actor_id') else None
    role_name = request.form.get('role_name', None)

    resp = ServiceApi.request_role(resource_id, actor_id, role_name)
    return render_json_response(resp)

@app.route('/<resource_type>/face/<resource_id>/invite_user/', methods=['POST'])
@app.route('/<resource_type>/command/<resource_id>/invite_user/', methods=['POST'])
@login_required
def invite_user(resource_type, resource_id):
    user_id = request.form.get('user_id', None)

    resp = ServiceApi.invite_user(resource_id, user_id)
    return render_json_response(resp)

@app.route('/<resource_type>/face/<resource_id>/offer_user_role/', methods=['POST'])
@app.route('/<resource_type>/command/<resource_id>/offer_user_role/', methods=['POST'])
@login_required
def offer_user_role(resource_type, resource_id):
    user_id = request.form.get('user_id', None)
    role_name = request.form.get('role_name', None)

    resp = ServiceApi.offer_user_role(resource_id, user_id, role_name)
    return render_json_response(resp)

@app.route('/<resource_type>/face/<resource_id>/request_access/', methods=['POST'])
@app.route('/<resource_type>/command/<resource_id>/request_access/', methods=['POST'])
@login_required
def request_access(resource_type, resource_id):
    org_id = request.form.get('org_id', None)
    res_name = request.form.get('res_name', None)
    actor_id = session.get('actor_id') if session.has_key('actor_id') else None

    resp = ServiceApi.request_access(resource_id, res_name, actor_id, org_id)
    return render_json_response(resp)

@app.route('/<resource_type>/face/<resource_id>/release_access/', methods=['POST'])
@app.route('/<resource_type>/command/<resource_id>/release_access/', methods=['POST'])
@login_required
def release_access(resource_type, resource_id):
    commitment_id = request.form.get('commitment_id', None)

    resp = ServiceApi.release_access(commitment_id)
    return render_json_response(resp)

@app.route('/<resource_type>/face/<resource_id>/request_exclusive_access/', methods=['POST'])
@app.route('/<resource_type>/command/<resource_id>/request_exclusive_access/', methods=['POST'])
@login_required
def request_exclusive_access(resource_type, resource_id):
    expiration = int(request.form.get('expiration', None))
    curtime = int(round(time.time() * 1000))
    full_expiration = str(curtime + (expiration * 60 * 60 * 1000)) # in ms
    actor_id = session.get('actor_id') if session.has_key('actor_id') else None
    org_id = request.form.get('org_id', None)

    resp = ServiceApi.request_exclusive_access(resource_id, actor_id, org_id, full_expiration)
    return render_json_response(resp)

@app.route('/negotiation/', methods=['POST'])
@login_required
def accept_reject_negotiation():
    negotiation_id = request.form.get('negotiation_id', None)
    verb           = request.form.get('verb', None)
    originator     = request.form.get('originator', None)
    reason         = request.form.get('reason', None)

    resp = ServiceApi.accept_reject_negotiation(negotiation_id, verb, originator, reason)
    return render_json_response(resp)

@app.route('/<resource_type>/face/<resource_id>/transition/', methods=['POST'])
@app.route('/<resource_type>/command/<resource_id>/transition/', methods=['POST'])
@login_required
def change_lcstate(resource_type, resource_id):
    transition_event = request.form['transition_event'].lower()
    transition = ServiceApi.transition_lcstate(resource_id, transition_event)
    return render_json_response(transition)

@app.route('/<resource_type>/face/<resource_id>/publish_event/', methods=['POST'])
@app.route('/<resource_type>/command/<resource_id>/publish_event/', methods=['POST'])
def publish_event(resource_type, resource_id):
    if resource_type == 'InstrumentDevice':
        event_type = 'DeviceOperatorEvent'
    else:
        event_type  = 'ResourceOperatorEvent'

    sub_type    = None
    description = request.form['description']

    # possible override for event type - if comes from a source like "report issue"
    if 'event_type' in request.form:
        event_type = request.form['event_type']

    resp = ServiceApi.publish_event(event_type, resource_id, resource_type, sub_type, description)
    return render_json_response(resp)

# -----------------------------------------------------------------------------
# FACE, STATUS, RELATED PAGES
# -----------------------------------------------------------------------------

@app.route('/<resource_type>/face/<resource_id>/', methods=['GET','PUT'])
@app.route('/<resource_type>/command/<resource_id>/', methods=['GET','PUT'])
def page(resource_type, resource_id):
    if request.is_xhr:
        if request.method == 'PUT':
            resource_obj = json.loads(request.data)
            updated_resource = ServiceApi.update_resource(resource_type, resource_obj)
            return render_json_response(updated_resource)
        else:
            return
    else:
        return render_app_template(request.path)

# -----------------------------------------------------------------------------
# COLLECTION "FACE" PAGES
# -----------------------------------------------------------------------------

@app.route('/<resource_type>/list/', methods=['GET'])
def collection(resource_type=None):
    if request.is_xhr:
        # Todo - Implement "My Resources" as a separate call when they are available (observatories, platforms, etc.)...
        # Todo - user_info_id set in a @login_required decorator
        user_info_id = session.get('user_id') if session.has_key('user_id') else None
        resources = ServiceApi.find_by_resource_type(resource_type, user_info_id)
        return render_json_response(resources)
    else:
        return render_app_template(request.path)

# -----------------------------------------------------------------------------
# RESOURCE EXTENSION & RELATED SITES API
# -----------------------------------------------------------------------------

@app.route('/<resource_type>/extension/<resource_id>/', methods=['GET'])
def extension(resource_type, resource_id):
    # Login not required to view, but required for user specific things
    # like event notifications, etc.
    user_id = session['user_id'] if session.has_key('user_id') else None
    extension = ServiceApi.get_extension(resource_type, resource_id, user_id)
    return render_json_response(extension)

@app.route('/related_sites/<resource_id>/', methods=['GET'])
def related_sites(resource_id):
    related_sites = ServiceApi.find_related_sites(resource_id)
    return render_json_response(related_sites)

@app.route('/related_objects_has_resource/<resource_id>/', methods=['GET'])
def related_objects_has_resource(resource_id):
    related_objects_has_resource = ServiceApi.find_related_objects_has_resource(resource_id)
    return render_json_response(related_objects_has_resource)

@app.route('/related_objects_has_attachment/<resource_id>/', methods=['GET'])
def related_objects_has_attachment(resource_id):
    related_objects_has_attachment = ServiceApi.find_related_objects_has_attachment(resource_id)
    return render_json_response(related_objects_has_attachment)

@app.route('/related_objects_has_role/<resource_id>/', methods=['GET'])
def related_objects_has_role(resource_id):
    related_objects_has_role = ServiceApi.find_related_objects_has_role(resource_id)
    return render_json_response(related_objects_has_role)

@app.route('/get_data_product_group_list/', methods=['GET'])
def get_data_product_group_list():
    dp_group_list = ServiceApi.get_data_product_group_list()
    return render_json_response(dp_group_list)

@app.route('/find_site_data_products/<resource_id>/', methods=['GET'])
def find_site_data_products(resource_id):
    site_data_products = ServiceApi.find_site_data_products(resource_id)
    return render_json_response(site_data_products)
    
@app.route('/get_sites_status/', methods=['GET', 'POST'])
def get_sites_status():
    # status = Servi1ceApi.find_status()
    # resource_ids = request.args.get('data')
    resource_ids = request.json['resource_ids']
    sites_status = ServiceApi.get_sites_status(resource_ids)
    return render_json_response(sites_status)

@app.route('/map/<resource_id>/', methods=['GET'])
@app.route('/map/data/<resource_id>', methods=['GET'])
@app.route('/resources/', methods=['GET'])
@app.route('/resources/<resource_id>/', methods=['GET'])
def dashboard_redirect(resource_id=None):
    '''Temporary redict until dashboard init supports html requests.'''
    return redirect('/')

@app.route('/activate_primary/', methods=['POST'])
@login_required
def activate_primary():
    deployment_id = request.form.get('deployment_id', None)
    primary = ServiceApi.activate_primary(deployment_id)
    return render_json_response(primary)

@app.route('/deactivate_primary/', methods=['POST'])
@login_required
def deactivate_primary():
    deployment_id = request.form.get('deployment_id', None)
    deactivate_primary = ServiceApi.deactivate_primary(deployment_id)
    return render_json_response(deactivate_primary)

@app.route('/activate_persistence/', methods=['POST'])
@login_required
def activate_persistence():
    data_product_id = request.form.get('data_product_id', None)
    pers = ServiceApi.activate_persistence(data_product_id)
    return render_json_response(pers)

@app.route('/suspend_persistence/', methods=['POST'])
@login_required
def suspend_persistence():
    data_product_id = request.form.get('data_product_id', None)
    pers = ServiceApi.suspend_persistence(data_product_id)
    return render_json_response(pers)

# -----------------------------------------------------------------------------
# COMMAND RESOURCE PAGES
# -----------------------------------------------------------------------------

@app.route('/<device_type>/command/<instrument_device_id>/<agent_command>/', methods=['GET', 'POST', 'PUT'])
# @login_required
def instrument_command(device_type, instrument_device_id, agent_command, cap_type=None, session_type=None):
    cap_type = request.args.get('cap_type')
    if request.method in ('POST', 'PUT'):
        if agent_command == 'set_agent':
            resource_params = json.loads(request.data)
            command_response = ServiceApi.set_agent(instrument_device_id, resource_params)
        elif agent_command == 'set_resource':
            resource_params = json.loads(request.data)
            command_response = ServiceApi.set_resource(instrument_device_id, resource_params)
        elif agent_command == 'start':
            command_response = ServiceApi.instrument_agent_start(instrument_device_id)
        elif agent_command == 'stop':
            command_response = ServiceApi.instrument_agent_stop(instrument_device_id)
        else:
            if agent_command == 'RESOURCE_AGENT_EVENT_GO_DIRECT_ACCESS':
                session_type = request.args.get('session_type')
            command_response = ServiceApi.instrument_execute(instrument_device_id, agent_command, cap_type, session_type)
    else:
        if agent_command == 'get_capabilities':
            command_response = ServiceApi.instrument_agent_get_capabilities(instrument_device_id)
        elif agent_command == 'get_resource':
            command_response = ServiceApi.get_resource(instrument_device_id)
        elif agent_command == 'get_platform_agent_state':
            command_response = ServiceApi.platform_agent_state(instrument_device_id, 'get_agent_state')
    return render_json_response(command_response)



@app.route('/TaskableResource/command/<resource_id>/<command>/', methods=['GET', 'POST', 'PUT'])
# @login_required
def taskable_command(resource_id, command, cap_type=None, session_type=None):
    cap_type = request.args.get('cap_type')
    
    if request.method in ('POST', 'PUT'):
        command_response = ServiceApi.taskable_execute(resource_id, command)
    else:
        if command == 'get_capabilities':
            app.logger.debug('get_capabilities')
            command_response = ServiceApi.tasktable_get_capabilities(resource_id)
    return render_json_response(command_response)

# @app.route('/PlatformDevice/command/<platform_device_id>/<agent_command>/')
@app.route('/PlatformDevice/command/<platform_device_id>/<agent_command>/<agent_instance_id>/')
def start_platform_agent(platform_device_id, agent_command, cap_type=None, agent_instance_id=None):
    cap_type = request.args.get('cap_type')
    if agent_command == 'start':
        command_response = ServiceApi.platform_agent_start(agent_instance_id)
        return jsonify(data=command_response)
    elif agent_command == 'stop':
        command_response = ServiceApi.platform_agent_stop(agent_instance_id)
        return jsonify(data=command_response)
    elif agent_command == 'get_capabilities':
        command_response = ServiceApi.platform_agent_get_capabilities(platform_device_id)
        return jsonify(data=command_response)
    else:
        command_response = ServiceApi.platform_execute(platform_device_id, agent_command, cap_type)
    
    return jsonify(data=command_response)


# -----------------------------------------------------------------------------
# GOOGLE MAP API
# -----------------------------------------------------------------------------

@app.route('/map.kml', methods=['GET'])
def google_map():
    kml = ServiceApi.fetch_map(ui_server=request.args.get('ui_server'), unique_key=request.args.get('unique_key'))
    return kml

@app.route('/map2.kml', methods=['GET'])
def map2():
    ui_server = request.args.get('ui_server')
    unique_key = request.args.get('unique_key')
    kml = ServiceApi.fetch_map(ui_server=ui_server, unique_key=unique_key)
    return kml

# -----------------------------------------------------------------------------
# GOOGLE VISUALIZATION API
# -----------------------------------------------------------------------------

@app.route('/visualization/<operation_name>/', methods=['GET'])
def visualization(operation_name):
    visualization_parameters = {}
    for k,v in request.args.iteritems():
        visualization_parameters.update({k:v})
    req = ServiceApi.visualization(operation_name, visualization_parameters)
    #return req
    return render_json_response(req)


"""
@app.route('/viz/initiate_realtime_visualization/<data_product_id>/', methods=['GET'])
def initiate_realtime_visualization2(data_product_id):
    resp = requests.get("http://localhost:5000/ion-service/visualization_service/initiate_realtime_visualization?data_product_id=" + data_product_id + "&callback=chart_instance.init_realtime_visualization_cb&return_format=raw_json")
    return resp.content

@app.route('/viz/get_realtime_visualization_data/<query_token>/', methods=['GET'])
def get_realtime_visualization_data2(query_token):
    resp = requests.get("http://localhost:5000/ion-service/visualization_service/get_realtime_visualization_data?query_token=" + query_token +"&return_format=raw_json")
    return resp.content
"""

# -----------------------------------------------------------------------------
# UI API
# -----------------------------------------------------------------------------


@app.route('/<resource_type>/face/<resource_id>/edit', methods=['GET'])
def edit(resource_type, resource_id):
    '''
    HTML requests should be redirected to the parent view
    for data, page preprocessing and Backbone initialization.
    '''
    parent_url = re.sub(r'edit$', '', request.url)
    return redirect(parent_url)

@app.route('/resource_type_edit/<resource_type>/<resource_id>/', methods=['GET', 'PUT'])
def resource_type_edit(resource_type, resource_id):
    if request.method == 'GET':
        resource = ServiceApi.get_prepare(resource_type, resource_id, None, True)
        return render_json_response(resource)
    if request.method == 'PUT':
        data = json.loads(request.data)
        resource_obj = data['resource']
        resource_assocs = data['assocs']
        updated_resource = ServiceApi.update_resource(resource_type, resource_obj, resource_assocs)
        return render_json_response(updated_resource)

@app.route('/<resource_type>/<resource_id>/', methods=['GET'])
@app.route('/resource/read/<resource_id>/', methods=['GET'])
def resource_by_id(resource_id, resource_type=None):
    resource = ServiceApi.find_by_resource_id(resource_id)
    return resource

@app.route('/resource_type_schema/<resource_type>/', methods=['GET'])
def get_resource_type_schema(resource_type):
    schema = ServiceApi.resource_type_schema(resource_type)
    return jsonify(schema=schema)

@app.route('/ui/', methods=['GET'])
def layout3():
    layout = LayoutApi.get_new_layout_schema()
    return jsonify(data=layout)

@app.route('/ui/reset/', methods=['GET'])
def reset_ui():
    reset_ui = ServiceApi.ui_reset()
    return jsonify(data=reset_ui)

@app.route('/ui/navigation/', methods=['GET'])
def ui_navigation():
    observatories = ServiceApi.find_by_resource_type('Observatory')
    orgs = ServiceApi.find_by_resource_type('Org')
    platformSites = ServiceApi.find_by_resource_type('PlatformSite')
    return jsonify(data={'orgs': orgs, 'observatories': observatories, 'platformSites': platformSites})
    #return jsonify(data={'orgs': orgs, 'observatories': observatories})


# -----------------------------------------------------------------------------
# AUTHENTICATION AND SESSIONS
# -----------------------------------------------------------------------------

@app.route('/signon/', methods=['GET'])
def signon():
    def nav():
        if 'login_redir' in session:
            return redirect(session.pop('login_redir'))

        return redirect('/')

    user_name = request.args.get('user')
    
    if user_name:
        # This is a backdoor, probably shouldn't be here on production...
        #if not PRODUCTION:
        ServiceApi.signon_user_testmode(user_name)
        return nav()

    # carriage returns were removed on the cilogon portal side,
    # restore them before processing
    raw_cert = request.args.get('cert')
    if not raw_cert:
        return nav()

    certificate = base64.b64decode(raw_cert)

    # call backend to signon user
    # will stash user id, expiry, is_registered and roles in session
    ServiceApi.signon_user(certificate)

    return nav()

@app.route('/login/', defaults={'redir':None}, methods=['GET'])
@app.route('/login/<path:redir>', methods=['GET'])
def login(redir):
    if redir:
        session['login_redir'] = redir

    url = urlparse(request.url)
    if url.scheme == 'http':
        https_url = re.sub('http://','https://',request.url)
        return redirect(https_url)
    else:
        return "This page should redirect to a secure login page"

@app.route('/userprofile/', methods=['GET', 'POST', 'PUT'])
def userprofile():
    if not session.has_key('user_id'):
        return redirect('/')
    is_registered = False
    if session.has_key('is_registered'):
        is_registered = session['is_registered']
    user_id = session['user_id']

    if request.is_xhr:
        if request.method == 'GET':
            # determine if this is an update or a new registration
            if is_registered:
                resp_data = ServiceApi.find_user_info(session['actor_id'])
            else:
                # try to extract name from UserCredentials
                creds = ServiceApi.find_user_credentials_by_actor_id(session['actor_id'])
                cntoken = creds['name']
                name = ''
                individual_names_given = ''
                individual_name_family = ''

                try:
                    rcn = re.compile(r'CN=(.*)\sA.+')
                    m = rcn.search(cntoken)
                    if m is not None:
                        name = m.groups()[0]

                        individual_names_given, individual_name_family = name.split(' ', 1)
                except:
                    pass

                resp_data = {'name':name,
                             'contact':{'individual_names_given':individual_names_given,
                                        'individual_name_family':individual_name_family}}

            return jsonify(data=resp_data)
        else:
            form_data = json.loads(request.data)
            if is_registered:
                resp_data = ServiceApi.update_user_info(form_data)

                if isinstance(resp_data, dict) and resp_data.has_key('GatewayError'):
                    return render_json_response(resp_data)
                else:
                    # only thing that can change here for session is name
                    session['name'] = form_data['name']

            else:
                user_id = ServiceApi.create_user_info(session['actor_id'], form_data)

                if isinstance(user_id, dict) and user_id.has_key('GatewayError'):
                    return render_json_response(user_id)
                else:
                    # simulate a signon by setting appropriate session vars
                    session['is_registered'] = True
                    session['user_id']       = user_id
                    session['roles']         = ServiceApi.get_roles_by_actor_id(session['actor_id'])
                    session['name']          = form_data['name']
                    #session['valid_until']  = 0     # @TODO: howto? only in certificate, so logon?

            resp_data = {"success":True}
            return jsonify(data=resp_data)
    else:
        return render_app_template(request.path)

@app.route('/signoff/', methods=['GET'])
def logout():
    clean_session()
    return redirect('/')

@app.route('/session/', methods=['GET'])
def session_info():
    # get version info from service gateway
    remote_version = ServiceApi.get_version()
    ion_ux_version = get_versions()

    # ion ux must be first
    version = [{ 'lib': 'ux-release', 'version': ion_ux_version }]

    # coi services should be second
    version.append({'lib':'coi-services-release', 'version': remote_version.pop('coi-services-release', 'unknown')})

    # sort the rest by alpha
    for k,v in sorted(remote_version.iteritems()):
        version.append({'lib':k, 'version': v})

    # trim off "-release" and "-dev"
    for ver in version:
        ver['lib']     = ver['lib'].replace("-release", "")
        ver['version'] = ver['version'].replace("-dev", "")

    session_values = {'user_id': None, 'roles': None, 'is_registered': False, 'is_logged_in': False, 'ui_mode': UI_MODE, 'version': version }

    if session.has_key('user_id'):
        roles = ServiceApi.get_roles_by_actor_id(session['actor_id'])
        session_values.update({'name': session['name'],
                               'user_id': session['user_id'],
                               'actor_id': session['actor_id'],
                               'roles': roles, 
                               'is_registered': session['is_registered'],
                               'is_logged_in': True,
                               'ui_theme_dark': session['ui_theme_dark']})
    
    return jsonify(data=session_values)


# -----------------------------------------------------------------------------
# DEVELOPMENT ROUTES
# -----------------------------------------------------------------------------

@app.route('/dev/thumbnail', methods=['GET'])
def thumbnail():
    return render_template('overview_thumbnails.html')

@app.route('/dev/assetmap', methods=['GET'])
def asset_map():
    return render_template('dashboard_assets_map.html')

@app.route('/dev/dashboard', methods=['GET'])
@app.route('/dev/dashboard/map/<resource_id>', methods=['GET'])
def dev_dashboard(resource_id=None):
    return render_app_template(request.path)

@app.route('/dev/map', methods=['GET'])
def dev_map(resource_id=None):
    return render_template('dev_map.html')


@app.route('/dev/datatable', methods=['GET'])
def dev_datatable(resource_id=None):
    return render_template('dev_datatable.html')

@app.route('/dev/actionmenus', methods=['GET'])
def dev_actionmenus(resource_id=None):
    return render_template('dev_actionmenus.html')

@app.route('/dev/editform', methods=['GET'])
def dev_editform(resource_id=None):
    return render_template('dev_editform.html')

@app.route('/dev/subscribe', methods=['GET'])
def dev_subscribe():
    time.sleep(2)
    return "ok"
    
@app.route('/dev/geospatial', methods=['GET'])
def geospatial(resource_id=None):
    return render_template('dev_geospatial.html')
    
@app.route('/dev/chart', methods=['GET'])
def chart(resource_id=None):
    return render_template('dev_chart.html')

@app.route('/dev/image', methods=['GET'])
def dev_image(resource_id=None):
    return render_template('dev_image.html')


# -----------------------------------------------------------------------------
# CATCH ANY UNMATCHED ROUTES
# -----------------------------------------------------------------------------

# @app.route("/<catchall>")
# def catchall(catchall):
#     return render_app_template(catchall)

    
if __name__ == '__main__':
    app.logger.info("Starting flask on %s GMT" % datetime.utcnow())
    app.run(debug=True, host=FLASK_HOST, port=FLASK_PORT)
