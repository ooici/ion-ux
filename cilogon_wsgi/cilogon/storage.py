# Basic class for storage.
# from AdminClient import AdminClient
import shutil

class TransactionStore(object):
    # load by the identifier
    def load(self, identifier):
        raise NotImplementedError

    # Either create the transaction if it does not exist or update it if it does.
    def save(self, transaction):
        raise NotImplementedError

    #Update an existing transaction. This should fail if the transaction does not exist.
    def update(self, transaction):
        raise NotImplementedError

    # returns a logical value of true if a transaction with the given identifier exists in this store.
    def hasTransaction(self, identifier):
        raise NotImplementedError

    def loadByTempCred(self, tempCred):
        raise NotImplementedError

    def loadByVerifier(self, verifier):
        raise NotImplementedError

    def loadByAccessToken(self, accessToken):
        raise NotImplementedError

    # Make a new transaction and put it into the store. This returns the transaction.
    def create(self, identifier):
        raise NotImplementedError

    # Remove the given transaction. At the end of this call, the transaction is not
    # in the store. If it was not initially there, there is no error raised. (You can
    # always issue hasTransaction if you need to check.)
    def remove(self, transaction):
        raise NotImplementedError;

    # A store is not guaranteed to be usable before an open is issued.
    # For some stores (e.g. in memory) this has no effect
    def open(self):
        return

    # This allows the store to do any clean up (e.g. release connections). After a call to close, the store is not
    # guaranteed to work or accept any operations (though it might).
    def close(self):
        return

    # This resets the store to its initial state, just after creation. This might just clear out old entries
    # or even recreate it the store. It is the state of the store after this call that is point.

    def initialize(self):
        return

    # This destroys the store. All entries and structures (e.g. tables and indices) are removed. Destroy is a one-time
    # operation. The store may or may not be usable afterwards (e.g. if an in-memory store, it might be, if a database
    # certainly not.
    def destroy(self):
        return

class PortalTransaction(object):
    identifier = None
    tempCred = None
    tempCredSS = None
    accessToken = None
    accessTokenSS = None
    verifier = None
    redirect = None
    certificate = None
    privateKey = None
    transactionStore = None
    complete = False
    def __init__(self, transactionStore=None, identifier=None):
        self.transactionStore= transactionStore
        self.identifier=identifier

    def __unicode__(self):
        return u'%s %s' % (self.identifier, self.tempCred)

    def save(self):
        self.transactionStore.save(self)

    def __ne__(self, t):
         return not self.__eq__(t)

    def __eq__(self, t):
        if t == None:
            return False
        else:
            return (t.identifier == self.identifier and
                t.tempCred == self.tempCred and
                t.tempCredSS == self.tempCredSS and
                t.accessToken == self.accessToken and
                t.accessTokenSS == self.accessTokenSS and
                t.verifier == self.verifier and
                t.complete == self.complete)

            
# A very simple in memory store. This is for quick prototyping/testing only.

