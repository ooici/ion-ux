#!/usr/bin/env python

from __future__ import with_statement
from fabric.api import *
import getpass
import os
import re
import time

web_host = None
web_port = None
extract_dir = None
deploy_dir = None
gateway_host = None
gateway_port = None
ssh_user = None

def setup_env():
    global web_host
    if not web_host:
        web_host = prompt('Fully qualified web application host name: ', default='ux.oceanobservatories.org')
    print "Deploy hostname: ", web_host

    global web_port
    if not web_port:
        web_port = prompt('Web service port: ', default=3000)
    print "Deploy web service port:: ", web_port

    global extract_dir
    if not extract_dir:
        extract_dir = prompt('Temporary extract dir on web host: ', default='/tmp/ux')

    global deploy_dir
    if not deploy_dir:
        deploy_dir = prompt('Root deploy dir on web host: ', default='/www/ux')
    print "deploy directory: " + deploy_dir

    global gateway_host
    if not gateway_host:
        gateway_host = prompt('Service Gateway Service hostname: ', default='sg.a.oceanobservatories.org')
    print "Deploy service gateway hostname: ", gateway_host

    global gateway_port
    if not gateway_port:
        gateway_port = prompt('Service Gateway Service port: ', default=5000)
    print "Deploy service gateway port: ", gateway_port

    global ssh_user
    if not ssh_user:
        ssh_user = prompt('User login on web application host: ', default=getpass.getuser())

    env.user = ssh_user
    env.hosts = [web_host]

# Work around for fab issue where it doesn't seem to properly utilize the env.hosts value
# Pass one of these method names on the command line to properly set up the env so
# fabric doesn't prompt you of for a host name.
# e.g. fab ux_test deploy_ux_test
def ux_test():
    global web_host
    web_host = 'ux-test.oceanobservatories.org'

    global ssh_user
    if not ssh_user:
        ssh_user = prompt('User login on web application host: ', default=getpass.getuser())

    env.user = ssh_user
    env.hosts = ['ux-test.oceanobservatories.org']

# See comment above
# eg. fab ux_stage deploy_ux_stage
def ux_stage():
    global web_host
    web_host = 'r2-ux-stage.oceanobservatories.org'

    global gateway_host
    gateway_host = 'sg.b.oceanobservatories.org'

    global ssh_user
    if not ssh_user:
        ssh_user = prompt('User login on web application host: ', default=getpass.getuser())

    env.user = ssh_user
    env.hosts = ['r2-ux-stage.oceanobservatories.org']

# See comment above
# eg. fab ux_dev deploy_ux_dev
def ux_dev():
    global web_host
    web_host = 'ux-dev.oceanobservatories.org'

    global ssh_user
    if not ssh_user:
        ssh_user = prompt('User login on web application host: ', default=getpass.getuser())

    env.user = ssh_user
    env.hosts = ['ux-dev.oceanobservatories.org']

def restart_apache():
    setup_env()
    run('sudo /etc/init.d/httpd restart')
    print 'Restarting Apache...'
    time.sleep(4);

# Sets up CILogon portal config values and then tars up the portal
def config_cilogon():
    setup_env()

    portal_root = deploy_dir + '/cilogon-wsgi/'

    wsgi_portal = 'wsgi-portal'

    # Remove any existing config file
    # This is configuration for the python code that interacts with the SGS
    local('rm -f cilogon-wsgi/wsgi-portal/portal.wsgi')
    o = open('cilogon-wsgi/wsgi-portal/portal.wsgi', 'w')
    cilogon_cfg = open('cilogon-wsgi/wsgi-portal/portal.wsgi.template').read()
    o.write( re.sub('FLASK_HOST_VALUE', web_host, cilogon_cfg) )
    o.close()

    ready_url = 'https://' + web_host + '/login/ready'
    failure_url = 'https://' + web_host + '/login/failure'
    success_url = 'https://' + web_host + '/login/success'

    local('rm -f cilogon-wsgi/cilogon/cfg.rdf')
    o = open('cilogon-wsgi/cilogon/cfg.rdf', 'w')
    cfgrdf_cfg = open('cilogon-wsgi/cilogon/cfg.rdf.template').read()
    cfgrdf_cfg = re.sub('READY', ready_url, cfgrdf_cfg)
    cfgrdf_cfg = re.sub('FAILURE', failure_url, cfgrdf_cfg)
    o.write( re.sub('SUCCESS', success_url, cfgrdf_cfg) )
    o.close()

    # Remove tar file
    with settings(warn_only=True):
        local('rm cilogon.tar')

    # create source distribution as tarball
    local('tar -cf cilogon.tar -X cilogontarexcludes.txt cilogon-wsgi')

# Call the config method and then scp, untar and install the CILogon portal software
def deploy_cilogon():
    config_cilogon()

    # Remove/recreate web app extract and install dirs
    run('sudo rm -rf %s' % extract_dir)
    with settings(warn_only=True):
        run('mkdir %s' % extract_dir)
    with settings(warn_only=True):
        sudo('rm -rf %s' % deploy_dir, shell=False)
    with settings(warn_only=True):
        sudo('mkdir %s' % deploy_dir, shell=False)

    put('cilogon.tar', '%s/cilogon.tar' % extract_dir)
    sudo('tar -xf %s/cilogon.tar -C %s' % (extract_dir, deploy_dir), shell=False)
    sudo('mkdir %s/cilogon-wsgi/temp' % deploy_dir, shell=False)
    sudo('mkdir %s/cilogon-wsgi/temp/data' % deploy_dir, shell=False)
    sudo('mkdir %s/cilogon-wsgi/temp/lookup' % deploy_dir, shell=False)
    sudo('chgrp -R root %s' % deploy_dir, shell=False)
    sudo('chown -R root %s' % deploy_dir, shell=False)
    sudo('chmod -R 777 %s/cilogon-wsgi/temp' % deploy_dir, shell=False)

