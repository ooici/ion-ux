from flask import Flask, request, session, jsonify, render_template, redirect, url_for, escape, send_file, g, make_response
import requests, json
from functools import wraps
import base64
import hashlib
import time

from urllib import quote

from config import FLASK_HOST, FLASK_PORT, GATEWAY_HOST, GATEWAY_PORT, LOGGED_IN, PRODUCTION, SECRET_KEY, UI_MODE, PORTAL_ROOT
from service_api import ServiceApi, error_message
from layout_api import LayoutApi
from jinja2 import Template
from urlparse import urlparse
import re
import os

# Attachments
from StringIO import StringIO
from mimetypes import guess_extension

app = Flask(__name__)
app.secret_key = SECRET_KEY
app.debug = True

def get_versions():
    if not hasattr(g, "ion_ux_version"):
        g.ion_ux_version = "unknown"

        try:
            with open(os.path.join(PORTAL_ROOT, "VERSION.txt")) as f:
                g.ion_ux_version = f.readline().strip()
        except IOError:
            pass

    return g.ion_ux_version

def render_app_template(current_url):
    tmpl = Template(LayoutApi.process_layout())
    return render_template(tmpl)
    
def render_json_response(service_api_response):
    if isinstance(service_api_response, dict) and service_api_response.has_key('GatewayError'):
        if PRODUCTION:
            del service_api_response['GatewayError']['Trace']
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

    
# -----------------------------------------------------------------------------
# SEARCH & ATTACHMENTS
# -----------------------------------------------------------------------------

@app.route('/search/', methods=['GET'])
def search(query=None):
    if request.is_xhr:
        search_query = escape(request.args.get('query'))
        search_results = ServiceApi.search(quote(search_query))
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
    attachment_filename = '%s%s' % (attachment_name, attachment_ext)

    return send_file(attachment, attachment_filename=attachment_name, as_attachment=True)

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
                                                   fd)

    dat = {'files':[{'name':fd.filename, 'size':fd.content_length}]}
    return jsonify(dat)

# -----------------------------------------------------------------------------
# EVENT SUBSCRIPTIONS
# -----------------------------------------------------------------------------

@app.route('/event_types/', methods=['GET'])
@login_required
def event_types():
    event_types = ServiceApi.get_event_types()
    return jsonify(data=event_types)

@app.route('/<resource_type>/status/<resource_id>/subscribe/', methods=['GET'])
@app.route('/<resource_type>/face/<resource_id>/subscribe/', methods=['GET'])
@app.route('/<resource_type>/related/<resource_id>/subscribe/', methods=['GET'])
@login_required
def subscribe_to_resource(resource_type, resource_id):
    resource_name = request.args.get('resource_name')
    event_type = request.args.get('event_type')
    resp = ServiceApi.create_user_notification(resource_type, resource_id, event_type, session['user_id'], resource_name)
    return render_json_response(resp)

@app.route('/<resource_type>/status/<resource_id>/unsubscribe/', methods=['GET'])
@app.route('/<resource_type>/face/<resource_id>/unsubscribe/', methods=['GET'])
@app.route('/<resource_type>/related/<resource_id>/unsubscribe/', methods=['GET'])
@login_required
def unsubscribe_to_resource(resource_type, resource_id):
    notification_id = request.args.get('notification_id')
    resp = ServiceApi.delete_user_subscription(notification_id)
    return render_json_response(resp)


        
@app.route('/<resource_type>/status/<resource_id>/transition/', methods=['POST'])
@app.route('/<resource_type>/face/<resource_id>/transition/', methods=['POST'])
@app.route('/<resource_type>/related/<resource_id>/transition/', methods=['POST'])
@login_required
def change_lcstate(resource_type, resource_id):
    transition_event = request.form['transition_event'].lower()
    transition = ServiceApi.transition_lcstate(resource_id, transition_event)
    return render_json_response(transition)

@app.route('/<resource_type>/status/<resource_id>/publish_event/', methods=['POST'])
@app.route('/<resource_type>/face/<resource_id>/publish_event/', methods=['POST'])
@app.route('/<resource_type>/related/<resource_id>/publish_event/', methods=['POST'])
@login_required
def publish_event(resource_type, resource_id):
    if resource_type == 'InstrumentDevice':
        event_type = 'DeviceOperatorEvent'
    else:
        event_type  = 'ResourceOperatorEvent'

    sub_type    = None
    description = request.form['description']

    resp = ServiceApi.publish_event(event_type, resource_id, resource_type, sub_type, description)
    return render_json_response(resp)

# -----------------------------------------------------------------------------
# FACE, STATUS, RELATED PAGES
# -----------------------------------------------------------------------------

@app.route('/<resource_type>/status/<resource_id>/', methods=['GET','PUT'])
@app.route('/<resource_type>/face/<resource_id>/', methods=['GET','PUT'])
@app.route('/<resource_type>/related/<resource_id>/', methods=['GET','PUT'])
@app.route('/<resource_type>/command/<resource_id>/', methods=['GET','PUT'])
def page(resource_type, resource_id):
    if request.is_xhr:
        if request.method == 'PUT':
            resource_obj = json.loads(request.data)
            updated_resource = ServiceApi.update_resource(resource_obj)
            return render_json_response(updated_resource)
        else:
            return
    else:
        return render_app_template(request.path)

