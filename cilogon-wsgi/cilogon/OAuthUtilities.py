import os
import simpleLogging
import base64
import logging
import constants
import hashlib
# Collection of helper utilities that encapsulate OAuth operations


# First leg of the process. A temporary credential is requested from the service
import httplib

#FIXME inject this at some point.
import socket

from Properties import PortalProperties

from oauth import OAuthConsumer
from oauth import OAuthSignatureMethod_PLAINTEXT

# Create a client and do the actual work. This takes a dictionary, createsets communicates with the OAuth server
# then returns an OAuthToken object.
def getTempCred(portalProperties, params=None):
    client = PortalOAuthClient(constants.SERVICE_ADDRESS,
                               constants.SERVICE_PORT,
                               constants.SERVICE_INITIALIZATION_REQUEST_URL,
                               constants.SERVICE_ACCESSS_REQUEST_URL,
                               constants.SERVICE_AUTHORIZATION_REQUEST_URL,
                               hostKey=portalProperties.hostKey(),
                               hostCert=portalProperties.hostCert())
    consumer = OAuthConsumer(constants.CONSUMER_KEY, constants.CONSUMER_SECRET)
    signature_method_plaintext = OAuthSignatureMethod_PLAINTEXT()
   # get request token
    oauth_request = PortalOAuthRequest.from_consumer_and_token(consumer,
                                                               callback=portalProperties.callbackUrl(),
                                                               http_url=client.request_token_url,
                                                               parameters=params)
    oauth_request.sign_request(signature_method_plaintext, consumer, None)
    token = client.fetch_request_token(oauth_request)
    return token

#Second leg of the process, called after the service makes the callback. An access token is requested.
def getAccessToken(portalProperties, transaction, params):
    client = PortalOAuthClient(constants.SERVICE_ADDRESS,
                               constants.SERVICE_PORT,
                               constants.SERVICE_INITIALIZATION_REQUEST_URL,
                               constants.SERVICE_ACCESSS_REQUEST_URL,
                               constants.SERVICE_AUTHORIZATION_REQUEST_URL,
                               hostKey=portalProperties.hostKey(),
                               hostCert=portalProperties.hostCert())
    logging.info('getAccessToken: accessReq = ' + constants.SERVICE_ACCESSS_REQUEST_URL + ', authZ url = ' + constants.SERVICE_AUTHORIZATION_REQUEST_URL)
    consumer = OAuthConsumer(constants.CONSUMER_KEY, constants.CONSUMER_SECRET)
    signature_method_plaintext = OAuthSignatureMethod_PLAINTEXT()
   # get request token
    logging.info('OAuth generated request token url = ' + str(client.request_token_url) + ', params = ' + str(params))
    oauth_request = PortalOAuthRequest.from_consumer_and_token(consumer,
                                                               None,
                                                               http_url=client.request_token_url,
                                                               parameters=params)
    token = PortalOAuthToken(transaction.tempCred,transaction.tempCredSS,)
    oauth_request.sign_request(signature_method_plaintext, consumer, token)
    logging.info('getAccessToken: making request')
    token = client.fetch_access_token(oauth_request)
    logging.info('getAccessToken: Made request, token = ' + str(token))
    return token

