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

def refresh_dummy_data():
    '''Refresh dummy_data_layout.py with latest schema.'''
    layout_schema = LayoutApiOG.get_layout_schema()
    schema = open('dummy_data_layout.py', 'w')
    schema.write('LAYOUT_SCHEMA = ' + str(layout_schema))
    return True

def build_partials(layout_schema=None):
    env = Environment()
    env.loader = FileSystemLoader('templates')

    tmpl_unparsed = env.get_template('ion-ux.html').render()

    tmpl = ET.fromstring(tmpl_unparsed.encode('utf-8'))
    body_elmt = tmpl.find('body')
    
    if layout_schema is None:
        layout_schema = LayoutApi.get_layout_schema()
    
    # Prepare optimized layout object for Backbone and build the facepage 
    # templates with placeholders for the Backbone sub-templates.    
    # Need to split and use uirefid for view

    old_view_id = [view for view in layout_schema['views'].keys() if view.endswith('2250001')][0]
    view_id = '2250001'

    # VIEW HTML
    script_elmt = ET.Element('script')
    script_elmt.set('id', 'dyn-instrument-facepage-tmpl')
    script_elmt.set('type', 'text/template')

    # VIEW JSON
    json_layout = {view_id: []}

    groups = layout_schema['views'][old_view_id]
    for group_index, group in enumerate(groups):            
        group_id = group[0]
        group_obj = layout_schema['objects'][group_id]
        group_label = layout_schema['objects'][group_obj['screen_label_id']]['text']
    
        # GROUP HTML
        group_elmt = ET.SubElement(script_elmt, 'div')
        group_elmt.set('id', group_obj['uirefid'])
        group_elmt.set('class', 'row')
        group_h2_elmt = ET.SubElement(group_elmt, 'h2')
        group_h2_elmt.text = group_label + ' Group'

        # GROUP JSON
        json_layout[view_id].append({'group_id': group_obj['uirefid'], 'screen_label': group_label, 'blocks': []})
    
        for block_index, block in enumerate(group[1]):
            block_obj = layout_schema['objects'][block[0]]
            block_id = block_obj['_id']
        
            try:
                block_label = layout_schema['objects'][block_obj['screen_label_id']]['text']
            except Exception, e:
                block_label = block_obj['name']
        
            # BLOCK HTML
            block_elmt = ET.SubElement(group_elmt, 'div')
            block_elmt.set('id', block_obj['uirefid'])
            block_h3_elmt = ET.SubElement(block_elmt, 'h3')
            block_h3_elmt.text = block_label
            block_p_elmt = ET.SubElement(block_elmt, 'p')
            # block_p_elmt.text = 'Attributes here.'
        
            # BLOCK JSON            
            associations = layout_schema['associated_to'][block_id]
            block_representation = ''
            if associations:
                for assoc in associations:
                    if assoc[0] == 'hasUIRepresentation':
                        block_representation = layout_schema['objects'][assoc[1]]['name']

            json_layout[view_id][group_index]['blocks'].append({
                'block_id': block_obj['uirefid'],
                'screen_label': block_label,
                'ui_representation': block_representation, 
                'attributes': []
                })

            for attribute_id in block[1]:
                # ATTRIBUTE JSON
                attribute_obj = layout_schema['objects'][attribute_id]
            
                try:
                    attribute_screen_label = layout_schema['objects'][attribute_obj['screen_label_id']]['text']
                except Exception, e:
                    attribute_screen_label = attribute_obj['name']

                try:
                    attribute_level = layout_schema['objects'][attribute_obj['information_level_id']]['level']
                except Exception, e:
                    attribute_level = 'none'

                json_layout[view_id][group_index]['blocks'][block_index]['attributes'].append({
                    'id': attribute_obj['uirefid'],
                    'name': attribute_obj['name'],
                    'screen_label': attribute_screen_label,
                    'level': attribute_level
                    })

    layout_elmt = ET.SubElement(body_elmt, 'script')
    layout_elmt.set('id', 'layout')
    layout_elmt.text = "var LAYOUT_OBJECT = %s;" % json.dumps(json_layout)

    body_elmt.append(script_elmt)

    # init_script_elmt = ET.Element('script')
    # init_script_elmt.set('type', 'text/javascript')
    # init_script_elmt.text = "$(function(){dyn_do_init();});"
    # body_elmt.append(init_script_elmt)

    string_response = cStringIO.StringIO()

    tmpl = ET.tostring(tmpl)
    h = HTMLParser.HTMLParser()
    return h.unescape(tmpl)