@app.route('/<resource_type>/status/<resource_id>/edit', methods=['GET'])
@app.route('/<resource_type>/face/<resource_id>/edit', methods=['GET'])
@app.route('/<resource_type>/related/<resource_id>/edit', methods=['GET'])
def edit(resource_type, resource_id):
    '''
    HTML requests should be redirected to the parent view
    for data, page preprocessing and Backbone initialization.
    '''
    parent_url = re.sub(r'edit$', '', request.url)
    return redirect(parent_url)


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
# RESOURCE EXTENSION API
# -----------------------------------------------------------------------------

@app.route('/<resource_type>/extension/<resource_id>/', methods=['GET'])
def extension(resource_type, resource_id):
    # Login not required to view, but required for user specific things
    # like event notifications, etc.
    user_id = session['user_id'] if session.has_key('user_id') else None
    extension = ServiceApi.get_extension(resource_type, resource_id, user_id)
    return render_json_response(extension)


# -----------------------------------------------------------------------------
# COMMAND RESOURCE PAGES
# -----------------------------------------------------------------------------

@app.route('/InstrumentDevice/command/<instrument_device_id>/<agent_command>/')
@login_required
def start_instrument_agent(instrument_device_id, agent_command, cap_type=None):
    cap_type = request.args.get('cap_type')
    if agent_command == 'start':
        command_response = ServiceApi.instrument_agent_start(instrument_device_id)
        return render_json_response(command_response)
    elif agent_command == 'stop':
        command_response = ServiceApi.instrument_agent_stop(instrument_device_id)
        return render_json_response(command_response)
    elif agent_command == 'get_capabilities':
        command_response = ServiceApi.instrument_agent_get_capabilities(instrument_device_id)
        return render_json_response(command_response)
    else:
        command_response = ServiceApi.instrument_execute(instrument_device_id, agent_command, cap_type)
    return render_json_response(command_response)


@app.route('/PlatformDevice/command/<platform_device_id>/<agent_command>/')
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
def map():
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

@app.route('/visualization/<operation_name>/')
def visualization(operation_name):
    overview_url = 'http://%s:%d/ion-service/visualization_service/%s?%s' % (GATEWAY_HOST, GATEWAY_PORT, operation_name, request.query_string)
    req = requests.get(overview_url)
    return req.content

@app.route('/viz/initiate_realtime_visualization/<data_product_id>/', methods=['GET'])
def initiate_realtime_visualization2(data_product_id):
    resp = requests.get("http://localhost:5000/ion-service/visualization_service/initiate_realtime_visualization?data_product_id=" + data_product_id + "&callback=chart_instance.init_realtime_visualization_cb&return_format=raw_json")
    return resp.content

@app.route('/viz/get_realtime_visualization_data/<query_token>/', methods=['GET'])
def get_realtime_visualization_data2(query_token):
    resp = requests.get("http://localhost:5000/ion-service/visualization_service/get_realtime_visualization_data?query_token=" + query_token +"&return_format=raw_json")
    return resp.content

# -----------------------------------------------------------------------------
# UI API
# -----------------------------------------------------------------------------

@app.route('/ui/', methods=['GET'])
def layout3():
    layout = LayoutApi.get_new_layout_schema()
    return jsonify(data=layout)

@app.route('/ui/reset/', methods=['GET'])
def reset_ui():
    reset_ui = ServiceApi.ui_reset()
    return jsonify(data=reset_ui)


# -----------------------------------------------------------------------------
# AUTHENTICATION AND SESSIONS
# -----------------------------------------------------------------------------

@app.route('/signon/', methods=['GET'])
def signon():
    user_name = request.args.get('user')

    if user_name:
        ServiceApi.signon_user_testmode(user_name)
        return redirect('/')
    
    # carriage returns were removed on the cilogon portal side,
    # restore them before processing
    raw_cert = request.args.get('cert')
    if not raw_cert:
        return redirect('/')

    certificate = base64.b64decode(raw_cert)

    # call backend to signon user
    # will stash user id, expiry, is_registered and roles in session
    ServiceApi.signon_user(certificate)    

    if session['is_registered'] == False:
        # redirect to registration screen
        return redirect('/userprofile')
    else:
        return redirect('/')

@app.route('/login/', methods=['GET'])
def login():
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
                resp_data = ServiceApi.find_user_info(user_id)
            else:
                resp_data = {'contact': {'name': '', 'email': '', 'phone': '', 'address': '', 'city': '', 'postalcode': ''}}
            return jsonify(data=resp_data)
        else:
            form_data = json.loads(request.data)
            if is_registered:
                ServiceApi.update_user_info(form_data)
            else:
                ServiceApi.create_user_info(user_id, form_data)
        
            # indicate user is registered
            session['is_registered'] = True

            resp_data = {"success":True}            
            return jsonify(data=resp_data)
    else:
        return render_app_template(request.path)

@app.route('/signoff/', methods=['GET'])
def logout():
    for key in session.keys():
        session.pop(key, None)
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
        session_values.update({'name': session['name'], 'user_id': session['user_id'], 'roles': session['roles'], 'is_registered': session['is_registered'], 'is_logged_in': True})
    return jsonify(data=session_values)


# -----------------------------------------------------------------------------
# DEVELOPMENT ROUTES
# -----------------------------------------------------------------------------

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
    app.run(debug=True, host=FLASK_HOST, port=FLASK_PORT)
