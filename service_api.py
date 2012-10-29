import requests, json, time, pprint
from flask import session
from config import GATEWAY_HOST, GATEWAY_PORT

SERVICE_GATEWAY_BASE_URL = 'http://%s:%d/ion-service' % (GATEWAY_HOST, GATEWAY_PORT)
AGENT_GATEWAY_BASE_URL = 'http://%s:%d/ion-agent' % (GATEWAY_HOST, GATEWAY_PORT)

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
    def ui_reset():
        return service_gateway_get('directory', 'reset_ui_specs', params={'url': 'http://filemaker.oceanobservatories.org/database-exports/'})
    
    @staticmethod
    def find_by_resource_type(resource_type):
        return service_gateway_get('resource_registry', 'find_resources', params={'restype': resource_type})[0]
    
    @staticmethod
    def find_by_resource_id(resource_id):
        resource = service_gateway_get('resource_registry', 'read', params={'object_id': resource_id})
        return jsonify(data=resource)

    @staticmethod
    def get_extension(resource_type, resource_id):
        if resource_type == 'InstrumentDevice':
            extension = service_gateway_get('instrument_management', 'get_instrument_device_extension', params= {'instrument_device_id': resource_id})
        elif resource_type == 'InstrumentModel':
            extension = service_gateway_get('resource_registry', 'get_resource_extension', params= {'resource_id': resource_id, 'resource_extension': 'DeviceModelExtension'})
        elif resource_type == 'PlatformDevice':
            extension = service_gateway_get('instrument_management', 'get_platform_device_extension', params= {'platform_device_id': resource_id})
        elif resource_type == 'PlatformModel':
            extension = service_gateway_get('resource_registry', 'get_resource_extension', params= {'resource_id': resource_id, 'resource_extension': 'DeviceModelExtension'})
        elif resource_type == 'DataProduct':
            extension = service_gateway_get('data_product_management', 'get_data_product_extension', params= {'data_product_id': resource_id})
        elif resource_type == 'Observatory':
            # extension = service_gateway_get('observatory_management', 'get_observatory_extension', params= {'observatory_id': resource_id})
            extension = service_gateway_get('resource_registry', 'get_resource_extension', params= {'resource_id': resource_id, 'resource_extension': 'MarineFacilityOrgExtension'})
        elif resource_type == 'UserInfo':
            extension = service_gateway_get('identity_management', 'get_actor_identity_extension', params= {'user_id': resource_id})
        elif resource_type == 'DataProcessDefinition':
            extension = service_gateway_get('resource_registry', 'get_resource_extension', params= {'resource_id': resource_id, 'resource_extension': 'DataProcessDefinitionExtension'})
            # extension = service_gateway_get('resource_registry', 'read', params={'object_id': resource_id})

        return extension


    @staticmethod
    def initiate_realtime_visualization(data_product_id):
        real_time_data = service_gateway_get('visualization_service', 'initiate_realtime_visualization', params= {'data_product_id': data_product_id, 'callback': 'chart.init_realtime_visualization_cb', 'return_format': 'raw_json'})
    
    @staticmethod
    def get_realtime_visualization_data(query_token):
        real_time_data = service_gateway_get('visualization_service', 'get_realtime_visualization_data', params= {'query_token': query_token, 'return_format': 'raw_json'})
        
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
        enrollment = SERVICE_REQUEST_TEMPLATE
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


    
    # INSTRUMENT COMMAND
    # ---------------------------------------------------------------------------
    
    @staticmethod
    def instrument_agent_start(instrument_device_id):
        # instrument_agent_instance_id = service_gateway_get('resource_registry', 'find_objects', params={'subject': instrument_device_id, 'predicate':'hasAgentInstance'})[0][0]['_id']
        instrument_agent_instance = service_gateway_get('instrument_management', 'find_instrument_agent_instance_by_instrument_device', params={'instrument_device_id': instrument_device_id})
        print 'COMINST: instrument_agent_instance', instrument_agent_instance
        instrument_agent_instance_id = instrument_agent_instance[0]['_id']
        print 'COMINST: instrument_agent_instance_id', instrument_agent_instance_id
        agent_request = service_gateway_get('instrument_management', 'start_instrument_agent_instance', params={'instrument_agent_instance_id': str(instrument_agent_instance_id)})
        print 'COMINST: agent_request', agent_request
        
        return agent_request

    @staticmethod
    def instrument_agent_stop(instrument_device_id):
        # instrument_agent_instance_id = service_gateway_get('resource_registry', 'find_objects', params={'subject': instrument_device_id, 'predicate':'hasAgentInstance'})[0][0]['_id']
        # agent_request = service_gateway_get('instrument_management', 'stop_instrument_agent_instance', params={'instrument_agent_instance_id': str(instrument_agent_instance_id)})
        # return agent_request
        
        pass

    @staticmethod
    def instrument_execute(instrument_device_id, command, cap_type):
        if cap_type == '1':
            agent_op = "execute_agent"
        elif cap_type == '3':
            agent_op = "execute_resource"
        params = {"command": {"type_": "AgentCommand", "command": command}}
        if command == 'go_direct_access':
            params['command'].update({'kwargs': {'session_type': 3, 'session_timeout':600, 'inactivity_timeout': 600}})
        agent_response = service_gateway_agent_request(instrument_device_id, agent_op, params)
        return agent_response

    @staticmethod
    def instrument_agent_get_capabilities(instrument_device_id):
        agent_command = "get_capabilities"
        params = {}
        agent_response = service_gateway_agent_request(instrument_device_id, agent_command, params)
        return agent_response
    


    # SIGNON
    # ---------------------------------------------------------------------------

    @staticmethod
    def signon_user(certificate):
        params={'certificate': certificate}
        user_id, valid_until, is_registered = service_gateway_post('identity_management', 'signon', params)

        # set user id, valid until and is registered info in session
        # TODO might need to address issues that arise with using
        # session to set cookie when web server ends up being a pool
        # of web servers?
        session['user_id'] = user_id
        session['valid_until'] = valid_until
        session['is_registered'] = is_registered

        # get roles and stash
        session['roles'] = service_gateway_get('org_management', 'find_all_roles_by_user', params={'user_id': user_id})

    @staticmethod
    def signon_user_testmode(user_name):
        user_identities = ServiceApi.find_by_resource_type("UserIdentity")
        for user_identity in user_identities:
            if user_name in user_identity['name']:
                user_id = user_identity['_id']
                session['user_id'] = user_id
                session['valid_until'] = str(int(time.time()) * 100000)
                session['is_registered'] = True

                # get roles and stash
                roles = service_gateway_get('org_management', 'find_all_roles_by_user', params={'user_id': user_id})
                roles_str = ""
                first_time = True
                for role in roles['RSN_Demo_org']:
                    if not first_time:
                        roles_str = roles_str + ","
                    else:
                        first_time = False
                    roles_str = roles_str + str(role["name"])
                session['roles'] = roles_str
                return

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




