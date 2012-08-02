from rdflib import URIRef
from rdflib import Literal
from rdflib import RDF
from rdflib import RDFS
from rdfUtil import RDFUtil
import vocabulary as VV
from Properties import DatabaseProperties
from PGAdmin import PGAdmin
from baseConfigure import BaseConfigure

# Utility to write a configuration file with Postgres support. If you want file-based
# persistence, use the configure class instead.
# There is not an edit feature. This will only write a completely new config file.
# This sits in a separate class so that portals which do not have postgres do not
# need to install the drivers for it in order to write their configuration.

class PGConfigure(BaseConfigure):
      def __init__(self):
           return

      def doConfig(self):
           (root, rdfutil, configFile) = super(PGConfigure, self).doConfig()
           if(root.hasValue(VV.HAS_STORE)):
                # get the store
                store = root.getThing(VV.HAS_STORE)
           else:
                # else create it.
                rdfutil.addTriple(root.getSubject(), VV.HAS_STORE, VV.uriRef())
                store = root.getThing(VV.HAS_STORE)

           store.addType(VV.POSTGRES_STORE_TYPE)
           rdfutil.addTriple(store.getSubject(), VV.HAS_DATABASE, VV.uriRef())
           rdfutil.getGraph().commit()
           dbp = DatabaseProperties()
           
           # We'll fill in the database properties as we go so we can use it to initialize the table
           # create the database configuration

           print('\nSetup the Postgres database\n')
           database = store.getThing(VV.HAS_DATABASE)
           self.setValue(database, VV.SQL_DATABASE_NAME, 'database name', dbp.databaseName())
           self.setValue(database, VV.SQL_DATABASE_SCHEMA, 'database schema', dbp.schema())
           if(database.hasValue(VV.SQL_DATABASE_NAME)):
               dbp.databaseName(database.getString(VV.SQL_DATABASE_NAME))
           if(database.hasValue(VV.SQL_DATABASE_SCHEMA)):
               dbp.schema(database.getString(VV.SQL_DATABASE_SCHEMA))

           # create the transaction table cfg
           print('\nNow we need to set up the transaction table')
           rdfutil.addTriple(database.getSubject(), VV.HAS_TRANSACTION_TABLE, VV.uriRef())
           tt = database.getThing(VV.HAS_TRANSACTION_TABLE)
           tt.addType(VV.TRANSACTION_TABLE_TYPE)
           self.setValue(tt, VV.SQL_TABLE_PREFIX, 'table name prefix', dbp.tablenamePrefix())
           if(tt.hasValue(VV.SQL_TABLE_NAME)):
               dbp.tablename(tt.getString(VV.SQL_TABLE_NAME))
           self.setValue(tt, VV.SQL_TABLE_NAME, 'table name', dbp.TABLENAME) # Note this is the raw name, not the qualified one
           if(tt.hasValue(VV.SQL_TABLE_PREFIX)):
               dbp.tablenamePrefix(tt.getString(VV.SQL_TABLE_PREFIX))

           # and the connection information cfg
           print('\nNow we need to set up the connection information for the user account')
           rdfutil.addTriple(store.getSubject(), VV.HAS_CONNECTION, VV.uriRef())
           conn = store.getThing(VV.HAS_CONNECTION)
           conn.addType(VV.SQL_CONNECTION_TYPE)
           self.setValue(conn, VV.CONNECTION_HOST, 'host name', dbp.host())
           if(conn.hasValue(VV.CONNECTION_HOST)):
               dbp.host(conn.getString(VV.CONNECTION_HOST))
           self.setValue(conn, VV.CONNECTION_USERNAME, 'user name', dbp.username())
           if(conn.hasValue(VV.CONNECTION_USERNAME)):
               dbp.username(conn.getString(VV.CONNECTION_USERNAME))
           self.setValue(conn, VV.CONNECTION_PASSWORD, 'password', dbp.password())
           if(conn.hasValue(VV.CONNECTION_PASSWORD)):
               dbp.password(conn.getString(VV.CONNECTION_PASSWORD))
           self.setValue(conn, VV.CONNECTION_PORT, 'port', dbp.port())
           if(conn.hasValue(VV.CONNECTION_PORT)):
               dbp.port(conn.getString(VV.CONNECTION_PORT))

           print('\nNow we need to set up the connection information for the adminstrator account')
           rdfutil.addTriple(store.getSubject(), VV.HAS_ADMIN_CONNECTION, VV.uriRef())
           adminConn = store.getThing(VV.HAS_ADMIN_CONNECTION)
           adminConn.addType(VV.SQL_ADMIN_CONNECTION_TYPE)
           self.setValue(adminConn, VV.CONNECTION_ADMIN_HOST, 'host name', dbp.adminHost())
           if(adminConn.hasValue(VV.CONNECTION_ADMIN_HOST)):
               dbp.adminHost(adminConn.getString(VV.CONNECTION_ADMIN_HOST))
           self.setValue(adminConn, VV.CONNECTION_ADMIN_USERNAME, 'user name', dbp.adminUsername())
           if(adminConn.hasValue(VV.CONNECTION_ADMIN_USERNAME)):
               dbp.adminUsername(adminConn.getString(VV.CONNECTION_ADMIN_USERNAME))
           self.setValue(adminConn, VV.CONNECTION_ADMIN_PASSWORD, 'password', dbp.adminPassword())
           if(adminConn.hasValue(VV.CONNECTION_ADMIN_PASSWORD)):
               dbp.adminPassword(adminConn.getString(VV.CONNECTION_ADMIN_PASSWORD))
           self.setValue(adminConn, VV.CONNECTION_ADMIN_PORT, 'port', dbp.adminPort())
           if(adminConn.hasValue(VV.CONNECTION_ADMIN_PORT)):
               dbp.adminPort(adminConn.getString(VV.CONNECTION_ADMIN_PORT))

           initChoice = self.select('Do you want to initialize the store now?', ['No', 'Yes'])
           if(initChoice == 1):
               pgadmin = PGAdmin(dbp)
               pgadmin.destroy(); # Remove it if it is there
               pgadmin.initialize(); #create it.
               print('\nok')

               
           rdfutil.save(configFile)
           print('done!')


cfg = PGConfigure()
cfg.doConfig()