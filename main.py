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

    roles = session["roles"] if session.has_key("roles") else ""
    logged_in = "True" if session.has_key('user') else "False"
    
    tmpl = Template(LayoutApi.process_layout())
    return render_template(tmpl, **{"current_url":"/", "roles":roles, "logged_in":logged_in})


# Face, status, related, command pages catch-all
@app.route('/<resource_type>/status/<resource_id>/', methods=['GET'])
@app.route('/<resource_type>/face/<resource_id>/', methods=['GET'])
@app.route('/<resource_type>/related/<resource_id>/', methods=['GET'])
@app.route('/<resource_type>/command/<resource_id>/', methods=['GET'])
@app.route('/<resource_type>/command2/<resource_id>/', methods=['GET'])
def page(resource_type, resource_id):
    if request.is_xhr:
        return True
    else:
        return render_app_template(request.path)

# Collections
@app.route('/<resource_type>/list/', methods=['GET'])
def collection(resource_type=None):
    if request.is_xhr:
        resources = ServiceApi.find_by_resource_type(resource_type)
        return jsonify(data=resources)
    else:
        return render_app_template(request.path)

# Extension API
@app.route('/<resource_type>/extension/<resource_id>/', methods=['GET'])
def extension(resource_type, resource_id):
    extension = ServiceApi.get_extension(resource_type, resource_id)
    return jsonify(data=extension)



# Command - these can probably be combined in the future but leaving separate for now.
@app.route('/InstrumentDevice/command/<instrument_device_id>/<agent_command>/')
def start_instrument_agent(instrument_device_id, agent_command, cap_type=None):
    cap_type = request.args.get('cap_type')
    print 'cap_type', cap_type

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


# @app.route('/PlatformDevice/command/<platform_device_id>/<agent_command>/')
# def start_platfom_agent(platform_device_id, agent_command, cap_type=None):
#     cap_type = request.args.get('cap_type')
#     print 'cap_type', cap_type
# 
#     if agent_command == 'start':
#         command_response = ServiceApi.platform_agent_start(platform_device_id)
#         return jsonify(data=command_response)
#     elif agent_command == 'stop':
#         command_response = ServiceApi.platform_agent_stop(platform_device_id)
#         return jsonify(data=command_response)
#     elif agent_command == 'get_capabilities':
#         command_response = ServiceApi.platform_agent_get_capabilities(platform_device_id)
#         return jsonify(data=command_response)
#     else:
#         command_response = ServiceApi.platform_execute(platform_device_id, agent_command, cap_type)
#     return jsonify(data=command_response)


# Visualization
# @app.route('/visualization/initiate_realtime_visualization/<data_product_id>/', methods=['GET'])
# def initiate_realtime_visualization(data_product_id):
#     query_response = ServiceApi.initiate_realtime_visualization(data_product_id)
#     print 'VVVVV', query_response
#     return jsonify(data=query_response)
# 
# @app.route('/visualization/get_realtime_visualization_data/<query_token>/', methods=['GET'])
# def get_realtime_visualization_data(query_token):
#     query_response = ServiceApi.get_realtime_visualization_data(query_token)
#     print 'TTTTTT', query_response
#     return jsonify(data=query_response)


@app.route('/viz/initiate_realtime_visualization/<data_product_id>/', methods=['GET'])
def initiate_realtime_visualization2(data_product_id):
    resp = requests.get("http://localhost:5000/ion-service/visualization_service/initiate_realtime_visualization?data_product_id=" + data_product_id + "&callback=chart_instance.init_realtime_visualization_cb&return_format=raw_json")
    print 'YYY-RESP.CONTENT ', resp.content
    return resp.content
    
@app.route('/viz/get_realtime_visualization_data/<query_token>/', methods=['GET'])
def get_realtime_visualization_data2(query_token):
    resp = requests.get("http://localhost:5000/ion-service/visualization_service/get_realtime_visualization_data?query_token=" + query_token +"&return_format=raw_json")
    print 'ZZZ-RESP.CONTENT ', resp.content
    return resp.content



