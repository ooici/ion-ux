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
        "params": { "command": ["AgentCommand", { "command": "placeholder" }]}
    }
}

class ServiceApi(object):
    
    @staticmethod
    def find_all_users():
        all_users = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'UserInfo'})[0]
        return all_users
    
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
        params = {"command": ["AgentCommand", {"command": agent_command}]}
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
                session['valid_until'] = int(time.time()) * 100000
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
    def find_user_info(user_id):
        params={'user_id': user_id}
        return service_gateway_post('identity_management', 'find_user_info_by_id', params)
    
    @staticmethod
    def find_all_user_infos():
        # TODO is this what we want here?
        user_infos = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'UserInfo'})[0]
        return user_infos
    
    @staticmethod
    def create_user_info(user_id, user_info):
        params={'user_id': user_id, 'user_info': ['UserInfo', user_info]}
        return service_gateway_post('identity_management', 'create_user_info', params)
    
    @staticmethod
    def update_user_info(user_info):
        params={'user_info': ['UserInfo', user_info]}
        return service_gateway_post('identity_management', 'update_user_info', params)
    
    @staticmethod
    def find_user(user_id):
        user = service_gateway_get('identity_management', 'read_user_identity', params={'user_id': user_id})
        
        if user.has_key('_id'):
            # CREDENTIALS
            user['credentials'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': user_id, 'predicate': 'hasCredentials', 'object_type': 'UserCredentials'})[0]

            # USER INFO
            user['user_info'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': user_id, 'predicate': 'hasInfo'})[0]

            # ROLES
            user['roles'] = service_gateway_get('org_management', 'find_all_roles_by_user', params={'user_id': user_id})

            # POLICIES
            user['policies'] = service_gateway_get('policy_management', 'find_resource_policies', params={'resource_id': user_id})

            # OWNED RESOURCES
            user['owned_resources'] = service_gateway_get('resource_registry', 'find_subjects', params={'predicate': 'hasOwner', 'object': user_id, 'id_only': False})[0]
            
            # EVENTS
            user['recent_events'] = []
            user['user_requests'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': user_id, 'predicate': 'hasRequest'})[0]

        return user

    @staticmethod
    def handle_user_request(org_id, request_id, reason, action):
        actions = ['APPROVE', 'DENY', 'ACCEPT', 'REJECT']
        if action not in actions:
            return "False"

        if action == 'APPROVE':
            res = service_gateway_get('org_management', 'approve_request', params={'org_id': org_id, 'request_id': request_id})
        elif action == 'DENY':
            res = service_gateway_get('org_management', 'deny_request', params={'org_id': org_id, 'request_id': request_id})
        elif action == 'ACCEPT':
            res = service_gateway_get('org_management', 'accept_request', params={'org_id': org_id, 'request_id': request_id})
        else:
            res = service_gateway_get('org_management', 'deny_request', params={'org_id': org_id, 'request_id': request_id, 'reason': reason})
        return res

    @staticmethod
    def find_observatory(marine_facility_id):
        marine_facility = service_gateway_get('marine_facility_management', 'read_marine_facility', params={'marine_facility_id': marine_facility_id})
        
        if marine_facility.has_key('_id'):

            org_id = service_gateway_get('marine_facility_management', 'find_marine_facility_org', params={'marine_facility_id': marine_facility_id})

            # GENERAL
            marine_facility['data_products'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': org_id, 'predicate': 'hasResource', 'object_type': 'DataProduct'})[0]
            marine_facility['platforms'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': org_id, 'predicate': 'hasResource', 'object_type': 'PlatformDevice'})[0]
            marine_facility['instruments'] = service_gateway_get('resource_registry', 'find_objects', params={'subject': org_id, 'predicate': 'hasResource', 'object_type': 'InstrumentDevice'})[0]

            # ADMINISTRATION            
            marine_facility['participants'] = []
            participants = service_gateway_get('resource_registry', 'find_objects', params={'subject': org_id, 'predicate': 'hasMembership'})[0]
            
            for participant in participants:
                user_info = service_gateway_get('resource_registry', 'find_objects', params={'subject': participant.get('_id'), 'predicate': 'hasInfo'})[0][0]
                marine_facility['participants'].append(user_info)

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

#    @staticmethod
#    def test_find_breadcrumb():
#        print "\n\n\n\n\n\n\n\n"
#        print "USER ==============================================================================================="
#        resources = ServiceApi.find_by_resource_type("UserIdentity")
#        for resource in resources:
#            bc_str, bc_dict = ServiceApi.find_breadcrumb(resource['_id'])
#            print "User breadcrumb str <%s> breadcrumb dict <%s>" % (bc_str, str(bc_dict))
#        
#        print "OBSERVATORY ==============================================================================================="
#        resources = ServiceApi.find_by_resource_type("MarineFacility")
#        for resource in resources:
#            bc_str, bc_dict = ServiceApi.find_breadcrumb(resource['_id'])
#            print "Observatory breadcrumb str <%s> breadcrumb dict <%s>" % (bc_str, str(bc_dict))
#        
#        print "PLATFORM ==============================================================================================="
#        resources = ServiceApi.find_by_resource_type("PlatformDevice")
#        for resource in resources:
#            bc_str, bc_dict = ServiceApi.find_breadcrumb(resource['_id'])
#            print "Platform breadcrumb str <%s> breadcrumb dict <%s>" % (bc_str, str(bc_dict))
#        
#        print "PLATFORM MODEL ==============================================================================================="
#        resources = ServiceApi.find_by_resource_type("PlatformModel")
#        for resource in resources:
#            bc_str, bc_dict = ServiceApi.find_breadcrumb(resource['_id'])
#            print "Platform Model breadcrumb str <%s> breadcrumb dict <%s>" % (bc_str, str(bc_dict))
#        
#        print "INSTRUMENT ==============================================================================================="
#        resources = ServiceApi.find_by_resource_type("InstrumentDevice")
#        for resource in resources:
#            bc_str, bc_dict = ServiceApi.find_breadcrumb(resource['_id'])
#            print "Instrument breadcrumb str <%s> breadcrumb dict <%s>" % (bc_str, str(bc_dict))
#        
#        print "INSTRUMENT MODEL ==============================================================================================="
#        resources = ServiceApi.find_by_resource_type("InstrumentModel")
#        for resource in resources:
#            bc_str, bc_dict = ServiceApi.find_breadcrumb(resource['_id'])
#            print "Instrument Model breadcrumb str <%s> breadcrumb dict <%s>" % (bc_str, str(bc_dict))
#        
#        print "INSTRUMENT AGENT ==============================================================================================="
#        resources = ServiceApi.find_by_resource_type("InstrumentAgent")
#        for resource in resources:
#            bc_str, bc_dict = ServiceApi.find_breadcrumb(resource['_id'])
#            print "Instrument Agent breadcrumb str <%s> breadcrumb dict <%s>" % (bc_str, str(bc_dict))
#        
#        print "DATA PROCESS ==============================================================================================="
#        resources = ServiceApi.find_by_resource_type("DataProcessDefinition")
#        for resource in resources:
#            bc_str, bc_dict = ServiceApi.find_breadcrumb(resource['_id'])
#            print "Data Process breadcrumb str <%s> breadcrumb dict <%s>" % (bc_str, str(bc_dict))
#
#        print "DATA PRODUCT ==============================================================================================="
#        resources = ServiceApi.find_by_resource_type("DataProduct")
#        for resource in resources:
#            bc_str, bc_dict = ServiceApi.find_breadcrumb(resource['_id'])
#            print "Data Product breadcrumb str <%s> breadcrumb dict <%s>" % (bc_str, str(bc_dict))

    @staticmethod
    def find_qualified_deploy_path(resource_id):
        # Only works for objects that satisfy the 'hasDeployment' association check
        resource = [service_gateway_get('resource_registry', 'read', params={'object_id': root})]
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

#    @staticmethod
#    def test_find_install_locations():
#        print "MARINE FACILITY TO MARINE FACILITY ==============================================================================================="
#        ret = ServiceApi.find_leaves('MarineFacility', 'MarineFacility')
#        print "AAAAAAAAAAAAAAAA All ret <%s>" % str(ret)
#        resources = ServiceApi.find_by_resource_type("MarineFacility")
#        for resource in resources:
#            ret = ServiceApi.find_leaves(resource['_id'], 'MarineFacility')
#            print "SSSSSSSSSSSSSSSSS Single ret <%s>" % str(ret)
#        print "MARINE FACILITY TO SITE ==============================================================================================="
#        ret = ServiceApi.find_leaves('MarineFacility', 'Site')
#        print "AAAAAAAAAAAAAAAA All ret <%s>" % str(ret)
#        resources = ServiceApi.find_by_resource_type("MarineFacility")
#        for resource in resources:
#            ret = ServiceApi.find_leaves(resource['_id'], 'Site')
#            print "SSSSSSSSSSSSSSSSS Single ret <%s>" % str(ret)
#        print "MARINE FACILITY TO LOGICAL PLATFORM ==============================================================================================="
#        ret = ServiceApi.find_leaves('MarineFacility', 'LogicalPlatform')
#        print "AAAAAAAAAAAAAAAA All ret <%s>" % str(ret)
#        resources = ServiceApi.find_by_resource_type("MarineFacility")
#        for resource in resources:
#            ret = ServiceApi.find_leaves(resource['_id'], 'LogicalPlatform')
#            print "SSSSSSSSSSSSSSSSS Single ret <%s>" % str(ret)
#        print "MARINE FACILITY TO LOGICAL INSTRUMENT ==============================================================================================="
#        ret = ServiceApi.find_leaves('MarineFacility', 'LogicalInstrument')
#        print "AAAAAAAAAAAAAAAA All ret <%s>" % str(ret)
#        resources = ServiceApi.find_by_resource_type("MarineFacility")
#        for resource in resources:
#            ret = ServiceApi.find_leaves(resource['_id'], 'LogicalInstrument')
#            print "SSSSSSSSSSSSSSSSS Single ret <%s>" % str(ret)
#
#        print "SITE TO SITE ==============================================================================================="
#        ret = ServiceApi.find_leaves('Site', 'Site')
#        print "AAAAAAAAAAAAAAAA All ret <%s>" % str(ret)
#        resources = ServiceApi.find_by_resource_type("Site")
#        for resource in resources:
#            ret = ServiceApi.find_leaves(resource['_id'], 'Site')
#            print "SSSSSSSSSSSSSSSSS Single ret <%s>" % str(ret)
#        print "SITE TO LOGICAL PLATFORM ==============================================================================================="
#        ret = ServiceApi.find_leaves('Site', 'LogicalPlatform')
#        print "AAAAAAAAAAAAAAAA All ret <%s>" % str(ret)
#        resources = ServiceApi.find_by_resource_type("Site")
#        for resource in resources:
#            ret = ServiceApi.find_leaves(resource['_id'], 'LogicalPlatform')
#            print "SSSSSSSSSSSSSSSSS Single ret <%s>" % str(ret)
#        print "SITE TO LOGICAL INSTRUMENT ==============================================================================================="
#        ret = ServiceApi.find_leaves('Site', 'LogicalInstrument')
#        print "AAAAAAAAAAAAAAAA All ret <%s>" % str(ret)
#        resources = ServiceApi.find_by_resource_type("Site")
#        for resource in resources:
#            ret = ServiceApi.find_leaves(resource['_id'], 'LogicalInstrument')
#            print "SSSSSSSSSSSSSSSSS Single ret <%s>" % str(ret)
#
#        print "LOGICAL PLATFORM TO LOGICAL PLATFORM ==============================================================================================="
#        ret = ServiceApi.find_leaves('LogicalPlatform', 'LogicalPlatform')
#        print "AAAAAAAAAAAAAAAA All ret <%s>" % str(ret)
#        resources = ServiceApi.find_by_resource_type("LogicalPlatform")
#        for resource in resources:
#            ret = ServiceApi.find_leaves(resource['_id'], 'LogicalPlatform')
#            print "SSSSSSSSSSSSSSSSS Single ret <%s>" % str(ret)
#        print "LOGICAL PLATFORM TO LOGICAL INSTRUMENT ==============================================================================================="
#        ret = ServiceApi.find_leaves('LogicalPlatform', 'LogicalInstrument')
#        print "AAAAAAAAAAAAAAAA All ret <%s>" % str(ret)
#        resources = ServiceApi.find_by_resource_type("LogicalPlatform")
#        for resource in resources:
#            ret = ServiceApi.find_leaves(resource['_id'], 'LogicalInstrument')
#            print "SSSSSSSSSSSSSSSSS Single ret <%s>" % str(ret)
#        
#        print "LOGICAL INSTRUMENT TO LOGICAL INSTRUMENT ==============================================================================================="
#        ret = ServiceApi.find_leaves('LogicalInstrument', 'LogicalInstrument')
#        print "AAAAAAAAAAAAAAAA All ret <%s>" % str(ret)
#        resources = ServiceApi.find_by_resource_type("LogicalInstrument")
#        for resource in resources:
#            ret = ServiceApi.find_leaves(resource['_id'], 'LogicalInstrument')
#            print "SSSSSSSSSSSSSSSSS Single ret <%s>" % str(ret)
        
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
        owner_id = service_gateway_get('resource_registry', 'find_objects', params={'subject': resource_id, 'predicate': 'hasOwner'})[0][0]['_id']
        return service_gateway_get('resource_registry', 'find_objects', params={'subject': owner_id, 'predicate': 'hasInfo', 'id_only': False})[0][0]

#    @staticmethod
#    def test_facepages():
#        # User facepage
#        user_fps = []
#        user_identities = ServiceApi.find_by_resource_type("UserIdentity")
#        for user_identity in user_identities:
#            user_fps.append(ServiceApi.find_user(user_identity['_id']))
#        obs_fps = []
#        # Observatory facepage
#        observatories = ServiceApi.find_by_resource_type("MarineFacility")
#        for observatory in observatories:
#            obs_fps.append(ServiceApi.find_observatory(observatory['_id']))
#        # Platform facepage
#        plat_fps = []
#        platforms = ServiceApi.find_by_resource_type("PlatformDevice")
#        for platform in platforms:
#            plat_fps.append(ServiceApi.find_platform(platform['_id']))
#        # PlatformModel facepage
#        plat_mdl_fps = []
#        platform_models = ServiceApi.find_by_resource_type("PlatformModel")
#        for platform_model in platform_models:
#            plat_mdl_fps.append(ServiceApi.find_platform_model(platform_model['_id']))
#        # Instrument facepage
#        instr_fps = []
#        instruments = ServiceApi.find_by_resource_type("InstrumentDevice")
#        for instrument in instruments:
#            instr_fps.append(ServiceApi.find_instrument(instrument['_id']))
#        # InstrumentModel facepage
#        instr_mdl_fps = []
#        instrument_models = ServiceApi.find_by_resource_type("InstrumentModel")
#        for instrument_model in instrument_models:
#            instr_mdl_fps.append(ServiceApi.find_instrument_model(instrument_model['_id']))
#        # InstrumentAgent facepage
#        instr_agnt_fps = []
#        instrument_agents = ServiceApi.find_by_resource_type("InstrumentAgent")
#        for instrument_agent in instrument_agents:
#            instr_agnt_fps.append(ServiceApi.find_instrument_agent(instrument_agent['_id']))
#        # DataProcessDefinition facepage
#        data_proc_fps = []
#        data_processes = ServiceApi.find_by_resource_type("DataProcessDefinition")
#        for data_process in data_processes:
#            data_proc_fps.append(ServiceApi.find_data_process_definition(data_process['_id']))
#        # DataProduct facepage
#        data_prod_fps = []
#        data_products = ServiceApi.find_by_resource_type("DataProduct")
#        for data_product in data_products:
#            data_prod_fps.append(ServiceApi.find_data_product(data_product['_id']))
#        print "\n\n\n\n\n\n\n\n"
#        print "USER ==============================================================================================="
#        for user_fp in user_fps:
#            print "\n====== User:\n%s\n\n" % pprint.pprint(user_fp)
#        print "OBSERVATORY ==============================================================================================="
#        for obs_fp in obs_fps:
#            print "\n====== Observatory:\n%s\n\n" % pprint.pprint(obs_fp)
#        print "PLATFORM ==============================================================================================="
#        for plat_fp in plat_fps:
#            print "\n====== Platform:\n%s\n\n" % pprint.pprint(plat_fp)
#        print "PLATFORM MODEL ==============================================================================================="
#        for plat_mdl_fp in plat_mdl_fps:
#            print "\n====== Platform Model:\n%s\n\n" % pprint.pprint(plat_mdl_fp)
#        print "INSTRUMENT ==============================================================================================="
#        for instr_fp in instr_fps:
#            print "\n====== Instrument:\n%s\n\n" % pprint.pprint(instr_fp)
#        print "INSTRUMENT MODEL ==============================================================================================="
#        for instr_mdl_fp in instr_mdl_fps:
#            print "\n====== Instrument Model:\n%s\n\n" % pprint.pprint(instr_mdl_fp)
#        print "INSTRUMENT AGENT ==============================================================================================="
#        for instr_agnt_fp in instr_agnt_fps:
#            print "\n====== Instrument Agent:\n%s\n\n" % pprint.pprint(instr_agnt_fp)
#        print "DATA PROCESS ==============================================================================================="
#        for data_proc_fp in data_proc_fps:
#            print "\n====== Data Process:\n%s\n\n" % pprint.pprint(data_proc_fp)
#        print "DATA PRODUCT ==============================================================================================="
#        for data_prod_fp in data_prod_fps:
#            print "\n====== Data Product:\n%s\n\n" % pprint.pprint(data_prod_fp)

        

def build_get_request(service_name, operation_name, params={}):
    url = '%s/%s/%s' % (SERVICE_GATEWAY_BASE_URL, service_name, operation_name)    
    if len(params) > 0:
        param_string = '?'
        for (k, v) in params.iteritems():
            param_string += '%s=%s&' % (k,v)
        url += param_string[:-1]

    #pretty_console_log('SERVICE GATEWAY GET URL', url)

    return url

def service_gateway_get(service_name, operation_name, params={}):    
    resp = requests.get(build_get_request(service_name, operation_name, params))
    #pretty_console_log('SERVICE GATEWAY GET RESPONSE', resp.content)

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

    #pretty_console_log('SERVICE GATEWAY POST URL/DATA', url, data)

    return url, data

def service_gateway_post(service_name, operation_name, params={}):
    url, data = build_post_request(service_name, operation_name, params)
    resp = requests.post(url, data)
    #pretty_console_log('SERVICE GATEWAY POST RESPONSE', resp.content)

    if resp.status_code == 200:
        resp = json.loads(resp.content)

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

    #pretty_console_log('SERVICE GATEWAY AGENT REQUEST POST URL/DATA', url, data)

    return url, data

def service_gateway_agent_request(agent_id, operation_name, params={}):
    url, data = build_agent_request(agent_id, operation_name, params)
    resp = requests.post(url, data)
    #pretty_console_log('SERVICE GATEWAY AGENT REQUEST POST RESPONSE', resp.content)

    if resp.status_code == 200:
        resp = json.loads(resp.content)

        if type(resp) == dict:
            return resp['data']['GatewayResponse']
        elif type(resp) == list:
            return resp['data']['GatewayResponse'][0]

def pretty_console_log(label, content, data=None):
    print '\n\n\n'
    print '-------------------------------------------'
    print '%s : %s' % (label, content)
    if data:
        print 'data : %s' % data
    print '-------------------------------------------'
