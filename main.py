
from flask import Flask, request, jsonify, render_template
import requests
import json
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


# RESOURCE BROWSER - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

SERVICE_GATEWAY_BASE_URL = 'http://localhost:5000/ion-services'

DEFINED_SERVICES_OPERATIONS = {
    'marine_facilities':
        {'restype': 'MarineFacility',
        'operations': {'create': 'create_marine_facility'}},
}

SERVICE_REQUEST_TEMPLATE = {
    'serviceRequest': {
        'serviceName': 'resource_registry', 
        'serviceOp': None,
        'params': {
            'object': [] # Ex. [BankObject, {'name': '...'}] 
        }
    }
}

@app.route('/resources', methods=['GET'])
def resources_index():
    response_data = {}
    response_data['menu'] = fetch_menu()
    
    # Fetch list of a certain type, if specified in request.args
    if request.args.has_key('type'):
        resource_type_url = 'http://localhost:5000/resources/list/%s' % request.args.get('type')
        resource_type_result = requests.get(resource_type_url)
        response_data.update(json.loads(resource_type_result.content))

    # return jsonify(data=response_data)
    return render_template('resource_browser/list.html', data=response_data)


@app.route('/resources/new', methods=['GET'])
def new_resource():    
    response_data = {}
    response_data['menu'] = fetch_menu()    

    return render_template('resource_browser/new.html', data=response_data)


# TEMPORARY CHECK-IN CODE BELOW INCOMPLETE.


@app.route('/resources/create', methods=['POST'])
def create_resource():
    post_data = SERVICE_REQUEST_TEMPLATE
    
    raw_request_data = request.form
    request_data = json.loads(raw_request_data)
    
    # Build main object from form values
    object_dict = {}
    for (key,value) in request_data.items():
        object_dict[key] = value
    post_data['']
    
    # Testing output
    return str(params)


@app.route('/render', methods=['GET'])
def render():
    return render_template('/partials/new_marine_facility.html')

@app.route('/resources/edit/<id>', methods=['GET'])
def edit_reource():
    pass


def fetch_menu():
    '''Returns a menu from the Service Gateway'''
        
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
