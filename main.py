from flask import Flask, request, session, jsonify, render_template, redirect, url_for
import requests, json
from functools import wraps

app = Flask(__name__)


HOST = '67.58.49.208'
PORT = 3000
LOGGED_IN = True
PRODUCTION = False

#GATEWAY_HOST = "67.58.49.196:5000"   # Todd's machine
GATEWAY_HOST = "localhost:5000"
SERVICE_GATEWAY_BASE_URL = 'http://%s/ion-service' % GATEWAY_HOST

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

PRODUCTION = False #more configurable in the future.

if PRODUCTION:
    from service_api import ServiceApi
else:
    from dummy_service_api import ServiceApi


@app.route('/')
def index():
    if LOGGED_IN: #XXX for development
        return render_template("ion-ux.html", **{"current_url":"/"})
    else:
        return render_template("index.html")

@app.route('/signon/', methods=['GET'])
def signon():
    # carriage returns were removed on the cilogon portal side,
    # restore them before processing
    raw_cert = request.args.get("cert")
    certificate = raw_cert.replace('\\n','\n')

    # TODO is this the right url to go to post signon?
    redirect_url = '/'
    
    # build signon service gateway request
    sg_data = SERVICE_REQUEST_TEMPLATE
    sg_data['serviceRequest']['serviceOp'] = 'signon'   
    sg_data['serviceRequest']['params']['certificate'] = certificate
        
    # make service gateway request
    service_gateway_call = gateway_post_request(
        '%s/identity_management/signon' % SERVICE_GATEWAY_BASE_URL, 
        sg_data
    )
        
    # handle response and set cookie if successful
    user_id, valid_until, is_registered  = json.loads(service_gateway_call.data)
    
    # set user id, valid until and is registered info in session
    # TODO might need to address issues that arise with using
    # session to set cookie when web server ends up being a pool
    # of web servers?
    session['user_id'] = user_id
    session['valid_until'] = valid_until
    session['is_registered'] = is_registered

    # conditionally display user registration dialog
    if not is_registered:
        update_user_info()

    # TODO redirect to url they were displaying before hitting the login button?
    return redirect(redirect_url)
    
@app.route('/dashboard', methods=["GET"])
def dashboard():
    return render_template('ux-dashboard.html')

@app.route('/dataresource', methods=["GET", "POST"])
def data_resource():
    resp_data = ServiceApi.data_resource(request.args)
    return jsonify(resp_data)


@app.route('/observatories/', methods=["GET", "POST"])
def observatories():
    if request.is_xhr:
        if request.method == 'POST':
            import time; time.sleep(0.7) #mock latency
            form_data = json.loads(request.data)
            object_schema = build_schema_from_form(form_data, service="marine_facilities")
            post_request = gateway_post_request(
                '%s/marine_facility_management/create_marine_facility' % SERVICE_GATEWAY_BASE_URL,
                object_schema
            )
            print post_request.content
            resp_data = {"success":True}
        else:
            resp_data = ServiceApi.marine_facilities(request.args)        
        return jsonify(data=resp_data)
    else:
        return create_html_response(request.path)

@app.route('/observatories/<marine_facility_id>/', methods=['GET'])
def observatory_facepage(marine_facility_id):
    if request.is_xhr:
        resp_data = ServiceApi.find_observatory(marine_facility_id)
        return jsonify(data=resp_data)
    else:
        return create_html_response(request.path)

@app.route('/platforms/', methods=['GET'])
def platforms():
    return create_html_response(request.path)

@app.route('/platforms/<platform_id>/', methods=['GET'])
def platform_facepage(platform_id):
    if request.is_xhr: #XXX put into decorator logic
        resp_data = ServiceApi.find_platform(platform_id)
        return jsonify(data=resp_data)
    else:
        return render_template("ion-ux.html", **{"current_url":request.path}) #XXX put into decorator logic

@app.route('/instruments/', methods=['GET', 'POST'])
def instruments():
    return create_html_response(request.path)

@app.route('/instruments/<instrument_id>/', methods=['GET'])
def instrument_facepage(instrument_id):
    if request.is_xhr: #XXX put into decorator logic
        resp_data = ServiceApi.find_instrument(instrument_id)
        return jsonify(data=resp_data)
    else:
        return render_template("ion-ux.html", **{"current_url":request.path}) #XXX put into decorator logic



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


@app.route("/<catchall>")
def catchall(catchall):
    return render_template("ion-ux.html", **{"current_url":catchall})    


#
#non route code below
#

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

def update_user_info():
    is_registered = session['is_registered']
    user_id = session['user_id']

    # determine if this is an update or a new registration
    if is_registered:
        # make service call to retrieve existing user info
        sg_data = SERVICE_REQUEST_TEMPLATE
        sg_data['serviceRequest']['serviceOp'] = 'find_user_info_by_id'   
        sg_data['serviceRequest']['params']['user_id'] = user_id

        service_gateway_call = requests.get(
            '%s/identity_management/find_user_info_by_id' % SERVICE_GATEWAY_BASE_URL, 
            data={'payload': json.dumps(sg_data)}
        )
        
        # handle response
        user_info  = json.loads(service_gateway_call.content)

        # populate user info dialog
        # TODO

    # on successful return from user info dialog,
    # make service gateway request
    if is_registered:
        # make service call to retrieve existing user info
        sg_data = SERVICE_REQUEST_TEMPLATE
        sg_data['serviceRequest']['serviceOp'] = 'update_user_info'   
        sg_data['serviceRequest']['params']['user_info'] = user_info

        service_gateway_call = gateway_post_request(
            '%s/identity_management/update_user_info' % SERVICE_GATEWAY_BASE_URL, 
            sg_data
        )
    else:
        # make service call to retrieve existing user info
        sg_data = SERVICE_REQUEST_TEMPLATE
        sg_data['serviceRequest']['serviceOp'] = 'create_user_info'   
        sg_data['serviceRequest']['params']['user_id'] = user_id
        sg_data['serviceRequest']['params']['user_info'] = user_info

        service_gateway_call = gateway_post_request(
            '%s/identity_management/create_user_info' % SERVICE_GATEWAY_BASE_URL, 
            sg_data
        )
        
        # indicate user is registered
        session['is_registered'] = True
        


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
