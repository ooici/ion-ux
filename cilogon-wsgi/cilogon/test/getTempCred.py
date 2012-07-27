import sys
import storage
import tempfile
import CILogonService
import random
import os.path

# FIXME Review this test to see if anything is useful, then delete it.
homeDir = os.path.expanduser('~')
user_cert = homeDir + '/.globus/usercert.pem'
user_key = homeDir + '/.globus/userkey.pem'
x = raw_input('enter path to the cert (' + user_cert + '):')
if x != None:
    user_cert = x
x = raw_input('enter path to the key (' + user_key + '):')
if x != None:
    user_key = x
x = tempfile.mkdtemp(suffix='-test', prefix='pstore-', dir=tempfile.gettempdir())
fileStore = storage.FileStore(x)
print('\nmade the file store at ' + x)
try:
    cil = CILogonService.CILogonService(success='https://merge.ncsa.uiuc.edu/portal/success',
                                        failure='https://merge.ncsa.uiuc.edu/portal/failure',
                                        portalName='Sample Portal',
                                        transactionStore=fileStore)
    id = 'fake identifier' + str(random.random()*10000)
    print('https://cilogon.org' + ci.requestCredential(id))
except Exception, e:
    print('\nerror: ' + str(e))
