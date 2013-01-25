from flask import Flask, request, session, jsonify, render_template, redirect, url_for, escape, send_file, g, make_response
import requests, json
from functools import wraps
import base64
import hashlib
import time

from urllib import quote

from config import FLASK_HOST, FLASK_PORT, GATEWAY_HOST, GATEWAY_PORT, LOGGED_IN, PRODUCTION, SECRET_KEY, UI_MODE, PORTAL_ROOT
from service_api import ServiceApi
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
        g.ion_ux_git_version = "unknown"

        try:
            with open(os.path.join(PORTAL_ROOT, "VERSION.txt")) as f:
                g.ion_ux_version = f.readline().strip().replace("-dev", "")
        except IOError:
            pass

        if os.path.exists(os.path.join(PORTAL_ROOT, ".git")):
            try:
                with open(".git/HEAD") as f:
                    refline = f.readline().strip().split(":")[1].strip()
                with open(os.path.join(".git", *refline.split("/"))) as f:
                    g.ion_ux_git_version = f.readline().strip()
            except (OSError, IOError):
                pass

    return (g.ion_ux_version, g.ion_ux_git_version)

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


# -----------------------------------------------------------------------------
# EVENT SUBSCRIPTIONS
# -----------------------------------------------------------------------------

@app.route('/event_types/', methods=['GET'])
def event_types():
    event_types = ServiceApi.get_event_types()
    return jsonify(data=event_types)

@app.route('/<resource_type>/status/<resource_id>/subscribe/<event_type>/', methods=['GET'])
@app.route('/<resource_type>/face/<resource_id>/subscribe/<event_type>/', methods=['GET'])
@app.route('/<resource_type>/related/<resource_id>/subscribe/<event_type>/', methods=['GET'])
def subscribe_to_resource(resource_type, resource_id, event_type):
    user_id = session.get('user_id')
    if user_id:
        resource_name = request.args.get('resource_name')
        resp = ServiceApi.subscribe(resource_type, resource_id, event_type, user_id, resource_name)
        return jsonify(data=resp)
    else:
        return jsonify(data='No user_id.')
        
@app.route('/<resource_type>/status/<resource_id>/transition/', methods=['POST'])
@app.route('/<resource_type>/face/<resource_id>/transition/', methods=['POST'])
@app.route('/<resource_type>/related/<resource_id>/transition/', methods=['POST'])
def change_lcstate(resource_type, resource_id):
    user_id = session.get('user_id')
    if user_id:
        transition_event = request.form['transition_event'].lower()
        transition = ServiceApi.transition_lcstate(resource_id, transition_event)
        return jsonify(data=transition)
    else:
        error_response = make_response('You must be signed in to change Lifecycle state.', 400)
        error_response.headers['Content-Type'] = 'application/json'
        return error_response


# -----------------------------------------------------------------------------
# FACE, STATUS, RELATED PAGES
# -----------------------------------------------------------------------------

@app.route('/<resource_type>/status/<resource_id>/', methods=['GET'])
@app.route('/<resource_type>/face/<resource_id>/', methods=['GET'])
@app.route('/<resource_type>/related/<resource_id>/', methods=['GET'])
@app.route('/<resource_type>/command/<resource_id>/', methods=['GET'])
def page(resource_type, resource_id):
    if request.is_xhr:
        return True
    else:
        return render_app_template(request.path)

@app.route('/<resource_type>/status/<resource_id>/edit', methods=['GET'])
@app.route('/<resource_type>/face/<resource_id>/edit', methods=['GET'])
@app.route('/<resource_type>/related/<resource_id>/edit', methods=['GET'])
def edit(resource_type, resource_id):
    # Edit HTML requests should be redirected to a parent view
    # for data setup and page structure.
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
    extension = ServiceApi.get_extension(resource_type, resource_id)
    return jsonify(data=extension)


# -----------------------------------------------------------------------------
# COMMAND RESOURCE PAGES
# -----------------------------------------------------------------------------

@app.route('/InstrumentDevice/command/<instrument_device_id>/<agent_command>/')
def start_instrument_agent(instrument_device_id, agent_command, cap_type=None):
    cap_type = request.args.get('cap_type')
    if agent_command == 'start':
        command_response = ServiceApi.instrument_agent_start(instrument_device_id)
        return jsonify(data=command_response)
    elif agent_command == 'stop':
        command_response = ServiceApi.instrument_agent_stop(instrument_device_id)
        return jsonify(data=command_response)
    elif agent_command == 'get_capabilities':
        command_response = ServiceApi.instrument_agent_get_capabilities(instrument_device_id)
        return jsonify(data=command_response)
    else:
        command_response = ServiceApi.instrument_execute(instrument_device_id, agent_command, cap_type)
    return jsonify(data=command_response)


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
    remote_version = ServiceApi.get_version()
    ion_ux_version, ion_ux_git_version = get_versions()
    version = {'ux-release' : ion_ux_version,
               'ux-git'     : ion_ux_git_version }
    
    for k,v in remote_version.iteritems():
        remote_version[k] = v.replace("-dev", "")
    
    version.update(remote_version)

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

@app.route("/<catchall>")
def catchall(catchall):
    return render_app_template(catchall)

    
if __name__ == '__main__':
    app.run(debug=True, host=FLASK_HOST, port=FLASK_PORT)