# Sets up core flask app config values and then tars it
secret_key = None
def config_flask():
    setup_env()

    global secret_key
    if not secret_key:
        secret_key = prompt('Enter a session encryption secret key to be used between browser and flask app: ')
   
    # Remove any existing ion-ux.html file
    #local('rm -f templates/ion-ux.html')
    ion_ux_cfg = open('templates/ion_ux.html').read()
    o = open('templates/ion_ux.html', 'w')
    o.write( re.sub('FLASK_HOST_VALUE', web_host, ion_ux_cfg) )
    o.close()

    # Remove any existing config file
    local('rm -f config.py')
    o = open('config.py', 'w')
    flask_cfg = open('config.py.template').read()
    flask_cfg = re.sub('FLASK_HOST_VALUE', web_host, flask_cfg)
    flask_cfg = re.sub('FLASK_PORT_VALUE', str(web_port), flask_cfg)
    flask_cfg = re.sub('SECRET_KEY_VALUE', secret_key, flask_cfg)
    flask_cfg = re.sub('GATEWAY_HOST_VALUE', gateway_host, flask_cfg)
    o.write( re.sub('GATEWAY_PORT_VALUE', str(gateway_port), flask_cfg) )
    o.close()

    # Remove any existing wsgi file and re-copy from template
    local('rm -f ion-ux.wsgi')
    o = open('ion-ux.wsgi', 'w')
    wsgi_config = open('ion-ux.wsgi.template').read()
    o.write( re.sub('DEPLOY_DIR_VALUE', deploy_dir + '/flask', wsgi_config) )
    o.close()

    # Remove tar file
    with settings(warn_only=True):
        local('rm ux.tar')

    # create source distribution as tarball
    local('tar -cf ux.tar -X uitarexcludes.txt *')

# Call the config method and then scp, untar and install the core flask software
def deploy_ui():
    config_flask()

    flask_root = deploy_dir + '/flask'

    # Remove/recreate web app extract and install dirs
    run('rm -rf %s' % extract_dir)
    with settings(warn_only=True):
        run('mkdir  %s' % extract_dir)
    with settings(warn_only=True):
        sudo('rm -rf %s' % flask_root, shell=False)
    with settings(warn_only=True):
        sudo('mkdir  %s' % deploy_dir, shell=False)
    with settings(warn_only=True):
        sudo('mkdir  %s' % flask_root, shell=False)

    put('ux.tar', '%s/ux.tar' % extract_dir)
    sudo('tar -xf %s/ux.tar -C %s' % (extract_dir, deploy_dir + '/flask'), shell=False)
    sudo('mkdir %s/public' % deploy_dir, shell=False)
    sudo('mkdir %s/logs' % deploy_dir, shell=False)
    sudo('chgrp -R root %s' % deploy_dir, shell=False)
    sudo('chown -R root %s' % deploy_dir, shell=False)

# This is just for testing...
def deploy_test():
    global web_host
    global web_port
    global gateway_host
    global gateway_port
    global extract_dir
    global deploy_dir

    web_host='ux-test.oceanobservatories.org'
    web_port=3000
    gateway_port=5000
    extract_dir='/tmp/ux'
    deploy_dir='/www/test'

    deploy_cilogon()
    deploy_ui()
    restart_apache()
# Helper methods that just set all the default values for you.  Use as follows:
#  > fab ux_test deploy_ux_test
def deploy_ux_test():
    global web_host
    global web_port
    global gateway_host
    global gateway_port
    global extract_dir
    global deploy_dir
    web_host='ux-test.oceanobservatories.org'
    web_port=3000
    gateway_port=5000
    extract_dir='/tmp/ux'
    deploy_dir='/www/ux'

    deploy_cilogon()
    deploy_ui()
    restart_apache()

# Helper methods that just set all the default values for you.  Use as follows:
#  > fab ux_stage deploy_ux_stage
def deploy_ux_stage():
    global web_host
    global web_port
    global gateway_host
    global gateway_port
    global extract_dir
    global deploy_dir
    web_host='r2-ux-stage.oceanobservatories.org'
    web_port=3000
    gateway_port=5000
    extract_dir='/tmp/ux'
    deploy_dir='/www/ux'

    deploy_cilogon()
    deploy_ui()
    restart_apache()

# Use as follows:
#  > fab ux_dev deploy_ux_dev
def deploy_ux_dev():
    global web_host
    global web_port
    global gateway_host
    global gateway_port
    global extract_dir
    global deploy_dir
    web_host='ux-dev.oceanobservatories.org'
    web_port=3000
    gateway_port=5000
    extract_dir='/tmp/ux'
    deploy_dir='/www/ux'

    deploy_cilogon()
    deploy_ui()
    restart_apache()
