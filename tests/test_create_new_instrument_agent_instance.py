__author__ = 'Seman'

import sys
sys.path.append('.')
import unittest
import main
from nose.plugins.attrib import attr
from service_api import ServiceApi
import random
from common import *

@attr('UNIT')
class InstrumentAgentInstanceUnitTest(unittest.TestCase):

    def setUp(self):
        self.org_name = "CI Bench Test Facility"
        self.user = "Beta Operator User"
        self.app_client = main.app.test_client()
        self.app_context = main.app.test_request_context()
        self.sa = ServiceApi()

    def tearDown(self):
        pass

    def create_resource(self, resource_type, org_id, resource_name=None):
        with self.app_context:
            self.sa.signon_user_testmode(self.user)
            resource_id, org_has_resource_id = self.sa.create_resource(resource_type=resource_type, org_id=org_id, resource_name=resource_name)
            self.assertIsNotNone(resource_id)
            self.assertIs(is_it_id(resource_id), True)
            self.assertIsNotNone(org_has_resource_id)
            self.assertIs(is_it_id(org_has_resource_id), True)

            # get the data from service gateway and verify
            resource = self.sa.get_prepare(resource_type, resource_id, None, True)
            resource_obj = resource.get('resource')
            resource_association = resource.get('associations')
            self.assertIsNotNone(resource_obj)
            self.assertEqual(resource_obj.get('name'), resource_name)

            # Verify the resource can be updated
            new_name = " Unit Test Data Product Temp " + str(int(random.random() * 1000))
            resource_obj['name'] = new_name
            response = self.sa.update_resource(resource_type, resource_obj, [])

            # Verify the name has been updated
            resource = self.sa.get_prepare(resource_type, resource_id, None, True)
            resource_obj = resource.get('resource')
            self.assertIsNotNone(resource_obj)
            self.assertEqual(resource_obj.get('name'), new_name)

            # Put back the name
            resource_obj['name'] = resource_name
            response = self.sa.update_resource(resource_type, resource_obj, [])
            resource = self.sa.get_prepare(resource_type, resource_id, None, True)
            resource_obj = resource.get('resource')
            self.assertIsNotNone(resource_obj)
            self.assertEqual(resource_obj.get('name'), resource_name)

    def test_create_new_instrument_agent_instance(self):
        instrument_name = "Unit Test Instrument Agent Instance " + str(int(random.random() * 1000))
        resource_type = 'InstrumentAgentInstance'

        org_id = get_org_id(org_name=self.org_name)
        self.assertIsNotNone(org_id)
        self.assertTrue(is_it_id(org_id))   # Make sure it returns id which is 32 chars

        self.create_resource(resource_type=resource_type, org_id=org_id, resource_name=instrument_name)


if __name__ == '__main__':
    unittest.main()
