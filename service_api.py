import requests, json, time, pprint
from flask import session, jsonify
from config import GATEWAY_HOST, GATEWAY_PORT
from copy import deepcopy

GATEWAY_BASE_URL = 'http://%s:%d' % (GATEWAY_HOST, GATEWAY_PORT)
SERVICE_GATEWAY_BASE_URL = '%s/ion-service' % (GATEWAY_BASE_URL)
AGENT_GATEWAY_BASE_URL = '%s/ion-agent' % (GATEWAY_BASE_URL)

SERVICE_REQUEST_TEMPLATE = {
    'serviceRequest': {
        'serviceName': '', 
        'serviceOp': '',
        'params': {} # Example -> 'object_name': ['restype', {}] }
    }
}

AGENT_REQUEST_TEMPLATE = {
    "agentRequest": { 
        "agentId": "",
        "agentOp": "",
        # "expiry": 0,
        "params": { "command": { "type_": "AgentCommand", "command": "placeholder" }}
    }
}

class ServiceApi(object):

    @staticmethod
    def search(search_query):
        search_url = "http://%s:%d/ion-service/discovery/parse?search_request=SEARCH'_all'LIKE'%s'FROM'resources_index'LIMIT100" % (GATEWAY_HOST, GATEWAY_PORT, search_query)
        search_results = requests.get(search_url)
        search_json = json.loads(search_results.content)
        if search_json['data'].has_key('GatewayResponse'):
            return search_json['data']['GatewayResponse']
        else:
            return search_json['data']

    @staticmethod
    def transition_lcstate(resource_id, transition_event):
        req = service_gateway_get('resource_management', 'execute_lifecycle_transition', params={'resource_id': resource_id, 'transition_event': transition_event})
        return req


    @staticmethod
    def subscribe(resource_type, resource_id, event_type, user_id, resource_name=None):
        name = 'Notification for %s' % resource_name if resource_name else 'NotificationTest'
        description = '%s - %s - Notification Request' % (resource_type, event_type)
        notification = {
            "type_": "NotificationRequest", 
            "lcstate": "DRAFT", 
            "description": description, 
            "name": name, 
            "origin": resource_id, 
            "origin_type": resource_type,
            "event_type": event_type}
        return service_gateway_post('user_notification', 'create_notification', params={'notification': notification, 'user_id': user_id})

    @staticmethod
    def get_event_types():
        events_url = 'http://%s:%s/ion-service/list_resource_types?type=Event' % (GATEWAY_HOST, GATEWAY_PORT)
        events = requests.get(events_url)
        events_json = json.loads(events.content)
        return events_json['data']['GatewayResponse']

    @staticmethod
    def ui_reset():
        return service_gateway_get('directory', 'reset_ui_specs', params={'url': 'http://filemaker.oceanobservatories.org/database-exports/'})
    
    @staticmethod
    def find_by_resource_type(resource_type, user_info_id=None):
        # Todo - Implement "My Resources" as a separate call when they are available (observatories, platforms, etc.)...
        if resource_type == 'NotificationRequest':
            if user_info_id:
                req = service_gateway_get('user_notification', 'get_user_notifications', params={'user_info_id': user_info_id})
            else:
                return []
        req = service_gateway_get('resource_registry', 'find_resources', params={'restype': resource_type})
        return req
    
    @staticmethod
    def find_by_resource_id(resource_id):
        resource = service_gateway_get('resource_registry', 'read', params={'object_id': resource_id})
        return jsonify(data=resource)

    @staticmethod
    def get_extension(resource_type, resource_id):
        if resource_type == 'InstrumentDevice':
            extension = service_gateway_get('instrument_management', 'get_instrument_device_extension', params= {'instrument_device_id': resource_id})
        elif resource_type in ('InstrumentModel', 'SensorModel', 'PlatformModel'):
            extension = service_gateway_get('resource_registry', 'get_resource_extension', params= {'resource_id': resource_id, 'resource_extension': 'DeviceModelExtension'})
        elif resource_type == 'PlatformDevice':
            extension = service_gateway_get('instrument_management', 'get_platform_device_extension', params= {'platform_device_id': resource_id})
        elif resource_type == 'DataProduct':
            extension = service_gateway_get('data_product_management', 'get_data_product_extension', params= {'data_product_id': resource_id})
        elif resource_type == 'UserInfo':
            extension = service_gateway_get('identity_management', 'get_user_info_extension', params= {'user_info_id': resource_id})
        elif resource_type == 'DataProcessDefinition':
            extension = service_gateway_get('data_process_management', 'get_data_process_definition_extension', params= {'data_process_definition_id': resource_id})
        elif resource_type == 'Org':
            extension = service_gateway_get('org_management', 'get_marine_facility_extension', params= {'org_id': resource_id})
        elif resource_type in ('Observatory', 'Subsite', 'PlatformSite', 'InstrumentSite'):
            extension = service_gateway_get('observatory_management', 'get_site_extension', params= {'site_id': resource_id})
        elif resource_type == 'NotificationRequest':
            extension = service_gateway_get('resource_registry', 'get_resource_extension', params= {'resource_id': resource_id, 'resource_extension': 'NotificationRequestExtension'})
        elif resource_type == 'DataProcess':
            extension = service_gateway_get('resource_registry', 'get_resource_extension', params= {'resource_id': resource_id, 'resource_extension': 'DataProcessExtension'})
        elif resource_type in ('UserRole'):
            extension = service_gateway_get('resource_registry', 'get_resource_extension', params= {'resource_id': resource_id, 'resource_extension': 'ExtendedInformationResource'})
        else:
            extension = 'Service API call not implemented.'

        return extension

    @staticmethod
    def initiate_realtime_visualization(data_product_id):
        real_time_data = service_gateway_get('visualization_service', 'initiate_realtime_visualization', params= {'data_product_id': data_product_id, 'callback': 'chart.init_realtime_visualization_cb', 'return_format': 'raw_json'})
    
    @staticmethod
    def get_realtime_visualization_data(query_token):
        real_time_data = service_gateway_get('visualization_service', 'get_realtime_visualization_data', params= {'query_token': query_token, 'return_format': 'raw_json'})
    
    @staticmethod
    def get_overview_visualization_data(data_product_id):
        overview_data = service_gateway_get('visualization_service', 'get_visualization_data', params={'data_product_id': data_product_id, 'return_format': 'raw_json'})
        return overview_data
        
        
    # USER REQUESTS
    # ---------------------------------------------------------------------------

    @staticmethod
    def find_org_user_requests(marine_facility_id, user_id=None):
        org_id = service_gateway_get('marine_facility_management', 'find_marine_facility_org', params={'marine_facility_id': marine_facility_id})
        if user_id:
            user_requests = service_gateway_get('org_management', 'find_user_requests', params={'org_id': org_id, 'user_id': user_id})
        else:
            user_requests = service_gateway_get('org_management', 'find_requests', params={'org_id': org_id})
        
        keepers = []
        
        for e in user_requests:
            user_id = e['user_id']
            if not any([k["user_id"] == user_id for k in keepers]):
                keepers.append(e)

        return keepers
        
    @staticmethod
    def request_enrollment_in_org(marine_facility_id, user_id):
        org_id = service_gateway_get('marine_facility_management', 'find_marine_facility_org', params={'marine_facility_id': marine_facility_id})
        enrollment = deepcopy(SERVICE_REQUEST_TEMPLATE)
        enrollment['serviceRequest']['serviceName'] = 'org_management'
        enrollment['serviceRequest']['serviceOp'] = 'request_enroll'
        enrollment['serviceRequest']['params'] = {'org_id': org_id, 'user_id': user_id}
        url = '%s/org_management/request_enroll' % SERVICE_GATEWAY_BASE_URL
        enroll_user = requests.post(url, data={'payload': json.dumps(enrollment)})        
        return enroll_user

    @staticmethod
    def handle_user_request(marine_facility_id, request_id, action, reason=None):
        org_id = service_gateway_get('marine_facility_management', 'find_marine_facility_org', params={'marine_facility_id': marine_facility_id})

        actions = ['approve', 'deny', 'accept', 'reject']
        if action not in actions:
            return "False"

        if action == 'approve':
            res = service_gateway_get('org_management', 'approve_request', params={'org_id': org_id, 'request_id': request_id})
        elif action == 'deny':
            res = service_gateway_get('org_management', 'deny_request', params={'org_id': org_id, 'request_id': request_id})
        elif action == 'accept':
            res = service_gateway_get('org_management', 'accept_request', params={'org_id': org_id, 'request_id': request_id})
        else:
            res = service_gateway_get('org_management', 'deny_request', params={'org_id': org_id, 'request_id': request_id, 'reason': reason})
        return res

    @staticmethod
    def fetch_map(ui_server, unique_key):
        # TODO: service_gateway_get to support dict arguments
        map_kml = requests.get('http://%s:%d/ion-service/visualization_service/get_dataproduct_kml?visualization_parameters={"unique_key":"%s","ui_server":"%s"}&return_format=raw_json' % (GATEWAY_HOST, GATEWAY_PORT, unique_key, ui_server))
        return map_kml.content
    
    # INSTRUMENT COMMAND
    # ---------------------------------------------------------------------------
    
    @staticmethod
    def instrument_agent_start(instrument_device_id):
        instrument_agent_instance = service_gateway_get('instrument_management', 'find_instrument_agent_instance_by_instrument_device', params={'instrument_device_id': instrument_device_id})
        instrument_agent_instance_id = instrument_agent_instance['_id']
        agent_request = service_gateway_get('instrument_management', 'start_instrument_agent_instance', params={'instrument_agent_instance_id': str(instrument_agent_instance_id)})
        
        return agent_request

    @staticmethod
    def instrument_agent_stop(instrument_device_id):
        instrument_agent_instance = service_gateway_get('instrument_management', 'find_instrument_agent_instance_by_instrument_device', params={'instrument_device_id': instrument_device_id})
        instrument_agent_instance_id = instrument_agent_instance['_id']
        ServiceApi.reset_driver(instrument_device_id)
        agent_request = service_gateway_get('instrument_management', 'stop_instrument_agent_instance', params={'instrument_agent_instance_id': str(instrument_agent_instance_id)})
        
        return agent_request
    
    # Used to ensure that driver is reset prior to an agent being stopped.
    @staticmethod
    def reset_driver(instrument_device_id):
        capabilities = ServiceApi.instrument_agent_get_capabilities(instrument_device_id)
        reset_cmd = 'RESOURCE_AGENT_EVENT_RESET'
        reset_state = bool([True for c in capabilities if c['name'] == reset_cmd])
        if reset_state:
            ServiceApi.instrument_execute(instrument_device_id, reset_cmd, '1')
        return
        
    @staticmethod
    def instrument_execute(instrument_device_id, command, cap_type):
        if cap_type == '1':
            agent_op = "execute_agent"
        elif cap_type == '3':
            agent_op = "execute_resource"
        params = {"command": {"type_": "AgentCommand", "command": command}}
        if command == 'RESOURCE_AGENT_EVENT_GO_DIRECT_ACCESS':
            params['command'].update({'kwargs': {'session_type': 3, 'session_timeout':600, 'inactivity_timeout': 600}})
        agent_response = service_gateway_agent_request(instrument_device_id, agent_op, params)
        return agent_response

    @staticmethod
    def instrument_agent_get_capabilities(instrument_device_id):
        agent_command = "get_capabilities"
        params = {}
        agent_response = service_gateway_agent_request(instrument_device_id, agent_command, params)
        return agent_response



    # PLATFORM COMMAND
    # ---------------------------------------------------------------------------

    @staticmethod
    def platform_agent_start(platform_agent_instance_id):
        agent_request = service_gateway_get('instrument_management', 'start_platform_agent_instance', params={'platform_agent_instance_id': platform_agent_instance_id})
        return agent_request

    @staticmethod
    def platform_agent_stop(platform_agent_instance_id):
        agent_request = service_gateway_get('instrument_management', 'stop_platform_agent_instance', params={'platform_agent_instance_id': platform_agent_instance_id})

        return agent_request

    @staticmethod
    def platform_execute(platform_device_id, command, cap_type):
        if cap_type == '1':
            agent_op = "execute_agent"
        elif cap_type == '3':
            agent_op = "execute_resource"
        params = {"command": {"type_": "AgentCommand", "command": command}}
        if command == 'RESOURCE_AGENT_EVENT_GO_DIRECT_ACCESS':
            params['command'].update({'kwargs': {'session_type': 3, 'session_timeout':600, 'inactivity_timeout': 600}})
        agent_response = service_gateway_agent_request(platform_device_id, agent_op, params)
        return agent_response

    @staticmethod
    def platform_agent_get_capabilities(platform_device_id):
        agent_command = "get_capabilities"
        params = {}
        agent_response = service_gateway_agent_request(platform_device_id, agent_command, params)
        return agent_response
    


    # SIGNON
    # ---------------------------------------------------------------------------

    @staticmethod
    def signon_user(certificate):
        params={'certificate': certificate}
        actor_id, valid_until, is_registered = service_gateway_post('identity_management', 'signon', params)
        
        # set user id, valid until and is registered info in session
        # TODO might need to address issues that arise with using
        # session to set cookie when web server ends up being a pool
        # of web servers?
        session['actor_id'] = actor_id
        session['valid_until'] = valid_until
        session['is_registered'] = is_registered
        
        user = service_gateway_get('identity_management', 'find_user_info_by_id', params={'actor_id': actor_id})
        user_id = user['_id'] if user.has_key('_id') else None
        name = user['name'] if user.has_key('name') else 'Unregistered'
        session['name'] = name
        session['user_id'] = user_id
        
        print 'x user: ', user
        
        session['roles'] = ServiceApi.get_roles_by_actor_id(actor_id)
        
        
    @staticmethod
    def signon_user_testmode(user_name):
        user_identities = ServiceApi.find_by_resource_type("UserInfo")
        for user_identity in user_identities:
            if user_name == user_identity['name']:
                uid = user_identity['_id']
                actor_id = service_gateway_get('resource_registry', 'find_subjects', params={'predicate': 'hasInfo', 'object': uid, 'id_only': True})[0]
                session['actor_id'] = actor_id
                session['valid_until'] = str(int(time.time()) * 100000)
                session['is_registered'] = True
                
                user = service_gateway_get('identity_management', 'find_user_info_by_id', params={'actor_id': actor_id})
                user_id = user['_id'] if user.has_key('_id') else None
                name = user['name'] if user.has_key('name') else 'Unregistered'
                session['name'] = name
                session['user_id'] = user_id
                
                
                print 'dddd - user_id', user_id
                print 'dddd - name', name
                
                
                session['roles'] = ServiceApi.get_roles_by_actor_id(actor_id)
                
                return

    @staticmethod
    def get_roles_by_actor_id(actor_id):
        roles_request = requests.get('http://%s:%d/ion-service/org_roles/%s' % (GATEWAY_HOST, GATEWAY_PORT, actor_id))
        roles = json.loads(roles_request.content)
        return roles['data']['GatewayResponse']

    @staticmethod
    def find_tim():
        users = ServiceApi.find_users()
        for user in users:
            if 'Tim Ampe' in user["name"]:
                return user
        return None
    
    

    # USERS
    # ---------------------------------------------------------------------------
    
    @staticmethod
    def find_all_user_infos():
        # TODO is this what we want here?
        user_infos = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'UserInfo'})[0]
        return user_infos
    
    @staticmethod
    def create_user_info(user_id, user_info):
        params={'user_id': user_id}
        params['user_info'] = user_info
        params['user_info']['type_'] = 'UserInfo'
        return service_gateway_post('identity_management', 'create_user_info', params)
    
    @staticmethod
    def update_user_info(user_info):
        params={'user_info': user_info}
        return service_gateway_post('identity_management', 'update_user_info', params)
    
    @staticmethod
    def find_users():
        resp = []
        user_identities = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'UserIdentity'})[0]
        for user_identity in user_identities:
            user_info = ServiceApi.find_user_info(user_identity["_id"])
            user_identity["user_info"] = user_info
            resp.append(user_identity)

        return resp
    
    @staticmethod
    def find_user(user_id):
        user = service_gateway_get('identity_management', 'read_user_identity', params={'user_id': user_id})
        
        if user.has_key('_id'):
            # CREDENTIALS
            user['credentials'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': user_id, 'predicate': 'hasCredentials', 'object_type': 'UserCredentials'})[0]

            # USER INFO
            user['user_info'] = ServiceApi.find_user_info(user_id)

            # ROLES
            roles = service_gateway_get('org_management', 'find_all_roles_by_user', params={'user_id': user_id})
            role_list = []
            for org in roles:
                for role in roles[org]:
                    role["org"] = org
                    role_list.append(role)
            user['roles'] = role_list
 
            # POLICIES
            user['policies'] = service_gateway_get('policy_management', 'find_resource_policies', params={'resource_id': user_id})

            # OWNED RESOURCES , 'id_only': False
            user['owned_resources'] = service_gateway_get('resource_registry', 'find_subjects', params={'predicate': 'hasOwner', 'object': user_id})[0]
            
            # EVENTS
            user['recent_events'] = []
            user['user_requests'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': user_id, 'predicate': 'hasRequest'})[0]

        return user

    @staticmethod
    def find_user_info(user_id):
        try:
            user_info = service_gateway_get('identity_management', 'find_user_info_by_id', params={'user_id': user_id})
        except:
            user_info = {'contact': {'name': '(Not Registered)', 'email': '(Not Registered)', 'phone': '???'}}
        return user_info

    @staticmethod
    def get_version():
        return service_gateway_get('version', None, base=GATEWAY_BASE_URL)

# HELPER METHODS
# ---------------------------------------------------------------------------

def _build_param_str(params=None):
    param_string = '?'

    requester = session['actor_id'] if session.has_key('actor_id') else 'None'
    param_string += 'requester=%s' % requester

    if params is not None:
        for k, v in params.iteritems():
            param_string += '&%s=%s' % (k,v)

    return param_string

def build_get_request(base, service_name, operation_name=None, params=None):
    """
    Builds a get request out of a service/operation and optional params.

    operation_name may be left blank if going to a custom url.
    """
    urlarr = [base, service_name]
    if operation_name is not None:
        urlarr.append(operation_name)

    url = "/".join(urlarr)
    param_string = _build_param_str(params)

    url += param_string
    #pretty_console_log('SERVICE GATEWAY GET URL', url)

    return url

def service_gateway_get(service_name, operation_name, params=None, base=SERVICE_GATEWAY_BASE_URL):
    service_gateway_resp = requests.get(build_get_request(base, service_name, operation_name, params))
    pretty_console_log('SERVICE GATEWAY GET RESPONSE', service_gateway_resp.content)
    return render_service_gateway_response(service_gateway_resp)

def render_service_gateway_response(service_gateway_resp):
    if service_gateway_resp.status_code == 200:
        resp = json.loads(service_gateway_resp.content)
        try:
            response = resp['data']['GatewayResponse']
            if isinstance(response, list):
                return response[0]
            else:
                return response
        except Exception, e:
            return resp['data']
    else:
        return json.dumps({'GatewayError': {'Message': 'An error occurred communicating with the Service Gateway'}})

def build_post_request(service_name, operation_name, params=None):
    url = '%s/%s/%s' % (SERVICE_GATEWAY_BASE_URL, service_name, operation_name)

    post_data = deepcopy(SERVICE_REQUEST_TEMPLATE)
    post_data['serviceRequest']['serviceName'] = service_name
    post_data['serviceRequest']['serviceOp'] = operation_name

    if params is not None:
        post_data['serviceRequest']['params'] = params

    # conditionally add user id and expiry to request
    if "actor_id" in session:
        post_data['serviceRequest']['requester'] = session['actor_id']
        post_data['serviceRequest']['expiry'] = session['valid_until']

    data={'payload': json.dumps(post_data)}

    pretty_console_log('SERVICE GATEWAY POST URL/DATA', url, data)

    return url, data

def service_gateway_post(service_name, operation_name, params=None):
    url, data = build_post_request(service_name, operation_name, params)
    resp = requests.post(url, data)
    pretty_console_log('SERVICE GATEWAY POST RESPONSE', resp.content)

    if resp.status_code == 200:
        resp = json.loads(resp.content)
        
        if resp['data'].has_key('GatewayError'):
            return resp['data']['GatewayError']
        else:
            if type(resp) == dict:
                return resp['data']['GatewayResponse']
            elif type(resp) == list:
                return resp['data']['GatewayResponse'][0]

def build_agent_request(agent_id, operation_name, params=None):
    url = '%s/%s/%s' % (AGENT_GATEWAY_BASE_URL, agent_id, operation_name)

    post_data = deepcopy(AGENT_REQUEST_TEMPLATE)
    post_data['agentRequest']['agentId'] = agent_id
    post_data['agentRequest']['agentOp'] = operation_name

    if params is not None:
        post_data['agentRequest']['params'] = params

    # conditionally add user id and expiry to request
    if session.has_key('actor_id'):
        post_data['agentRequest']['requester'] = session['actor_id']
        post_data['agentRequest']['expiry'] = session['valid_until']

    data={'payload': json.dumps(post_data)}

    pretty_console_log('SERVICE GATEWAY AGENT REQUEST POST URL/DATA', url, data)
    print 'SERVICE AGENT REQUEST POST DATA: ', data

    return url, data

def service_gateway_agent_request(agent_id, operation_name, params=None):
    url, data = build_agent_request(agent_id, operation_name, params)
    resp = requests.post(url, data)
    pretty_console_log('SERVICE GATEWAY AGENT REQUEST POST RESPONSE', resp.content)

    if resp.status_code == 200:
        resp = json.loads(resp.content)

        if type(resp) == dict:
            return resp['data']['GatewayResponse']
        elif type(resp) == list:
            return resp['data']['GatewayResponse'][0]

def pretty_console_log(label, content, data=None):
    # pass
    print '\n Service Gateway: ', '%s : %s' % (label, content), '\n\n'
