from flask import Flask, request, jsonify, render_template, redirect, url_for
import requests, json
from functools import wraps

app = Flask(__name__)


HOST = ''
PORT = 3000
LOGGED_IN = True
PRODUCTION = False

GATEWAY_HOST = "localhost:5000"
SERVICE_GATEWAY_BASE_URL = 'http://%s/ion-service' % GATEWAY_HOST

DEFINED_SERVICES_OPERATIONS = {
    'observatories': {
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

PRODUCTION = False #more configurable in the future.

if PRODUCTION:
    from service_api import ServiceApi
else:
    from dummy_service_api import ServiceApi
    from service_api import ServiceApi


@app.route('/')
def index():
    if LOGGED_IN: #XXX for development
        return render_template("ion-ux.html", **{"current_url":"/"})
    else:
        return render_template("index.html")


@app.route('/signon', methods=['POST'])
def signon():
    # take 
    form_data = json.loads(request.data)
    certificate = form_data['cert']
    
    # build service gateway request
    # make service gateway request
    # handle response and set cookie if successful (redirect to user registration)
    

@app.route('/dashboard', methods=["GET"])
def dashboard():
    return render_template('ux-dashboard.html')


# Generic index to view any resource type
@app.route('/list/<resource_type>/', methods=['GET'])
def list(resource_type=None):

    for k, v in DEFINED_SERVICES_OPERATIONS.iteritems():
        if v['restype'] == resource_type:
        # if DEFINED_SERVICES_OPERATIONS.has_key(resource_type):
            print "YES!"
            resource = DEFINED_SERVICES_OPERATIONS[resource_type]
            resource_type = resource['restype']
            service_gateway_call = requests.get('%s/resource_registry/find_resources?restype=%s' % (SERVICE_GATEWAY_BASE_URL, resource_type))

            resources = json.loads(service_gateway_call.content)
            resources = resources['data']['GatewayResponse'][0]
    
    return jsonify(data=json.dumps(resources))


@app.route('/observatories/', methods=["GET", "POST"])
def observatories():
    if request.is_xhr:
        if request.method == 'POST':
            import time; time.sleep(0.7) #mock latency
            form_data = json.loads(request.data)
            object_schema = build_schema_from_form(form_data, service="marine_facilities")
            url = 'http://%s/ion-service/marine_facility_management/create_marine_facility' % GATEWAY_HOST
            post_request = requests.post(url, data={'payload': json.dumps(object_schema)})
            resp_data = {"success":True}
        else:
            resource = DEFINED_SERVICES_OPERATIONS['observatories']
            resource_type = resource['restype']
            service_gateway_call = requests.get('%s/resource_registry/find_resources?restype=%s' % (SERVICE_GATEWAY_BASE_URL, 'MarineFacility'))
            resp_data = json.loads(service_gateway_call.content)
            resp_data = resp_data['data']['GatewayResponse'][0]
            
        return jsonify(data=resp_data)
    else:
        return create_html_response(request.path)


@app.route('/observatories/<marine_facility_id>/', methods=['GET'])
def observatory_facepage(marine_facility_id):
    if request.is_xhr:        
        marine_facility = service_gateway_get('marine_facility_management', 'read_marine_facility', params={'marine_facility_id': marine_facility_id})
        
        if marine_facility.has_key('_id'):
            # GENERAL
            marine_facility['data_products'] = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'DataProduct', 'id_only': 'False'})[0]
            marine_facility['platforms'] = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'PlatformDevice', 'id_only': 'False'})[0]
            marine_facility['instruments'] = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'InstrumentDevice', 'id_only': 'False'})[0]

            # ADMINISTRATION
            org_id = service_gateway_get('marine_facility_management', 'find_marine_facility_org', params={'marine_facility_id': marine_facility_id})
            marine_facility['users'] = service_gateway_get('org_management', 'find_enrolled_users', params={'org_id': org_id})
            marine_facility['policies'] = service_gateway_get('org_management', 'find_org_roles', params={'org_id': org_id})
            
            # SOFTWARE
            marine_facility['instrument_agents'] = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'InstrumentAgent', 'id_only': 'False'})[0]
            marine_facility['data_process_definitions'] = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'DataProcessDefinition', 'id_only': 'False'})[0]
            
            # EVENTS
            marine_facility['recent_events'] = []
            marine_facility['user_requests'] = service_gateway_get('org_management', 'find_requests', params={'org_id': org_id})
            
            # DEFINITIONS
            marine_facility['platform_models'] = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'PlatformModel', 'id_only': 'False'})[0]
            marine_facility['instrument_models'] = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'InstrumentModel', 'id_only': 'False'})[0]
             
            print '\n\n\n'
            print '----------------------------'
            print 'FINAL RESULT: ', str(marine_facility)
            print '----------------------------'
            
        return jsonify(data=marine_facility)
    else:
        return create_html_response(request.path)


