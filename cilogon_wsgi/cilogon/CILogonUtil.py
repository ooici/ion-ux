# A singleton factory for getting the portal properties, store and cilogon service. Generally
# # you will only need to call getCILogonService for most needs.
# If you do not configure this it will attempt to load the properties found in the environment variable
# named constants.PORTAL_CONFIG_FILE
from Properties import PropertiesImporter
import Properties as Properties
import os
import constants
import StoreFactory
import simpleLogging
import logging
from os import sep


__propertyImporter = None
__pp = None

# Internal method to setup the property importer. You should set the environmental variable named in
# constants.PORTAL_CONFIG_FILE
def _propertyImporter(pImporter=None):
    logging.info('getting property importer, value = ' + str(pImporter))
    global __propertyImporter
    if pImporter is not None:
        __propertyImporter = pImporter
    elif __propertyImporter is None:
        logging.info('loading default config file')
        #__propertyImporter = PropertiesImporter(configFile='/var/www/config/portal.xml')
        # NOTE that under mod_python the current directory is always set to "/"
        #XXX __propertyImporter = PropertiesImporter(configFile='..' + sep + 'cilogon' + sep + 'cfg.rdf')
	cfg_path = "/www/ux/cilogon-wsgi/cilogon/cfg.rdf" #XXX hardcoded XXX
        __propertyImporter = PropertiesImporter(configFile=cfg_path)
    return __propertyImporter

# Get/set the portal properties
def portalProperties(portalProperties=None):
    global __pp
    if portalProperties is not None:
        __pp = portalProperties
    elif __pp is None:
        __pp = _propertyImporter().getPortalProperties()
    return __pp

__storeFactory = None
def _storeFactory(storeFactory=None):
    global __storeFactory
    # use the one supplied
    if storeFactory is not None:
        __storeFactory = storeFactory
    # if all else fails, try to create one
    elif __storeFactory is None:
        __storeFactory = StoreFactory.StoreFactory(propertiesImporter=_propertyImporter())
    return __storeFactory

__store = None
# Get/set the store.
def store():
    global __store
    if __store is None:
        logging.info('CREATING a new Store')
        __store = _storeFactory().createStore()
    return __store

__cil = None
def getCILogonService():
    global __cil
    if __cil is None:
        __cil = CILogonService(portalProperties(), store())
    return __cil
