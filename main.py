from flask import Flask, request, session, jsonify, render_template, redirect, url_for
import requests, json
from functools import wraps
import base64
import hashlib
import time

from config import GATEWAY_HOST

app = Flask(__name__)

#app.secret_key = hashlib.sha1(str(time.time()))
app.secret_key = "Foo"

HOST = 'localhost'
PORT = 3000
LOGGED_IN = True
PRODUCTION = False


SERVICE_GATEWAY_BASE_URL = 'http://%s/ion-service' % GATEWAY_HOST

if PRODUCTION:
    from service_api import ServiceApi
else:
    # from dummy_service_api import ServiceApi
    from service_api import ServiceApi

DEFINED_SERVICES_OPERATIONS = {
    'marine_facilities': {
            'restype': 'MarineFacility',
            'service_name': 'marine_facility_management',
            'object_name': 'marine_facility',
            'operation_names': {'create': 'create_marine_facility'}
        },
  
    'platforms': {
            'restype': 'PlatformDevice'
        },

    'instruments': {
            'restype': 'InstrumentDevice'
        },
}

SERVICE_REQUEST_TEMPLATE = {
    'serviceRequest': {
        'serviceName': '', 
        'serviceOp': '',
        'params': {} # Example -> 'object_name': ['restype', {}] }
    }
}


@app.route('/')
def index():
    if LOGGED_IN: #XXX for development
        return render_template("ion-ux.html", **{"current_url":"/"})
    else:
        return render_template("index.html")

# TODO fix this to be a post
@app.route('/signon/', methods=['GET'])
def signon():
    # carriage returns were removed on the cilogon portal side,
    # restore them before processing
    raw_cert = request.args.get("cert")
    certificate = base64.b64decode(raw_cert)

    # call backend to signon user
    user_id, valid_until, is_registered = ServiceApi.signon_user(certificate)    
    
    # set user id, valid until and is registered info in session
    # TODO might need to address issues that arise with using
    # session to set cookie when web server ends up being a pool
    # of web servers?
    session['user_id'] = user_id
    session['valid_until'] = valid_until
    session['is_registered'] = is_registered

    if not is_registered:
        # redirect to registration screen
        return redirect('/register')
    else:
        return redirect('/')


@app.route('/register/', methods=['GET', 'POST'])
def register():

    is_registered = session['is_registered']
    user_id = session['user_id']

    if request.is_xhr:
        if request.method == 'POST':
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
            # determine if this is an update or a new registration
            if is_registered:
                resp_data = ServiceApi.find_user_info(user_id)
            else:
                resp_data = {'contact': {'name': '', 'email': '', 'phone': '', 'address': '', 'city': '', 'postalcode': ''}}
            return jsonify(data=resp_data)
    else:
        return create_html_response(request.path)


# Generic index to view any resource type
@app.route('/list/<resource_type>/', methods=['GET'])
def list(resource_type=None):
    resources = ServiceApi.find_by_resource_type(resource_type)
    return jsonify(data=json.dumps(resources))


@app.route('/observatories/', methods=["GET", "POST"])
def observatories():
    if request.is_xhr:
        if request.method == 'POST':
            # TODO - NEEDS TO BE MOVED INTO SERVICEAPI
            import time; time.sleep(0.7) #mock latency
            form_data = json.loads(request.data)
            object_schema = build_schema_from_form(form_data, service="marine_facilities")
            post_request = gateway_post_request(
                '%s/marine_facility_management/create_marine_facility' % SERVICE_GATEWAY_BASE_URL,
                object_schema
            )
            resp_data = {"success":True}
        else:
            resp_data = ServiceApi.find_by_resource_type('MarineFacility')
            
        return jsonify(data=resp_data)
    else:
        return create_html_response(request.path)


@app.route('/observatories/<marine_facility_id>/', methods=['GET'])
def observatory_facepage(marine_facility_id):
    if request.is_xhr:
        marine_facility = ServiceApi.find_observatory(marine_facility_id)
        return jsonify(data=marine_facility)
    else:
        return create_html_response(request.path)