class MemoryStore(TransactionStore):
    store = None # just a dictionary to store the transactions by identifier
    lookup = None # This has tempcred, accesstoken and verifier as keys pointing to the identifier
    def __init__(self):
        # nix to do, really, just set up the dictionaries that hold this
        self.store = {}
        self.lookup = {}

    def load(self, identifier):
        return self.store[identifier]

    # Either create the transaction if it does not exist or update it if it does.
    def save(self, transaction):
        self.store[transaction.identifier] = transaction
        if (transaction.tempCred != None):
            self.lookup[str(transaction.tempCred)] = transaction
        if (transaction.accessToken != None):
            self.lookup[str(transaction.accessToken)] = transaction
        if (transaction.verifier!= None):
            self.lookup[str(transaction.verifier)] = transaction

    #Update an existing transaction. This should fail if the transaction does not exist.
    def update(self, transaction):
        if(self.hasTransaction(transaction.identifier)):
            return
        raise Exception    

    # returns a logical value of true if a transaction with the given identifier exists in this store.
    def hasTransaction(self, identifier):
        #return self.store.has_key(identifier)
        return identifier in self.store

    def loadByTempCred(self, tempCred):
        return self.lookup[str(tempCred)]

    def loadByVerifier(self, verifier):
        return self.lookup[str(verifier)]

    def loadByAccessToken(self, accessToken):
        return self.lookup[str(accessToken)]

    # Make a new transaction and put it into the store. This returns the transaction.
    def create(self, identifier):
        pt = PortalTransaction(transactionStore=self, identifier=identifier)
        self.save(pt)
        return pt

    def remove(self, transaction):
        if(transaction.tempCred != None):
            del self.lookup[str(transaction.tempCred)]
        if(transaction.accessToken != None):
            del self.lookup[str(transaction.accessToken)]
        if(transaction.verifier != None):
            del self.lookup[str(transaction.verifier)]
        del self.store[transaction.identifier]    

    def initialize(self):
        self.store = {}
        self.lookup = {}
        return

    def destroy(self):
        self.store = {}
        self.lookup = {}
        return


import hashlib
import os.path
import os
import os.path
import pickle

class FileStore(TransactionStore):
    baseDirectory = None
    dataDirectory = None
    indexDirectory= None
    # Create a file store. You may do this by either
    # (a) specifying a base directory and letting the store make the corresponding data and lookup directories or
    # (b) explicitly specifying the data and lookup directories. Specifying the base directory has right of way.
    def __init__(self, baseDirectory=None, dataDirectory=None, indexDirectory=None):
        if(baseDirectory != None):
            self.baseDirectory = baseDirectory
            self.dataDirectory = baseDirectory + os.sep + 'data'
            self.indexDirectory= baseDirectory + os.sep + 'index'
        else:
            self.dataDirectory = str(dataDirectory)
            self.indexDirectory= str(indexDirectory)
        # Check to see if this exists and create it if need be.
        admin = FileStoreAdminClient(dataDirectory, indexDirectory)
        if not admin.exists():
            admin.create()


    def toHexString(self, stringThing):
        return hashlib.sha1(stringThing).hexdigest()

    def create(self, identifier):
        t = PortalTransaction(identifier=identifier)
        t.transactionStore = self
        t.save()
        return t;

    def _saveLookup(self, key, value):
        fileName = self.toHexString( key)
        logging.info('FileStore, saving to ' + str(self.indexDirectory+ os.sep + fileName))
        f = open(self.indexDirectory+ os.sep + fileName, 'w')
        pickle.dump(value, f)
        f.close()

    def _dataFileName(self, x):
        return self.dataDirectory + os.sep + self.toHexString(x)


    def _lookupFileName(self, x):
        return self.indexDirectory+ os.sep + self.toHexString(x)

    def save(self, transaction):
        try:
           f = open(self._dataFileName(transaction.identifier) , 'w')
           pickle.dump(transaction, f)
           f.close()
        except IOError:
           print "woops! that didn't work. Error opening file " + (self.dataDirectory + os.sep + self.toHexString(transaction.identifier))
        if(transaction.tempCred != None):
            self._saveLookup(transaction.tempCred, transaction.identifier)
        if(transaction.accessToken != None):
            self._saveLookup(transaction.accessToken, transaction.identifier)
        if(transaction.verifier != None):
            self._saveLookup(transaction.verifier, transaction.identifier)

    def hasTransaction(self, identifier):
        # FIXME This should check if the file exists. This is just a placeholder.
         fileName = self._dataFileName(identifier)
         return os.path.exists(fileName)
         # return self.load(identifier) != None

    def load(self, identifier):
        f = open(self._dataFileName(identifier), 'r')
        transaction = pickle.load(f)
        f.close()
        return transaction

    def _loadByLookup(self, lookup):
        f = open(self._lookupFileName(lookup), 'r')
        identifier = pickle.load(f)
        f.close()
        transaction = self.load(identifier)
        return transaction

    def loadByTempCred(self, tempCred):
        return self._loadByLookup(tempCred)
    # FIXME This should check afterwards that the verifier was actually used. As it stands now there is no
    # checking, so passing, e.g. a tempCred to this method (or any save load() will find something.
    def loadByVerifier(self, verifier):
        return self._loadByLookup(verifier)

    def loadByAccessToken(self, accessToken):
        return self._loadByLookup(accessToken)

    def remove(self, transaction):
        os.remove(self._dataFileName(transaction.identifier))
        if(transaction.tempCred != None):
            os.remove(self._lookupFileName(transaction.tempCred))
        if(transaction.verifier != None):
            os.remove(self._lookupFileName(transaction.verifier))
        if(transaction.accessToken != None):
            os.remove(self._lookupFileName(transaction.accessToken))


