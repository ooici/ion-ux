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
        "params": { "command": { "type_": "AgentCommand", "command": "placeholder" }}
    }
}

class ServiceApi(object):
    
    @staticmethod
    def find_all_frame_of_references():
        frame_of_references = []
        frame_of_references.append(ServiceApi.find_by_resource_type('Site'))
        frame_of_references.append(ServiceApi.find_by_resource_type('LogicalPlatform'))
        frame_of_references.append(ServiceApi.find_by_resource_type('LogicalInstrument'))
        return frame_of_references
    
    @staticmethod
    def create_observatory(data, manager_user_id):
        marine_facility_id = service_gateway_post('marine_facility_management', 'create_marine_facility', params=data["serviceRequest"]["params"])

        org_id = service_gateway_get('marine_facility_management', 'find_marine_facility_org', params={'marine_facility_id': marine_facility_id})
        enrollment = service_gateway_post('org_management', 'enroll_member', params={'org_id': org_id, 'user_id': manager_user_id})
        management = service_gateway_post('org_management', 'grant_role', params={'org_id': org_id, 'user_id': manager_user_id, 'role_name': 'ORG_MANAGER'})
        return marine_facility_id
    
    @staticmethod
    def test_create_marine_facility():
        marine_facility_template = {"serviceRequest": {
            "serviceName": "marine_facility_management",
            "serviceOp": "create_marine_facility",
            "params": {
                "marine_facility": {
                    "type_": "MarineFacility",
                    "name": "NewMF",
                    "description": "A new marine facility.",
                    "contact": {
                        "name": "Test User",
                        "phone": "858-555-1212",
                        "email": "test@user.com",
                        "city": "San Diego",
                        "postalcode": "92093"
                    },
                    "institution": {
                        "name": "Test Institution",
                        "website": "ti.edu",
                        "email": "ti@ti.edu",
                        "phone": "858-555-1212"
                        }
                    }
                }
            }
        }
        
        
        marine_facility = service_gateway_post("marine_facility_management", "create_marine_facility", params=marine_facility_template)
        return marine_facility
    
    @staticmethod
    def find_tim():
        users = ServiceApi.find_users()
        for user in users:
            if 'Tim Ampe' in user["name"]:
                return user
        return None
    
    @staticmethod
    def find_platform_models():
        platform_models = service_gateway_get('instrument_management', 'find_platform_models', params={})
        return platform_models

    @staticmethod
    def instrument_primary_deployment_off(instrument_device_id, logical_instrument_id):
        primary_deployment = service_gateway_get('instrument_management', 'undeploy_primary_instrument_device_from_logical_instrument', params={'instrument_device_id': instrument_device_id, 'logical_instrument_id': logical_instrument_id})
        return str(primary_deployment)

    @staticmethod
    def instrument_primary_deployment_on(instrument_device_id, logical_instrument_id):
        primary_deployment = service_gateway_get('instrument_management', 'deploy_as_primary_instrument_device_to_logical_instrument', params={'instrument_device_id': instrument_device_id, 'logical_instrument_id': logical_instrument_id})
        return str(primary_deployment)

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
    def find_resources_by_resource_type(resource_type, user_identity_id=None):
        if user_identity_id:
            resources = service_gateway_get('resource_registry', 'find_subject', params={'subject_type': resource_type , 'predicate': 'hasOwner', 'object_id': user_identity_id})
            return resources
        resources = service_gateway_get('resource_type', 'find_resources', params={'restype': resource_type})
        return resources
    
    @staticmethod
    def instrument_agent_start(instrument_device_id):
        instrument_agent_instance_id = service_gateway_get('resource_registry', 'find_objects', params={'subject': instrument_device_id, 'predicate':'hasAgentInstance'})[0][0]['_id']
        agent_request = service_gateway_get('instrument_management', 'start_instrument_agent_instance', params={'instrument_agent_instance_id': str(instrument_agent_instance_id)})
        return agent_request

    @staticmethod
    def instrument_agent_stop(instrument_device_id):
        instrument_agent_instance_id = service_gateway_get('resource_registry', 'find_objects', params={'subject': instrument_device_id, 'predicate':'hasAgentInstance'})[0][0]['_id']
        agent_request = service_gateway_get('instrument_management', 'stop_instrument_agent_instance', params={'instrument_agent_instance_id': str(instrument_agent_instance_id)})
        return agent_request

    @staticmethod
    def instrument_execute_agent(instrument_device_id, agent_command):
        agent_op = "execute_agent"
        params = {"command": {"type_": "AgentCommand", "command": agent_command}}
        agent_response = service_gateway_agent_request(instrument_device_id, agent_op, params)
        return agent_response

    @staticmethod
    def instrument_agent_get_capabilities(instrument_device_id):        
        agent_command = "get_capabilities"
        params = {}
        agent_response = service_gateway_agent_request(instrument_device_id, agent_command, params)
        return agent_response
    
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
    def find_observatory(marine_facility_id):
        marine_facility = service_gateway_get('marine_facility_management', 'read_marine_facility', params={'marine_facility_id': marine_facility_id})
        
        if marine_facility.has_key('_id'):
            org_id = service_gateway_get('marine_facility_management', 'find_marine_facility_org', params={'marine_facility_id': marine_facility_id})

            if org_id:
                marine_facility['org_id'] = org_id

            # GENERAL
            marine_facility['data_products'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': org_id, 'predicate': 'hasResource', 'object_type': 'DataProduct'})[0]
            marine_facility['platforms'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': org_id, 'predicate': 'hasResource', 'object_type': 'PlatformDevice'})[0]
            marine_facility['instruments'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': org_id, 'predicate': 'hasResource', 'object_type': 'InstrumentDevice'})[0]

            # ADMINISTRATION            
            marine_facility['participants'] = []
            participants = service_gateway_get('resource_registry', 'find_objects', params={'subject': org_id, 'predicate': 'hasMembership'})[0]
            
            for participant in participants:
                participant["user_info"] = ServiceApi.find_user_info(participant["_id"])
                marine_facility['participants'].append(participant)

            marine_facility['roles'] = service_gateway_get('org_management', 'find_org_roles', params={'org_id': org_id})
            
            # SOFTWARE
            marine_facility['instrument_agents'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': org_id, 'predicate': 'hasResource', 'object_type': 'InstrumentAgent'})[0]
            marine_facility['data_process_definitions'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': org_id, 'predicate': 'hasResource', 'object_type': 'DataProcessDefinition'})[0]
            
            # EVENTS
            marine_facility['recent_events'] = []
            marine_facility['user_requests'] = service_gateway_get('org_management', 'find_requests', params={'org_id': org_id})
            
            # DEFINITIONS
            marine_facility['platform_models'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': org_id, 'predicate': 'hasResource', 'object_type': 'PlatformModel'})[0]
            marine_facility['instrument_models'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': org_id, 'predicate': 'hasResource', 'object_type': 'InstrumentModel'})[0]
        
            # FRAMES OF REFERENCE
            marine_facility['subordinates'] = service_gateway_get('marine_facility_management', 'find_subordinate_frames_of_reference', params={'input_resource_id': marine_facility_id})
            
            # OWNER
            marine_facility['owner'] = ServiceApi.find_owner(marine_facility_id)

            # POLICIES
            marine_facility['policies'] = service_gateway_get('policy_management', 'find_resource_policies', params={'resource_id': org_id})
        
        return marine_facility
    
    @staticmethod
    def find_platform(platform_device_id):
        platform = service_gateway_get('instrument_management', 'read_platform_device', params={'platform_device_id': platform_device_id})
        
        if platform.has_key('_id'):
            # DEPLOYMENTS
            platform['primary_deployment'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': platform_device_id, 'predicate': 'hasPrimaryDeployment', 'object_type': 'LogicalPlatform', 'id_only': False})[0]
            platform['deployments'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': platform_device_id, 'predicate': 'hasDeployment', 'object_type': 'LogicalPlatform', 'id_only': False})[0]
        
            # ADMINISTRATION        
            platform['policies'] = service_gateway_get('policy_management', 'find_resource_policies', params={'resource_id': platform_device_id})
            # platform['instrument_agents'] = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'InstrumentAgent'})[0]
        
            # INSTRUMENTS - ERROR WITH PRELOAD DATA
            # logical_platform_id = platform['deployments'][0]['_id']
            # logical_instruments = service_gateway_get('resource_registry', 'find_objects', params={'subject': logical_platform_id, 'predicate': 'hasInstrument', 'id_only': False})[0]
            platform['instruments'] = service_gateway_get('instrument_management', 'find_instrument_device_by_platform_device', params={'platform_device_id': platform_device_id})
        
            # EVENTS
            platform['recent_events'] = []
            platform['user_requests'] = []
        
            # FRAMES OF REFERENCE
            platform['subordinates'] = service_gateway_get('marine_facility_management', 'find_subordinate_frames_of_reference', params={'input_resource_id': platform['deployments'][0]['_id']})
            platform['superiors'] = service_gateway_get('marine_facility_management', 'find_superior_frames_of_reference', params={'input_resource_id': platform['deployments'][0]['_id']})
            
            # OWNER
            platform['owner'] = ServiceApi.find_owner(platform_device_id)

            # POLICIES
            platform['policies'] = service_gateway_get('policy_management', 'find_resource_policies', params={'resource_id': platform_device_id})

            # DEFINITIONS TBD
        
        return platform
    
    @staticmethod
    def find_platform_model(platform_model_id):
        platform_model = service_gateway_get('resource_registry', 'read', params={'object_id': platform_model_id})
        
        if platform_model.has_key('_id'):
            # RELATED DEVICES
            platform_model['related_devices'] = service_gateway_get('resource_registry', 'find_subjects', params={'subject_type': 'PlatformDevice', 'predicate': 'hasModel', 'object': platform_model_id, 'id_only': False})[0]
            
            # OWNER
            platform_model['owner'] = ServiceApi.find_owner(platform_model_id)

            # POLICIES
            platform_model['policies'] = service_gateway_get('policy_management', 'find_resource_policies', params={'resource_id': platform_model_id})
        
        return platform_model

    @staticmethod
    def find_instrument(instrument_device_id):
        instrument = service_gateway_get('instrument_management', 'read_instrument_device', params={'instrument_device_id': instrument_device_id})
        
        if instrument.has_key('_id'):
            # DATA PRODUCTS
            instrument['data_products'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': instrument_device_id, 'predicate': 'hasOutputProduct', 'id_only': False})[0]
            for data_product in instrument['data_products']:
                if 'raw' in data_product['name'].lower():
                    instrument['raw_data_product'] = data_product
                elif 'parsed' in data_product['name'].lower():
                    instrument['parsed_data_product'] = data_product

            # LAST UPDATE
            instrument['last_update'] = {}
            if 'parsed_data_product' in instrument:
                instrument['last_update'] = service_gateway_get('data_product_management', 'get_last_update', params={'data_product_id': instrument['parsed_data_product']['_id']})
                # TODO use last update to populate 'Latest Readings'
                # TODO get visualization
                # instrument['visualization'] = service_gateway_get('visualization', 'get_google_dt', params={'data_product_id': instrument['parsed_data_product']['_id']})

            # RELATED MODEL
            instrument['related_model'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': instrument_device_id, 'predicate': 'hasModel', 'object_type': 'InstrumentModel', 'id_only': False})[0][0]
        
            # DEPLOYMENTS
            instrument['primary_deployment'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': instrument_device_id, 'predicate': 'hasPrimaryDeployment', 'object_type': 'LogicalInstrument', 'id_only': False})[0]
            instrument['deployments'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': instrument_device_id, 'predicate': 'hasDeployment', 'object_type': 'LogicalInstrument', 'id_only': False})[0]
        
            # ADMINISTRATION
            instrument['instrument_agent'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': instrument_device_id, 'predicate': 'hasAgentInstance', 'object_type': 'InstrumentAgentInstance', 'id_only': False})[0][0]
        
            # FRAME OF REFERENCES
            instrument['superiors'] = service_gateway_get('marine_facility_management', 'find_superior_frames_of_reference', params={'input_resource_id': instrument['deployments'][0]["_id"]})
            
            # OWNER
            instrument['owner'] = ServiceApi.find_owner(instrument_device_id)
        
            # POLICIES
            instrument['policies'] = service_gateway_get('policy_management', 'find_resource_policies', params={'resource_id': instrument_device_id})


        
        return instrument

    @staticmethod
    def find_instrument_model(instrument_model_id):
        instrument_model = service_gateway_get('resource_registry', 'read', params={'object_id': instrument_model_id})
        
        if instrument_model.has_key('_id'):
            # RELATED INSTRUMENTS
            instrument_model['related_instruments'] = service_gateway_get('resource_registry', 'find_subjects', params={'subject_type': 'InstrumentDevice', 'predicate': 'hasModel', 'object': instrument_model_id, 'id_only': False})[0]
        
            # INSTRUMENT AGENTS
            instrument_model['instrument_agents'] = service_gateway_get('resource_registry', 'find_subjects', params={'subject_type': 'InstrumentAgent', 'predicate': 'hasModel', 'object': instrument_model_id, 'id_only': False})[0]
            
            # OWNER
            instrument_model['owner'] = ServiceApi.find_owner(instrument_model_id)
        
            # POLICIES
            instrument_model['policies'] = service_gateway_get('policy_management', 'find_resource_policies', params={'resource_id': instrument_model_id})
        
        return instrument_model

    @staticmethod
    def find_instrument_agent(instrument_agent_id):
        instrument_agent = service_gateway_get('resource_registry', 'read', params={'object_id': instrument_agent_id})
        
        if instrument_agent.has_key('_id'):            
            # RELATED INSTRUMENT MODELS
            instrument_agent['related_models'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': instrument_agent_id, 'predicate': 'hasModel', 'id_only': False})[0]

            # RELATED INSTRUMENT AGENT INSTANCES
            instrument_agent['related_instances'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': instrument_agent_id, 'predicate': 'hasInstance', 'id_only': False})[0]

            # RELATED DATA PROCESS DEFINITIONS
            instrument_agent['related_process_definitions'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': instrument_agent_id, 'predicate': 'hasProcessDefinition', 'id_only': False})[0]

            # OWNER
            instrument_agent['owner'] = ServiceApi.find_owner(instrument_agent_id)
        
            # POLICIES
            instrument_agent['policies'] = service_gateway_get('policy_management', 'find_resource_policies', params={'resource_id': instrument_agent_id})

        return instrument_agent
    
    @staticmethod
    def find_data_process_definition(data_process_definition_id):
        data_process_definition = service_gateway_get('resource_registry', 'read', params={'object_id': data_process_definition_id})
        
        if data_process_definition.has_key('_id'):
            # STREAM DEFINITIONS
            data_process_definition['input_stream_definitions'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': data_process_definition_id, 'predicate': 'hasInputStreamDefinition', 'object_type': 'StreamDefinition', 'id_only': False})[0]
            data_process_definition['output_stream_definitions'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': data_process_definition_id, 'predicate': 'hasStreamDefinition', 'object_type': 'StreamDefinition', 'id_only': False})[0]

            # USED IN
            data_process_definition['data_process'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': data_process_definition_id, 'predicate': 'hasInstance', 'object_type': 'DataProcess', 'id_only': False})[0]
        
            # OWNER
            data_process_definition['owner'] = ServiceApi.find_owner(data_process_definition_id)

            # POLICIES
            data_process_definition['policies'] = service_gateway_get('policy_management', 'find_resource_policies', params={'resource_id': data_process_definition_id})

        return data_process_definition
    
    @staticmethod
    def find_data_products():
        data_products = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'DataProduct'})[0]
        return data_products

    @staticmethod
    def find_data_product(data_product_id):
        data_product = service_gateway_get('resource_registry', 'read', params={'object_id': data_product_id})
        
        if data_product.has_key('_id'):            
            # LAST UPDATE
            data_product['last_update'] = service_gateway_get('data_product_management', 'get_last_update', params={'data_product_id': data_product_id})
            # TODO use last update to populate 'Latest Readings'
            # TODO get visualization
            # instrument['visualization'] = service_gateway_get('visualization', 'get_google_dt', params={'data_product_id': data_product_id})
        
            # INPUT PROCESS
            data_product['input_process'] = service_gateway_get('resource_registry', 'find_subjects', params={'predicate': 'hasInputProduct', 'object': data_product_id, 'id_only': False})[0]
        
            # OUTPUT PROCESS
            data_product['output_process'] = service_gateway_get('resource_registry', 'find_subjects', params={'predicate': 'hasOutputProduct', 'object': data_product_id, 'id_only': False})[0]
        
            # FRAME OF REFERENCES TBD
        
            # OWNER
            data_product['owner'] = ServiceApi.find_owner(data_product_id)
        
            # POLICY
            data_product['policies'] = service_gateway_get('policy_management', 'find_resource_policies', params={'resource_id': data_product_id})

        return data_product
    
    @staticmethod
    def find_frame_of_reference(frame_of_reference_id):
        frame_of_reference = service_gateway_get('resource_registry', 'read', params={'object_id': frame_of_reference_id})
        
        if frame_of_reference.has_key('_id'):
            # SUBORDINATES
            frame_of_reference['subordinates'] = service_gateway_get('marine_facility_management', 'find_subordinate_frames_of_reference', params={'input_resource_id': frame_of_reference_id})

            # SUPERIORS
            frame_of_reference['superiors'] = service_gateway_get('marine_facility_management', 'find_superior_frames_of_reference', params={'input_resource_id': frame_of_reference_id})
            
            print "SUPERIORS", frame_of_reference['superiors']

            # OWNER
            frame_of_reference['owner'] = ServiceApi.find_owner(frame_of_reference_id)
        
        return frame_of_reference

    @staticmethod
    def find_qualified_deploy_path(resource_id):
        # Only works for objects that satisfy the 'hasDeployment' association check
        resource = [service_gateway_get('resource_registry', 'read', params={'object_id': resource_id})]
        deployment = service_gateway_get('resource_registry', 'find_objects', params={'subject': resource_id, 'predicate': 'hasDeployment', 'id_only': False})[0]
        if len(deployment) == 0:
            return resource['type_'] + '::' + resource['name'], [{'name': resource['name'], 'id': resource['_id'], 'type': resource['type_']}]

        superior_dict = service_gateway_get('marine_facility_management', 'find_superior_frames_of_reference', params={'input_resource_id': deployment[0]['_id']})
        breadcrumb_str = ""
        breadcrumb_list = []
        if 'MarineFacility' in superior_dict:
            for marine_facility in superior_dict['MarineFacility']:
                breadcrumb_str = breadcrumb_str + '/Observatory::' + marine_facility['name']
                entity_dict = {'name': marine_facility['name'], 'id': marine_facility['_id'], 'type': 'MarineFacility'}
                breadcrumb_list.append(entity_dict)
        if 'Site' in superior_dict:
            for site in superior_dict['Site']:
                breadcrumb_str = breadcrumb_str + '/Site::' + site['name']
                entity_dict = {'name': site['name'], 'id': site['_id'], 'type': 'Site'}
                breadcrumb_list.append(entity_dict)
        if 'LogicalPlatform' in superior_dict:
            for logical_platform in superior_dict['LogicalPlatform']:
                breadcrumb_str = breadcrumb_str + '/Platform::' + logical_platform['name']
                entity_dict = {'name': logical_platform['name'], 'id': logical_platform['_id'], 'type': 'LogicalPlatform'}
                breadcrumb_list.append(entity_dict)
        breadcrumb_str = breadcrumb_str + '/' + resource['type_'] + '::' + resource['name']
        breadcrumb_list.append({'name': resource['name'], 'id': resource['_id'], 'type': resource['type_']})
        return breadcrumb_str, breadcrumb_list
        
    @staticmethod
    def find_leaves(root, leaf_type):
        valid_types = ["MarineFacility", "Site", "LogicalPlatform", "LogicalInstrument"]
       
        if leaf_type not in valid_types:
            return []

        if root in valid_types:
            resources = ServiceApi.find_by_resource_type(root)
        else:
            resources = [service_gateway_get('resource_registry', 'read', params={'object_id': root})]
        ret_list = []
        for resource in resources:
            if resource['type_'] == 'MarineFacility':
                marine_facility = resource
                marine_facility_dict = {'name': marine_facility['name'], 'id': marine_facility['_id'], 'type': 'MarineFacility'}
                if leaf_type == 'MarineFacility':
                    ret_list.append([marine_facility_dict])
                else:
                    sites = service_gateway_get('resource_registry', 'find_objects', params={'subject': marine_facility['_id'], 'predicate': 'hasSite', 'id_only': False})[0]
                    if len(sites) > 0:
                        for site in sites:
                            site_dict = {'name': site['name'], 'id': site['_id'], 'type': 'Site'}
                            if leaf_type == 'Site':
                                ret_list.append([marine_facility_dict, site_dict])
                            else:
                                logical_platforms = service_gateway_get('resource_registry', 'find_objects', params={'subject': site['_id'], 'predicate': 'hasPlatform', 'id_only': False})[0]
                                if len(logical_platforms) > 0:
                                    for logical_platform in logical_platforms:
                                        logical_platform_dict = {'name': logical_platform['name'], 'id': logical_platform['_id'], 'type': 'LogicalPlatform'}
                                        if leaf_type == 'LogicalPlatform':
                                            ret_list.append([marine_facility_dict, site_dict, logical_platform_dict])
                                        else:
                                            logical_instruments = service_gateway_get('resource_registry', 'find_objects', params={'subject': logical_platform['_id'], 'predicate': 'hasInstrument', 'id_only': False})[0]
                                            if len(logical_instruments) > 0:
                                                for logical_instrument in logical_instruments:
                                                    logical_instrument_dict = {'name': logical_instrument['name'], 'id': logical_instrument['_id'], 'type': 'LogicalInstrument'}
                                                    ret_list.append([marine_facility_dict, site_dict, logical_platform_dict, logical_instrument_dict])
                                else:
                                    ret_list.append([marine_facility_dict, site_dict])
                    else:
                        ret_list.append([marine_facility_dict])
            elif resource['type_'] == 'Site':
                site = resource
                site_dict = {'name': site['name'], 'id': site['_id'], 'type': 'Site'}
                if leaf_type == 'Site':
                    ret_list.append([site_dict])
                else:
                    logical_platforms = service_gateway_get('resource_registry', 'find_objects', params={'subject': site['_id'], 'predicate': 'hasPlatform', 'id_only': False})[0]
                    if len(logical_platforms) > 0:
                        for logical_platform in logical_platforms:
                            logical_platform_dict = {'name': logical_platform['name'], 'id': logical_platform['_id'], 'type': 'LogicalPlatform'}
                            if leaf_type == 'LogicalPlatform':
                                ret_list.append([site_dict, logical_platform_dict])
                            else:
                                logical_instruments = service_gateway_get('resource_registry', 'find_objects', params={'subject': logical_platform['_id'], 'predicate': 'hasInstrument', 'id_only': False})[0]
                                if len(logical_instruments) > 0:
                                    for logical_instrument in logical_instruments:
                                        logical_instrument_dict = {'name': logical_instrument['name'], 'id': logical_instrument['_id'], 'type': 'LogicalInstrument'}
                                        ret_list.append([site_dict, logical_platform_dict, logical_instrument_dict])
                    else:
                        ret_list.append([marine_facility_dict, site_dict])
            elif resource['type_'] == 'LogicalPlatform':
                logical_platform = resource
                logical_platform_dict = {'name': logical_platform['name'], 'id': logical_platform['_id'], 'type': 'LogicalPlatform'}
                if leaf_type == 'LogicalPlatform':
                    ret_list.append([logical_platform_dict])
                else:
                    logical_instruments = service_gateway_get('resource_registry', 'find_objects', params={'subject': logical_platform['_id'], 'predicate': 'hasInstrument', 'id_only': False})[0]
                    if len(logical_instruments) > 0:
                        for logical_instrument in logical_instruments:
                            logical_instrument_dict = {'name': logical_instrument['name'], 'id': logical_instrument['_id'], 'type': 'LogicalInstrument'}
                            ret_list.append([logical_platform_dict, logical_instrument_dict])
            else:
                logical_instrument = resource
                logical_instrument_dict = {'name': logical_instrument['name'], 'id': logical_instrument['_id'], 'type': 'LogicalInstrument'}
                ret_list.append([logical_instrument_dict])
        return ret_list
    
    @staticmethod
    def find_by_resource_type(resource_type):
        return service_gateway_get('resource_registry', 'find_resources', params={'restype': resource_type})[0]

    @staticmethod
    def find_owner(resource_id):
        # TODO remove later
        try:
            owner_id = service_gateway_get('resource_registry', 'find_objects', params={'subject': resource_id, 'predicate': 'hasOwner'})[0][0]['_id']
        except:
            return {"contact": {"name": "Owen Ownerrep", "email": "owenownerrep@gmail.com"}}
        return service_gateway_get('resource_registry', 'find_objects', params={'subject': owner_id, 'predicate': 'hasInfo', 'id_only': False})[0][0]

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
    print '\n'
    print '-------------------------------------------'
    print '%s : %s' % (label, content), '\n\n'
    if data:
        print 'data : %s' % data

