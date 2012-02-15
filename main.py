from flask import Flask, request, jsonify, render_template, redirect, url_for
import requests, json
from functools import wraps

app = Flask(__name__)


PRODUCTION = False #more configurable in the future.
if PRODUCTION:
    from service_api import ServiceApi
else:
    from dummy_service_api import ServiceApi

@app.route('/')
def index():
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
        print request.data 
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


# RESOURCE BROWSER
# Still needs refactoring...

RESOURCE_REGISTRY_URL = 'http://localhost:5000/ion-services/resource_registry/'

DEFINED_SERVICES_OPERATIONS = {
    'marine_facilities':
        {'restype': 'MarineFacility',
        'operations': {'create': 'create_marine_facility'}},
}

SERVICE_REQUEST_TEMPLATE = {
    'serviceRequest': {
        'serviceName': 'resource_registry', 
        'serviceOp': '',
        'params': {
            'object': [] # Ex. [BankObject, {'name': '...'}] 
        }
    }
}

@app.route('/resources', methods=['GET'])
def resources_index():    
    if request.args.has_key('type'):
        resource_type = request.args['type']
        
        get_data = SERVICE_REQUEST_TEMPLATE
        get_data['serviceRequest']['serviceOp'] = 'find_resources'
        get_data['serviceRequest']['params']['object'] = [resource_type, {'restype': resource_type}]
        
        service_gateway_call = requests.get(
            'http://localhost:5000/ion-service/resource_registry/find_resources',
            data={'payload': json.dumps(get_data)}
        )
        
        resources = json.loads(service_gateway_call.content)
        print convert_unicode(resources['data'])
        resources = json.loads(resources['data'])
        resources = resources[0]
    else:
        resource_type=None
        resources=None
    
    return render_template('resource_browser/list.html', resource_type=resource_type, resources=resources, menu=fetch_menu())
    
    # if request.args.has_key('type'):
    #     resource_type = request.args['type']
    #     
    #     service_gateway_call = requests.get('http://localhost:5000/resources/list/%s' % resource_type)
    #     resources = json.loads(service_gateway_call.content)
    #     resources = resources['resource_types']
    # else:
    #     resource_type=None
    #     resources=None
    # 
    # return render_template('resource_browser/list.html', resource_type=resource_type, resources=resources, menu=fetch_menu())


@app.route('/resources/new', methods=['GET'])
def new_resource():    
    if request.args.has_key('type'):
        resource_type = request.args['type']
    else:
        resource_type = None
        
    return render_template('resource_browser/new_form.html', resource_type=resource_type, resource=None, menu=fetch_menu())



@app.route('/resources/new2', methods=['GET'])
def new_resource2():
    
    if request.args.has_key('type'):
        resource_type = request.args['type']
        form_values = requests.get('http://localhost:5000/ion-service/resource_type_schema/%s' % resource_type)
        form_values = json.loads(form_values.content)
        # form_values = json.loads(form_values['data'])
    else:
        resource_type = None

    # return str(form_values['data'])
    return render_template('resource_browser/create_dynamic_form.html', form_values=form_values, resource_type=resource_type, resource=None, menu=fetch_menu())


@app.route('/resources/create', methods=['POST'])
def create_resource():
    post_data = SERVICE_REQUEST_TEMPLATE
    post_data['serviceRequest']['serviceOp'] = 'create'
    
    request_data = request.form
    resource_type = request.form['restype']
    
    resource_type_params = {}
    for (key,value) in request_data.items():
        if key == 'restype': continue
        resource_type_params[key] = value
    
    post_data['serviceRequest']['params']['object'] = [resource_type, resource_type_params]
    
    service_gateway_call = requests.post(
        'http://localhost:5000/ion-service/resource_registry/create', 
        data={'payload': json.dumps(post_data)}
    )
    
    if service_gateway_call.status_code != 200:
        return "The service gateway returned the following error: %d" % service_gateway_call.status_code

    return redirect("%s?type=%s" % (url_for('resources_index'), resource_type))


@app.route('/resources/show/<resource_id>')
def show_resource(resource_id=None):
    
    resource_type = request.args.get('type')
    
    service_gateway_call = requests.get('http://localhost:5000/ion-service/resource_registry/read?object_id=%s' % resource_id)
    resource = json.loads(service_gateway_call.content)
    resource = json.loads(resource['data'])
    
    # return str(resource)
    return render_template('resource_browser/show.html', resource_type=resource_type, resource=resource, menu=fetch_menu())


@app.route('/resources/edit/<resource_id>', methods=['GET'])
def edit_reource(resource_id=None):
    if request.args.has_key('type'):
        resource_type = request.args['type']
    else:
        resource_type = None
    
    service_gateway_call = requests.get('http://localhost:5000/ion-service/resource_registry/read?object_id=%s' % resource_id)
    resource = json.loads(service_gateway_call.content)
    resource = json.loads(resource['data'])

    # return str(resource)
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

    # return str(post_data)
    return redirect("%s?type=%s" % (url_for('resources_index'), resource_type))

@app.route('/resources/delete/<resource_id>')
def delete_resource(resource_id=None):
    return str(resource_id)


def fetch_menu():        
    menu_data = requests.get('http://localhost:5000/ion-service/list_resource_types')
    menu = json.loads(menu_data.content)
    
    return menu['data']

@app.route('/schema/<resource_type>')
def get_resource_schema(resource_type):
    resource_type = str(resource_type)

    resource_type_schema_response = requests.get("http://localhost:5000/ion-service/resource_type_schema/%s" % resource_type) 
    resource_type_schema = json.loads(resource_type_schema_response.content)
    
    return str(resource_type_schema)
    # return jsonify(data=resource_type_schema)
    
if __name__ == '__main__':
    app.run(debug=True, port=3000)
