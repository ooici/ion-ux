import dummy_data

class ServiceApi(object):

    @staticmethod
    def data_resource(request_args):
        action = request_args.get("action")
        if action == "detail":
            dummy_data.DATA["source"]["visualization_url"] = "http://visualize.whirledpeas.edu/crazy-visuals"
            dummy_data.DATA.update({"dataResourceSummary":dummy_data.DATARESOURCESUMMARY_ONE})
            return dummy_data.DATA
        elif action == "findByUser":
            return dummy_data.FINDBYUSER
        else:
            dummy_data.DATA.update({"dataResourceSummary":dummy_data.ALL_RESOURCES_DATA})
            return dummy_data.DATA

    @staticmethod
    def subscription(request_args):
        return dummy_data.SUBSCRIPTION_DATA