# # Instrument
# @app.route('/instruments/ext/<resource_id>/', methods=['GET'])
# def instrument_extension(resource_id):
#     instrument_extension = ServiceApi.get_instrument_extension(resource_id)
#     return jsonify(data=instrument_extension)
# 
# # Platform
# @app.route('/platforms/ext/<resource_id>/', methods=['GET'])
# def platform_extension(resource_id):
#     platform_extension = ServiceApi.get_instrument_extension(resource_id)
#     return jsonify(data=platform_extension)
# 
# # DataProduct
# @app.route('/data_products/ext/<resource_id>/', methods=['GET'])
# def data_product_extension(resource_id):
#     data_product_extension = ServiceApi.get_data_product_extension(resource_id)
#     return jsonify(data=data_product_extension)
    



# # Instrument
# @app.route('/instruments/<instrument_device_id>/', methods=['GET'])
# def instrument_facepage(instrument_device_id):
#     if request.is_xhr:
#         instrument = ServiceApi.find_instrument(instrument_device_id)
#         return jsonify(data=instrument)
#     else:
#         return render_app_template(request.path)
# 
# @app.route('/instruments/<instrument_device_id>/command/', methods=['GET'])
# def instrument_facepage(instrument_device_id):
#     if request.is_xhr:
#         instrument = ServiceApi.find_instrument(instrument_device_id)
#         return jsonify(data=instrument)
#     else:
#         return render_app_template(request.path)





# @app.route('/instruments/<type>/<instrument_device_id>/', methods=['GET'])
# def instrument_facepage_with_extension(type, instrument_device_id):
#     if request.is_xhr:
#         instrument_extension_data = ServiceApi.get_instrument_extension(instrument_device_id=instrument_device_id)
#         return jsonify(data=instrument_extension_data)
#     else:
#         return render_app_template(request.path)

# @app.route('/users/', methods=['GET'])
# def users():
#     if request.is_xhr:
#         users = ServiceApi.find_by_resource_type('ActorIdentity')
#         return jsonify(data=users)
#     else:
#         return render_app_template(request.path)

# @app.route('/users/<user_id>/', methods=['GET'])
# def user_facepage(user_id):
#     if request.is_xhr:
#         user = ServiceApi.get_actor_identity_extension(user_id)
#         return jsonify(data=user)
#     else:
#         return render_app_template(request.path)
# 
# # Routes for generic information resource and resource.
# @app.route('/resources/list/<resource_type>/', methods=['GET'])
# def resource_list(resource_type=None):
#     resources = ServiceApi.find_by_resource_type(resource_type)
#     return jsonify(data=resources)
# 
# @app.route('/resources/read/<resource_id>/', methods=['GET'])
# def resource_facepage(resource_id=None):
#     resource = ServiceApi.find_by_resource_id(resource_id)
#     return jsonify(data=resource)


# START LAYOUT
# ---------------------------------------------------------------------------
@app.route('/ui/', methods=['GET'])
def layout3():
    layout = LayoutApi.get_new_layout_schema()
    return jsonify(data=layout)

@app.route('/ui/reset/', methods=['GET'])
def reset_ui():
    reset_ui = ServiceApi.ui_reset()
    return jsonify(data=reset_ui)


# LCA ROUTES
# ---------------------------------------------------------------------------
@app.route('/tim/', methods=['GET'])
def tim():
    tim = ServiceApi.find_tim()['_id']
    return jsonify(data=tim)

@app.route('/')
def index():
    if LOGGED_IN: #XXX for development
        return render_app_template(request.path)
    else:
        return render_template("index.html")

# TODO fix this to be a post
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


# DEV ROUTES
# -------------------------------------------------------------------------
@app.route('/dev/datatable', methods=['GET'])
def dev_datatable(resource_id=None):
    return render_template('dev_datatable.html')

@app.route('/dev/actionmenus', methods=['GET'])
def dev_actionmenus(resource_id=None):
    return render_template('dev_actionmenus.html')
    
@app.route('/dev/geospatial', methods=['GET'])
def geospatial(resource_id=None):
    return render_template('dev_geospatial.html')
    
@app.route('/dev/chart', methods=['GET'])
def chart(resource_id=None):
    return render_template('dev_chart.html')

@app.route('/dev/image', methods=['GET'])
def dev_image(resource_id=None):
    return render_template('dev_image.html')


# CATCHALL ROUTE
# -------------------------------------------------------------------------
@app.route("/<catchall>")
def catchall(catchall):
    return render_app_template(catchall)









