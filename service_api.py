class ServiceApi(object):
    
    @staticmethod
    def get_observatory_facepage(marine_facility_id):
        marine_facility = service_gateway_get('marine_facility_management', 'read_marine_facility', params={'marine_facility_id': marine_facility_id})
        
        if marine_facility.has_key('_id'):
            # GENERAL
            marine_facility['data_products'] = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'DataProduct', 'id_only': 'False'})[0]
            marine_facility['platforms'] = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'PlatformDevice', 'id_only': 'False'})[0]
            marine_facility['instruments'] = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'InstrumentDevice', 'id_only': 'False'})[0]

            # ADMINISTRATION
            org_id = service_gateway_get('marine_facility_management', 'find_marine_facility_org', params={'marine_facility_id': marine_facility_id})
            marine_facility['users'] = service_gateway_get('org_management', 'find_enrolled_users', params={'org_id': org_id})
            marine_facility['policies'] = service_gateway_get('org_management', 'find_org_roles', params={'org_id': org_id})
            
            # SOFTWARE
            marine_facility['instrument_agents'] = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'InstrumentAgent', 'id_only': 'False'})[0]
            marine_facility['data_process_definitions'] = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'DataProcessDefinition', 'id_only': 'False'})[0]
            
            # EVENTS
            marine_facility['recent_events'] = []
            marine_facility['user_requests'] = service_gateway_get('org_management', 'find_requests', params={'org_id': org_id})
            
            # DEFINITIONS
            marine_facility['platform_models'] = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'PlatformModel', 'id_only': 'False'})[0]
            marine_facility['instrument_models'] = service_gateway_get('resource_registry', 'find_resources', params={'restype': 'InstrumentModel', 'id_only': 'False'})[0]
        
        return marine_facility




def build_get_request(service_name, operation_name, params={}):
    url = '%s/%s/%s' % (SERVICE_GATEWAY_BASE_URL, service_name, operation_name)    
    if len(params) > 0:
        param_string = '?'
        for (k, v) in params.iteritems():
            param_string += '%s=%s&' % (k,v)
        url += param_string[:-1]

    print '---------------------------------------'
    print url
    print '---------------------------------------'

    return url


def service_gateway_get(service_name, operation_name, params={}):    
    resp = requests.get(build_get_request(service_name, operation_name, params))

    pretty_console_log('SERVICE GATEWAY RESPONSE', resp.content)
    print '---------------------------------------'
    print str(resp.content)
    print '---------------------------------------'

    if resp.status_code == 200:
        resp = json.loads(resp.content)

        print "++++++++++++++++++++++++++++++++++"
        # print type(resp['data']['GatewayResponse'])
        print "++++++++++++++++++++++++++++++++++"

        # resp = resp.get_key('data').get_key('GatewayResponse')

        print '=================================='
        print 'URL: ', type(resp['data']['GatewayResponse'])
        print '=================================='

        if type(resp) == dict:
            return resp['data']['GatewayResponse']
        elif type(resp) == list:
            return resp['data']['GatewayResponse'][0]


def pretty_console_log(label, content):
    print '\n\n\n'
    print '------------------------------'
    print '%s : %s' % (label, content)
    print '------------------------------'
