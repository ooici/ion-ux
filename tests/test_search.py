import sys
sys.path.append('.')
import unittest
import main
from nose.plugins.attrib import attr
from service_api import ServiceApi


@attr('UNIT')
class SearchUnitTest(unittest.TestCase):

    def setUp(self):
        self.app_client = main.app.test_client()
        self.app_context = main.app.test_request_context()

    def tearDown(self):
        pass

    def test_quick_search(self):
        with self.app_context:
            sa = ServiceApi()
            search_query = "parsed"
            results = sa.search(search_query=search_query)
            self.assertTrue(results != [])
            search_query_found = False
            for result in results:
                for key, value in result['_source'].iteritems():
                    if type(value) is str or type(value) is unicode:
                        if value.lower().find(search_query.lower()) > -1:
                            search_query_found = True
            self.assertTrue(search_query_found)

            search_query = "parseD"
            results = sa.search(search_query=search_query)
            self.assertTrue(results != [])
            search_query_found = False
            for result in results:
                for key, value in result['_source'].iteritems():
                    if type(value) is str or type(value) is unicode:
                        if value.lower().find(search_query.lower()) > -1:
                            search_query_found = True
            self.assertTrue(search_query_found)


@attr('INT')
class SearchIntTest(unittest.TestCase):

    def setUp(self):
        self.app = main.app.test_client()

    def tearDown(self):
        pass

    def test_search(self):
        result = self.app.get("/search/?query=parsed")
        self.assertEqual(result.status_code, 200)


if __name__ == '__main__':
    unittest.main()  