@app.route('/platforms/', methods=['GET'])
def platforms():
    return create_html_response(request.path)


@app.route('/platforms/<platform_device_id>/', methods=['GET'])
def platform_facepage(platform_device_id):
    if request.is_xhr:        
        platform = service_gateway_get('instrument_management', 'read_platform_device', params={'platform_device_id': platform_device_id})
        
        # DEPLOYMENTS
        platform['deployments'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': platform_device_id, 'predicate': 'hasDeployment', 'object_type': 'LogicalPlatform', 'id_only': False})[0]
        
        # ADMINISTRATION        
        platform['instrument_agents'] = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'InstrumentAgent'})
        platform['policies'] = service_gateway_get('policy_management', 'find_resource_policies', params={'resource_id': platform_device_id})
        
        # INSTRUMENTS - ERROR WITH PRELOAD DATA
        # logical_platform_id = platform['deployments'][0]['_id']
        # logical_instruments = service_gateway_get('resource_registry', 'find_objects', params={'subject': logical_platform_id, 'predicate': 'hasInstrument', 'id_only': False})[0]
        # platform['instruments'] = service_gateway_get('instrument_management', 'find_instrument_device_by_platform_device', params={'platform_device_id': platform_device_id})
        
        # EVENTS
        platform['recent_events'] = []
        platform['user_requests'] = []
        
        # DEFINITIONS TBD
        
        # FRAMES OF REFERENCE TBD
        
        
        print '\n\n\n'
        print '----------------------------'
        print 'FINAL RESULT: ', str(platform)
        print '----------------------------'
        
        return jsonify(data=platform)
    else:
        return render_template("ion-ux.html", **{"current_url":request.path})
        

@app.route('/instruments/', methods=['GET', 'POST'])
def instruments():
    return create_html_response(request.path)