# HELPER METHODS
# ---------------------------------------------------------------------------

def build_get_request(service_name, operation_name, params={}):
    url = '%s/%s/%s' % (SERVICE_GATEWAY_BASE_URL, service_name, operation_name)    
    if len(params) > 0:
        param_string = '?'
        for (k, v) in params.iteritems():
            param_string += '%s=%s&' % (k,v)
        url += param_string[:-1]

    pretty_console_log('SERVICE GATEWAY GET URL', url)

    return url

def service_gateway_get(service_name, operation_name, params={}):    
    resp = requests.get(build_get_request(service_name, operation_name, params))
    pretty_console_log('SERVICE GATEWAY GET RESPONSE', resp.content)
    
    if resp.status_code == 200:
        print 'XXXXXX', type(resp.content)
        resp = json.loads(resp.content)
        
        if type(resp) == dict:
            return resp['data']['GatewayResponse']
        elif type(resp) == list:
            return resp['data']['GatewayResponse'][0]

def build_post_request(service_name, operation_name, params={}):
    url = '%s/%s/%s' % (SERVICE_GATEWAY_BASE_URL, service_name, operation_name)    

    post_data = SERVICE_REQUEST_TEMPLATE
    post_data['serviceRequest']['serviceName'] = service_name   
    post_data['serviceRequest']['serviceOp'] = operation_name   
    if len(params) > 0:
        post_data['serviceRequest']['params'] = params

    # conditionally add user id and expiry to request
    if "user_id" in session:
        post_data['serviceRequest']['requester'] = session['user_id']
        post_data['serviceRequest']['expiry'] = session['valid_until']

    data={'payload': json.dumps(post_data)}

    pretty_console_log('SERVICE GATEWAY POST URL/DATA', url, data)

    return url, data

def service_gateway_post(service_name, operation_name, params={}):
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

def build_agent_request(agent_id, operation_name, params={}):
    url = '%s/%s/%s' % (AGENT_GATEWAY_BASE_URL, agent_id, operation_name)    

    post_data = AGENT_REQUEST_TEMPLATE
    post_data['agentRequest']['agentId'] = agent_id   
    post_data['agentRequest']['agentOp'] = operation_name   
    if len(params) > 0:
        post_data['agentRequest']['params'] = params

    # conditionally add user id and expiry to request
    if "user_id" in session:
        post_data['agentRequest']['requester'] = session['user_id']
        post_data['agentRequest']['expiry'] = session['valid_until']

    data={'payload': json.dumps(post_data)}

    pretty_console_log('SERVICE GATEWAY AGENT REQUEST POST URL/DATA', url, data)

    return url, data

def service_gateway_agent_request(agent_id, operation_name, params={}):
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
    print '\n Service Gateway: ', '%s : %s' % (label, content), '\n\n'
