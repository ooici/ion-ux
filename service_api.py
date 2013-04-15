import requests, json, time, pprint, re, ast
from flask import session, jsonify, abort
from config import GATEWAY_HOST, GATEWAY_PORT
from copy import deepcopy
from instrument_command import BLACKLIST
# import re

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
        "params": {"timeout": 300, "command": { "type_": "AgentCommand", "command": "placeholder" }}
    }
}


class ServiceApi(object):

    @staticmethod
    def find_related_objects(resource_id):
        related_objects = service_gateway_get('resource_registry', 'find_objects', params={'subject': resource_id, 'predicate': 'hasResource'})
        return related_objects
    
    @staticmethod
    def find_related_sites(resource_id):
        related_sites = service_gateway_get('observatory_management', 'find_related_sites', params={'parent_resource_id': resource_id})
        return related_sites

    @staticmethod
    def search(search_query):

        query = None

        # simple search for possible raw query language
        raw_starts = ["search '", "belongs to", "has '", "in '"]
        searchlow = search_query.lower()
        for raw in raw_starts:
            if searchlow.startswith(raw):
                query = search_query

        # if not a raw query
        if not query:
            # split into ors
            # from http://stackoverflow.com/a/1180180/84732
            rors = re.compile(' or (?=(?:(?:[^"]*"){2})*[^"]*$)', flags=re.IGNORECASE)
            exprs = rors.split(search_query)

            search_template = "SEARCH '%s' %s '%s' FROM 'resources_index' LIMIT 100"
            queries = []
            for expr in exprs:
                val   = expr
                verb  = "MATCH"
                field = "_all"

                # allow specifying specific field with = sign
                # must allow following rules to be applied too
                if val[0] != '"' and val[-1] != '"' and "=" in val:
                    field, val = val.split("=", 1)

                # allow "LIKE" searching with ~
                if val[0] == "~":
                    val = val[1:]
                    verb = "LIKE"
                # quotes on both sides mean exact match only
                elif val[0] == '"' and val[-1] == '"':
                    verb = "IS"
                    val = val[1:-1]

                queries.append(search_template % (field, verb, val))

            query = " OR ".join(queries)

        url = build_get_request(SERVICE_GATEWAY_BASE_URL, 'discovery', 'parse', params={'search_request':query, 'id_only':False})
        resp = requests.get(url)
        search_json = json.loads(resp.content)
        if search_json['data'].has_key('GatewayResponse'):
            return search_json['data']['GatewayResponse']

        return search_json['data']

        search_url = "http://%s:%d/ion-service/discovery/parse?search_request=SEARCH'_all'LIKE'%s'FROM'resources_index'LIMIT100" % (GATEWAY_HOST, GATEWAY_PORT, search_query)
        search_results = requests.get(search_url)
        search_json = json.loads(search_results.content)
        if search_json['data'].has_key('GatewayResponse'):
            return search_json['data']['GatewayResponse']
        else:
            return search_json['data']

    @staticmethod
    def adv_search(geospatial_bounds, vertical_bounds, temporal_bounds, search_criteria):
        post_data = { 'query': {},
                      'and': [],
                      'or': [] }

        queries = []

        if geospatial_bounds and all(geospatial_bounds.itervalues()):
            queries.append({'bottom_right': [float(geospatial_bounds['east']), float(geospatial_bounds['south'])],
                                'top_left': [float(geospatial_bounds['west']), float(geospatial_bounds['north'])],
                                   'field': 'geospatial_point_center',
                                   'index': 'resources_index'})

        if vertical_bounds and all(vertical_bounds.itervalues()):
            queries.append({'vertical_bounds': {'from': float(vertical_bounds['lower']), 'to': float(vertical_bounds['upper'])},
                            'field': 'geospatial_bounds',
                            'index': 'resources_index'})

        if temporal_bounds and all(temporal_bounds.itervalues()):
            queries.append({'time_bounds': {'from': temporal_bounds['from'], 'to': temporal_bounds['to']},
                            'field': 'nominal_datetime',
                            'index': 'resources_index'})

        if search_criteria:
            for item in search_criteria:
                # if no value, it's probably just the first one left blank
                if not item[2]:
                    continue

                q = {'index': 'resources_index', 'field': str(item[0])}
                v = str(item[2])

                if item[1].lower() == "contains":
                    q['match'] = v
                elif item[1].lower() == "starts with":
                    q['value'] = "{0}*".format(v)
                elif item[1].lower() == "ends with":
                    q['value'] = "*{0}".format(v)
                elif item[1].lower() == "like":
                    q['fuzzy'] = v
                elif item[1].lower() == "matches":
                    q['value'] = v
                else:
                    q['match'] = v       # anything we didn't get

                queries.append(q)

        # transform queries into the expected query object
        if len(queries) == 0:
            abort(500)

        post_data['query'] = queries[0]
        post_data['and'] = queries[1:]

        # have to manually call because normal SG post turns a list into the first object?
        url, data = build_post_request('discovery', 'query', {'query': post_data, 'id_only': False})
        resp = requests.post(url, data)
        search_json = json.loads(resp.content)
        if search_json['data'].has_key('GatewayResponse'):
            return search_json['data']['GatewayResponse']

        return search_json['data']

    @staticmethod
    def update_resource(resource_obj):

        # Hack to convert strings into objects, booleans
        # as a workaround to shortcomings dynamically generating 
        # backbone-forms (booleans and user-defined key-values, such as
        # custom_attributes). See ResourceTypeSchema() below, or 
        # /static/js/ux-editform.js for current implementation.

        for (k,v) in resource_obj.iteritems():
            if isinstance(v, unicode):
                if v.startswith('{'):
                    try:
                        resource_obj.update({k: ast.literal_eval(str(v))})
                    except Exception, e:
                        # pass it to the backend for validation and error?
                        pass
            
            # catch any objects that were
            elif v == '[object Object]':
                resource_obj.update({k: {}})
            
            if v == 'true':
                resource_obj.update({k: True})
            elif v == 'false':
                resource_obj.update({k: False})
            
            print 'update_resource: ', k, type(resource_obj[k])
            
            if v == 'agent_config':
                print v
            
        req = service_gateway_post('resource_management', 'update_resource', params={'resource': resource_obj})
        return req

    @staticmethod
    def create_resource_attachment(resource_id, attachment_name, attachment_description, attachment_type, attachment_content_type, content, keywords):
        # form our own data
        post_data = {'resource_id'             : resource_id,
                     'keywords'                : keywords,
                     'attachment_name'         : attachment_name,
                     'attachment_description'  : attachment_description,
                     'attachment_type'         : attachment_type,
                     'attachment_content_type' : attachment_content_type}

        # use build_post_request to get url
        url, req = build_post_request('attachment', None, params=post_data)

        post_files = { 'file': (attachment_name, content) }

        # make our own post
        req = requests.post(url, req, files=post_files)

        return req

    @staticmethod
    def delete_resource_attachment(attachment_id):
        url = build_get_request(SERVICE_GATEWAY_BASE_URL, 'attachment', attachment_id)
        req = requests.delete(url)

        return render_service_gateway_response(req)

    @staticmethod
    def transition_lcstate(resource_id, transition_event):
        req = service_gateway_get('resource_management', 'execute_lifecycle_transition', params={'resource_id': resource_id, 'transition_event': transition_event})
        return req

    @staticmethod
    def get_user_subscriptions(user_id):
        return service_gateway_post('user_notification', 'get_user_notifications', params={'user_info_id': user_id})

    @staticmethod
    def create_user_notification(resource_type, resource_id, event_type, user_id, resource_name=None):
        name = 'Notification for %s' % resource_name if resource_name else 'NotificationTest'
        description = '%s - %s - Notification Request' % (resource_type, event_type)
        notification = {
            "type_": "NotificationRequest", 
            "lcstate": "DRAFT", 
            "description": description, 
            "name": name, 
            "origin": resource_id, 
            "origin_type": resource_type,
            "event_type": event_type
            }
        return service_gateway_post('user_notification', 'create_notification', params={'notification': notification, 'user_id': user_id})
    
    @staticmethod
    def delete_user_subscription(notification_id):
        return service_gateway_post('user_notification', 'delete_notification', params={'notification_id': notification_id})

    @staticmethod
    def enroll_request(resource_id, actor_id):
        sap = {'type_': 'EnrollmentProposal',
               'originator': 1,
               'consumer': actor_id,
               'provider': resource_id,
               'description': "Enrollment Request",
               'proposal_status': 1 }
        return service_gateway_post('org_management', 'negotiate', params={'sap':sap})

    @staticmethod
    def request_role(resource_id, actor_id, role_name):
        sap = {'type_': 'RequestRoleProposal',
               'originator': 1,
               'consumer': actor_id,
               'provider': resource_id,
               'proposal_status': 1,
               'description': "Role Request: %s" % role_name,
               'role_name': role_name }

        return service_gateway_post('org_management', 'negotiate', params={'sap':sap})

    @staticmethod
    def invite_user(resource_id, user_id):
        # look up actor id from user id
        actor_id = service_gateway_get('resource_registry', 'find_subjects', params={'predicate': 'hasInfo', 'object': user_id, 'id_only': True})[0]

        sap = {'type_': 'EnrollmentProposal',
               'originator': 2,
               'consumer': actor_id,
               'provider': resource_id,
               'description': "Enrollment Invite",
               'proposal_status': 1 }

        return service_gateway_post('org_management', 'negotiate', params={'negotiation_type': 2,
                                                                           'sap':sap})

    @staticmethod
    def offer_user_role(resource_id, user_id, role_name):
        # look up actor id from user id
        actor_id = service_gateway_get('resource_registry', 'find_subjects', params={'predicate': 'hasInfo', 'object': user_id, 'id_only': True})[0]

        sap = {'type_': 'RequestRoleProposal',
               'originator': 2,
               'consumer': actor_id,
               'provider': resource_id,
               'proposal_status': 1,
               'description': "Role Invite: %s" % role_name,
               'role_name': role_name }

        return service_gateway_post('org_management', 'negotiate', params={'negotiation_type': 2,
                                                                           'sap':sap})

    @staticmethod
    def request_access(resource_id, res_name, actor_id, org_id):
        sap = {'type_': 'AcquireResourceProposal',
               'originator': 1,
               'consumer': actor_id,
               'provider': org_id,
               'proposal_status': 1,
               'description': "Access Request: %s" % res_name,
               'resource_id': resource_id }

        return service_gateway_post('org_management', 'negotiate', params={'sap':sap})

    @staticmethod
    def release_access(commitment_id):
        return service_gateway_post('org_management', 'release_commitment', params={'commitment_id':commitment_id})

    @staticmethod
    def request_exclusive_access(resource_id, actor_id, org_id, expiration):
        sap = {'type_': 'AcquireResourceExclusiveProposal',
               'originator': 1,
               'consumer': actor_id,
               'provider': org_id,
               'proposal_status': 1,
               'resource_id': resource_id,
               'description': "Exclusive Access Request",
               'expiration': expiration}

        return service_gateway_post('org_management', 'negotiate', params={'sap':sap})

    @staticmethod
    def accept_reject_negotiation(negotiation_id, verb, originator, reason):
        if not verb in ["accept", "reject"]:
            return error_message("Unknown verb %s" % verb)

        url, _ = build_post_request("resolve-org-negotiation", None)

        post_data = {'negotiation_id': negotiation_id,
                     'verb':           verb,
                     'reason':         reason,
                     'originator':     originator}

        if "actor_id" in session:
            post_data['serviceRequest'] = {'requester' : session['actor_id'],
                                           'expiry'    : session['valid_until']}

        data={'payload': json.dumps(post_data)}
        req = requests.post(url, data)
        return render_service_gateway_response(req)

    @staticmethod
    def get_event_types():
        events_url = 'http://%s:%s/ion-service/list_resource_types?type=Event' % (GATEWAY_HOST, GATEWAY_PORT)
        events = requests.get(events_url)
        events_json = json.loads(events.content)
        return events_json['data']['GatewayResponse']

    @staticmethod
    def publish_event(event_type, origin, origin_type, sub_type, description):
        pdict = { 'event_type'  : event_type,
                  'origin'      : origin,
                  'origin_type' : origin_type,
                  'sub_type'    : sub_type,
                  'description' : description}

        return service_gateway_post('user_notification', 'publish_event', params=pdict)

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
    def get_extension(resource_type, resource_id, user_id):
        if resource_type == 'InstrumentDevice':
            extension = service_gateway_get('instrument_management', 'get_instrument_device_extension', params= {'instrument_device_id': resource_id, 'user_id': user_id})
        elif resource_type in ('InstrumentModel', 'SensorModel', 'PlatformModel'):
            extension = service_gateway_get('resource_registry', 'get_resource_extension', params= {'resource_id': resource_id, 'resource_extension': 'DeviceModelExtension', 'user_id': user_id})
        elif resource_type == 'PlatformDevice':
            extension = service_gateway_get('instrument_management', 'get_platform_device_extension', params= {'platform_device_id': resource_id, 'user_id': user_id})
        elif resource_type == 'DataProduct':
            extension = service_gateway_get('data_product_management', 'get_data_product_extension', params= {'data_product_id': resource_id, 'user_id': user_id})
        elif resource_type == 'UserInfo':
            extension = service_gateway_get('identity_management', 'get_user_info_extension', params= {'user_info_id': resource_id, 'user_id': user_id})
        elif resource_type == 'DataProcessDefinition':
            extension = service_gateway_get('data_process_management', 'get_data_process_definition_extension', params= {'data_process_definition_id': resource_id, 'user_id': user_id})
        elif resource_type == 'Org':
            extension = service_gateway_get('org_management', 'get_marine_facility_extension', params= {'org_id': resource_id, 'user_id': user_id})
        elif resource_type in ('Observatory', 'Subsite', 'PlatformSite', 'InstrumentSite'):
            extension = service_gateway_get('observatory_management', 'get_site_extension', params= {'site_id': resource_id, 'user_id': user_id})
        elif resource_type == 'NotificationRequest':
            extension = service_gateway_get('resource_registry', 'get_resource_extension', params= {'resource_id': resource_id, 'resource_extension': 'NotificationRequestExtension', 'user_id': user_id})
        elif resource_type == 'DataProcess':
            extension = service_gateway_get('resource_registry', 'get_resource_extension', params= {'resource_id': resource_id, 'resource_extension': 'DataProcessExtension', 'user_id': user_id})
        elif resource_type in ('UserRole'):
            extension = service_gateway_get('resource_registry', 'get_resource_extension', params= {'resource_id': resource_id, 'resource_extension': 'ExtendedInformationResource', 'user_id': user_id})
        else:
            extension = service_gateway_get('resource_registry', 'get_resource_extension', params= {'resource_id': resource_id, 'resource_extension': 'ExtendedInformationResource', 'user_id': user_id})
            # brute force - if not an InformationResource, it might be taskable
            if "GatewayError" in extension:
                extension = service_gateway_get('resource_registry', 'get_resource_extension', params = {'resource_id': resource_id, 'resource_extension': 'ExtendedTaskableResource', 'user_id': user_id})

        #else:
        #    extension = error_message(msg="Resource extension for %s is not available." % resource_type)
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
        map_kml = requests.get('http://%s:%d/ion-service/visualization_service/get_data_product_kml?visualization_parameters={"unique_key":"%s","ui_server":"%s"}&return_mimetype=application/json' % (GATEWAY_HOST, GATEWAY_PORT, unique_key, ui_server))
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
        reset_state = bool([True for c in capabilities['commands'] if c['name'] == reset_cmd])
        if reset_state:
            ServiceApi.instrument_execute(instrument_device_id, reset_cmd, '1')
        return
        
    @staticmethod
    def instrument_execute(instrument_device_id, command, cap_type, session_type=None):
        if cap_type == '1':
            agent_op = "execute_agent"
        elif cap_type == '3':
            agent_op = "execute_resource"
        params = {"command": {"type_": "AgentCommand", "command": command}}
        if command == 'RESOURCE_AGENT_EVENT_GO_DIRECT_ACCESS':
            params['command'].update({'kwargs': {'session_type': int(session_type), 'session_timeout':600, 'inactivity_timeout': 600}})
        agent_request = service_gateway_agent_request(instrument_device_id, agent_op, params)
        return agent_request

    @staticmethod
    def instrument_agent_get_capabilities(instrument_device_id):
        agent_req = service_gateway_agent_request(instrument_device_id, 'get_capabilities', params={})
        
        # Temp hack to catch error
        if isinstance(agent_req, dict) and agent_req.has_key('GatewayError'):
            return agent_req
        else:
            commands = []
            agent_param_names = []
            resource_param_names = []
            
            for param in agent_req:
                cap_type = param['cap_type']
                if cap_type == 1 or cap_type == 3:
                    commands.append(param)
                if cap_type == 2:
                    agent_param_names.append(param['name'])
                if cap_type == 4:
                    resource_param_names.append(param['name'])
            
            if resource_param_names:
                resource_params_request = service_gateway_agent_request(instrument_device_id, 'get_resource', params={'params': resource_param_names})
                resource_params = {}
                for k,v in resource_params_request.iteritems():
                    if k in BLACKLIST:
                        continue
                    resource_params.update({k:v})
                    if isinstance(v, float):
                        resource_params[k] = str(v)
                # TEMP: workaround to convert 0.0 strings for JavaScript/JSON.
                resource_params = {}
                for k,v in resource_params_request.iteritems():
                    if k in BLACKLIST:
                        continue
                    else:
                        resource_params.update({k:v})
                    if isinstance(v, float):
                        resource_params[k] = str(v)
            else:
                resource_params = []
            
            # if agent_param_names:
            #     agent_params = service_gateway_agent_request(instrument_device_id, 'get_resource', params={'params': agent_param_names})
            # else:
            #     agent_params = []
            
            capabilities = {}
            capabilities.update({'resource_params': resource_params})
            capabilities.update({'commands': commands})
            # capabilities.update({'agent_params': agent_params})
                
        return capabilities

    @staticmethod
    def set_resource(device_id, params):
        # TEMP: hack to convert '0.0' strings to workaround JavaScript/JSON.
        # Also, skips null values until param schema is available.
        new_params = {}
        for k,v in params.iteritems():
            if k in BLACKLIST or not v:
                print 'Blacklisted:', k, v
                continue
            if isinstance(v, unicode) and '.' in v:
                print 'Before float:', k, v, type(v)
                new_params.update({k: float(v.strip())})
                print 'After float', k, params[k], type(float(v.strip()))
            else:
                new_params.update({k: v})
        
        agent_request = service_gateway_agent_request(device_id, 'set_resource', params={'params': new_params})
        return agent_request


    # @staticmethod
    # def get_resource(device_id):
    #     # params = ["PTCA1", "PA1", "WBOTC", "PCALDATE", "STORETIME", "CPCOR", "PTCA2", "OUTPUTSV", "SAMPLENUM", "TCALDATE", "OUTPUTSAL", "NAVG", "POFFSET", "INTERVAL", "SYNCWAIT", "CJ", "CI", "CH", "TA0", "TA1", "TA2", "TA3", "RCALDATE", "CG", "CTCOR", "PTCB0", "PTCB1", "PTCB2", "CCALDATE", "PA0", "TXREALTIME", "PA2", "SYNCMODE", "PTCA0", "RTCA2", "RTCA1", "RTCA0"]
    #     agent_request = service_gateway_agent_request(device_id, 'get_resource', params={'params': params})
    #     return agent_request

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
    def signon_tester():
        signon_request = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'ActorIdentity', 'name': 'web_authentication', 'id_only': True})[0]
        return signon_request

    @staticmethod
    def signon_user(certificate):
        params={'certificate': certificate}
        web_requester_id = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'ActorIdentity', 'name': 'web_authentication', 'id_only': True})[0]
        actor_id, valid_until, is_registered = service_gateway_post('identity_management', 'signon', params, raw_return=True, web_requester_id=web_requester_id)
        
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
                
                user = service_gateway_get('identity_management', 'find_user_info_by_id', params={'actor_id': actor_id})
                if user.has_key('_id'):
                    user_id = user['_id']
                    is_registered = True
                else:
                    user_id = None
                    is_registered = False
                name = user['name'] if user.has_key('name') else 'Unregistered'
                
                session['user_id'] = user_id
                session['name'] = name
                session['is_registered'] = is_registered
                session['roles'] = ServiceApi.get_roles_by_actor_id(actor_id)
                
                return

        # if still here, search by ActorIdentity
        actor_identities = ServiceApi.find_by_resource_type("ActorIdentity")
        for actor_identity in actor_identities:
            if user_name == actor_identity['name']:
                actor_id = actor_identity['_id']
                session['actor_id'] = actor_id
                session['valid_until'] = str(int(time.time()) * 100000)

                user = service_gateway_get('identity_management', 'find_user_info_by_id', params={'actor_id': actor_id})
                if user.has_key('_id'):
                    user_id = user['_id']
                    is_registered = True
                else:
                    user_id = None
                    is_registered = False
                name = user['name'] if user.has_key('name') else 'Unregistered'

                session['user_id'] = user_id
                session['name'] = name
                session['is_registered'] = is_registered
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
    def create_user_info(actor_id, user_info):
        params={'actor_id': actor_id}
        params['user_info'] = user_info
        params['user_info']['type_'] = 'UserInfo'
        return service_gateway_post('identity_management', 'create_user_info', params, raw_return=True)
    
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
        user_info = service_gateway_get('identity_management', 'find_user_info_by_id', params={'actor_id': user_id})
        if "GatewayError" in user_info:
            user_info = {'contact': {'name': '(Not Registered)', 'email': '(Not Registered)', 'phone': '???'}}

        return user_info


    @staticmethod
    def resource_type_schema(resource_type):
        rts = ResourceTypeSchema(resource_type)
        return rts()

    @staticmethod
    def find_user_credentials_by_actor_id(actor_id):
        return service_gateway_get('resource_registry',
                                   'find_objects',
                                   params={'subject':actor_id,
                                           'predicate':'hasCredentials',
                                           'object_type':'UserCredentials'})[0]

    @staticmethod
    def get_version():
        return service_gateway_get('version', None)


