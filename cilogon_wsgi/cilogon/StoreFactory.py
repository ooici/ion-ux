from storage import BaseStoreFactory
import vocabulary as VV
from storage import FileStore,MemoryStore
from Properties import PropertiesImporter

class StoreFactory(BaseStoreFactory):
    def __init__(self, configFile=None, propertiesImporter=None):
        if propertiesImporter is not None:
            self.propertiesImporter(p=propertiesImporter)
            return
        self.__configFile = configFile
        if self.__configFile is not None:
           x = PropertiesImporter(configFile=self.__configFile)
           self.propertiesImporter(p = x)
        return

    def createStore(self):
        if super(StoreFactory, self).createStore() is not None:
            return super(StoreFactory, self).createStore()
        pp = self.propertiesImporter() # increase readability a bit

        # No other store set up. Grab the configuration, check for postgres.
        root = pp.getRDFUtil().getRoot()
        storeConfig = root.getThing(predicate=VV.HAS_STORE)

        if(storeConfig.isA(VV.POSTGRES_STORE_TYPE)):
            from PGTransactionStore import PGTransactionStore
            self.store(newStore=PGTransactionStore(dbprops=pp.getDatabaseProperties(storeConfig = storeConfig)))
        elif storeConfig.isA(VV.FILE_STORE_TYPE):
            self.store(newStore=FileStore(storeConfig.getString(VV.FILE_DATA_PATH), storeConfig.getString(VV.FILE_INDEX_PATH)))
        elif storeConfig.isA(VV.MEMORY_STORE_TYPE):
            self.store(newStore=MemoryStore())
        else:
            raise Exception('ERROR no store found!')
        return self.store()




