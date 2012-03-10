import urllib
import urlparse
import httplib2
import constants
import OAuthUtilities
import logging
import simpleLogging
import random
import hashlib

class CILogonService (object):
    portalProperties = None
    transactionStore = None

    def __init__(self, portal_properties, transaction_store):
        self.portalProperties = portal_properties
        self.transactionStore = transaction_store

    # A convenience to create random identifiers
    def createIdentifier(self):
        id = ''.join([str(random.randint(0, 9)) for i in range(64)]) # seed it
        id = 'cilogon-' + hashlib.sha1(id).hexdigest() # regularize it
        return id

    def getPortalProperties(self, portalProps = None):
        if portalProps is not None:
            self.portalProperties = portalProps
        return self.portalProperties

    def requestCredential(self, identifier):
        t = self.transactionStore.create(identifier)
        params = {constants.CILOGON_SUCCESS_URI : self.getPortalProperties().successUrl(),
                  constants.CILOGON_FAILURE_URI : self.getPortalProperties().failureUrl(),
                  constants.CILOGON_PORTAL_NAME : self.getPortalProperties().portalName()}
        token = OAuthUtilities.getTempCred(self.getPortalProperties(), params = params)

        t.tempCred = token.key
        t.tempCredSS = token.secret
        redirectUrl =  constants.SERVICE_AUTHORIZATION_REQUEST_URL + '?' + constants.OAUTH_TOKEN  + '='  + token.key + '&skin=OOI'
        logging.info('redirect = ' + redirectUrl)
        t.redirect = redirectUrl
        t.save()
        return redirectUrl

    def getCredential(self, identifier):
        t = self.transactionStore.load(identifier)
         #FIXME if this transaction is not complete, raise an error. Add other errors as needed.
        if t.complete is not True:
            raise Exception("Error, the transaction is still pending.")
        return Credential(t.certificate, t.privateKey)

    # Removes the transaction (and its credential). Use this when you no longer need the
    # credential.
    def removeTransaction(self, identifier):
        if self.transactionStore.hasTransaction(identifier):
            t = self.transactionStore.load(identifier)
            self.transactionStore.remove(t)

class Credential(object):
    certificate = None
    privateKey = None

    def __init__(self, certificate=None, privateKey=None):
        self.certificate = certificate
        self.privateKey = privateKey
