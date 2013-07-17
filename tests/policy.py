__author__ = 'seman'
import sys
sys.path.append('.')
import unittest
import main
from service_api import ServiceApi
from common import *
from flask import current_app

ServiceApi.print_enabled = False


class PolicyIntTest(unittest.TestCase):

    def setUp(self):
        self.user = "Beta Operator User"
        self.org_name = "CI Bench Test Facility"
        self.app_client = main.app.test_client()
        self.app_context = main.app.test_request_context()
        self.sa = ServiceApi()
        self.unauthorized_status_code = 400
        self.org_id =  get_org_id(org_name=self.org_name)
        self.assertIsNotNone(self.org_id)
        self.assertTrue(is_it_id(self.org_id), "Org id is set to non id value")

    def tearDown(self):
        pass

    def test_create_resource_as_guest(self):
        # Try to create instrument as a guest
        with main.app.test_client() as client:
            rsp = client.post('/create/', data={
                'resource_type': "InstrumentDevice",
                'org_id': self.org_id,
            })
            self.assertEqual(rsp.status_code,  self.unauthorized_status_code)

            # Try to create data product as a guest
            rsp = client.post('/create/', data={
                'resource_type': "DataProduct",
                'org_id': self.org_id,
                })
            self.assertEqual(rsp.status_code,  self.unauthorized_status_code)

            # Try to create instrument agent instance as a guest
            rsp = client.post('/create/', data={
                'resource_type': "InstrumentAgentInstance",
                'org_id': self.org_id,
                })
            self.assertEqual(rsp.status_code,  self.unauthorized_status_code)

            # Try to create instrument agent as a guest
            rsp = client.post('/create/', data={
                'resource_type': "InstrumentAgent",
                'org_id': self.org_id,
                })
            self.assertEqual(rsp.status_code,  self.unauthorized_status_code)

            # Try to create plantform device as a guest
            rsp = client.post('/create/', data={
                'resource_type': "PlatformDevice",
                'org_id': self.org_id,
                })
            self.assertEqual(rsp.status_code,  self.unauthorized_status_code)

    def test_persistence_as_guest(self):
        with main.app.test_client() as client:
            rsp = client.post('/activate_persistence/', data={
                'data_product_id': self.org_id,
            })
            self.assertEqual(rsp.status_code,  self.unauthorized_status_code)

        with main.app.test_client() as client:
            rsp = client.post('/suspend_persistence/', data={
                'data_product_id': self.org_id,
            })
            self.assertEqual(rsp.status_code,  self.unauthorized_status_code)

if __name__ == '__main__':
    unittest.main()