from AdminClient import AdminClient
class FileStoreAdminClient(AdminClient):
    dataDirectory = None
    indexDirectory = None
    def __init__(self, dataDirectory, indexDirectory):
            self.dataDirectory = str(dataDirectory)
            self.indexDirectory = str(indexDirectory)

    def isInitialized(self):
        return os.listdir(self.dataDirectory)=="" and os.listdir(self.indexDirectory) == ""

    def exists(self):
        return os.path.exists(self.dataDirectory) and os.path.exists(self.indexDirectory)

    def initialize(self):
        self.destroy()
        self.create()

    def destroy(self):
        if os.path.exists(self.dataDirectory):
            shutil.rmtree(self.dataDirectory)
        if os.path.exists(self.indexDirectory):
            shutil.rmtree(self.indexDirectory)

    def create(self):
        if not os.path.exists(self.dataDirectory):
            os.makedirs(self.dataDirectory)
        if not os.path.exists(self.indexDirectory):
            os.makedirs(self.indexDirectory)



    # The base class for all store factories.
from Properties import PropertiesImporter
import vocabulary
import simpleLogging
import logging

class BaseStoreFactory(object):
    __configFile = None
    __propertiesImporter = None
    __store = None
    def store(self, newStore=None):
        if newStore is not None:
            self.__store = newStore
        return self.__store    

    # Control flow is thus: Either give the config file which will create the properties importer
    # or pass in the properties importer itself. This checks the properties importer first
    # and if present, ignores the config file
    def __init__(self, configFile=None, propertiesImporter=None):
        if propertiesImporter is not None:
            self.__propertiesImporter = propertiesImporter
            return
        self.__configFile = configFile
        if self.__configFile is not None:
           self.__propertiesImporter = PropertiesImporter(configFile=self.__configFile)
        return

    def propertiesImporter(self, p=None):
        if p is not None:
            self.__propertiesImporter = p
        return self.__propertiesImporter

    # Create the store. The base implementation supports memory and file stores. If these are not found
    # a None is returned. Overriding classes should invoke this then add checks for any other stores.
    def createStore(self):
        if(self.store() != None):
            return self.store()
        pp = self.propertiesImporter()
        root = pp.getRDFUtil().getRoot()
        logging.info('got root = ' + str(root))
        storeConfig = root.getThing(predicate=vocabulary.HAS_STORE)

        if(storeConfig.isA(vocabulary.MEMORY_STORE_TYPE)):
            self.store(MemoryStore())
        elif(storeConfig.isA(vocabulary.FILE_STORE_TYPE)):
            logging.info('getting file store, data path = ' + storeConfig.getString(vocabulary.FILE_DATA_PATH) + ', and lookup = ' + storeConfig.getString(vocabulary.FILE_INDEX_PATH))
            self.store(FileStore(dataDirectory=storeConfig.getString(vocabulary.FILE_DATA_PATH), indexDirectory=storeConfig.getString(vocabulary.FILE_INDEX_PATH)))
        return self.store()