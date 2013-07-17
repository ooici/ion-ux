__author__ = 'Seman'

import sys
sys.path.append('.')
import unittest
import flask
from nose.plugins.attrib import attr
import main
from service_api import ServiceApi
import random
from common import *


@attr('UNIT')
class DataProductIntTest(unittest.TestCase):

    def setUp(self):
        self.org_name = "CI Bench Test Facility"
        self.user = "Beta Operator User"
        self.app_client = main.app.test_client()
        self.app_context = main.app.test_request_context()
        self.sa = ServiceApi()

    def tearDown(self):
        pass

    def create_new_data_product(self, resource_type, org_id, resource_name=None):
        with self.app_context:
            # Create a new resource
            self.sa.signon_user_testmode(self.user)
            instrument_device_id, org_has_resource_instrument_id = self.sa.create_resource(resource_type=resource_type, org_id=org_id, resource_name=resource_name)
            self.assertIsNotNone(instrument_device_id)
            self.assertIs(is_it_id(instrument_device_id), True)
            self.assertIsNotNone(org_has_resource_instrument_id)
            self.assertIs(is_it_id(org_has_resource_instrument_id), True)

            # Get the data from service gateway and verify
            resource = self.sa.get_prepare(resource_type, instrument_device_id, None, True)
            resource_obj = resource.get('resource')
            resource_association = resource.get('associations')
            self.assertIsNotNone(resource_obj)
            self.assertEqual(resource_obj.get('name'), resource_name)

            # Verify the resource can be updated
            new_name = " Unit Test New Instrument Name " + str(int(random.random() * 1000))
            resource_obj['name'] = new_name
            response = self.sa.update_resource(resource_type, resource_obj, [])

            # Verify the name has been updated
            resource = self.sa.get_prepare(resource_type, instrument_device_id, None, True)
            resource_obj = resource.get('resource')
            self.assertIsNotNone(resource_obj)
            self.assertEqual(resource_obj.get('name'), new_name)

            # Put back the name
            resource_obj['name'] = resource_name
            response = self.sa.update_resource(resource_type, resource_obj, [])
            resource = self.sa.get_prepare(resource_type, instrument_device_id, None, True)
            resource_obj = resource.get('resource')
            self.assertIsNotNone(resource_obj)
            self.assertEqual(resource_obj.get('name'), resource_name)

            # Logout by clearing the session
            flask.session.clear()

            # Try to update the instrument data as a guest
            response = self.sa.update_resource(resource_type, resource_obj, [])
            self.assertTrue(len(response) > 0, "Service Gateway is supposed to return unauthorized error for updating a resource as a guest")
            error = response[0].get('GatewayError')
            self.assertIsNotNone(error, "Service Gateway is supposed to return unauthorized error for updating a resource as a guest")
            error = error.get('Exception')
            self.assertEqual(error.lower(), "unauthorized", "Service Gateway is supposed to return unauthorized error for updating a resource as a guest")

    def test_create_data_product(self):
        instrument_name = "Unit Test Data Product " + str(int(random.random() * 1000))
        resource_type = 'DataProduct'

        org_id = get_org_id(org_name=self.org_name)
        self.assertIsNotNone(org_id)
        self.assertTrue(is_it_id(org_id))

        self.create_new_data_product(resource_type=resource_type, org_id=org_id, resource_name=instrument_name)


if __name__ == '__main__':
    unittest.main()