# Third leg of the process, once the access token is retrieved, get the actual certificate.
def getAssets(portalProperties, transaction, params):
    logging.info('getAssets: starting')
    client = PortalOAuthClient(constants.SERVICE_ADDRESS,
                               constants.SERVICE_PORT,
                               constants.SERVICE_INITIALIZATION_REQUEST_URL,
                               constants.SERVICE_CREDENTIAL_REQUEST_URL,
                               constants.SERVICE_AUTHORIZATION_REQUEST_URL,
                                hostKey=portalProperties.hostKey(),
                               hostCert=portalProperties.hostCert())
    consumer = OAuthConsumer(constants.CONSUMER_KEY, constants.CONSUMER_SECRET)
    signature_method_plaintext = OAuthSignatureMethod_PLAINTEXT()
   # get request token
    logging.info('getAssets: creating request')
    otherId = hashlib.sha1(transaction.identifier).hexdigest()
    logging.info('getAssets: file infix =' + otherId)
    TEMP_DIRECTORY = str(portalProperties.temporaryDirectory()) + '/'
    tempKey = TEMP_DIRECTORY + otherId + '-key.pem'
    tempCertReq= TEMP_DIRECTORY + otherId + '-req.der'
    b64CertReq = TEMP_DIRECTORY + otherId + '-req.b64'
    #certConfig= PORTAL_ROOT + 'cert-request.cfg'
    certConfig= portalProperties.certRequestConfiguration()
    os.system('openssl req -new  -newkey rsa:2048 -outform DER -keyout ' + tempKey + '  -config ' + certConfig + ' -out ' + tempCertReq)
    keyfile = open(tempKey, 'rb')
    transaction.privateKey = keyfile.read()
    keyfile.close()
    # Have to base 64 encode the file
    reqfile = open(tempCertReq, 'rb')
    b64=open(b64CertReq,'wr')
    base64.encode(reqfile, b64)
    b64.close()
    b64=open(b64CertReq, 'r')
    reqfile.close()
    certreq = b64.read()
    b64.close()
    logging.info('cert request = ' + certreq)
    params[constants.CERT_REQUEST_PARAMETER] = certreq
    logging.info('getAssets: added cert req with key = ' + constants.CERT_REQUEST_PARAMETER + ', making oauth request')
    oauth_request = PortalOAuthRequest.from_consumer_and_token(consumer,
                                                               None,
                                                               http_url=client.request_token_url,
                                                               parameters=params
                                                               )
    token = PortalOAuthToken(transaction.accessToken,transaction.accessTokenSS)
    logging.info('getAssets: got token, getting ready to sign request')
    oauth_request.sign_request(signature_method_plaintext, consumer, token)
    logging.info('getAssets:  signed request, getting ready to send cert req')
    resource = client.access_resource(oauth_request)

    logging.info('getAssets: got cert')
    transaction.certificate=resource
    transaction.save()
    # cleanup
    logging.info('getAssets: cleaning up, removing ' + tempKey)
    os.remove(tempKey)
    os.remove(tempCertReq)
    os.remove(b64CertReq)
    return resource

from oauth import OAuthClient
from oauth import OAuthToken

class PortalOAuthClient(OAuthClient):

    def __init__(self, server,
                 port=httplib.HTTPS_PORT,
                 request_token_url='',
                 access_token_url='',
                 authorization_url='',
                 hostKey = None,
                 hostCert = None):
        self.server = server
        self.port = port
        self.request_token_url = request_token_url
        self.access_token_url = access_token_url
        self.authorization_url = authorization_url
        self.connection = httplib.HTTPSConnection(host=self.server, port=self.port)
        logging.info('portal oauth client, hostkey = ' + str(hostKey) + ', and host cert = ' + str(hostCert))
#        self.connection = VerifiedHTTPSConnection("%s:%d" % (self.server, self.port),
#                                                  key_file=hostKey,
#                                                  cert_file=hostCert)


    def fetch_request_token(self, oauth_request):
        # via headers
        # -> OAuthToken
        self.connection.request(oauth_request.http_method, self.request_token_url, headers=oauth_request.to_header())
        response = self.connection.getresponse()
        if(response.status != 200):
            raise Exception('Error making request: ' + str(response.read()))
        return OAuthToken.from_string(response.read())

    def fetch_access_token(self, oauth_request):
        # via headers
        # -> OAuthToken
        self.connection.request(oauth_request.http_method, self.access_token_url, headers=oauth_request.to_header())
        response = self.connection.getresponse()
        if response.status != 200:
        	logging.warn('Error temp cred -- response from server:\n' + response.read())
        	raise Exception('Error: did not get a temp cred. Response code=' + str(response.status))

        return OAuthToken.from_string(response.read())

    def authorize_token(self, oauth_request):
        # via url
        # -> typically just some okay response
        self.connection.request(oauth_request.http_method, oauth_request.to_url())
        response = self.connection.getresponse()
        if response.status != 200:
        	logging.warn('Error getting access token -- response from server:\n' + response.read())
        	raise Exception('Error: could not get access token =' + str(response.status))

        return response.read()

    def access_resource(self, oauth_request):
        # via post body
        # -> some protected resources
        headers = {'Content-Type' :'application/x-www-form-urlencoded'}
        self.connection.request('POST', self.access_token_url, body=oauth_request.to_postdata(), headers=headers)
        response = self.connection.getresponse()
        logging.info('got response from server =' + str(response))

        if response.status != 200:
        	logging.warn('Error getting cert -- response from server:\n' + response.read())
        	raise Exception('Error: did not get a cert. Response code=' + str(response.status))
        cert = response.read()
        logging.info('cert = ' + cert)
        return cert

from oauth import escape
from oauth import OAuthRequest
from oauth import HTTP_METHOD
from oauth import generate_timestamp
from oauth import generate_nonce
from oauth import OAuthRequest

