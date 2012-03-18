#!/usr/bin/env python

from __future__ import with_statement
from fabric.api import *
import os
import re
import time

web_host = None
def config_cilogon():
    global web_host
    if not web_host:
        web_host = prompt('Fully qualified web application host: ', default='ux.oceanobservatories.org')

    cilogon_cfg = open('cilogon_wsgi/cilogon/cfg.rdf', 'w')

    ready_url = 'https://' + web_host + '/cilogon/ready'
    failure_url = 'https://' + web_host + '/cilogon/failure'
    success_url = 'https://' + web_host + '/cilogon/success'

    cilogon_cfg = re.sub('READY', ready_url, cilogon_cfg)
    cilogon_cfg = re.sub('FAILURE', failure_url, cilogon_cfg)
    cilogon_cfg = re.sub('SUCCESS', success_url, cilogon_cfg)

    cilogon_cfg.close()

web_port = None
secret_key = None
deploy_dir = None
gateway_host = None
gateway_port = None
def config_flask():
    global web_host
    if not web_host:
        web_host = prompt('Web service host: ', default='localhost')

    global web_port
    if not web_port:
        web_port = prompt('Web service port: ', default=3000)

    global secret_key
    if not secret_key:
        secret_key = prompt('Session encryption secret key: ')

    global deploy_dir
    if not deploy_dir:
        deploy_dir = prompt('Deploy dir on web host: ', default='/www/ux/flask')

    global gateway_host
    if not gateway_host:
        gateway_host = prompt('Gateway service host: ', default='localhost')

    global gateway_port
    if not gateway_port:
        gateway_port = prompt('Gateway service port: ', default=5000)

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
    o.write( re.sub('DEPLOY_DIR_VALUE', deploy_dir, wsgi_config) )
    o.close()

def deploy_flask_local():
    local('python main.py')

ssh_user = None
extract_dir = None
def deploy_flask_remote():
    global web_host
    if not web_host:
        web_host = prompt('Web service host: ', default='ux.oceanobservatories.org')

    global ssh_user
    if ssh_user is None:
        ssh_user = os.getlogin()
        ssh_user = prompt('ssh login name:', default=ssh_user)

    global extract_dir
    if not extract_dir:
        extract_dir = prompt('Temporary extract dir on web host: ', default='/tmp/ux')

    global deploy_dir
    if not deploy_dir:
        deploy_dir = prompt('Deploy dir on web host: ', default='/www/ux/flask')

    # create source distribution as tarball
    local('tar -cf ux.tar -X tarexcludes.txt *')

    # Stop apache
#    run('sudo su root && apachectl stop')
#    print 'Waiting for Apache to fully stop'
#    time.sleep(10);

    env.user = ssh_user
    env.hosts = [web_host]

    # Remove/recreate web app extract and install dirs
    run('rm -rf %s' % extract_dir)
    run('mkdir  %s' % extract_dir)
    run('rm -rf %s/*' % deploy_dir)
#    run('mkdir %s' % deploy_dir)

    put('ux.tar', '%s/ux.tar' % extract_dir)
    run('cd %s && tar -xf %s/ux.tar' % (deploy_dir, extract_dir))

    # Start apache
#    run('apachectl start')

    # Remove tar file
    local('rm ux.tar')

def deploy_lca():
    global web_host
    global web_port
    global gateway_host
    global gateway_port
    global extract_dir
    global deploy_dir
    web_host='ux.oceanobservatories.org'
    web_port=3000
    gateway_host='r2-dev1.oceanobservatories.org'
    gateway_port=5000
    extract_dir='/tmp/ux'
    deploy_dir='/www/ux/flask'

    config_flask()
    deploy_flask_remote()
