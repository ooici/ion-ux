#import sys
# sys.path.insert(0, '/home/ncsa/dev/csd/cilogon/service/python/cilogon')
import storage

import random
import storage
import unittest
import tempfile
import os
from PGTransactionStore import PGTransactionStore
from StoreFactory import StoreFactory

class TestSequenceFunctions(unittest.TestCase):

    head = 'urn:test/foo/'
    tail = '/' + str(1000*random.random())

    def test_fileStore(self):
        x = tempfile.mkdtemp(suffix='-test', prefix='pstore-', dir=tempfile.gettempdir())
        fileStore = storage.FileStore(x)
        self._doTest(fileStore)

    def test_memoryStore(self):
        store = storage.MemoryStore()
        self._doTest(store)
        
    def _makeToken(self, label):
         return self.head + label + self.tail

    def _doTest(self, store):
        uid = self._makeToken('identifier')
        # check creation semantics
        t = store.create(uid)
        self.assertTrue(store.hasTransaction(t.identifier))

        # check usage works = set some properties, save, set some more, save...
        t.tempCred=self._makeToken('tempCred')
        t.tempCredSS=self._makeToken('tempCredSS')
        t.save()
        t2 = store.loadByTempCred(t.tempCred)
        self.assertTrue(t == t2)

        t.verifier=self._makeToken('verifier')
        t.save()
        t2 = store.loadByVerifier(t.verifier)
        self.assertTrue(t == t2)

        t.accessToken=self._makeToken('accessToken/')
        t.accessTokenSS=self._makeToken('accessTokenSS/')
        t.save()
        t2 = store.loadByAccessToken(t.accessToken)
        self.assertTrue(t == t2)

        t.complete = True
        t.credential = 'mairzy doats and does eat stoats and liddle lambsie-divey'
        t.save()

        t2 = store.load(uid)
        self.assertTrue(t == t2)

        store.remove(t)
        self.assertFalse(store.hasTransaction(t.identifier))        

    def test_pgStore(self):

        sf = StoreFactory(configFile='/tmp/portal.xml')
        pgStore = sf.createStore()
        self._doTest(pgStore)

if __name__ == '__main__':
    unittest.main()

