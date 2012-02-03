import requests, json

BASE_URL = 'http://localhost:5000/ion-service'
SERVICE_REQUEST_TEMPLATE = {
    'serviceRequest': {
        'serviceName': 'resource_registry', 
        'serviceOp': '',
        'params': {
            'object': [] # Ex. [BankObject, {'name': '...'}] 
        }
    }
}
 
read_data = SERVICE_REQUEST_TEMPLATE
read_data['serviceRequest']['serviceOp'] = 'find_objects'
read_data['serviceRequest']['params']['object'] = ['Org', {'object_type': 'Org'}]

r = requests.get('%s/find_objects' % BASE_URL, data={'payload': json.dumps(read_data)})