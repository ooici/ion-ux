#!/usr/bin/env python

__author__ = 'Michael Meisinger'

import json
import pprint
import requests
from requests import Session
import sys

def _create_svc_url(host, service, op):
    url = "http://%s/ion-service/%s/%s" % (host, service, op)
    return url

def main():
    if len(sys.argv) < 2:
        print "Illegal arguments"
        print "Usage: %s authtoken host" % sys.argv[0]
        sys.exit(1)
    token = sys.argv[1]
    host = sys.argv[2] if len(sys.argv) > 2 else "localhost:3000"

    session = Session()
    xhr_headers = {
        #'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:28.0) Gecko/20100101 Firefox/28.0',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
    }

    # Search for CTD Simulator resource by name
    print "Searching for CTD Simulator"
    url = "http://%s/search/" % (host)
    resp = session.get(url, headers=xhr_headers,
                       params=dict(query="search 'name' is 'CTD Simulator' from 'resources_index'"))

    inst_id = None
    for obj in resp.json["data"]:
        if obj["type_"] == "InstrumentDevice" and obj["name"] == "CTD Simulator":
            inst_obj = obj.copy()
            inst_id = obj["_id"]

    if not inst_id:
        print "ERROR: Could not find instrument id in response"
        print "Response: ", resp.text
        sys.exit(1)

    print "Found CTD Simulator:", inst_id

    # Get instrument extension
    #url = "http://%s/InstrumentDevice/extension/%s/" % (host, inst_id)
    #resp = session.get(url, headers=xhr_headers)
    #print "Found instrument extended resource"

    # Starting the agent
    url = "http://%s/InstrumentDevice/command/%s/start/" % (host, inst_id)
    resp = session.post(url)
    if resp.json.get("data", {}).get("GatewayError", {}).get("Exception", None) == "Unauthorized":
        print "Start agent anonymously returns Unauthorized - OK"
    else:
        print "ERROR: Starting agent does not return Unauthorized"
        sys.exit(1)

    # Setting the token
    print "Setting authentication token: ", token
    url = "http://%s/setauthtoken/" % (host)
    resp = session.get(url, params=dict(authtoken=token))
    if "OK" not in resp.text:
        print "ERROR: Setting auth token not successful"
        print "Response: ", resp.text
        sys.exit(1)

    # Starting the agent - again
    url = "http://%s/InstrumentDevice/command/%s/start/" % (host, inst_id)
    resp = session.post(url)
    if resp.json.get("data", None) and isinstance(resp.json["data"], basestring) and "InstrumentAgent" in resp.json["data"]:
        print "Starting agent successful. Process id=", resp.json["data"]
    else:
        print "Start agent with token returns Unauthorized - NOT OK"
        print resp.text
        sys.exit(1)

    # Stoping the agent
    url = "http://%s/InstrumentDevice/command/%s/stop/" % (host, inst_id)
    resp = session.post(url)
    if "data" in resp.json and resp.json["data"] is None:
        print "Stop agent successful"
    else:
        print "Stop agent with token returns Unauthorized - NOT OK"
        print resp.text
        sys.exit(1)

    # # Edit resource type
    # url = "http://%s/resource_type_edit/InstrumentDevice/%s/" % (host, inst_id)
    # inst_obj1 = inst_obj.copy()
    # inst_obj1["description"] = "Simulator providing CTD data"
    # par_dict = dict(resource=inst_obj1, assocs=[])
    # resp = requests.put(url, data=json.dumps(par_dict))
    #
    # #json.dumps(dict(resource=inst_obj1, assocs=[]))
    # print resp.text

if __name__ == '__main__':
    main()