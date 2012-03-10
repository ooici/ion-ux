from rdflib import URIRef
from rdflib import RDF
from rdflib import Literal
from rdflib import ConjunctiveGraph as Graph
import vocabulary

class RDFUtil(object):
    filename = None
    graph = None
    def __init__(self, filename=None):
        self.filename = filename
        if filename is not None:
            self.loadGraph()

    def getGraph(self):
        if(self.graph == None):
            self.graph = Graph()
        return self.graph

    def loadGraph(self):
         self.getGraph().parse(self.filename)

    def save(self, file=None):
        x = file
        if x is None:
            x = self.filename
        self.getGraph().serialize(x)


    def addTriple(self, subject, predicate, object):
        self.getGraph().add((subject, predicate, object))
     # Return a thing containing the root node. If a subject is supplied, use that.
     # otherwise look for a node of the correct type. If exactly one is found, use that
     # otherwise, if none is found, return None. Multiple roots raises and exceptiion
    def getRoot(self, subj = None):
        if(subj == None):
            x = self.getGraph().subjects(predicate=RDF.type, object=vocabulary.ROOT_TYPE)
            try:
                subj = x.next()
            except StopIteration:
                return None
            if(sum(1 for e in x) != 0):
                raise Exception('error -- multiple roots found in configuration')
        return Thing(graph=self.graph, subject=subj)

    def getTable(self, subj=None):
        return Table(graph=self.getGraph(), subject = subj)

class Thing(object):
    graph = None
    subject=None
    def __init__(self, graph=None, subject=None):
        self.graph = graph
        self.subject =subject

    def getSubject(self):
        return self.subject

    def hasValue(self, predicate=None):
        try:
            self.graph.objects(subject=self.subject, predicate=predicate).next()
        except StopIteration:
            return False
        else:
            return True

    def getValues(self, predicate=None):
        try:
            return self.graph.objects(subject=self.subject, predicate=predicate)
        except StopIteration:
            return None

    # Sort of a save. does everything since there is really no session state except the graph
    def save(self):
        self.graph.commit()

    def getValue(self, predicate):
        try:
            return self.graph.objects(subject=self.subject, predicate=predicate).next()
        except StopIteration:
            return None

    # Sets the single-value for this predicate. This will remove all other values first,
        # so that at the end of this call, it will be single-valued.
    def setValue(self, predicate=None, value=None):
        self.remove(predicate)
        self.graph.add((self.subject, predicate, Literal(value)))

    def setThing(self, predicate=None, value=None):
        self.remove(predicate)
        self.graph.add((self.subject, predicate, value.getSubject()))

    def remove(self, predicate):
        self.graph.remove((self.subject, predicate, None))

    # Determines if this thing has the given rdf type.
    def isA(self, rdfType=None):
        v = self.getValues(predicate=RDF.type);
        if(v == None):
            return False
        for type in v:
            if(type == rdfType):
                return True
        return False


    def addType(self, rdfType):
        self.addValue(RDF.type, rdfType)
        #self.graph.add((self.getSubject(), RDF.type, rdfType))

    def addValue(self, predicate, value):
        self.graph.add((self.getSubject(), predicate, value))

    #Converts the value to a python value. You actually have to know it is a string first!
    def getString(self, predicate):
        return self.getValue(predicate).toPython()

    def getThing(self, predicate):
        return Thing(self.graph, self.getValue(predicate))

    def getThings(self):
        subjects = self.getValues()
        things = []
        for r in subjects:
            things.append(Thing(self.graph, r))
        return things

class Table(Thing):
    columns = {} # A dictionary

    def getColumns(self):
        if(not self.columns):
            subjects = self.getValues(predicate=vocabulary.SQL_HAS_COLUMN)
            for r in subjects:
                 t = self.getThing(r)
                 self.columns[t.getString(predicate=vocabulary.SQL_COLUMN_UID)] = t
        return self.columns;

    def getColumn(self, uid):
        return self.getColumns()(uid)

    def getColumnName(self, uid):
        self.getColumn(uid).getString(vocabulary.SQL_COLUMN_NAME)