# Generic index to view any resource type
# @app.route('/list/<resource_type>/', methods=['GET'])
# def list(resource_type=None):
#     resources = ServiceApi.find_by_resource_type(resource_type)
#     return jsonify(data=json.dumps(resources))
# 
# 
# @app.route('/obs/create/', methods=['GET'])
# def observatory_create():
#     observatory = ServiceApi.test_create_marine_facility();
#     return jsonify(data=observatory)
# 
# @app.route('/observatories/', methods=["GET", "POST"])
# def observatories():
#     if request.is_xhr:
#         resp_data = ServiceApi.find_by_resource_type('Observatory')
#         return jsonify(data=resp_data)
#     else:
#         return render_app_template(request.path)
# 
# @app.route('/observatories/all_users/', methods=['GET'])
# def observatories_all_users():
#     all_users = ServiceApi.find_users()
#     return jsonify(data=all_users)
# 
# @app.route('/observatories/<marine_facility_id>/', methods=['GET', 'POST'])
# @app.route('/observatories/<marine_facility_id>/edit/', methods=['GET', 'POST'])
# def observatory_facepage(marine_facility_id):
#     if request.is_xhr:
#         marine_facility = ServiceApi.find_observatory(marine_facility_id)
#         return jsonify(data=marine_facility)
#     else:
#         return render_app_template(request.path)
# 
# 
# @app.route('/observatories/<marine_facility_id>/request_enrollment/', methods=['GET'])
# def enroll_user(marine_facility_id):
#     request_enrollment = ServiceApi.request_enrollment_in_org(marine_facility_id, session['user_id'])
#     return str(request_enrollment)
# 
# @app.route('/observatories/<marine_facility_id>/user_requests/', methods=['GET'])
# def observatory_user_requests(marine_facility_id):
#     if session.has_key('roles'):
#         if 'ORG_MANAGER' in session['roles']:
#             user_requests = ServiceApi.find_org_user_requests(marine_facility_id)
#         else:
#             user_requests = ServiceApi.find_org_user_requests(marine_facility_id, session['user_id'])
#     else:
#         user_requests = []
# 
#     return jsonify(data=user_requests)
#     
# @app.route('/observatories/<marine_facility_id>/user_requests/<request_id>/<action>/', methods=['GET'])
# def user_request(marine_facility_id, request_id, action=None):
#     resp = ServiceApi.handle_user_request(marine_facility_id, request_id, action, reason="because")
#     return jsonify(data=resp)
# 
# 
# @app.route('/platforms/', methods=['GET', 'POST'])
# def platforms():
#     if request.is_xhr:
#         if request.method == 'POST':
#             print 'PLATFORM POST'
#             # Build form
#             # Service call
#             # return id
#         platforms = ServiceApi.find_by_resource_type('PlatformDevice')
#         return jsonify(data=platforms)
#     else:
#         return render_app_template(request.path)
# 
# 
# @app.route('/platforms/<platform_device_id>/', methods=['GET'])
# def platform_facepage(platform_device_id):
#     if request.is_xhr:
#         platform = ServiceApi.find_platform(platform_device_id)
#         return jsonify(data=platform)
#     else:
#         return render_app_template(request.path)
# 
# @app.route('/platform_models/', methods=['GET'])
# def platform_models():
#     if request.is_xhr:
#         platform_models = ServiceApi.find_by_resource_type('PlatformModel')
#         return jsonify(data=platform_models)
#     else:
#         return render_app_template(request.path)
# 
# 
# @app.route('/platform_models/<platform_model_id>/', methods=['GET'])
# def platform_model_facepage(platform_model_id):
#     if request.is_xhr:
#         platform_model = ServiceApi.find_platform_model(platform_model_id)
#         return jsonify(data=platform_model)
#     else:
#         return render_app_template(request.path)
# 
# @app.route('/instruments/', methods=['GET', 'POST'])
# def instruments():
#     if request.is_xhr:
#         instruments = ServiceApi.find_by_resource_type('InstrumentDevice')
#         return jsonify(data=instruments)
#     else:
#         return render_app_template(request.path)
# 
# 
# 
# @app.route('/instruments/<instrument_device_id>/primary_deployment_off/<logical_instrument_id>/', methods=['GET'])
# def primary_deployment_off(instrument_device_id, logical_instrument_id):
#     deployment_off = ServiceApi.instrument_primary_deployment_off(instrument_device_id, logical_instrument_id)
#     return jsonify(data=True)
# 
# @app.route('/instruments/<instrument_device_id>/primary_deployment_on/<logical_instrument_id>/', methods=['GET'])
# def primary_deployment_off(instrument_device_id, logical_instrument_id):
#     deployment_off = ServiceApi.instrument_primary_deployment_on(instrument_device_id, logical_instrument_id)
#     return jsonify(data=True)
#         
#         
# 
# @app.route('/instrument_models/', methods=['GET'])
# def instrument_models():
#     if request.is_xhr:
#         instrument_models = ServiceApi.find_by_resource_type('InstrumentModel')
#         return jsonify(data=instrument_models)
#     else:
#         return render_app_template(request.path)
# 
# 
# @app.route('/instrument_models/<instrument_model_id>/', methods=['GET'])
# def instrument_model_facepage(instrument_model_id):
#     if request.is_xhr:
#         instrument_model = ServiceApi.find_instrument_model(instrument_model_id)
#         return jsonify(data=instrument_model)
#     else:
#         return render_app_template(request.path)
# 
# @app.route('/instrument_agents/')
# def instrument_agents():
#     if request.is_xhr:
#         instrument_agents = ServiceApi.find_by_resource_type('InstrumentAgent')
#         return jsonify(data=instrument_agents)
#     else:
#         return render_app_template(request.path)
# 
# @app.route('/instrument_agents/<instrument_agent_id>/', methods=['GET'])
# def instrument_agent_facepage(instrument_agent_id):
#     if request.is_xhr:
#         instrument = ServiceApi.find_instrument_agent(instrument_agent_id)
#         return jsonify(data=instrument)
#     else:
#         return render_app_template(request.path)
# 
# 
# @app.route('/data_process_definitions/')
# def data_process_definitions():
#     if request.is_xhr:
#         data_process_definitions = ServiceApi.find_by_resource_type('DataProcessDefinition')
#         return jsonify(data=data_process_definitions)
#     else:
#         return render_app_template(request.path)
# 
# @app.route('/data_process_definitions/<data_process_definition_id>/')
# def data_process_definition_facepage(data_process_definition_id):
#     if request.is_xhr:    
#         data_process_definition = ServiceApi.find_data_process_definition(data_process_definition_id)
#         return jsonify(data=data_process_definition)
#     else:
#         return render_app_template(request.path)
# 
# @app.route('/data_products/', methods=['GET'])
# def data_products():
#     if request.is_xhr:
#         data_products = ServiceApi.find_data_products()
#         return jsonify(data=data_products)
#     else:
#         return render_app_template(request.path)
# 
# @app.route('/data_products/<data_product_id>/', methods=['GET'])
# def data_product_facepage(data_product_id): 
#     if request.is_xhr:
#         # Add start and stop to data processes
#         data_product = ServiceApi.find_data_product(data_product_id)
#         return jsonify(data=data_product)
#     else:
#         return render_app_template(request.path)
# 
# # Request actions
# @app.route('/<resource_type>/request/<request_id>/<request_action>', methods=['GET', 'POST'])
# def take_action_on_request(resource_type, resource_id, request_action):
#     return jsonify(data=True)
# 
# # New routes
# @app.route('/<resource_type>/new/', methods=['GET'])
# def new_resource_router(resource_type):
#     if request.is_xhr:        
#         return jsonify(data=True)
#     else:
#         return render_app_template(request.path)
# 
# @app.route('/find_tree/<root_type>/<leaf_type>/', methods=['GET'])
# def find_leaves(root_type, leaf_type):
#     tree_list = ServiceApi.find_leaves(root_type, leaf_type)
#     return jsonify(data=tree_list)
# 
# @app.route('/find_platform_models/', methods=['GET'])
# def find_platform_models():
#     platform_models = ServiceApi.find_platform_models()
#     return jsonify(data=platform_models)


