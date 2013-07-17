__author__ = 'seman'

__author__ = 'seman'
import sys
sys.path.append('.')
import unittest
import main
from service_api import ServiceApi
from common import *
import flask

ServiceApi.print_enabled = False


class EnrollmentUnitTest(unittest.TestCase):

    def setUp(self):
        self.user = "Owen Ownerrep"
        self.org_name = "RSN Facility"
        self.app_client = main.app.test_client()
        self.app_context = main.app.test_request_context()
        self.sa = ServiceApi()
        self.org_id = get_org_id(org_name=self.org_name)
        self.assertIsNotNone(self.org_id)
        self.assertTrue(is_it_id(self.org_id), "Org id is set to non id value")

    def tearDown(self):
        pass

    def test_enrollment_accept(self):
        negotiation_open = 1
        negotiation_accepted = 2
        negotiation_rejected = 3
        reject = 'reject'
        accept = 'accept'
        negotiation_type_request = 1

        # Request access to RSN Facility
        with self.app_context:
            self.sa.signon_user_testmode(self.user)
            actor_id = flask.session.get('actor_id') if flask.session.has_key('actor_id') else None
            resp = ServiceApi.enroll_request(self.org_id, actor_id)
            error = resp.get('GatewayError')
            self.assertIsNone(error, "Request for enrollment failed. Error: " + str(error))
            negotiation_id = resp.get('negotiation_id')
            self.assertIsNotNone(negotiation_id, "Request for enrollment failed ")

        with self.app_context:
            # Verify negotiation is open
            self.sa.signon_user_testmode("Tim Ampe")
            resource = self.sa.get_prepare("OrgUserNegotiationRequest", negotiation_id, None, True)
            resource_obj = resource.get('resource')
            negotiation_status = resource_obj.get('negotiation_status')
            negotiation_type = resource_obj.get('negotiation_type')
            self.assertEqual(negotiation_status, negotiation_open)
            self.assertEqual(negotiation_type, negotiation_type_request)

            # Accept negotiation
            rsp = self.sa.accept_reject_negotiation(negotiation_id, accept, 'provider', 'Different roads sometimes lead to the same castle.')

            resource = self.sa.get_prepare("OrgUserNegotiationRequest", negotiation_id, None, True)
            resource_obj = resource.get('resource')
            negotiation_status = resource_obj.get('negotiation_status')
            negotiation_type = resource_obj.get('negotiation_type')
            self.assertEqual(negotiation_status, negotiation_accepted)


            #todo remove the enrollment


    def test_enrollment_reject(self):
        negotiation_open = 1
        negotiation_accepted = 2
        negotiation_rejected = 3
        reject = 'reject'
        accept = 'accept'
        negotiation_type_request = 1

        # Request access to RSN Facility
        with self.app_context:
            self.sa.signon_user_testmode(self.user)
            actor_id = flask.session.get('actor_id') if flask.session.has_key('actor_id') else None
            resp = ServiceApi.enroll_request(self.org_id, actor_id)
            error = resp.get('GatewayError')
            self.assertIsNone(error, "Request for enrollment failed. Error: " + str(error))
            negotiation_id = resp.get('negotiation_id')
            self.assertIsNotNone(negotiation_id, "Request for enrollment failed ")

        with self.app_context:
            # Verify negotiation is open
            self.sa.signon_user_testmode("Tim Ampe")
            resource = self.sa.get_prepare("OrgUserNegotiationRequest", negotiation_id, None, True)
            resource_obj = resource.get('resource')
            negotiation_status = resource_obj.get('negotiation_status')
            negotiation_type = resource_obj.get('negotiation_type')
            self.assertEqual(negotiation_status, negotiation_open)
            self.assertEqual(negotiation_type, negotiation_type_request)

            # Reject negotiation
            rsp = self.sa.accept_reject_negotiation(negotiation_id, reject, 'provider', 'Different roads sometimes lead to the same castle.')
            resource = self.sa.get_prepare("OrgUserNegotiationRequest", negotiation_id, None, True)
            resource_obj = resource.get('resource')
            negotiation_status = resource_obj.get('negotiation_status')
            negotiation_type = resource_obj.get('negotiation_type')
            self.assertEqual(negotiation_status, negotiation_rejected)