class ResourceTypeSchema(object):

    def __init__(self, root_resource_type, fundamental_types=None):
        self.root_resource_type = root_resource_type
        self.fundamental_types = fundamental_types or ["dict", "list", "tuple", "bool", "int", "float", "str"]

    def __call__(self):
        """
        Get the root resource's schema, then recursively get all child resource schemas. 
        """
        data_resp = self.get_data(self.root_resource_type)
        sub_resources, enum_types = self.find_sub_types(data_resp, self.root_resource_type)
        path = None
        schema_data = self.find_types(data_resp, self.root_resource_type)
        enum_data = self.get_enum_data(enum_types)
        [schema_data.update(d) for d in enum_data]
        [schema_data.pop(d[0]) for d in enum_types]
        while sub_resources:
            schema_resource_name, schema_resource_type = sub_resources.pop(0)
            path = (path + "." + str(schema_resource_name)) if path else schema_resource_name
            data_resp = self.get_data(schema_resource_type)
            sub_resources_current, enum_types_current = self.find_sub_types(data_resp, schema_resource_type)
            sub_resources.extend(sub_resources_current)
            schema_data_current = self.find_types(data_resp, schema_resource_type)
            sub_schema_data = dict([(path + "." + str(key), val) for (key, val) in schema_data_current.iteritems()])
            schema_data.update(sub_schema_data)
            enum_data = self.get_enum_data(enum_types_current)
            [schema_data.update(d) for d in enum_data]
            [schema_data.pop(d[0]) for d in enum_types_current]
        schema = self.nest_schema_data(schema_data)
        return schema

    def nest_schema_data(self, schema_data):
        """
        Create Backbone Forms compliant schema structure.
        """
        all_added_data, all_removed_keys = [], set()
        for (key, val) in schema_data.iteritems():
            if isinstance(val, dict) and ("itemType" in val):
                if val["itemType"] == "Object":
                    if "." not in key: #is root level key
                        nested_data, removed_keys = self._get_sub_nesting(schema_data, str(key))
                        all_added_data.append(nested_data)
                        all_removed_keys.update(removed_keys)
        [schema_data.pop(key) for key in all_removed_keys]
        [schema_data.update(data) for data in all_added_data]
        return schema_data

    def _get_sub_nesting(self, schema_data, nested_root):
        """
        Recursively form sub resources into a 
        Backbone Forms compliant schema structure.
        """
        current_nested_name = nested_root
        nested_data = DotDict({nested_root: {"type":"List", "itemType":"Object", "subSchema":{}}})
        removed_keys = set() #keys to be removed from flat schema (replaced with nested)
        sditems = schema_data.iteritems()
        all_nested_keys = [key for (key, val) in sditems if key.startswith(current_nested_name+".")]
        nest_level = nested_root.count(".")
        nesting_count = [k.count(".") for k in all_nested_keys]
        if len(nesting_count) == 0:
            return nested_data, removed_keys
        max_nest_level = max(nesting_count)
        while max_nest_level >= nest_level:
            for (key, val) in schema_data.iteritems():
                if key.startswith(current_nested_name+"."):
                    removed_keys.add(key)
                    next_nested_name = current_nested_name
                    if key.count(".") == nest_level:
                        nestkey = key.replace(".", ".subSchema.")
                        fulllist = nestkey.split(".")
                        nestlist = fulllist[:-1]
                        attrname = fulllist[-1]
                        nested_data_ref = None
                        while nestlist:
                            if nested_data_ref is None:
                                nested_data_ref = getattr(nested_data, nestlist.pop(0))
                            else:
                                nested_data_ref = getattr(nested_data_ref, nestlist.pop(0))
                        if isinstance(val, dict) and ("itemType" in val):
                            if val["itemType"] == "Object":
                                val.update({"subSchema":{}})
                                setattr(nested_data_ref, attrname, val)
                        else:
                            setattr(nested_data_ref, attrname, val)
            nest_level += 1
        # import pprint; pp = pprint.PrettyPrinter(indent=2); pp.pprint(nested_data)
        return nested_data, removed_keys

    def get_data(self, resource_type):
        resp = service_gateway_get('resource_type_schema', resource_type, params={})
        return resp

    def get_enum_data(self, enum_types):
        enum_data = []
        for etypetuple in enum_types:
            ename, etype = etypetuple
            resp = service_gateway_get('resource_type_schema', etype, params={})
            etype_schemas = resp["schemas"][etype]
            for (name, vals) in etype_schemas.iteritems():
                optionskv = resp["schemas"][vals["enum_type"]]
                options = optionskv.values()
                name = ename+'.'+name 
                enum_data.append({name: {"type": "Select", "options": options}})
        return enum_data

    def find_sub_types(self, data, parent_resource_type):
        """
        Look inside data's 'schema' to find sub types.

        Sub-resources can be:
            - a 'resource type' (a sub-schema for this resource needs to be fetched)
            - a 'enum_type' (enum options need to be fetched)
            - one of 'self.fundamental_types' (no sub-schema needs to be fetched)

        """
        prt_schema = data["schemas"][parent_resource_type]
        sub_resources, enum_types = [], []
        for (name, val) in prt_schema.iteritems():
            if val.has_key("decorators"):
                if val["decorators"].has_key("ContentType"):
                    content_type = val["decorators"]["ContentType"]
                    if content_type not in self.fundamental_types:
                        sub_resources.append([name, content_type])
            if val.has_key("type"):
                stype = val["type"]
                if stype not in self.fundamental_types: # must be an 'enum_type'
                    rtype = val["default"]["type_"]
                    rschema = data["schemas"][rtype]
                    enums = [key for (key, valdict) in rschema.iteritems() if "enum_type" in valdict]
                    if any(enums):
                        enum_types.append([name, stype])
        return sub_resources, enum_types

    def find_types(self, data, parent_resource_type):
        prt_schema = data["schemas"][parent_resource_type]
        types = []
        for (name, val) in prt_schema.iteritems():
            if val["decorators"].has_key("ContentType"):
                if val["decorators"]["ContentType"] in self.fundamental_types:
                    types.append([name, val["type"]])
                else:
                    types.append([name, "sub_type"])
            else:
                types.append([name, val["type"]])
        return dict([(name, self._resource_type_to_form_schema(stype)) for (name, stype) in types])

    def _resource_type_to_form_schema(self, resource_str_type):
        """
        Mapping between given string type and HTML form type.
        """
        if resource_str_type == "sub_type":
            return {"type": "List", "itemType": "Object"}
        elif resource_str_type in ["list", "tuple"]:
            return {"type": "List"}
        elif resource_str_type == "bool":
            return {"type": "Radio", "options": [True, False]}
        elif resource_str_type == "int":
            return "Number"
        elif resource_str_type == "str":
            return "Text"
        elif resource_str_type == "dict":
            return "TextArea"
        else:
            return "Text"