@app.route('/observatories/<marine_facility_id>/enroll_user/', methods=['GET'])
def enroll_user(marine_facility_id):
    org_request = requests.get('http://67.58.49.196:5000/ion-service/marine_facility_management/find_marine_facility_org?marine_facility_id=7812a996aed546a5aaeeafdef1b09160')
    org_id = json.loads(org_request.content)
    org_id = org_id['data']['GatewayResponse']
    
    
    enrollment = {
        'serviceRequest': {
            'serviceName': 'org_management', 
            'serviceOp': 'request_enroll',
            'params': {'org_id': org_id, 'user_id': 'aae8f2620068493885c822e27ceabdf3'} # Example -> 'object_name': ['restype', {}] }
        }
    }
    
    enroll_user = requests.post('http://67.58.49.196:5000/ion-service/org_management/request_enroll', data={'payload':json.dumps(enrollment)})
    
    find_requests = requests.get('http://67.58.49.196:5000/ion-service/org_management/find_requests?org_id=%s' % org_id)
    
    print str(find_requests.content)
    
    return find_requests.content


@app.route('/')


@app.route('/platforms/', methods=['GET'])
def platforms():
    if request.is_xhr:
        platforms = ServiceApi.find_by_resource_type('PlatformDevice')
        return jsonify(data=platforms)
    else:
        return create_html_response(request.path)


@app.route('/platforms/<platform_device_id>/', methods=['GET'])
def platform_facepage(platform_device_id):
    if request.is_xhr:
        platform = ServiceApi.find_platform(platform_device_id)
        return jsonify(data=platform)
    else:
        return render_template("ion-ux.html", **{"current_url":request.path})


@app.route('/platform_models/<platform_model_id>/', methods=['GET'])
def platform_model_facepage(platform_model_id):
    if request.is_xhr:
        platform_model = ServiceApi.find_platform_model(platform_model_id)
        return jsonify(data=platform_model)
    else:
        return render_template("ion-ux.html", **{"current_url":request.path})


@app.route('/instruments/', methods=['GET', 'POST'])
def instruments():
    if request.is_xhr:
        instruments = ServiceApi.find_by_resource_type('InstrumentDevice')
        return jsonify(data=instruments)
    else:
        return create_html_response(request.path)


@app.route('/instruments/<instrument_device_id>/', methods=['GET'])
def instrument_facepage(instrument_device_id):
    if request.is_xhr:
        instrument = ServiceApi.find_instrument(instrument_device_id)
        return jsonify(data=instrument)
    else:
        return render_template("ion-ux.html", **{"current_url":request.path})
        
        
@app.route('/instruments/<instrument_device_id>/command/', methods=['GET'])
def instrument_facepage(instrument_device_id):
    if request.is_xhr:
        instrument = ServiceApi.find_instrument(instrument_device_id)
        return jsonify(data=instrument)
    else:
        return render_template("ion-ux.html", **{"current_url":request.path})


@app.route('/instruments/<instrument_device_id>/command/<agent_command>/')
def start_instrument_agent(instrument_device_id, agent_command):
    if agent_command == 'start':
        instrument = ServiceApi.instrument_agent_start(instrument_device_id)
    elif agent_command == 'initialize':
        instrument = ServiceApi.instrument_agent_initialize(instrument_device_id)
    elif agent_command == 'capabilities':
        instrument = ServiceApi.instrument_agent_capabilities(instrument_device_id)        
    elif agent_command == 'activate':
        instrument = ServiceApi.instrument_agent_activate(instrument_devide_id)
    return jsonify(data=True)


@app.route('/instrument_models/<instrument_model_id>/', methods=['GET'])
def instrument_model_facepage(instrument_model_id):
    if request.is_xhr:
        instrument_model = ServiceApi.find_instrument_model(instrument_model_id)
        return jsonify(data=instrument_model)
    else:
        return render_template("ion-ux.html", **{"current_url":request.path})


@app.route('/instrument_agents/')
def instrument_agents():
    pass


