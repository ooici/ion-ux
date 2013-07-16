from service_api import ServiceApi
import main


def is_it_id(id_):
    if len(id_) == 32:
        return True
    return False


def get_org_data():
    #Returns org name and org ids
    with main.app.test_request_context():
        sa = ServiceApi()
        org = sa.find_by_resource_type("Org")
        return [{'name': str(item['name']), 'org_id': str(item['_id'])} for item in org]


def get_org_id(org_name="CI Bench Test Facility", org_data=None):
    # Get org id from org name
    org_data = org_data or get_org_data()
    org_id = [org['org_id'] for org in org_data if org['name'] == org_name]
    if org_id:
        return org_id[0]
    return None