# -------------------------------------------------------------------------
# RESOURCE BROWSER - MUCH REFACTORING NEEDED
# -------------------------------------------------------------------------

# @app.route('/resources', methods=['GET'])
# def resources_index():    
#     if request.args.has_key('type'):
#         resource_type = request.args['type']        
#         service_gateway_call = requests.get('%s/resource_registry/find_resources?restype=%s' % (SERVICE_GATEWAY_BASE_URL, resource_type))
#         resources = json.loads(service_gateway_call.content)
#         resources = resources['data']['GatewayResponse'][0]
#     else:
#         resource_type=None
#         resources=None
#     
#     return render_template('resource_browser/list.html', resource_type=resource_type, resources=resources, menu=fetch_menu())
#     
# 
# @app.route('/resources/new', methods=['GET'])
# def new_resource():    
#     if request.args.has_key('type'):
#         resource_type = request.args['type']
#     else:
#         resource_type = None
#         
#     return render_template('resource_browser/new_form.html', resource_type=resource_type, resource=None, menu=fetch_menu())
# 
# 
# @app.route('/resources/create', methods=['POST'])
# def create_resource():
#     sg_data = SERVICE_REQUEST_TEMPLATE
#     sg_data['serviceRequest']['serviceOp'] = 'create'
#     
#     request_data = request.form
#     resource_type = request.form['restype']
# 
#     resource_type_params = {}
#     for (key,value) in request_data.items():
#         if key == 'restype': continue
#         resource_type_params[key] = value
#     
#     sg_data['serviceRequest']['params']['object'] = [resource_type, resource_type_params]
#         
#     service_gateway_call = requests.post(
#         '%s/resource_registry/create' % SERVICE_GATEWAY_BASE_URL, 
#         sg_data
#     )
#         
#     return redirect("%s?type=%s" % (url_for('resources_index'), resource_type))
# 
# 
# @app.route('/resources/show/<resource_id>')
# def show_resource(resource_id=None):
#     
#     resource_type = request.args.get('type')
#     
#     service_gateway_call = requests.get(
#         '%s/resource_registry/read?object_id=%s' % (SERVICE_GATEWAY_BASE_URL,resource_id)
#     )
#     resource = json.loads(service_gateway_call.content)
#     resource = resource['data']['GatewayResponse']
#     
#     return render_template('resource_browser/show.html', resource_type=resource_type, resource=resource, menu=fetch_menu())
# 
# 
# @app.route('/resources/edit/<resource_id>', methods=['GET'])
# def edit_reource(resource_id=None):
#     if request.args.has_key('type'):
#         resource_type = request.args['type']
#     else:
#         resource_type = None
#     
#     service_gateway_call = requests.get(
#         '%s/resource_registry/read?object_id=%s' % (SERVICE_GATEWAY_BASE_URL,resource_id)
#     )
#     resource = json.loads(service_gateway_call.content)
#     resource = resource['data']['GatewayResponse']
# 
#     return render_template('resource_browser/edit_form.html', resource_type=resource_type, resource=resource, menu=fetch_menu())
# 
# 
# @app.route('/resources/update/<resource_id>', methods=['POST'])
# def update_resource(resource_id=None):
#     post_data = SERVICE_REQUEST_TEMPLATE
#     post_data['serviceRequest']['serviceOp'] = 'update'
#     
#     request_data = request.form
#     resource_type = request.form['restype']
#     
#     resource_type_params = {}
#     for (key,value) in request_data.items():
#         if key == 'restype': continue
#         resource_type_params[key] = value
# 
#     post_data['serviceRequest']['params']['object'] = [resource_type, resource_type_params]
# 
#     service_gateway_call = gateway_post_request(
#         '%s/resource_registry/update' % SERVICE_GATEWAY_BASE_URL, 
#         post_data
#     )
# 
#     return redirect("%s?type=%s" % (url_for('resources_index'), resource_type))
# 
# 
# @app.route('/resources/delete/<resource_id>')
# def delete_resource(resource_id=None):
#     pass
# 
# 
# @app.route('/schema/<resource_type>')
# def get_resource_schema(resource_type):
#     resource_type_schema_response = requests.get(
#         "http://%s/ion-service/resource_type_schema/%s" % (SERVICE_GATEWAY_BASE_URL,resource_type)
#     )
#     resource_type_schema = json.loads(resource_type_schema_response.content)
#     
#     return str(resource_type_schema)
# 
# @app.route('/resource_types', methods=['GET'])
# def resource_types():
#     res = fetch_menu()
#     return jsonify(data=res)
# 
# 



