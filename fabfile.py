#!/usr/bin/env python

from __future__ import with_statement
from fabric.api import *
import getpass
import os
import re
import time
from os.path import join
from random import choice
import string

class Deploy:
    def __init__(self):
        pass

    def config_cilogon(self):
        # Create portal.wsgi file from template
        wsgi_file = join(self.local_dir,'cilogon-wsgi/wsgi-portal/portal.wsgi')
        local('rm -f ' + wsgi_file)
        o = open(wsgi_file, 'w')

        cilogon_cfg = open(join(self.local_dir,'cilogon-wsgi/wsgi-portal/portal.wsgi.template')).read()
        o.write( re.sub('FLASK_HOST_VALUE', self.web_host, cilogon_cfg) )
        o.close()

        # Create Cilogon config file from template
        ready_url = 'https://' + self.web_host + '/login/ready'
        failure_url = 'https://' + self.web_host + '/login/failure'
        success_url = 'https://' + self.web_host + '/login/success'
        local('rm -f ' + join(self.local_dir,'cilogon-wsgi/cilogon/cfg.rdf'))
        o = open(join(self.local_dir,'cilogon-wsgi/cilogon/cfg.rdf'), 'w')
        cfgrdf_cfg = open(join(self.local_dir,'cilogon-wsgi/cilogon/cfg.rdf.template')).read()
        cfgrdf_cfg = re.sub('READY', ready_url, cfgrdf_cfg)
        cfgrdf_cfg = re.sub('FAILURE', failure_url, cfgrdf_cfg)
        o.write( re.sub('SUCCESS', success_url, cfgrdf_cfg) )
        o.close()
        # Remove tar file
        with settings(warn_only=True):
            local('rm ' + join(self.local_dir,'cilogon.tar'))

        # create source distribution as tarball
        local('tar -cf %s -X %s %s' % (join(self.local_dir,'cilogon.tar'),  join(self.local_dir,'cilogontarexcludes.txt'), join(self.local_dir, 'cilogon-wsgi')))


    def deploy_cilogon(self):
        print("Executing on %s as %s" % (env.host, env.user))
        # Remove/recreate web app extract and install dirs
        run('sudo rm -rf %s' % self.remote_extract_dir)
        with settings(warn_only=True):
            run('mkdir %s' % self.remote_extract_dir)
        with settings(warn_only=True):
            sudo('rm -rf %s' % self.remote_deploy_dir, shell=False)
        with settings(warn_only=True):
            sudo('mkdir %s' % self.remote_deploy_dir, shell=False)


        put('cilogon.tar', '%s/cilogon.tar' % self.remote_extract_dir)
        sudo('tar -xf %s/cilogon.tar -C %s' % (self.remote_extract_dir, self.remote_deploy_dir), shell=False)
        sudo('mkdir %s/cilogon-wsgi/temp' % self.remote_deploy_dir, shell=False)
        sudo('mkdir %s/cilogon-wsgi/temp/data' % self.remote_deploy_dir, shell=False)
        sudo('mkdir %s/cilogon-wsgi/temp/lookup' % self.remote_deploy_dir, shell=False)
        sudo('chgrp -R root %s' % self.remote_deploy_dir, shell=False)
        sudo('chown -R root %s' % self.remote_deploy_dir, shell=False)
        sudo('chmod -R 777 %s/cilogon-wsgi/temp' % self.remote_deploy_dir, shell=False)

    def config_flask(self):
        # Create config.py file from template
        config_file = join(self.local_dir, 'config.py')
        local('rm -f ' + config_file)
        o = open(config_file, 'w')
        flask_cfg = open(join(self.local_dir, 'config.py.template')).read()
        flask_cfg = re.sub('FLASK_HOST_VALUE', self.web_host, flask_cfg)
        flask_cfg = re.sub('FLASK_PORT_VALUE', str(self.web_port), flask_cfg)
        flask_cfg = re.sub('SECRET_KEY_VALUE', self.secret_key, flask_cfg)
        flask_cfg = re.sub('GATEWAY_HOST_VALUE', self.gateway_host, flask_cfg)
        o.write( re.sub('GATEWAY_PORT_VALUE', str(self.gateway_port), flask_cfg) )
        o.close()

        # Remove any existing wsgi file and re-copy from template
        ion_ux_file = join(self.local_dir, 'ion-ux.wsgi')
        local('rm -f ' + ion_ux_file)
        o = open(ion_ux_file, 'w')
        wsgi_config = open(join(self.local_dir, 'ion-ux.wsgi.template')).read()
        o.write(re.sub('DEPLOY_DIR_VALUE', join(self.remote_deploy_dir, self.remote_relative_flask_dir), wsgi_config))
        o.close()

        # Remove tar file
        with settings(warn_only=True):
            local('rm ux.tar')
        # create source distribution as tarball
        local('tar -cf ux.tar -X uitarexcludes.txt *')

    def deploy_ui(self):
        flask_root = join(self.remote_deploy_dir, self.remote_relative_flask_dir)
        # Remove/recreate web app extract and install dirs
        run('rm -rf %s' % self.remote_extract_dir)
        with settings(warn_only=True):
            run('mkdir  %s' % self.remote_extract_dir)
        # Remove/recreate deploy and flask dir
        with settings(warn_only=True):
            sudo('rm -rf %s' % flask_root, shell=False)
        with settings(warn_only=True):
            sudo('mkdir  %s' % self.remote_deploy_dir, shell=False)
        with settings(warn_only=True):
            sudo('mkdir  %s' % flask_root, shell=False)
        # Deploy
        put('ux.tar', '%s/ux.tar' % self.remote_extract_dir)
        sudo('tar -xf %s/ux.tar -C %s' % (self.remote_extract_dir, flask_root), shell=False)
        sudo('mkdir %s/public' % self.remote_deploy_dir, shell=False)
        sudo('mkdir %s/logs' % self.remote_deploy_dir, shell=False)
        sudo('chgrp -R root %s' % self.remote_deploy_dir, shell=False)
        sudo('chown -R root %s' % self.remote_deploy_dir, shell=False)

    def deploy(self, ssh_user, web_host, web_port=3000, remote_extract_dir='/tmp/ux', remote_deploy_dir='/www/ux', remote_relative_flask_dir='flask',
               gateway_host='sg.a.oceanobservatories.org', gateway_port=5000, secret_key=None):
        self.web_host = web_host
        self.web_port = web_port
        self.remote_extract_dir = remote_extract_dir
        self.remote_deploy_dir = remote_deploy_dir
        self.remote_relative_flask_dir = remote_relative_flask_dir
        self.gateway_host = gateway_host
        self.gateway_port = gateway_port
        self.ssh_user = ssh_user
        self.secret_key = secret_key or self.generate_random_string()

        self.local_dir = "."
        self.clone_dir = join(self.local_dir, 'tmp_clone')
        self.git_project_url = 'git@github.com:ooici/ion-ux.git'

        global env
        env.host_string= web_host
        env.user = ssh_user

        self.clone()
        self.config_cilogon()
        self.deploy_cilogon()
        self.config_flask()
        self.deploy_ui()
        self.restart_apache()

    def restart_apache(self):
        run('sudo /etc/init.d/httpd restart')
        print 'Restarting Apache...'
        time.sleep(4);

    def generate_random_string(self,size=32):
        chars=string.ascii_uppercase + string.ascii_lowercase + string.digits
        return ''.join(choice(chars) for x in range(size))

    def clone(self):
        local('rm -rf ' + self.clone_dir)
        local('mkdir  ' + self.clone_dir)
        local('git clone %s %s' % (self.git_project_url, self.clone_dir))

        print 'Below is a list of release tags available for deploying:'
        os.chdir(self.clone_dir)
        default_tag_version = local('git tag|sort -n|tail -1', capture=True)
        no_tag = 'no tag - get the latest'
        default_tag_version = no_tag
        local('git tag | sort -r' )
        tag_version = prompt('Please enter release tag you want to deploy based on list above:',
            default=default_tag_version)
        if tag_version != no_tag:
            print '\nUsing git tag version: ', tag_version
            local('git checkout %s' % tag_version)
        else:
            print '\nNot using git tag. Deploying the latest\n'


env.roledefs = {
    'ux_dev': ['ux-dev.oceanobservatories.org'],
    'ux_test': ['ux-test.oceanobservatories.org'],
}


host = None
gateway_host = None

def ux_dev():
    global host
    host = 'ux-dev.oceanobservatories.org'

def ux_test():
    global host
    host = 'ux-test.oceanobservatories.org'

def ux_stage():
    global host
    host = 'r2-ux-stage.oceanobservatories.org'

def gateway_sg():
    global gateway_host;
    gateway_host = 'sg.a.oceanobservatories.org'

def deploy():
    global host, gateway_host
    web_host = host or prompt('Web application hostname: ', default='ux-test.oceanobservatories.org')
    ssh_user = prompt('Username for remote host: ', default=getpass.getuser())
    gateway_host= gateway_host or prompt('Service Gateway Service hostname: ', default='sg.a.oceanobservatories.org')
    deploy = Deploy()

    deploy.deploy(ssh_user=ssh_user, web_host=web_host, gateway_host=gateway_host)