class PortalOAuthRequest(OAuthRequest):
    def __init__(self,
                 http_method=HTTP_METHOD,
                 http_url=None,
                 parameters=None):
        self.http_method = http_method
        self.http_url = http_url
        self.parameters = parameters or {}

    def from_consumer_and_token(oauth_consumer, token=None,
            callback=None, verifier=None,
            http_method=HTTP_METHOD,
            http_url=None,
            parameters=None):
        if not parameters:
            parameters = {}

        defaults = {
            constants.OAUTH_CONSUMER_KEY: oauth_consumer.key,
            constants.OAUTH_TIMESTAMP: generate_timestamp(),
            constants.OAUTH_NONCE: generate_nonce(),
            constants.OAUTH_VERSION: OAuthRequest.version,
        }

        defaults.update(parameters)
        parameters = defaults

        if token:
            parameters[constants.OAUTH_TOKEN] = token.key
            if token.callback:
                parameters[constants.OAUTH_CALLBACK] = token.callback
            # 1.0a support for verifier.
            if verifier:
                parameters[constants.OAUTH_VERIFIER] = verifier
        elif callback:
            # 1.0a support for callback in the request token request.
            parameters[constants.OAUTH_CALLBACK] = callback

        return PortalOAuthRequest(http_method, http_url, parameters)
    from_consumer_and_token = staticmethod(from_consumer_and_token)

    def to_header(self, realm=''):
          """Serialize as a header for an HTTPAuth request."""
          auth_header = 'OAuth realm="%s"' % realm
          # Add the oauth parameters.
          if self.parameters:
              for k, v in self.parameters.iteritems():
                       auth_header += ', %s="%s"' % (k, escape(str(v)))
          return {'Authorization': auth_header}

    def to_postdata(self):
        """Serialize as post data for a POST request."""
        logging.info('starting to create post request. param')
        try:
              foo = '&'.join(['%s=%s' % (escape(str(k)), escape(str(v))) \
                       for k, v in self.parameters.iteritems()])
        except Exception,e:
              logging.warn('error from creating post body' + str(e))

        logging.info('returning post body')
        return foo



from oauth import OAuthToken
class PortalOAuthToken(OAuthToken):
    def set_parameter(self, parameter, value):
        self.parameters[parameter] = value

from threading import Thread



class doRest(Thread):
   def __init__ (self,
   	      transaction,
   	      portalProperties):
      Thread.__init__(self)
      self.transaction = transaction
      self.portalProperties = portalProperties
      self.status = -1


   def run(self):
      logging.info('doRest: starting ')
      params = {constants.OAUTH_VERIFIER : self.transaction.verifier}
      token = getAccessToken(self.portalProperties,
      	      self.transaction,
      	      params)
      logging.info('doRest: got access token')
      self.transaction.accessToken = token.key
      self.transaction.accessTokenSS = token.secret
      params = {constants.OAUTH_TOKEN : self.transaction.accessToken}
      logging.info('doRest: before getAssets')
      try:
      	      getAssets(self.portalProperties,
      	      	      self.transaction,
      	      	      params=params)
              logging.info('doRest: done with get, saving')
              self.transaction.complete = True
              self.transaction.save()

      except Exception,e:
      	      logging.warn('doRest: Error getting the cert: ' + str(e))
      	      self.transaction.complete = False
      	      self.transaction.save()
      	      return

# The standard python library does not require key and creds to do ssl -- if they are present
# it will sort of do the verification in that it check that the cert is valid -- *any* valid
# cert will do, even a self-signed on. If they are absent it will silently not do anything. The best way
# to ensure that this is done is to slightly alter the base implementation to make the cert required.
# In this way, if they are not set,  an error is raised. This is still not a good solution.
# The most recent chatter about this is that python will simply adopt the OpenSSL wrapper
# M2Crypto at some point, until then, this is broken.          
#import httplib
#import ssl
#class VerifiedHTTPSConnection(httplib.HTTPSConnection):
#    def connect(self):
        # overrides the version in httplib so that we do
        #    certificate verification
#        sock =socket.create_connection((self.host, self.port),
#                                        self.timeout)
#        if self._tunnel_host:
#            self.sock = sock
#            self._tunnel()
        # wrap the socket using verification with the root
        #    certs in trusted_root_certs
#        self.sock = ssl.wrap_socket(sock,
#                                    self.key_file,
#                                    self.cert_file,
#                                    cert_reqs=ssl.CERT_REQUIRED,
#                                    ca_certs="trusted_root_certs")