# -------------------------------------------------------------------------
# NON-ROUTE CODE BELOW
# -------------------------------------------------------------------------

# common service gateway post request method.
# handles including user id and expiry in request
# payload if cookies found in session.
# def gateway_post_request(url, payload):
#     # conditionally add user id and expiry to request
# #    if "user_id" in session:
# #        payload['serviceRequest']['params']['requestor'] = session['user_id']
# #        payload['serviceRequest']['params']['expiry'] = session['valid_until']
# 
#     data={'payload': json.dumps(payload)}
#     print "POST request\n  url: %s\n  data: %s" % (url,data)
#     
#     ion_actor_id = ServiceApi.find_tim()['_id']
#     headers = {}
#     headers['ion-actor-id'] = ion_actor_id
#     service_gateway_call = requests.post(url, data, headers=headers)
# 
#     print "POST response\n  url: %s\n  content: %s" % (url,service_gateway_call)    
# 
#     if service_gateway_call.status_code != 200:
#         # TODO figure out how (if at all) we want to handle 401
#         return "The service gateway returned the following error: %d" % service_gateway_call.status_code
# 
#     return service_gateway_call
# 
# 
# 
# def dict_from_form_data(form_data):
#     sub_result_dict = {}
#     for (k, v) in form_data.iteritems():
#         elems = k.split("__")
#         if len(elems) == 1:
#             sub_result_dict[elems[0]] = v
#         if len(elems) == 2:
#             sub_k, sub_v = elems
#             # if sub_k in result_dict:
#             if sub_result_dict.has_key(sub_k):
#                 sub_result_dict[sub_k].update({sub_v:v})
#             else:
#                 sub_result_dict[sub_k] = {sub_v:v}
#     
#     print "\n\n\nSUBRESULTDICT=====================================\n", str(sub_result_dict)
#     return sub_result_dict
# 
# 
# def build_schema_from_form(form_data, service="marine_facilities", object_name="marine_facility"):
#     service_name = DEFINED_SERVICES_OPERATIONS[service]['service_name']
#     service_op = DEFINED_SERVICES_OPERATIONS[service]['operation_names']['create']
#     resource_type = DEFINED_SERVICES_OPERATIONS[service]["restype"]
#     result_dict = SERVICE_REQUEST_TEMPLATE
#     result_dict['serviceRequest']['serviceName'] = service_name
#     result_dict['serviceRequest']['serviceOp'] = service_op
#     sub_result_dict = {"type_": resource_type}
#     for (k, v) in form_data.iteritems():
#         elems = k.split("__")
#         if len(elems) == 1:
#             sub_result_dict[elems[0]] = v
#         if len(elems) == 2:
#             sub_k, sub_v = elems
#             # if sub_k in result_dict:
#             if sub_result_dict.has_key(sub_k):
#                 sub_result_dict[sub_k].update({sub_v:v})
#             else:
#                 sub_result_dict[sub_k] = {sub_v:v}
#     
#     if object_name:
#         result_dict["serviceRequest"]["params"][object_name] = sub_result_dict
#     else:
#         result_dict["serviceRequest"]["params"].append(sub_result_dict)
# 
#     return result_dict


