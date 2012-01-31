import dummy_data

class ServiceApi(object):

    @staticmethod
    def data_resource(request_args):
        action = request_args.get("action")
        if action == "findByUser":
            return dummy_data.FINDBYUSER
        else:
            dummy_data.DATA.update({"dataResourceSummary":dummy_data.ALL_RESOURCES_DATA})
            return dummy_data.DATA

    @staticmethod
    def data_resource_details(data_resource_id):
        dummy_data.DATA["source"]["visualization_url"] = "http://visualize.whirledpeas.edu/crazy-visuals"
        dummy_data.DATA.update({"dataResourceSummary":dummy_data.DATARESOURCESUMMARY_ONE})
        dummy_data.DATA.update({"data_resource_id":data_resource_id})
        return dummy_data.DATA

    @staticmethod
    def subscription(request_args):
        return dummy_data.SUBSCRIPTION_DATA

    @staticmethod
    def marine_facilities(request_args):
        return dummy_data.MARINE_FACILITIES_DATA
