import dummy_data

class ServiceApi(object):

    @staticmethod
    def data_resource(request_args):
        dummy_data.DATA.update({"dataResourceSummary":dummy_data.ALL_RESOURCES_DATA})
        return dummy_data.DATA

    @staticmethod
    def subscription(request_args):
        return dummy_data.SUBSCRIPTION_DATA
