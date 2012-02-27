from flask import Flask, request, jsonify, render_template, redirect, url_for
import requests, json
from functools import wraps

app = Flask(__name__)


PRODUCTION = False #more configurable in the future.
if PRODUCTION:
    from service_api import ServiceApi
else:
    from dummy_service_api import ServiceApi

LOGGED_IN = True



@app.route('/')
def index():
    if LOGGED_IN: #XXX for development
        return render_template("ion-ux.html", **{"current_url":"/"})
    else:
        return render_template("index.html")

@app.route('/dashboard', methods=["GET"])
def dashboard():
    return render_template('ux-dashboard.html')

@app.route('/dataresource', methods=["GET", "POST"])
def data_resource():
    resp_data = ServiceApi.data_resource(request.args)
    return jsonify(resp_data)

@app.route('/marine_facilities', methods=["GET", "POST"])
def marine_facilities():
    if request.method == 'POST':
        import time; time.sleep(0.7) #mock latency

        form_data = json.loads(request.data)
        object_schema = build_schema_from_form(form_data, service="marine_facilities")

        print object_schema

        post_request = requests.post('http://localhost:5000/ion-service/marine_facility_management/create_marine_facility', data={'payload': json.dumps(object_schema)})
        
        print post_request.content
        
        resp_data = {"success":True}
    else:
        resp_data = ServiceApi.marine_facilities(request.args)
    return jsonify(data=resp_data)

@app.route('/dataresource/<data_resource_id>', methods=["GET", "POST"])
def data_resource_details(data_resource_id):
    resp_data = ServiceApi.data_resource_details(data_resource_id)
    return jsonify(resp_data)

@app.route('/subscription', methods=["GET", "POST"])
def subscription():
    resp_data = ServiceApi.subscription(request.args)
    return jsonify(resp_data)


@app.route('/lca')
def lca():
    return render_template('lca.html')




RESOURCE_REGISTRY_URL = 'http://localhost:5000/ion-services/resource_registry/'

DEFINED_SERVICES_OPERATIONS = {
    'marine_facilities':
        {
            'restype': 'MarineFacility',
            'service_name': 'marine_facility_management',
            'object_name': 'marine_facility',
            'operation_names': {'create': 'create_marine_facility'}
        },
}

SERVICE_REQUEST_TEMPLATE = {
    'serviceRequest': {
        'serviceName': '', 
        'serviceOp': '',
        'params': {} # Example -> 'object_name': ['restype', {}] }
    }
}



def build_schema_from_form(form_data, service="marine_facilities", object_name="marine_facility"):
    service_name = DEFINED_SERVICES_OPERATIONS[service]['service_name']
    service_op = DEFINED_SERVICES_OPERATIONS[service]['operation_names']['create']
    resource_type = DEFINED_SERVICES_OPERATIONS[service]["restype"]
    result_dict = SERVICE_REQUEST_TEMPLATE
    result_dict['serviceRequest']['serviceName'] = service_name
    result_dict['serviceRequest']['serviceOp'] = service_op
    result_dict["serviceRequest"]["params"][object_name] = [resource_type]
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
    result_dict["serviceRequest"]["params"][object_name].append(sub_result_dict)
    return result_dict



# def build_schema_from_form(form_data, service="marine_facilities"):
#     resource_type = DEFINED_SERVICES_OPERATIONS[service]["restype"]
#     result_dict = SERVICE_REQUEST_TEMPLATE
#     result_dict["serviceRequest"]["params"]["object"].append(resource_type)
#     sub_result_dict = {}
#     for (k, v) in form_data.iteritems():
#         elems = k.split("__")
#         if len(elems) == 1:
#             sub_result_dict[elems[0]] = v
#         if len(elems) == 2:
#             sub_k, sub_v = elems
#             if sub_k in result_dict:
#                 sub_result_dict[sub_k].update({sub_v:v})
#             else:
#                 sub_result_dict[sub_k] = {sub_v:v}
#     result_dict["serviceRequest"]["params"]["object"].append(sub_result_dict)
#     return result_dict


# RESOURCE BROWSER
# Still needs refactoring...

@app.route('/resources', methods=['GET'])
def resources_index():    
    if request.args.has_key('type'):
        resource_type = request.args['type']        
        service_gateway_call = requests.get('http://localhost:5000/ion-service/resource_registry/find_resources?restype=%s' % resource_type)
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
        'http://localhost:5000/ion-service/resource_registry/create', 
        data={'payload': json.dumps(sg_data)}
    )
        
    return redirect("%s?type=%s" % (url_for('resources_index'), resource_type))

@app.route('/resources/show/<resource_id>')
def show_resource(resource_id=None):
    
    resource_type = request.args.get('type')
    
    service_gateway_call = requests.get('http://localhost:5000/ion-service/resource_registry/read?object_id=%s' % resource_id)
    resource = json.loads(service_gateway_call.content)
    resource = resource['data']['GatewayResponse']
    
    return render_template('resource_browser/show.html', resource_type=resource_type, resource=resource, menu=fetch_menu())


@app.route('/resources/edit/<resource_id>', methods=['GET'])
def edit_reource(resource_id=None):
    if request.args.has_key('type'):
        resource_type = request.args['type']
    else:
        resource_type = None
    
    service_gateway_call = requests.get('http://localhost:5000/ion-service/resource_registry/read?object_id=%s' % resource_id)
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
        'http://localhost:5000/ion-service/resource_registry/update', 
        data={'payload': json.dumps(post_data)}
    )

    if service_gateway_call.status_code != 200:
        return "The service gateway returned the following error: %d" % service_gateway_call.status_code


    return redirect("%s?type=%s" % (url_for('resources_index'), resource_type))


@app.route('/resources/delete/<resource_id>')
def delete_resource(resource_id=None):
    pass


def fetch_menu():        
    menu_data = requests.get('http://localhost:5000/ion-service/list_resource_types')
    menu = json.loads(menu_data.content)
    
    return menu['data']['GatewayResponse']

@app.route('/schema/<resource_type>')
def get_resource_schema(resource_type):
    resource_type = str(resource_type)

    resource_type_schema_response = requests.get("http://localhost:5000/ion-service/resource_type_schema/%s" % resource_type) 
    resource_type_schema = json.loads(resource_type_schema_response.content)
    
    return str(resource_type_schema)

@app.route("/<catchall>")
def catchall(catchall):
    return render_template("ion-ux.html", **{"current_url":catchall})    
    
if __name__ == '__main__':
    app.run(debug=True, port=3000)
