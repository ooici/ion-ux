import json

class ServiceApi(object):

    @staticmethod
    def resource_type_schema(resource_type):
        OBJECT_MAP = {"contacts":"ContactInformation"}
        req = service_gateway_get('resource_type_schema', resource_type, params={})
        for k,v in req:
            if k in M:
                subreq = service_gateway_get('resource_type_schema', M[k], params={})
                
        return req

#http://sg.a.oceanobservatories.org:5000/ion-service/resource_type_schema/InstrumentDevice
InstrumentDevice_json = """
{
  "data": {
    "GatewayResponse": {
      "message_controllable": true,
      "lcstate": "DRAFT_PRIVATE",
      "alt_ids": [],
      "description": "",
      "contacts": [],
      "uuid": "",
      "custom_attributes": {},
      "hardware_version": "",
      "last_calibration_datetime": "",
      "ts_updated": "",
      "type_": "InstrumentDevice",
      "monitorable": true,
      "serial_number": "",
      "firmware_version": "",
      "addl": {},
      "ts_created": "",
      "reference_urls": [],
      "controllable": true,
      "name": ""
    }
  }
}
"""

#print json.loads(InstrumentDevice_json)


#curl http://sg.a.oceanobservatories.org:5000/ion-service/resource_type_schema/ContactInformation
ContactInformation_json = """
{
  "data": {
    "GatewayResponse": {
      "individual_names_given": "",
      "city": "",
      "roles": [],
      "administrative_area": "",
      "url": "",
      "country": "",
      "variables": [
        {
          "name": "",
          "value": ""
        }
      ],
      "organization_name": "",
      "type_": "ContactInformation",
      "postal_code": "",
      "individual_name_family": "",
      "phones": [],
      "position_name": "",
      "email": "",
      "street_address": ""
    }
  }
}
"""


#http://sg.a.oceanobservatories.org:5000/ion-service/resource_type_schema/Phone
Phone_json = """
{
  "data": {
    "GatewayResponse": {
      "phone_number": "",
      "phone_type": "",
      "type_": "Phone",
      "sms": 0
    }
  }
}
"""
REQ_DATA_MAP = {"InstrumentDevice":InstrumentDevice_json, "ContactInformation":ContactInformation_json, "Phone":Phone_json}



def resource_type_schema(resource_type):
    """
    Traverse the schema of 'resource_type',
    (and all sub-schemas in the base schema,
    based on key existence in KEY_RESOURCE_TYPE_MAP).

    Returns an object that maps the 'path' of data
    attributes to it's 'type', based on the given schema.
    """

    KEY_RESOURCE_TYPE_MAP = {"contacts":"ContactInformation", "phones":"Phone"}

    current_data_resp = json.loads(REQ_DATA_MAP[resource_type])["data"]["GatewayResponse"]
    sub_obj_keys = [key for key in current_data_resp.keys() if key in KEY_RESOURCE_TYPE_MAP]
    [current_data_resp.pop(key) for key in sub_obj_keys] # sub objects removed 
    path = None
    data = dict([(key, str(type(val))) for (key, val) in current_data_resp.iteritems()])

    while sub_obj_keys:
        sub_obj_key = sub_obj_keys.pop(0)
        path = (path + "." + sub_obj_key) if path else sub_obj_key
        current_data_resp = json.loads(REQ_DATA_MAP[KEY_RESOURCE_TYPE_MAP[sub_obj_key]])["data"]["GatewayResponse"]
        sub_obj_keys.extend([key for key in current_data_resp.keys() if key in KEY_RESOURCE_TYPE_MAP])
        [current_data_resp.pop(key) for key in sub_obj_keys] # sub objects removed 
        data.update(dict([(path+"."+key, str(type(val))) for (key, val) in current_data_resp.iteritems()]))

    return data


if __name__ == "__main__":
    data = resource_type_schema("InstrumentDevice")
    for (k, v) in data.iteritems():
        print k, v

