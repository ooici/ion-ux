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

DEFINED_VIEWS = ['2050001', '2050002', '2050006'] # Instrument, Platform, Observatory

class LayoutApi(object):
    @staticmethod
    def process_layout():
        layout_schema = layout_json_tree()
        processed_layout = build_partials(layout_schema=layout_schema)
        return processed_layout
    
    @staticmethod
    def get_layout_schema():
        return LAYOUT_SCHEMA


# TODO: refactor group dictionary for efficiency
def layout_json_tree():
    layout_schema = LayoutApi.get_layout_schema()
    layout_objects = LAYOUT_SCHEMA['objects']
    view_groups = LAYOUT_SCHEMA['UIViewGroup']
    layout_json = {}

    for defined_view in DEFINED_VIEWS:
        # Fetch the view resource
        view_id = [view for view in layout_schema['UIResourceType'] if view.endswith(defined_view)][0]
        view_obj = layout_schema['objects'][view_id]
        view_uirefid = view_obj['uirefid']

        # Set the view tree 
        layout_json.update({view_uirefid: []})
        view_json = layout_json[view_uirefid]

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
            
            # Get group position
            for view_group_id in view_groups:
                view_group_obj = layout_objects[view_group_id]
                if view_group_obj['group_id'] == group_id:
                    group_position = view_group_obj['position']
                else:
                    group_position = None
            
            # Append the group so that we can cycle back over them to append the block
            view_json.append({'group_id': group_obj['uirefid'], 'group_screen_label': group_screen_label, 'group_position': group_position,'blocks': []})
            
            # Cycle over the groups to find the current group
            for group_index, group in enumerate(view_json):
                if group_obj['uirefid'] == group['group_id']:
                    block_view = {'block_id': block_obj['uirefid'], 'block_screen_label': block_screen_label, 'attributes': []}
                    attributes = {}

                    # Fetch the block's attributes.
                    block_associations = layout_schema['associated_to'][block_id]
                    for block_association in block_associations:
                        if block_association[0] == 'hasUIRepresentation':
                            block_view.update({'ui_representation': layout_objects[block_association[1]]['name']})


                        if block_association[0] == 'hasUIAttribute':
                            attribute_obj = layout_objects[block_association[1]]                            

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

                    view_json[group_index]['blocks'].append(block_view)

    return layout_json


def build_partials(layout_schema=None):
    env = Environment()
    env.loader = FileSystemLoader('templates')
    tmpl_unparsed = env.get_template('ion-ux.html').render()
    tmpl = ET.fromstring(tmpl_unparsed.encode('utf-8'))
    body_elmt = tmpl.find('body')
    if layout_schema is None:
        layout_schema = LayoutApi.get_layout_schema()
    
    for view_id, view_tree in layout_schema.iteritems():
        script_elmt = ET.Element('script')
        script_elmt.set('id', view_id)
        script_elmt.set('type', 'text/template')

        # Set columns here
        column_container_elmt = ET.SubElement(script_elmt, 'div')
        column_container_elmt.set('class', 'row')
        column_one_elmt = ET.SubElement(column_container_elmt, 'div')
        column_one_elmt.set('class', 'span2')
        column_two_elmt = ET.SubElement(column_container_elmt, 'div')
        column_two_elmt.set('class', 'span8')

        for group in view_tree:
            # Temporary hack to text columns to circumvent UI database positioning errors.
            if group['group_screen_label'] == 'Information':
                group_elmt = ET.SubElement(column_one_elmt, 'div')
            else:
                group_elmt = ET.SubElement(column_two_elmt, 'div')
            group_elmt.set('id', group['group_id'])
            group_h2_elmt = ET.SubElement(group_elmt, 'h2')
            group_h2_elmt.text = group['group_screen_label']

            for block in group['blocks']:
                # BLOCK HTML
                block_elmt = ET.SubElement(group_elmt, 'div')
                block_elmt.set('id', block['block_id'])
                block_h3_elmt = ET.SubElement(block_elmt, 'h3')
                block_h3_elmt.text = block['block_screen_label']
                block_p_elmt = ET.SubElement(block_elmt, 'p')
        
        body_elmt.append(script_elmt)

    layout_elmt = ET.SubElement(body_elmt, 'script')
    layout_elmt.set('id', 'layout')
    layout_elmt.text = "var LAYOUT_OBJECT = %s;" % json.dumps(layout_schema)

    init_script_elmt = ET.Element('script')
    init_script_elmt.set('type', 'text/javascript')
    init_script_elmt.text = "$(function(){dyn_do_init();});"
    body_elmt.append(init_script_elmt)

    # string_response = cStringIO.StringIO()

    tmpl = ET.tostring(tmpl)
    h = HTMLParser.HTMLParser()
    return h.unescape(tmpl)


def refresh_dummy_data():
    '''Refresh dummy_data_layout.py with latest schema.'''
    layout_schema = LayoutApiOG.get_layout_schema()
    schema = open('dummy_data_layout.py', 'w')
    schema.write('LAYOUT_SCHEMA = ' + str(layout_schema))
    return True
        
if __name__ == '__main__':
    print layout_json_tree()