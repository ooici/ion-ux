from rdflib import URIRef
from rdflib import Literal
from rdflib import RDF
from rdflib import RDFS
from rdfUtil import RDFUtil
import vocabulary as VV

from baseConfigure import BaseConfigure

# A utility to write a portal's configuration file.
# This gives the option of configuring with in-memory or with a file-backed store.
# For postgres support, use PGConfigure instead.
# There is not an edit feature. This will only write a completely new config file.

class configure(BaseConfigure):
    def __init__(self):
        return

    def doConfig(self):
        (root, rdfutil, configFile) = super(configure, self).doConfig()
        if(root.hasValue(VV.HAS_STORE)):
            # get the store
            store = root.getThing(VV.HAS_STORE)
        else:
            choice = self.select('select the type of store', ['Memory', 'File'])
            rdfutil.addTriple(root.getSubject(), VV.HAS_STORE, VV.uriRef())
            store = root.getThing(VV.HAS_STORE)
            if(choice == 0):
                # do memory
                store.addType(VV.MEMORY_STORE_TYPE)
            elif (choice == 1):
                # do file
                store.addType(VV.FILE_STORE_TYPE)
                store.setValue(VV.FILE_DATA_PATH, self.my_input("set the path for store data"))
                store.setValue(VV.FILE_INDEX_PATH, self.my_input("set the path for the store index"))

        rdfutil.save(configFile)
        print('done!')

cfg = configure()
cfg.doConfig()