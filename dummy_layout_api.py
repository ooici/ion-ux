import os.path
import sys
import cStringIO
import xml.etree.cElementTree as ET
import HTMLParser
import json

from collections import defaultdict
from jinja2 import Template
from jinja2 import FileSystemLoader
from jinja2.environment import Environment

from dummy_data_layout import LAYOUT_SCHEMA
from layout_api import LayoutApi as LayoutApiOG

class LayoutApi(object):
    
    @staticmethod
    def get_layout_schema():
        return LAYOUT_SCHEMA
    
    @staticmethod    
    def build_partials(layout_schema=None):
        return LayoutApiOG.build_partials(layout_schema=LAYOUT_SCHEMA)