@app.route('/instruments/<instrument_device_id>/', methods=['GET'])
def instrument_facepage(instrument_device_id):
    if request.is_xhr:
        instrument = service_gateway_get('instrument_management', 'read_instrument_device', params={'instrument_device_id': instrument_device_id})
        
        # DATA
        instrument['data'] = []
        
        # DEPLOYMENTS
        instrument['deployments'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': instrument_device_id, 'predicate': 'hasDeployment', 'object_type': 'LogicalInstrument', 'id_only': False})[0]
        
        # ADMINISTRATION
        instrument['instrument_agent'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': instrument_device_id, 'predicate': 'hasAgentInstance', 'object_type': 'InstrumentAgentInstance', 'id_only': False})[0]
        
        # POLICIES
        instrument['policies'] = service_gateway_get('policy_management', 'find_resource_policies', params={'resource_id': instrument_device_id})
        
        # FRAME OF REFERENCES TBD
        
        return jsonify(data=instrument)
    else:
        return render_template("ion-ux.html", **{"current_url":request.path})


@app.route('/data_process_definition/<data_process_definition_id>/')
def data_process_definition_facepage(data_process_definition_id):
    dpd = service_gateway_get('resource_registry', 'read', params={'object_id': data_process_definition_id})
    dpd['input_stream_definitions'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': data_process_definition_id, 'predicate': 'hasInputStreamDefinition', 'object_type': 'StreamDefinition', 'id_only': False})
    dpd['output_stream_definitions'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': data_process_definition_id, 'predicate': 'hasStreamDefinition', 'object_type': 'StreamDefinition', 'id_only': False})

    # USED IN
    dpd['data_process'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': data_process_definition_id, 'predicate': 'hasInstance', 'object_type': 'DataProcess', 'id_only': False})
    
    # POLICIES
    dpd['policies'] = service_gateway_get('policy_management', 'find_resource_policies', params={'resource_id': data_process_definition_id})
    
    return jsonify(data=dpd)


@app.route('/')


def build_get_request(service_name, operation_name, params={}):
    url = '%s/%s/%s' % (SERVICE_GATEWAY_BASE_URL, service_name, operation_name)    
    if len(params) > 0:
        param_string = '?'
        for (k, v) in params.iteritems():
            param_string += '%s=%s&' % (k,v)
        url += param_string[:-1]
        
    print '---------------------------------------'
    print url
    print '---------------------------------------'

    return url


def service_gateway_get(service_name, operation_name, params={}):    
    resp = requests.get(build_get_request(service_name, operation_name, params))
    print '---------------------------------------'
    print str(resp.content)
    print '---------------------------------------'
    
    if resp.status_code == 200:
        resp = json.loads(resp.content)
        
        print '---------------------------------------'
        print 'URL: ', type(resp['data']['GatewayResponse'])
        print '---------------------------------------'
        
        if type(resp) == dict:
            return resp['data']['GatewayResponse']
        elif type(resp) == list:
            return resp['data']['GatewayResponse'][0]







@app.route('/dataresource', methods=["GET", "POST"])
def data_resource():
    resp_data = ServiceApi.data_resource(request.args)
    return jsonify(resp_data)


@app.route('/dataresource/<data_resource_id>/', methods=["GET", "POST"])
def data_resource_details(data_resource_id):
    resp_data = ServiceApi.data_resource_details(data_resource_id)
    return jsonify(resp_data)


@app.route('/subscription/', methods=["GET", "POST"])
def subscription():
    resp_data = ServiceApi.subscription(request.args)
    return jsonify(resp_data)


# RESOURCE BROWSER
# Still needs refactoring...
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
        'http://%/ion-service/resource_registry/create' % GATEWAY_HOST, 
        data={'payload': json.dumps(sg_data)}
    )
        
    return redirect("%s?type=%s" % (url_for('resources_index'), resource_type))

@app.route('/resources/show/<resource_id>')
def show_resource(resource_id=None):
    
    resource_type = request.args.get('type')
    
    service_gateway_call = requests.get('http://%s/ion-service/resource_registry/read?object_id=%s' % (GATEWAY_HOST,resource_id))
    resource = json.loads(service_gateway_call.content)
    resource = resource['data']['GatewayResponse']
    
    return render_template('resource_browser/show.html', resource_type=resource_type, resource=resource, menu=fetch_menu())


@app.route('/resources/edit/<resource_id>', methods=['GET'])
def edit_reource(resource_id=None):
    if request.args.has_key('type'):
        resource_type = request.args['type']
    else:
        resource_type = None
    
    service_gateway_call = requests.get('http://%s/ion-service/resource_registry/read?object_id=%s' % (GATEWAY_HOST,resource_id))
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

    service_gateway_call = requests.post(
        'http://%s/ion-service/resource_registry/update' % GATEWAY_HOST, 
        data={'payload': json.dumps(post_data)}
    )

    if service_gateway_call.status_code != 200:
        return "The service gateway returned the following error: %d" % service_gateway_call.status_code


    return redirect("%s?type=%s" % (url_for('resources_index'), resource_type))


@app.route('/resources/delete/<resource_id>')
def delete_resource(resource_id=None):
    pass


@app.route('/schema/<resource_type>')
def get_resource_schema(resource_type):
    resource_type = str(resource_type)

    resource_type_schema_response = requests.get("http://%s/ion-service/resource_type_schema/%s" % (GATEWAY_HOST,resource_type))
    resource_type_schema = json.loads(resource_type_schema_response.content)
    
    return str(resource_type_schema)


@app.route('/resource_types', methods=['GET'])
def resource_types():
    res = fetch_menu()
    return jsonify(data=res)


@app.route("/<catchall>")
def catchall(catchall):
    return render_template("ion-ux.html", **{"current_url":catchall})    


#
#non route code below
#






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
    
    return menu['data']['GatewayResponse']


def create_html_response(request_path, template_name="ion-ux.html"):
    return render_template(template_name, **{"current_url":request_path})


    
if __name__ == '__main__':
    app.run(debug=True, host=HOST, port=PORT)
