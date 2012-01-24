from flask import Flask, request, jsonify, render_template
import requests
import json

app = Flask(__name__)

SERVICE_GATEWAY_HOST = 'http://localhost:5000/test/bank/what'

PRODUCTION = False #more configurable in the future.
if PRODUCTION:
    from service_api import ServiceApi
else:
    from dummy_service_api import ServiceApi

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/dashboard')
def dashboard():
    return render_template("dashboard.html")

@app.route('/dataresource', methods=["GET", "POST"])
def data_resource():
    resp_data = ServiceApi.data_resource(request.args)
    return jsonify(resp_data)

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

# Reference for intelligent CRUD operations down the line.
DEFINED_SERVICES_OPERATIONS = {
    'marine_facilities':
        {'type_name': 'MarineFacility',
        'operations': {'create': 'create_marine_facility'}},
}

@app.route('/resources', methods=['GET'])
def resources_index():
    '''
    Hacky Web 1.0 resource browser to deal with COI refactoring. 
    Needs to be Backbone-ized and cleaned up quite a bit. The service gateway 
    exposes urls that are broken up into concise bits for future Backbone/
    JavaScript calls, i.e. Backbone.Collection -> menu_items.fetch().
    '''    
    
    # Dict to catch all the response data... And the menu.
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


@app.route('/<service_name>/create', methods=['POST', 'GET'])
def create_resource(service_name):
    '''
    Create function that defaults to resource_registry#create if a higher
    level service is not found in DEFINED_SERVICES_OPERATIONS. Here is an
    example call to the service gateway:
    
    payload={"serviceRequest": {    "serviceName": "exchange_management", 
                                    "serviceOp": "create_exchange_space", 
                                    "params": { 
                                        "exchange_space": ["ExchangeSpace", {"lcstate": "DRAFT", "description": "ION test XS", "name": "ioncore2"}], 
                                        "org_id": "2632d3ec58eb42ca8231bdfd16f1b089" }}}
    '''



    service_name = str(service_name)
    create_operation = 'create'
    payload = {}

    if service_name is not 'resource_registry':
        if DEFINED_SERVICES_OPERATIONS.has_key(service_name):
            create_operation = DEFINED_SERVICES_OPERATIONS.get(service_name).get('operations').get('create')
        else:
            # Needs to turn into a 404
            return "Service name not found."
    
    payload['serviceRequest'] = {'serviceName': service_name, 'serviceOp': create_operation}
    
    form = request.form
    return str(form)

    
@app.route('/resources/edit/<id>', methods=['GET'])
def edit_reource():
    pass

@app.route('/service')
def service_route():
    s = call_service_gateway('resource_registry', 'create', 'new name', 'Org')
    return s

def service_gateway_url(operation, service_name='resource_registry'):
    return "%s/%s/" % (SERVICE_GATEWAY_BASE_URL, service_name)

def fetch_menu():
    '''Returns a menu from the Service Gateway'''
        
    menu_data = requests.get('http://localhost:5000/ion-service/list_resource_types')
    menu = json.loads(menu_data.content)
    
    return menu['data']

def build_gateway_url(service_name=None, operation=None):
    pass
    
if __name__ == '__main__':
    app.run(debug=True, port=3000)