class DotDict(dict):
    marker = object()
    def __init__(self, value=None):
        if value is None:
            pass
        elif isinstance(value, dict):
            for key in value:
                self.__setitem__(key, value[key])
        else:
            raise TypeError, 'expected dict'

    def __setitem__(self, key, value):
        if isinstance(value, dict) and not isinstance(value, DotDict):
            value = DotDict(value)
        dict.__setitem__(self, key, value)

    def __getitem__(self, key):
        found = self.get(key, DotDict.marker)
        if found is DotDict.marker:
            found = DotDict()
            dict.__setitem__(self, key, found)
        return found

    __setattr__ = __setitem__
    __getattr__ = __getitem__


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
    pretty_console_log('SERVICE GATEWAY GET URL', url)

    return url

def service_gateway_get(service_name, operation_name, params=None, base=SERVICE_GATEWAY_BASE_URL):
    service_gateway_request = requests.get(build_get_request(base, service_name, operation_name, params))
    pretty_console_log('SERVICE GATEWAY GET RESPONSE', service_gateway_request.content)
    return render_service_gateway_response(service_gateway_request)

def render_service_gateway_response(service_gateway_resp, raw_return=None):
    if service_gateway_resp.status_code == 200:
        resp = json.loads(service_gateway_resp.content)
        try:
            response = resp['data']['GatewayResponse']
            
            if raw_return: # return actor_id, valid_until, is_registered tuple/list
                return response
            if isinstance(response, list):
                return response[0]
            else:
                return response
        except Exception, e:
            return resp['data']
    else:
        return json.dumps(service_gateway_resp.content)