# def new_build_schema_from_form(form_data, service=None, object_name=None):
#     service_name = DEFINED_SERVICES_OPERATIONS[service]['service_name']
#     service_op = DEFINED_SERVICES_OPERATIONS[service]['operation_names']['create']
#     resource_type = DEFINED_SERVICES_OPERATIONS[service]["restype"]
#     result_dict = SERVICE_REQUEST_TEMPLATE
#     result_dict['serviceRequest']['serviceName'] = service_name
#     result_dict['serviceRequest']['serviceOp'] = service_op
#     sub_result_dict = {"type_": resource_type}
#     for (k, v) in form_data.iteritems():
#         elems = k.split("__")
#         if len(elems) == 1:
#             sub_result_dict[elems[0]] = v
#         if len(elems) == 2:
#             sub_k, sub_v = elems
#             # if sub_k in result_dict:
#             if sub_result_dict.has_key(sub_k):
#                 sub_result_dict[sub_k].update({sub_v:v})
#             else:
#                 sub_result_dict[sub_k] = {sub_v:v}
# 
#     if object_name:
#         result_dict["serviceRequest"]["params"][object_name] = sub_result_dict
#     else:
#         result_dict["serviceRequest"]["params"].append(sub_result_dict)
# 
#     return result_dict


# def fetch_menu():        
#     menu_data = requests.get('%s/list_resource_types' % SERVICE_GATEWAY_BASE_URL)
#     menu = json.loads(menu_data.content)
#     print menu
#     return menu['data']['GatewayResponse']


    
if __name__ == '__main__':
    app.run(debug=True, host=FLASK_HOST, port=FLASK_PORT)
