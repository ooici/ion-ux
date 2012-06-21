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

def json_layout_tree():
    layout_schema = LAYOUT_SCHEMA

    view_id = [view for view in layout_schema['UIResourceType'] if view.endswith('2050001')][0]
    view_obj = layout_schema['objects'][view_id]
    blocks_objs = layout_schema['associated_from'][view_id]
    
    json_layout = {view_id: []}
    
    for block in blocks_objs:
        group_id = layout_schema['associated_from'][block[1]][0][1]
        group_obj = layout_schema['objects'][group_id]

        json_layout[view_id].append({'group_id': group_obj['uirefid'], 'blocks': []})
        
        for group_index, group in enumerate(json_layout[view_id]):
            if group_obj['uirefid'] == group['group_id']:
                json_layout[view_id][group_index]['blocks'].append('yo!')
                
        
        # get screen labels
        
        # group_dict = {'group_id': group_obj['uirefid'], 'blocks': []}
        # group_dict['blocks'].append({})
        
        
        # json_layout[view_id][group_id]['blocks'].append({'block_id': block['_id'], 'attributes': []})
        
    return json_layout
        
        

if __name__ == '__main__':
    print json_layout_tree()