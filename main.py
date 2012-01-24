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

# Future use
SERVICE_GATEWAY_HOST = 'localhost/ion-services/' 
SERVICE_GATEWAY_PORT = 5000

@app.route('/resources/', methods=['GET'])
def resources_index():
    '''
    Hacky Web 1.0 single url resource browser to deal with COI refactoring. 
    Needs to be Backbone-ized and cleaned up quite a bit. The service gateway 
    exposes urls that are broken up into concise bits for future Backbone/
    JavaScript calls, i.e. Backbone.Collection -> menu_items.fetch().
    '''    
    
    # List to catch all the returned data.
    response_data = {}
    response_data.update(fetch_menu())

    # menu = requests.get('http://localhost:5000/resources/menu')
    # response_data.update(json.loads(menu.content))
    # response_data['menu'].sort()
    
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
    response_data.update(fetch_menu())
    
    return render_template('resource_browser/new.html', data=response_data)

@app.route('/resources/create', methods=['POST'])
def create_resource():
    
    payload = request.form
    return jsonify(payload=payload)
    # Grab the payload.
    # past it service bridge
    # redirect to /resources with the correct type




def fetch_menu():
    menu_data = requests.get('http://localhost:5000/resources/menu')
    menu = json.loads(menu_data.content)
    menu['menu'].sort()

    return menu

def build_gateway_url(service_name=None, operation=None):
    gateway_url = 'http://%s:%d' % SERVICE_GATEWAY_HOST, SERVICE_GATEWAY_HOST

    if not service_name and not operation:
        return 'something'
    else:
        return 'http://%s:%d/%s/%s'

if __name__ == '__main__':
    app.run(debug=True, port=3000)
