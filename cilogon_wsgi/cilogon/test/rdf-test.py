import sys
from StoreFactory import StoreFactory

sf = StoreFactory(configFile='/tmp/portal.xml')
db = sf.getDatabaseProperties()
print "database name = " + db.databaseName()
