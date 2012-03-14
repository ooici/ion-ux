import sys
import urllib
import os.path
from rdflib import URIRef
# from rdflib import Literal
from rdflib import RDF
from rdflib import RDFS
from rdfUtil import RDFUtil
import vocabulary as VV
from Properties import PortalProperties

prompt = ": "
indent = '   '

class BaseConfigure(object):
    def __init__(self):
       return


    # Here's how it works: A default value is supplied. If the user returns that,
    # then a None is returned, indicating that no value should be written to the file.
    # This keeps the configuration file much, much smaller.
    # If the default value is none, then skip testing for it.

    def my_input(self, text, defaultValue = None):
        s = None
        if(defaultValue is None):
            s = text + prompt
        else:
            s = text + '(' + str(defaultValue) + ')' + prompt
        x = raw_input(s)
        if defaultValue is not None:
            if x is defaultValue or x == '':
                return None
        return x


    def select(self, text, textList):
        count = 0
        while True:
            print text
            print('Choose by number from the following list')
            for x in textList:
                print indent + str(count) + '. ' + x
                count = count + 1
            y = raw_input('choice' + prompt)
            try:
                choice = int(y)
                if(0 <= choice and choice < count):
                    return choice
                print('sorry, but your choice of ' + str(choice) + ' is not valid. Please retry')
                count = 0
            except ValueError:
                print('\"' + y + '\" is not a valid integer. Please try again')
                count = 0

    # convenience method. This takes a thing and (single-valued) predicate to set, then it
    # prompts and ONLY if there is a non-default value, it will set it
    def setValue(self, thing, predicate, text, defaultValue):
        x = self.my_input(text, defaultValue)
        if(x is not None):
            thing.setValue(predicate, x)

    # Correctly encode a piece of text as per the uri spec. This means (since python does not
    # treat characters as unicode, but (in pre 3.0 releases) as 8-bit byte strings), the text
    # must be encoded to utf-8 then escaped
    def uriEncode(self, text):
        return urllib.quote(text.encode('utf-8'))

    # A method that does the basic configuration common to all portals. Note that this returns the
    # root of the configuration, the configured RDFUtil and the configuration file.
    # You must explicitly call save at the end of your use to persist the changes. This call
    # persists nothing.
    def doConfig(self, defCfg =os.path.curdir + os.path.sep + 'cfg.rdf'):
        print('Welcome to the NCSA CILogon portal configuration utility, version 0.0.1')
        print('You may exit this at any time by hitting ctrl+C')
        configFile = self.my_input("Enter the file for an existing or new configuration", defaultValue=defCfg)
        # A simple return is supposed to accept the default, so if there is one, (or the user types in the default
        # use that
        if(configFile == None or configFile==''):
            configFile = defCfg

        if os.path.isfile(configFile):
        # load it
            rdfutil = RDFUtil(filename=configFile)
        else:
            rdfutil = RDFUtil()
        root = rdfutil.getRoot()
        # create the root node.
        if root is None:
            d = 'portal configuration'
            x = self.my_input('Enter a name for this configuration', defaultValue=d)
            if(x == None or x == ''):
                # In this case, the user took the default
                x = d
            rootSubject = URIRef(VV.CONFIG_ROOT_NAME + '#' + self.uriEncode(x))
            rdfutil.addTriple(rootSubject,  RDF.type, VV.ROOT_TYPE)
            root = rdfutil.getRoot()
            root.setValue(RDFS.label, x)
        # By this point, there is a store. What we need to do next is configure all the properties that
        # the portal itself needs, such as the callback url, name, etc.
        pp = PortalProperties()

        print('\nNext we need to know where the service host key and cert are located')
        rdfutil.addTriple(root.getSubject(), VV.HAS_SSL_CONFIGURATION, VV.uriRef())
        sslConfig = root.getThing(VV.HAS_SSL_CONFIGURATION)
        sslConfig.addType(VV.SSL_CONFIGURATIION)
        self.setValue(sslConfig, VV.SSL_HOST_KEY, 'host key file name', pp.hostKey())
        self.setValue(sslConfig, VV.SSL_HOST_CERT, 'host cred file name', pp.hostCert())

        print('\nNow come the portal parameters')
        rdfutil.addTriple(root.getSubject(), VV.HAS_PORTAL_PARAMETERS, VV.uriRef())
        portalParameters = root.getThing(VV.HAS_PORTAL_PARAMETERS)
        portalParameters.addType(VV.PORTAL_PARAMETERS)
        self.setValue(portalParameters, VV.PORTAL_CALLBACK_URI, 'the callback url', pp.callbackUrl())
        self.setValue(portalParameters, VV.PORTAL_SUCCESS_URI, 'the success url', pp.successUrl())
        self.setValue(portalParameters, VV.PORTAL_FAILURE_URI, 'the failure url', pp.failureUrl())
        self.setValue(portalParameters, VV.PORTAL_NAME, 'the name of this portal', pp.portalName())
        self.setValue(portalParameters, VV.PORTAL_TEMPORARY_DIRECTORY, 'the path to the temporary directory', pp.temporaryDirectory())
        self.setValue(portalParameters, VV.PORTAL_CERT_REQ_CONFIGURATION, 'the path to the cert request configuration file', pp.certRequestConfiguration())

        return root, rdfutil, configFile
