class PortalProperties(object):
    CALLBACK_URL = 'https://sample.portal.org/ready.py'
    SUCCESS_URL = 'http://sample.portal.org/success.py'
    FAILURE_URL = 'http://sample.portal.org/failure'
    PORTAL_NAME = 'Sample portal'
    TEMPORARY_DIRECTORY = '/path/to/temp/dir'
    CERT_REQ_CONFIGURATION = 'cert-request.cfg'
    HOST_CERT = '/etc/grid-security/hostcert.pem'
    HOST_KEY = '/etc/grid-security/hostkey.pem'

    def __init__(self):
         return

    def callbackUrl(self, callback=None):
        if(callback != None):
            self.CALLBACK_URL = callback
        return self.CALLBACK_URL

    def successUrl(self, success=None):
        if(success!=None):
            self.SUCCESS_URL = success
        return self.SUCCESS_URL

    def failureUrl(self, failure=None):
        if(failure!=None):
            self.FAILURE_URL= failure
        return self.FAILURE_URL

    def portalName(self, portalName=None):
        if(portalName!=None):
            self.PORTAL_NAME = portalName
        return self.PORTAL_NAME

    def temporaryDirectory(self, tempDir=None):
        if(tempDir!=None):
            self.TEMPORARY_DIRECTORY= tempDir
        return self.TEMPORARY_DIRECTORY
    def certRequestConfiguration(self, certReqConfig = None):
        if certReqConfig is not None:
            self.CERT_REQ_CONFIGURATION = certReqConfig
        return self.CERT_REQ_CONFIGURATION

    def hostCert(self, hostcert=None):
        if(hostcert is not None):
            self.HOST_CERT= hostcert
        return self.HOST_CERT

    def hostKey(self, hostkey =None):
        if(hostkey is not None):
            self.HOST_KEY = hostkey
        return self.HOST_KEY


from rdfUtil import RDFUtil
# Convenience class. This imports/exports from a store thing to a database properties object
# set either the rdf util or the config file. If you set the config file, it will be
# parsed and used to create the rdf util.
class ThingImporter(object):
    __configFile = None
    __rdfutil = None

    def __init__(self, configFile=None, rdfUtil=None):
         if rdfUtil is None:
             self.__configFile= configFile
         else:
             self.__rdfutil = rdfUtil

    def configFile(self,config=None):
        if self.__configFile is None:
            self.__configFile = config
        return self.__configFile

    def getRDFUtil(self):
        if self.__rdfutil is None:
            self.__rdfutil = RDFUtil(self.configFile())
        return self.__rdfutil