@app.route('/instrument_agents/<instrument_agent_id>/', methods=['GET'])
def instrument_agent_facepage(instrument_agent_id):
    if request.is_xhr:
        instrument = ServiceApi.find_instrument_agent(instrument_agent_id)
        return jsonify(data=instrument)
    else:
        return render_template("ion-ux.html", **{"current_url":request.path})


@app.route('/data_process_definitions/<data_process_definition_id>/')
def data_process_definition_facepage(data_process_definition_id):
    if request.is_xhr:    
        data_process_definition = ServiceApi.find_data_process_definition(data_process_definition_id)
        return jsonify(data=data_process_definition)
    else:
        return render_template("ion-ux.html", **{"current_url":request.path})


@app.route('/data_products/', methods=['GET'])
def data_products():
    pass

@app.route('/data_products/<data_product_id>/', methods=['GET'])
def data_product_facepage(data_product_id): 
    if request.is_xhr:
        data_product = ServiceApi.find_data_product(data_product_id)
        return jsonify(data=data_product)
    else:
        return render_template("ion-ux.html", **{"current_url":request.path})




# -------------------------------------------------------------------------
# RESOURCE BROWSER - MUCH REFACTORING NEEDED
# -------------------------------------------------------------------------

@app.route('/resources', methods=['GET'])
def resources_index():    
    if request.args.has_key('type'):
        resource_type = request.args['type']        
        service_gateway_call = requests.get('%s/resource_registry/find_resources?restype=%s' % (SERVICE_GATEWAY_BASE_URL, resource_type))
        resources = json.loads(service_gateway_call.content)
        resources = resources['data']['GatewayResponse'][0]
    else:
        resource_type=None
        resources=None
    
    return render_template('resource_browser/list.html', resource_type=resource_type, resources=resources, menu=fetch_menu())
    

@app.route('/resources/new', methods=['GET'])
def new_resource():    
    if request.args.has_key('type'):
        resource_type = request.args['type']
    else:
        resource_type = None
        
    return render_template('resource_browser/new_form.html', resource_type=resource_type, resource=None, menu=fetch_menu())


@app.route('/resources/create', methods=['POST'])
def create_resource():
    sg_data = SERVICE_REQUEST_TEMPLATE
    sg_data['serviceRequest']['serviceOp'] = 'create'
    
    request_data = request.form
    resource_type = request.form['restype']

    resource_type_params = {}
    for (key,value) in request_data.items():
        if key == 'restype': continue
        resource_type_params[key] = value
    
    sg_data['serviceRequest']['params']['object'] = [resource_type, resource_type_params]
        
    service_gateway_call = requests.post(
        '%s/resource_registry/create' % SERVICE_GATEWAY_BASE_URL, 
        sg_data
    )
        
    return redirect("%s?type=%s" % (url_for('resources_index'), resource_type))


@app.route('/resources/show/<resource_id>')
def show_resource(resource_id=None):
    
    resource_type = request.args.get('type')
    
    service_gateway_call = requests.get(
        '%s/resource_registry/read?object_id=%s' % (SERVICE_GATEWAY_BASE_URL,resource_id)
    )
    resource = json.loads(service_gateway_call.content)
    resource = resource['data']['GatewayResponse']
    
    return render_template('resource_browser/show.html', resource_type=resource_type, resource=resource, menu=fetch_menu())


@app.route('/resources/edit/<resource_id>', methods=['GET'])
def edit_reource(resource_id=None):
    if request.args.has_key('type'):
        resource_type = request.args['type']
    else:
        resource_type = None
    
    service_gateway_call = requests.get(
        '%s/resource_registry/read?object_id=%s' % (SERVICE_GATEWAY_BASE_URL,resource_id)
    )
    resource = json.loads(service_gateway_call.content)
    resource = resource['data']['GatewayResponse']

    return render_template('resource_browser/edit_form.html', resource_type=resource_type, resource=resource, menu=fetch_menu())


