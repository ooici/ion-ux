from flask import Flask, request, jsonify, render_template, redirect, url_for
import requests, json
from functools import wraps

from config import GATEWAY_HOST

app = Flask(__name__)


HOST = ''
PORT = 3000
LOGGED_IN = True
PRODUCTION = False

SERVICE_GATEWAY_BASE_URL = 'http://%s/ion-service' % GATEWAY_HOST

PRODUCTION = False #more configurable in the future.

if PRODUCTION:
    from service_api import ServiceApi
else:
    # from dummy_service_api import ServiceApi
    from service_api import ServiceApi

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


@app.route('/register/', methods=['GET', 'POST'])
def register():
    if request.is_xhr:
        if request.method == 'POST':
            
            
            # Handle post
            resp_data = {"success":True}
        else:
            resp_data = {}            
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
            url = 'http://%s/ion-service/marine_facility_management/create_marine_facility' % GATEWAY_HOST
            post_request = requests.post(url, data={'payload': json.dumps(object_schema)})
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
    return create_html_response(request.path)


@app.route('/instruments/<instrument_device_id>/', methods=['GET'])
def instrument_facepage(instrument_device_id):
    if request.is_xhr:
        instrument = ServiceApi.find_instrument(instrument_device_id)
        return jsonify(data=instrument)
    else:
        return render_template("ion-ux.html", **{"current_url":request.path})


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



# -------------------------------------------------------------------------
# CATCHALL ROUTE
# -------------------------------------------------------------------------

@app.route("/<catchall>")
def catchall(catchall):
    return render_template("ion-ux.html", **{"current_url":catchall})    



# -------------------------------------------------------------------------
# NON-ROUTE CODE BELOW
# -------------------------------------------------------------------------

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
