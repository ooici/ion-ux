# This class is a Postgresql based implementation of the transaction store.
# It resides in a separate file so that portals do not need to install postgres drivers
# unless they specifically import this.

from storage import TransactionStore
from storage import PortalTransaction
from Properties import DatabaseProperties

import psycopg2
import psycopg2.extras



class PGTransactionStore(TransactionStore):
# load by the identifier
    props = None
    connection = None
    def __init__(self, dbprops = None):
            self.props = dbprops
            connectString = ("dbname='" + dbprops.databaseName() +
                "' user='" + dbprops.username() +
                "' host='"+ dbprops.host() +
                "' password='" + dbprops.password() +
                "' sslmode=require")
            #print 'PGTRANS STORE connect string = ' + connectString
            try:
                self.connection = psycopg2.connect(connectString);
            except:
                print "unable to connect to the database"

    def _populateTransaction(self, row):
        portalTransaction = PortalTransaction(transactionStore=self)
        portalTransaction.identifier = row[self.props.uid()]
        portalTransaction.tempCred = row[self.props.tempCred()]
        portalTransaction.tempCredSS = row[self.props.tempCredSS()]
        portalTransaction.accessToken = row[self.props.accessToken()]
        portalTransaction.accessTokenSS = row[self.props.accessTokenSS()]
        portalTransaction.verifier = row[self.props.verifier()]
        portalTransaction.redirect = row[self.props.redirectUri()]
        portalTransaction.certificate = row[self.props.certificate()]
        portalTransaction.privateKey = row[self.props.privateKey()]
        portalTransaction.complete = row[self.props.complete()]
        return portalTransaction

    def load(self, identifier):
        return self._loadByIdentifier(identifier, self.props.uid())

    def save(self, transaction):
        if self.hasTransaction(transaction.identifier):
            self.update(transaction)
        else:
            self.create(transaction.identifier)

    def remove(self, transaction):
        dict = {'identifier' : transaction.identifier}
        sql = 'DELETE FROM ' + self.props.tablename() + ' WHERE ' + self.props.uid() + ' = %(identifier)s'
        cur = self.connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute(sql, dict)
        cur.close()

    def hasTransaction(self, identifier):
        return self.load(identifier) != None

    def _loadByIdentifier(self, id, idColumn):
        cur = self.connection.cursor(cursor_factory=psycopg2.extras.DictCursor)

        dict = {"identifier" : id}
        #sql = 'SELECT * FROM ' + self.props.tablename() + ' WHERE ' + idColumn + ' = \'' + id + '\''
        sql = 'SELECT * FROM ' + self.props.tablename() + ' WHERE ' + idColumn + ' = %(identifier)s'
        cur.execute(sql, dict)
        rows = cur.fetchall()
        t= None
        for row in rows:
           t = self._populateTransaction(row)
        cur.close()
        return t

    def loadByTempCred(self, tempCred):
        return self._loadByIdentifier(tempCred, self.props.tempCred())


    def loadByVerifier(self, verifier):
        return self._loadByIdentifier(verifier, self.props.verifier())

    def loadByAccessToken(self, accessToken):
        return self._loadByIdentifier(accessToken, self.props.accessToken())

    def _createTransaction(self, transaction):
        dict = {"identifier" : transaction.identifier,"complete" : False}

        sql = ('INSERT INTO ' + self.props.tablename() + ' (' +
            self.props.uid() + ', ' +
        self.props.complete()  + ') VALUES (%(identifier)s, %(complete)s' + ')')
        cur = self.connection.cursor()
        cur.execute(sql, dict)
        self.connection.commit()
        cur.close()

    def update(self, transaction):
        dict = {"uid" : transaction.identifier,
                "tempCred" : transaction.tempCred,
                "tempCredSS" : transaction.tempCredSS,
                "accessToken": transaction.accessToken,
                "accessTokenSS" : transaction.accessTokenSS,
                "verifier" : transaction.verifier,
                "complete" : transaction.complete,
                "redirectUri" : transaction.redirect,
                "certificate" : transaction.certificate,
                "privateKey" : transaction.privateKey,
        }

        sql = ('UPDATE ' + self.props.tablename() + ' SET ' +
            self.props.tempCred()  + '=%(tempCred)s, ' +
            self.props.tempCredSS() + '=%(tempCredSS)s, ' +
            self.props.accessToken() + '=%(accessToken)s, ' +
            self.props.accessTokenSS() + '=%(accessTokenSS)s, ' +
            self.props.verifier() + '=%(verifier)s, ' +
            self.props.complete() + '=%(complete)s, ' +
            self.props.redirectUri() + '=%(redirectUri)s, ' +
            self.props.certificate() + '=%(certificate)s, ' +
            self.props.privateKey() + '=%(privateKey)s'
            ' WHERE ' + self.props.uid() + ' = %(uid)s')
        cur = self.connection.cursor()
        cur.execute(sql, dict)
        self.connection.commit()
        cur.close()

    def create(self, identifier):
        pt = PortalTransaction(transactionStore=self, identifier=identifier)
        self._createTransaction(pt)
        return pt

#    def destroy(self):
#        cur = self.connection.cursor()
#        cur.execute('drop schema ' + self.props.schema() + ' cascade'); # blow it all away.
#
#    def initialize(self):
#        cur = self.connection.cursor()
#        cur.execute('create schema ' + self.props.schema());
#        cur.execute('set search_path to ' + self.props.schema());
#        s.executeUpdate("GRANT ALL PRIVILEGES ON TABLE " + getPortalTransactionTable().getTablename() + " TO " + getUser());

from AdminClient import AdminClient

class PGAdmin(AdminClient):
# load by the identifier
    props = None
    connection = None
    def __init__(self, dbprops = None):
            self.props = dbprops
            connectString = ("dbname='" + dbprops.databaseName() +
                "' user='" + dbprops.adminUsername() +
                "' host='"+ dbprops.adminHost() +
                "' password='" + dbprops.adminPassword() +
                "' sslmode=require")
            try:
                self.connection = psycopg2.connect(connectString);
            except:
                print "unable to connect to the database"


    def destroy(self):
        cur = self.connection.cursor()
        cur.execute('drop schema ' + self.props.schema() + ' cascade'); # blow it all away.

    def create(self):
        cur = self.connection.cursor()
        x = self.props # cut down on verbosity
        cur.execute('create schema ' + x.schema());
        cur.execute('set search_path to ' + x.schema());
        columns = (x.uid() + " text PRIMARY KEY,\n " +
                   x.tempCred() + " text,\n " +
                   x.tempCredSS() + " text,\n " +
                   x.accessToken() + " text,\n " +
                   x.accessTokenSS() + " text,\n " +
                   x.verifier() + " text,\n " +
                   x.complete() + " boolean,\n " +
                   x.privateKey() + " bytea, " +
                   x.certificate() + " text, " +
                   x.redirectUri() + " text ")
        createString = "CREATE TABLE " + self.props.tablename() + "(" + columns + ")"
        print'\ncreate string = ' + createString
        cur.execute(createString);
        cur.execute("GRANT ALL PRIVILEGES ON TABLE " + x.tablename() + " TO " + x.username())
        self.connection.commit()
        cur.close()

    def exists(self):
        super(PGAdmin, self).exists()

    def initialize(self):
        self.destroy()
        self.create()

    def isInitialized(self):
        super(PGAdmin, self).isInitialized()