@app.route('/resources/update/<resource_id>', methods=['POST'])
def update_resource(resource_id=None):
    post_data = SERVICE_REQUEST_TEMPLATE
    post_data['serviceRequest']['serviceOp'] = 'update'
    
    request_data = request.form
    resource_type = request.form['restype']
    
    resource_type_params = {}
    for (key,value) in request_data.items():
        if key == 'restype': continue
        resource_type_params[key] = value

    post_data['serviceRequest']['params']['object'] = [resource_type, resource_type_params]

    service_gateway_call = gateway_post_request(
        '%s/resource_registry/update' % SERVICE_GATEWAY_BASE_URL, 
        post_data
    )

    return redirect("%s?type=%s" % (url_for('resources_index'), resource_type))


@app.route('/resources/delete/<resource_id>')
def delete_resource(resource_id=None):
    pass


@app.route('/schema/<resource_type>')
def get_resource_schema(resource_type):
    resource_type = str(resource_type)

    resource_type_schema_response = requests.get(
        "http://%s/ion-service/resource_type_schema/%s" % (SERVICE_GATEWAY_BASE_URL,resource_type)
    )
    resource_type_schema = json.loads(resource_type_schema_response.content)
    
    return str(resource_type_schema)

@app.route('/resource_types', methods=['GET'])
def resource_types():
    res = fetch_menu()
    return jsonify(data=res)



# -------------------------------------------------------------------------
# CATCHALL ROUTE
# -------------------------------------------------------------------------

@app.route("/<catchall>")
def catchall(catchall):
    return render_template("ion-ux.html", **{"current_url":catchall})    


# -------------------------------------------------------------------------
# NON-ROUTE CODE BELOW
# -------------------------------------------------------------------------

# common service gateway post request method.
# handles including user id and expiry in request
# payload if cookies found in session.
def gateway_post_request(url, payload):
    # conditionally add user id and expiry to request
    if "user_id" in session:
        payload['serviceRequest']['params']['requestor'] = session['user_id']
        payload['serviceRequest']['params']['expiry'] = session['valid_until']

    data={'payload': json.dumps(payload)}
    print "POST request\n  url: %s\n  data: %s" % (url,data)    
        
    service_gateway_call = requests.post(url,data)

    print "POST response\n  url: %s\n  content: %s" % (url,service_gateway_call)    

    if service_gateway_call.status_code != 200:
        # TODO figure out how (if at all) we want to handle 401
        return "The service gateway returned the following error: %d" % service_gateway_call.status_code

    return service_gateway_call


def build_schema_from_form(form_data, service="marine_facilities", object_name="marine_facility"):
    service_name = DEFINED_SERVICES_OPERATIONS[service]['service_name']
    service_op = DEFINED_SERVICES_OPERATIONS[service]['operation_names']['create']
    resource_type = DEFINED_SERVICES_OPERATIONS[service]["restype"]
    result_dict = SERVICE_REQUEST_TEMPLATE
    result_dict['serviceRequest']['serviceName'] = service_name
    result_dict['serviceRequest']['serviceOp'] = service_op
    sub_result_dict = {}
    for (k, v) in form_data.iteritems():
        elems = k.split("__")
        if len(elems) == 1:
            sub_result_dict[elems[0]] = v
        if len(elems) == 2:
            sub_k, sub_v = elems
            if sub_k in result_dict:
                sub_result_dict[sub_k].update({sub_v:v})
            else:
                sub_result_dict[sub_k] = {sub_v:v}
    
    if object_name:
        result_dict["serviceRequest"]["params"][object_name] = [resource_type]                
        result_dict["serviceRequest"]["params"][object_name].append(sub_result_dict)
    else:
        result_dict["serviceRequest"]["params"].append(sub_result_dict)

    return result_dict


def fetch_menu():        
    menu_data = requests.get('%s/list_resource_types' % SERVICE_GATEWAY_BASE_URL)
    menu = json.loads(menu_data.content)
    print menu
    return menu['data']['GatewayResponse']


def create_html_response(request_path, template_name="ion-ux.html"):
    return render_template(template_name, **{"current_url":request_path})


    
if __name__ == '__main__':
    app.run(debug=True, host=HOST, port=PORT)