def build_post_request(service_name, operation_name, params=None, web_requester_id=None, base=SERVICE_GATEWAY_BASE_URL):
    """
    Builds a post request out of a service/operation and optional params.
    operation_name may be left blank if going to a custom url.
    """
    urlarr = [base, service_name]
    if operation_name is not None:
        urlarr.append(operation_name)

    url = "/".join(urlarr)

    post_data = deepcopy(SERVICE_REQUEST_TEMPLATE)
    post_data['serviceRequest']['serviceName'] = service_name
    post_data['serviceRequest']['serviceOp'] = operation_name
    if params is not None:
        post_data['serviceRequest']['params'] = params
    # conditionally add user id and expiry to request
    
    if web_requester_id:
        post_data['serviceRequest']['requester'] = web_requester_id
    elif "actor_id" in session:
        post_data['serviceRequest']['requester'] = session['actor_id']
        post_data['serviceRequest']['expiry'] = session['valid_until']
    data={'payload': json.dumps(post_data)}
    pretty_console_log('SERVICE GATEWAY POST URL/DATA', url, data)
    return url, data

def service_gateway_post(service_name, operation_name, params=None, raw_return=None, web_requester_id=None, base=SERVICE_GATEWAY_BASE_URL):
    url, data = build_post_request(service_name, operation_name, params, web_requester_id=web_requester_id, base=base)
    service_gateway_request = requests.post(url, data)
    pretty_console_log('SERVICE GATEWAY POST RESPONSE', service_gateway_request.content)
    return render_service_gateway_response(service_gateway_request, raw_return=raw_return)

def build_agent_request(agent_id, operation_name, params=None):
    url = '%s/%s/%s' % (AGENT_GATEWAY_BASE_URL, agent_id, operation_name)

    post_data = deepcopy(AGENT_REQUEST_TEMPLATE)
    post_data['agentRequest']['agentId'] = agent_id
    post_data['agentRequest']['agentOp'] = operation_name

    if params is not None:
        # post_data['agentRequest']['params'] = params['params']
        post_data['agentRequest']['params'].update(params)

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
    return render_service_gateway_response(resp, raw_return=True)

    # if resp.status_code == 200:
    #     resp = json.loads(resp.content)
    # 
    #     if type(resp) == dict:
    #         return resp['data']['GatewayResponse']
    #     elif type(resp) == list:
    #         return resp['data']['GatewayResponse'][0]

def error_message(msg=None):
    """Builds a Gateway compataible error message for UI."""
    error_msg = {'GatewayError': {'Message': 'An error occurred.'}}
    if msg is not None:
        error_msg['GatewayError']['Message'] = msg
    return error_msg

def pretty_console_log(label, content, data=None):
    print '\n Service Gateway: ', '%s : %s' % (label, content), '\n\n'
