#!/usr/bin/env python

try:
    from setuptools import setup, find_packages
except ImportError:
    from distutils.core import setup

import os
import sys

# Add /usr/local/include to the path for macs, fixes easy_install for several packages (like gevent and pyyaml)
if sys.platform == 'darwin':
    os.environ['C_INCLUDE_PATH'] = '/usr/local/include'

setup(name='ion-ux',
      description='OOI ION UX',
      url='https://github.com/ooici/ion-ux',
      download_url='http://sddevrepo.oceanobservatories.org/releases/',
      license='Apache 2.0',
      packages=find_packages(),
      dependency_links=[
          'http://sddevrepo.oceanobservatories.org/releases/',
      ],
      test_suite='pyon',
      install_requires=[
          'Flask==0.9',
          'Jinja2>=2.7',
          'nose',
          'requests',
          'fabric'
      ]
)