# A convenience class to organize the tablenames and such for database access.
class DatabaseProperties(object):
    def __init__(self, filename=None):
        return

    # Properties relating to the database itself
    DATABASE_NAME='csd'
    PREFIX='portal'
    SCHEMA='cilogon_portal'
    TABLENAME='transactions'

    #Connection properties for the user
    PORT=5432
    USERNAME='cilogon'
    PASSWORD='changeme'
    HOST='localhost'

    # Connection properties for the administator.
    ADMIN_PORT = 5432
    ADMIN_USERNAME = 'cilogon_admin'
    ADMIN_PASSWORD = 'changeme2'
    ADMIN_HOST='localhost'

    #Properties naming the colums of the database.
    TEMP_CRED='temp_cred'
    ACCESS_TOKEN='access_token'
    VERIFIER='verifier'
    TEMP_CRED_SS='temp_cred_ss'
    ACCESS_TOKEN_SS='access_token_ss'
    UID='transaction_uid'
    PRIVATE_KEY='private_key'
    CERTIFICATE='certificate'
    REDIRECT_URL = 'redirect_uri'
    COMPLETE='complete'

    def tablename(self, tname=None):
        if(tname != None):
            self.TABLENAME = tname
        return self.qualify(self.TABLENAME)

    # Used when you need the un-qualified tablename. Normally you just
    # need to call tablename()
    def rawTablename(self, tname=None):
        if(tname != None):
            self.TABLENAME = tname
        return self.TABLENAME

    def tablenamePrefix(self, prefix=None):
        if(prefix != None):
            self.PREFIX = prefix
        return self.PREFIX

    def schema(self, schm=None):
        if(schm != None):
            self.SCHEMA = schm
        return self.SCHEMA

    def port(self, port = None):
        if(port != None):
            self.PORT = port
        return self.PORT

    def password(self, pwd=None):
        if(pwd != None):
            self.PASSWORD = pwd
        return self.PASSWORD

    def username(self, uname=None):
        if(uname !=  None):
            self.USERNAME = uname
        return self.USERNAME

    def host(self, h=None):
        if(h !=  None):
            self.HOST= h
        return self.HOST

    def adminPort(self, port = None):
        if(port != None):
            self.ADMIN_PORT = port
        return self.ADMIN_PORT

    def adminPassword(self, pwd=None):
        if(pwd != None):
            self.ADMIN_PASSWORD = pwd
        return self.ADMIN_PASSWORD

    def adminUsername(self, uname=None):
        if(uname !=  None):
            self.ADMIN_USERNAME = uname
        return self.ADMIN_USERNAME

    def adminHost(self, ahost=None):
        if(ahost !=  None):
            self.ADMIN_HOST = ahost
        return self.ADMIN_HOST


    def databaseName(self, dbname = None):
        if(dbname != None):
            self.DATABASE_NAME = dbname
        return self.DATABASE_NAME

    def qualify(self, name):
        return self.schema() + "." + self.tablenamePrefix() + '_' + name

    # What follows are the names of the columns in the database that store the given information.
    def tempCred(self, tc=None):
        if(tc != None):
            self.TEMP_CRED = tc
        return self.TEMP_CRED

    def tempCredSS(self, tcss = None):
        if(tcss != None):
            self.TEMP_CRED_SS = tcss
        return self.TEMP_CRED_SS

    def accessToken(self, at = None):
        if(at != None):
            self.ACCESS_TOKEN = at
        return self.ACCESS_TOKEN

    def accessTokenSS(self, atss = None):
        if(atss!= None):
            self.ACCESS_TOKEN_SS = atss
        return self.ACCESS_TOKEN_SS

    def verifier(self, ver = None):
        if(ver != None):
            self.VERIFIER = ver
        return self.VERIFIER

    def uid(self, uid = None):
        if(uid != None):
            self.UID = uid;
        return self.UID

    def complete(self, complete = None):
        if(complete != None):
            self.COMPLETE = complete
        return self.COMPLETE


    def redirectUri(self, redir = None):
        if(redir != None):
            self.REDIRECT_URL = redir
        return self.REDIRECT_URL

    def certificate(self, cert = None):
        if(cert != None):
            self.CERTIFICATE = cert
        return self.CERTIFICATE

    def privateKey(self, pkey = None):
        if(pkey != None):
            self.PRIVATE_KEY = pkey
        return self.PRIVATE_KEY


import vocabulary as VV

# Object that imports the configuration to a portal properties object, which is configuration neutral.
# You may supply a configuration file (in rdf-xml format) or a configured rdf util object.

