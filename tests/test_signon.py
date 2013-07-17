import sys
sys.path.append('.')
import unittest
import main
import flask
from nose.plugins.attrib import attr


@attr('INT')
class SignInIntTest(unittest.TestCase):

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def test_sign_on(self,user="Beta Operator User"):
        with main.app.test_client() as c:
            rv = c.get('/signon/?user='+user)
            user_id = flask.session.get('user_id')
            self.assertIsNot(user_id, None)


if __name__ == '__main__':
    unittest.main()  