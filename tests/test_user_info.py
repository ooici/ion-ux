__author__ = 'Seman'

import sys
sys.path.append('.')
import unittest
import main
from service_api import ServiceApi
import flask
import random
from common import *


class SignIntTest(unittest.TestCase):

    def setUp(self):
        self.user = "Beta Operator User"
        self.app_client = main.app.test_client()
        self.app_context = main.app.test_request_context()
        self.sa = ServiceApi()

    def tearDown(self):
        pass

    def test_user_info(self,user="Beta Operator User"):
        with self.app_context:
            # Make sure the user is signed in
            self.sa.signon_user_testmode(self.user)
            user_id = flask.session.get('user_id')
            actor_id = flask.session.get('actor_id')
            username = flask.session.get('name')
            is_registered = flask.session.get('is_registered')
            self.assertIsNot(user_id, None)
            self.assertIsNot(actor_id, None)
            self.assertEqual(username, self.user)
            self.assertIs(is_registered, True)
            self.assertIs(is_it_id(user_id), True)
            self.assertTrue(is_it_id(actor_id), 32)

            # Get User info
            resource_type = 'UserInfo'
            resource = self.sa.get_prepare(resource_type, user_id, None, True)
            self.assertTrue(resource)
            resource_obj = resource.get('resource')
            self.assertIsNotNone(resource_obj)

            resource_assocs = resource.get('associations')
            self.assertIsNotNone(resource_assocs)

            contact = resource_obj.get('contact')
            city = contact.get('city')
            self.assertIsNotNone(city)

            # Update city
            new_city = 'La Jolla ' + str(int(random.random() * 1000))
            resource_obj['contact']['city'] = new_city
            updated_resource = self.sa.update_resource(resource_type, resource_obj, resource_assocs)

            # Get user info again verify the new city name
            resource_temp = self.sa.get_prepare(resource_type, user_id, None, True)
            resource_obj_temp = resource_temp.get('resource')
            self.assertEqual(resource_obj_temp.get('contact').get('city'), new_city)




if __name__ == '__main__':
    unittest.main()