class PropertiesImporter(ThingImporter):
    __portalProperties = None
    __databaseProperties = None

    def _writeNonDefaultValue(thing, predicate, value, default):
        if default == value:
            return
        thing.setValue(predicate, value)
    # Write, i.e. serialize the database properties object to a store. This centralizes
    # all the work with the vocabulary. This sets the current database properties object
    # as well.
    def writeDatabaseProperties(self, databaseProperties = None, storeConfig = None):
        print 'PropertiesImporter, getting ready to write database properties'

        if databaseProperties is not None:
           print 'SETTING database properties'
           self.__databaseProperties = databaseProperties
        if(storeConfig == None):
           root = self.getRDFUtil().getRoot()
           storeConfig = root.getThing(predicate=VV.HAS_STORE)
           print 'Store subject = ' +str(storeConfig.getSubject())
           # If we still don't have one, something is wrong.
           if(storeConfig == None):
               raise Exception('Error: no store')
        p = self.__databaseProperties # for readability
        database = storeConfig.getThing(predicate=VV.HAS_DATABASE)
        defaults = DatabaseProperties()
        # get the transaction table
        tt = database.getThing(VV.HAS_TRANSACTION_TABLE)
        #tt= self.getRDFUtil().getTable(database.getValue(VV.HAS_TRANSACTION_TABLE))
        connection = storeConfig.getThing(VV.HAS_CONNECTION)
        adminConnection = storeConfig.getThing(VV.HAS_ADMIN_CONNECTION)

        #self._writeNonDefaultValue(database, VV.SQL_DATABASE_NAME, p.databaseName, defaults.databaseName())
        print 'setting database name'
        database.setValue(VV.SQL_DATABASE_NAME, p.databaseName())
        tt.setValue(VV.SQL_TABLE_NAME, p.rawTablename())
        tt.setValue(VV.SQL_TABLE_PREFIX, p.tablenamePrefix())
        database.setValue(VV.SQL_DATABASE_SCHEMA, p.schema())

        # connection information for the user
        connection.setValue(VV.CONNECTION_PORT, p.port())
        connection.setValue(VV.CONNECTION_PASSWORD, p.password())
        connection.setValue(VV.CONNECTION_USERNAME,p.username())
        connection.setValue(VV.CONNECTION_HOST, p.host())

        # connection information for the administrator
        adminConnection.setValue(VV.CONNECTION_ADMIN_PORT, p.adminPort())
        adminConnection.setValue(VV.CONNECTION_ADMIN_PASSWORD,p.adminPassword())
        adminConnection.setValue(VV.CONNECTION_ADMIN_USERNAME,p.adminUsername())
        adminConnection.setValue(VV.CONNECTION_ADMIN_HOST,p.adminHost())
        # Finally, any custom columns.
        tt.setValue(VV.TRANSACTION_TABLE_COLUMN_TEMP_CRED,p.tempCred())
        tt.setValue(VV.TRANSACTION_TABLE_COLUMN_TEMP_CRED_SS,p.tempCredSS())
        tt.setValue(VV.TRANSACTION_TABLE_COLUMN_ACCESS_TOKEN,p.accessToken())
        tt.setValue(VV.TRANSACTION_TABLE_COLUMN_ACCESS_TOKEN_SS,p.accessTokenSS())
        tt.setValue(VV.TRANSACTION_TABLE_COLUMN_VERIFIER,p.verifier())
        tt.setValue(VV.TRANSACTION_TABLE_COLUMN_IDENTIFIER,p.uid())
        tt.setValue(VV.TRANSACTION_TABLE_COLUMN_COMPLETE,p.complete())
        tt.setValue(VV.TRANSACTION_TABLE_COLUMN_REDIRECT_URI,p.redirectUri())
        tt.setValue(VV.TRANSACTION_TABLE_COLUMN_CERTIFICATE,p.certificate())
        tt.setValue(VV.TRANSACTION_TABLE_COLUMN_PRIVATE_KEY,p.privateKey())
        self.getRDFUtil().save()



    # If the store configuration is not set, this will try to determine it from the root.
    # That should work just fine and you generally only need to specify the root in exceptional
    # circumstances, e.g., testing a new configuration.
    def getDatabaseProperties(self, storeConfig = None):
        if self.__databaseProperties is not None:
           return self.__databaseProperties
        if(storeConfig == None):
           root = self.getRDFUtil().getRoot()
           storeConfig = root.getThing(VV.HAS_STORE)
           # If we still don't have one, something is wrong.
           if(storeConfig == None):
               raise Exception('Error: no store')
        database = storeConfig.getThing(VV.HAS_DATABASE);
        # get the transaction table
        tt= self.getRDFUtil().getTable(database.getValue(VV.HAS_TRANSACTION_TABLE))
        connection = storeConfig.getThing(VV.HAS_CONNECTION)
        adminConnection = storeConfig.getThing(VV.HAS_ADMIN_CONNECTION)

        p = DatabaseProperties()

        # Now that we have the information read in and parsed, start setting properties
        # database and table specific properties
        p.databaseName(database.getValue(VV.SQL_DATABASE_NAME))
        p.tablename(tt.getValue(VV.SQL_TABLE_NAME))
        p.tablenamePrefix(tt.getValue(VV.SQL_TABLE_PREFIX))
        p.schema(database.getValue(VV.SQL_DATABASE_SCHEMA))

        # connection information for the user
        p.port(connection.getValue(VV.CONNECTION_PORT))
        p.password(connection.getValue(VV.CONNECTION_PASSWORD))
        p.username(connection.getValue(VV.CONNECTION_USERNAME))
        p.host(connection.getValue(VV.CONNECTION_HOST))

        # connection information for the administrator
        p.adminPort(adminConnection.getValue(VV.CONNECTION_ADMIN_PORT))
        p.adminPassword(adminConnection.getValue(VV.CONNECTION_ADMIN_PASSWORD))
        p.adminUsername(adminConnection.getValue(VV.CONNECTION_ADMIN_USERNAME))
        p.adminHost(adminConnection.getValue(VV.CONNECTION_ADMIN_HOST))
        # Finally, any custom columns.
        p.tempCred(tt.getValue(VV.TRANSACTION_TABLE_COLUMN_TEMP_CRED))
        p.tempCredSS(tt.getValue(VV.TRANSACTION_TABLE_COLUMN_TEMP_CRED_SS))
        p.accessToken(tt.getValue(VV.TRANSACTION_TABLE_COLUMN_ACCESS_TOKEN))
        p.accessTokenSS(tt.getValue(VV.TRANSACTION_TABLE_COLUMN_ACCESS_TOKEN_SS))
        p.verifier(tt.getValue(VV.TRANSACTION_TABLE_COLUMN_VERIFIER))
        p.uid(tt.getValue(VV.TRANSACTION_TABLE_COLUMN_IDENTIFIER))
        p.complete(tt.getValue(VV.TRANSACTION_TABLE_COLUMN_COMPLETE))
        p.redirectUri(tt.getValue(VV.TRANSACTION_TABLE_COLUMN_REDIRECT_URI))
        p.certificate(tt.getValue(VV.TRANSACTION_TABLE_COLUMN_CERTIFICATE))
        p.privateKey(tt.getValue(VV.TRANSACTION_TABLE_COLUMN_PRIVATE_KEY))
        __databaseProperties = p
        return __databaseProperties

    # Get the properties for a portal. You may supply the root Thing of a configuration if
    # you want to. If no root is designated, this will try to get it from the configuration
    # file or rdfutil supplied.
    def getPortalProperties(self, rootConfig=None):
        if self.__portalProperties is None:
           if rootConfig is None:
               rootConfig = self.getRDFUtil().getRoot()
           # If we still don't have one, something is wrong.
           if(rootConfig == None):
               raise Exception('Error: no root found')

           pcfg = rootConfig.getThing(predicate=VV.HAS_PORTAL_PARAMETERS)

           p = PortalProperties()
           p.callbackUrl(pcfg.getValue(VV.PORTAL_CALLBACK_URI))
           p.successUrl(pcfg.getValue(VV.PORTAL_SUCCESS_URI))
           p.failureUrl(pcfg.getValue(VV.PORTAL_FAILURE_URI))
           p.portalName(pcfg.getValue(VV.PORTAL_NAME))
           p.temporaryDirectory(pcfg.getValue(VV.PORTAL_TEMPORARY_DIRECTORY))
           p.certRequestConfiguration(pcfg.getValue(VV.PORTAL_CERT_REQ_CONFIGURATION))
           # In the vocabulary, the SSL configuration is stored in a separate object, so we get it
           sslConfig = rootConfig.getThing(predicate=VV.HAS_SSL_CONFIGURATION)
           p.hostKey(sslConfig.getValue(VV.SSL_HOST_KEY))
           p.hostCert(sslConfig.getValue(VV.SSL_HOST_CERT))
           self.__portalProperties = p
        return self.__portalProperties

    def writePortalProperties(self, portalProperties=None, rootConfig=None):
        if portalProperties is not None:
           self.__portalProperties = portalProperties
        if rootConfig is None:
           rootConfig = self.getRDFUtil().getRoot()
           # If we still don't have one, something is wrong.
           if(rootConfig == None):
                raise Exception('Error: no root found')

           pcfg = rootConfig.getThing(predicate=VV.HAS_PORTAL_PARAMETERS)

           p = self.__portalProperties # keep it readable
           pcfg.setValue(VV.PORTAL_CALLBACK_URI,p.callbackUrl())
           pcfg.setValue(VV.PORTAL_SUCCESS_URI,p.successUrl())
           pcfg.setValue(VV.PORTAL_FAILURE_URI,p.failureUrl())
           pcfg.setValue(VV.PORTAL_NAME,p.portalName())
           pcfg.setValue(VV.PORTAL_TEMPORARY_DIRECTORY,p.temporaryDirectory())
           pcfg.setValue(VV.PORTAL_CERT_REQ_CONFIGURATION,p.certRequestConfiguration())
           # In the vocabulary, the SSL configuration is stored in a separate object, so we get it
           sslConfig = rootConfig.getThing(predicate=VV.HAS_SSL_CONFIGURATION)
           sslConfig.setValue(VV.SSL_HOST_KEY,p.hostKey())
           sslConfig.setValue(VV.SSL_HOST_CERT,p.hostCert())


