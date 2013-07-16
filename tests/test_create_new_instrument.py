__author__ = 'Seman'

import sys
sys.path.append('.')
import unittest
import main
from nose.plugins.attrib import attr
from service_api import ServiceApi
import random
import flask
from common import *
from StringIO import StringIO


@attr('UNIT')
class InstrumentDeviceUnitTest(unittest.TestCase):

    def setUp(self):
        self.user = "Beta Operator User"
        self.app_client = main.app.test_client()
        self.app_context = main.app.test_request_context()
        self.sa = ServiceApi()

    def tearDown(self):
        pass

    def get_instrument_model_id_from_resources(self, model_name, resources):
        for resource in resources:
            if resource.get('name') == model_name:
                return resource.get('_id')
        return None

    def attachment(self, instrument_id):
        '''
        with self.app_client as c:
            r =c.get('/signon/?user='+self.user)
            user_id = flask.session.get('user_id')
            self.assertIsNot(user_id, None)
            r = c.post('/attachment/', data={
                'file': (StringIO('That rug really tied the room together.'), 'unittest.txt'),
                'resource_id': instrument_id,
                'description': 'This is just a test',
                'keywords': 'testing 123',
                'created_by': 'the dude',
                'modified_by': 'Walter Sobchak',
            })
            r = r
        '''
        pass



    def create_new_instrument(self, resource_type, org_id, resource_name=None):
        with self.app_context:
            self.sa.signon_user_testmode(self.user)
            instrument_device_id, org_has_resource_instrument_id = self.sa.create_resource(resource_type=resource_type, org_id=org_id, resource_name=resource_name)
            self.assertIsNotNone(instrument_device_id)
            self.assertIs(is_it_id(instrument_device_id), True)
            self.assertIsNotNone(org_has_resource_instrument_id)
            self.assertIs(is_it_id(org_has_resource_instrument_id), True)

            # get the data from service gateway and verify
            resource = self.sa.get_prepare(resource_type, instrument_device_id, None, True)
            resource_obj = resource.get('resource')
            resource_association = resource.get('associations')
            self.assertIsNotNone(resource_obj)
            self.assertEqual(resource_obj.get('name'), resource_name)
            associate_resource = resource_association.get('InstrumentModel').get('associated_resources')
            self.assertEqual(len(associate_resource), 0)  # Verify there is no association

            # set instrument model
            available_resources = resource_association.get('InstrumentModel').get('resources')
            instrument_model_name = 'SBE 37-SMP MicroCAT CTD Demo'
            instrument_model_id = self.get_instrument_model_id_from_resources(instrument_model_name, available_resources)
            self.assertIsNotNone(instrument_model_id, "Could not find " + instrument_model_name + " id from available resources")
            instrument_model_obj = self.sa.get_prepare("InstrumentModel", instrument_model_id, None, True)
            response = self.sa.update_resource(resource_type, resource_obj, {'InstrumentModel': instrument_model_id})
            error = response[0]
            self.assertIsNone(error)

            # Verify the instrument model association is set correctly
            resource = self.sa.get_prepare(resource_type, instrument_device_id, None, True)
            resource_association = resource.get('associations')
            associated_resource = resource_association.get('InstrumentModel').get('associated_resources')
            self.assertEqual(len(associated_resource), 1)
            self.assertTrue(instrument_model_id in associated_resource[0].values())

            # Update the instrument name
            resource = self.sa.get_prepare(resource_type, instrument_device_id, None, True)
            resource_obj = resource.get('resource')
            new_name = " Unit Test New Instrument Name " + str(int(random.random() * 1000))
            resource_obj['name'] = new_name
            response = self.sa.update_resource(resource_type, resource_obj, [])
            error = response[0]
            self.assertIsNone(error, error)

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

            # Try to update the instrument data as a guest and verify it fails
            response = self.sa.update_resource(resource_type, resource_obj, [])
            self.assertTrue(len(response) > 0, "Service Gateway is supposed to return unauthorized error for updating new instrument as a guest")
            error = response[0].get('GatewayError')
            self.assertIsNotNone(error, "Service Gateway is supposed to return unauthorized error for updating new instrument as a guest")
            error = error.get('Exception')
            self.assertEqual(error.lower(), "unauthorized", "Service Gateway is supposed to return unauthorized error for updating new instrument as a guest")

            return instrument_device_id

    def test_create_new_instrument(self):
        org_name = "CI Bench Test Facility"
        instrument_name = "Unit Test Instrument " + str(int(random.random() * 10000))
        resource_type = 'InstrumentDevice'

        org_data = get_org_data()
        self.assertIsNotNone(org_data)
        org_id = get_org_id(org_data, org_name)
        self.assertIsNotNone(org_id)
        self.assertTrue(is_it_id(org_id), "Org id is set to non id value")

        instrument_id = self.create_new_instrument(resource_type=resource_type, org_id=org_id, resource_name=instrument_name)
        #self.attachment(instrument_id)


if __name__ == '__main__':
    unittest.main()
