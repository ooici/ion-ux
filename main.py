from flask import Flask, request, session, jsonify, render_template, redirect, url_for
import requests, json
from functools import wraps
import base64
import hashlib
import time

from config import FLASK_HOST, FLASK_PORT, GATEWAY_HOST, GATEWAY_PORT, LOGGED_IN, PRODUCTION, SECRET_KEY
from service_api import ServiceApi
from layout_api import LayoutApi
from jinja2 import Template
from urlparse import urlparse
import re

app = Flask(__name__)
app.secret_key = SECRET_KEY
app.debug = True
SERVICE_GATEWAY_BASE_URL = 'http://%s:%d/ion-service' % (GATEWAY_HOST, GATEWAY_PORT)

def render_app_template(current_url):
    """Renders base template for full app, with needed template params"""
    roles = session["roles"] if session.has_key("roles") else "roles"
    logged_in = "True" if session.has_key('user_id') else "False"
    tmpl = Template(LayoutApi.process_layout())
    return render_template(tmpl, **{"current_url":"/", "roles":roles, "logged_in":logged_in})

@app.route('/')
def index():
    return render_app_template(request.path)

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
        resp = ServiceApi.subscribe(resource_type, resource_id, event_type, user_id)
        return jsonify(data=resp)
    else:
        return jsonify(data='No user_id.')

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

# -----------------------------------------------------------------------------
# COLLECTION "FACE" PAGES
# -----------------------------------------------------------------------------

@app.route('/<resource_type>/list/', methods=['GET'])
def collection(resource_type=None):
    if request.is_xhr:
        resources = ServiceApi.find_by_resource_type(resource_type)
        return jsonify(data=resources)
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

@app.route('/viz/overview/<data_product_id>/')
def viz_overview(data_product_id):
    # Need to move into ServiceApi
    resp = requests.get('http://%s:%s/ion-service/visualization_service/get_visualization_data?data_product_id=%s&return_format=raw_json' % (GATEWAY_HOST, str(GATEWAY_PORT), data_product_id))
    return resp.content

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

@app.route('/signout/', methods=['GET'])
def logout():
    session.pop('roles', None)
    session.pop('user_id', None)
    session.pop('is_registered', None)
    return redirect('/')

@app.route('/session/check/', methods=['GET'])
def session_check():
    if session['user_id']:
        return 'user_id: %s, roles: %s, is_registered: %s' % (session['user_id'], session['roles'], session['is_registered'])
    else:
        return 'No user session found.'


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