# TODO: refactor group dictionary for efficiency
def json_layout_tree():
    layout_schema = LAYOUT_SCHEMA
    layout_objects = LAYOUT_SCHEMA['objects']
    view_groups = LAYOUT_SCHEMA['UIViewGroup']
    
    json_layout = {}
    
    defined_views = ['2050001', '2050002', '2050006'] # Instrument, Platform, Observatory
    
    for defined_view in defined_views:
        # Fetch the view resource
        view_id = [view for view in layout_schema['UIResourceType'] if view.endswith(defined_view)][0]
        view_obj = layout_schema['objects'][view_id]
        view_uirefid = view_obj['uirefid']
    
        # Set the view tree 
        json_layout.update({view_uirefid: []})
        json_view = json_layout[view_uirefid]
    
        # Fetch the view's blocks via associated_from
        view_block_associations = layout_schema['associated_from'][view_id]
        for block_association in view_block_associations:
            # Extract the block's id and fetch the block object
            block_id = block_association[1]
            block_obj = layout_objects[block_id]
            block_position = None # TODO
        
            # Juking a key error in the UI database
            block_screen_label = None
            try:
                block_screen_label = layout_objects[block_obj['screen_label_id']]['text']
            except Exception, e:
                print 'Block screen label error: %s' % e
            
            # Find the block's associated group id, object, screen label and position
            group_id = layout_schema['associated_from'][block_id][0][1]
            group_obj = layout_objects[group_id]
            group_screen_label = layout_objects[group_obj['screen_label_id']]['text']
            group_position = None
        
            # Get group position
            for view_group_id in view_groups:
                view_group_obj = layout_objects[view_group_id]
                if view_group_obj['group_id'] == group_id:
                    group_position = view_group_obj['position']
        
            json_view.append({'group_id': group_obj['uirefid'], 'group_screen_label': group_screen_label, 'group_position': group_position,'blocks': []})
        
            for group_index, group in enumerate(json_view):
                if group_obj['uirefid'] == group['group_id']:
                    block_view = {'block_id': block_obj['uirefid'], 'block_screen_label': block_screen_label, 'attributes': []}
                    attributes = {}

                    # Fetch the block's attributes.
                    block_attribute_associations = layout_schema['associated_to'][block_id]
                    for attribute_association in block_attribute_associations:
                        if attribute_association[0] == 'hasUIAttribute':
                            attribute_obj = layout_objects[attribute_association[1]]
                        
                            # Fetch attribute screen label (full and abbreviated)
                            # Juking a key error in the UI database
                            screen_label_obj = None
                            try:
                                screen_label_obj = layout_objects[attribute_obj['screen_label_id']]
                            except Exception, e:
                                print 'Attribute screen label error: %s' % e
                        
                            if screen_label_obj:
                                attributes.update({'screen_label_text': screen_label_obj['text']})
                                attributes.update({'screen_label_abbreviation': screen_label_obj['abbreviation']})
                        
                            if attribute_obj['information_level_id']:
                                attributes.update({'information_level': layout_objects[attribute_obj['information_level_id']]['level']})
                        
                            block_view['attributes'].append(attributes)
                    
                    json_view[group_index]['blocks'].append(block_view)
            
    return json_layout
        
        
if __name__ == '__main__':
    print json_layout_tree()