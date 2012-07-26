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
from service_api import service_gateway_get
from config import CACHED_LAYOUT

DEFINED_VIEWS = ['2050001', '2050002', '2050006', '2050011']

class LayoutApi(object):
    @staticmethod
    def process_layout():
        layout_json = layout_json_tree()
        processed_layout = build_partials(layout_schema=layout_json)
        return processed_layout
    
    @staticmethod
    def get_layout_schema():
        if CACHED_LAYOUT:
            layout_schema = LAYOUT_SCHEMA
        else:
            layout_schema = service_gateway_get('directory', 'get_ui_specs', params={'user_id': 'tboteler'})
        return layout_schema
    

# TODO: much more efficiency/clean-up to do with *_view dicts
def layout_json_tree():
    layout_schema = LayoutApi.get_layout_schema()
    layout_objects = layout_schema['objects']
    view_group_ids = layout_schema['UIViewGroup']
    layout_json = {}
    
    for defined_view in DEFINED_VIEWS:
        # Fetch the view resource
        view_id = [view for view in layout_schema['UIResourceType'] if view.endswith(defined_view)][0]
        view_obj = layout_objects[view_id]
        view_uirefid = view_obj['uirefid']
        
        # TEMP - catching unassociatedd screen_labels
        # if view_obj['screen_label_id']:
        #     view_screen_label = layout_objects['screen_label_id']
        # else:
        #     view_screen_label = view_obj['name']
        
        view_screen_label = view_obj['name']
        # Set the view tree
        layout_json.update({view_uirefid: {'screen_label': view_screen_label, 'groups': []}})
        view_json = layout_json[view_uirefid]
        # Fetch the view's blocks via associated_from
        view_block_associations = layout_schema['associated_from'][view_id]
        
        for block_association in view_block_associations:
            # Extract block and group objects
            block_id = block_association[1]
            block_obj = layout_objects[block_id]            
            group_id = layout_schema['associated_from'][block_id][0][1]
            group_obj = layout_objects[group_id]
                        
            try:
                group_screen_label = group_obj['name'] # "Group" #layout_objects[group_obj['screen_label_id']]['text']
            except Exception, e:
                continue # Skip this block, will not render until block -> group association is made.

            # Get group position
            group_position = ''
            for view_group_id in view_group_ids:
                view_group_obj = layout_objects[view_group_id]
                if view_group_obj['group_id'] == group_id:
                    group_position = view_group_obj['position']
                else:
                    group_position = None
            
            is_new_group = True
            group_view = {'_id': group_obj['_id'], 'group_id': group_obj['uirefid'], 'group_screen_label': group_screen_label, 'group_position': group_position,'blocks': []}
            for group in view_json['groups']:
                if group['group_id'] == group_obj['uirefid']:
                    is_new_group = False
                    group_view = group
            
            # Assemble block
            block_position = None # TODO
            
            # Juking a key error in the UI database
            block_name = None
            try:
                # TODO - switch this back to a screen label
                # block_screen_label = layout_objects[block_obj['screen_label_id']]['text']
                block_name = block_obj['name']
            except Exception, e:
                print 'Block screen label error: %s' % e
            
            print(block_obj, '\n\n\n')
            
            block_view = {'block_id': block_obj['uirefid'], 'name': block_name, 'attributes': []}
            
            # Assemble attributes
            # Fetch the block's attributes.
            block_associations = layout_schema['associated_to'][block_id]
            for block_association in block_associations:
                
                if block_association[0] == 'hasUIRepresentation':
                    block_view.update({'ui_representation': layout_objects[block_association[1]]['name']})
                
                if block_association[0] == 'hasUIAttribute':
                    attribute_obj = layout_objects[block_association[1]]
                    attributes_view = {}
                    # Fetch attribute screen label (full and abbreviated)
                    # Juking a key error in the UI database
                    screen_label_obj = None
                    try:
                        screen_label_obj = layout_objects[attribute_obj['screen_label_id']]
                    except Exception, e:
                        print 'Attribute screen label error: %s' % e

                    if screen_label_obj:
                        attributes_view.update({'screen_label_text': screen_label_obj['text']})
                        attributes_view.update({'screen_label_abbreviation': screen_label_obj['abbreviation']})

                    # TEMP until screen labels are fixed.
                    attributes_view.update({'screen_label_text': attribute_obj['name']})

                    if attribute_obj['information_level_id']:
                        pass
                        # attributes_view.update({'information_level': layout_objects[attribute_obj['information_level_id']]['level']})

                    block_view['attributes'].append(attributes_view)
            
            group_view['blocks'].append(block_view)
            
            if is_new_group:
                view_json['groups'].append(group_view)

    return layout_json

def build_partials(layout_schema=None):
    env = Environment()
    env.loader = FileSystemLoader('templates')
    tmpl_unparsed = env.get_template('ion-ux.html').render()
    tmpl = ET.fromstring(tmpl_unparsed.encode('utf-8'))
    body_elmt = tmpl.find('body')
    if layout_schema is None:
        layout_schema = LayoutApi.layout_json_tree(LAYOUT_SCHEMA)

    for view_id, view_tree in layout_schema.iteritems():
        script_elmt = ET.Element('script')
        script_elmt.set('id', view_id)
        script_elmt.set('type', 'text/template')

        pagename_container_elmt = ET.SubElement(script_elmt, 'div')
        pagename_container_elmt.set('class', 'row-fluid')
        pagename_emlt = ET.SubElement(pagename_container_elmt, 'div')
        pagename_emlt.set('class', 'span12')
        pagename_h1_elmt = ET.SubElement(pagename_emlt, 'h1')
        pagename_h1_elmt.text = view_tree['screen_label']

        # Set columns here
        column_container_elmt = ET.SubElement(script_elmt, 'div')
        column_container_elmt.set('class', 'row-fluid')
        column_one_elmt = ET.SubElement(column_container_elmt, 'div')
        column_one_elmt.set('class', 'span2')
        column_two_elmt = ET.SubElement(column_container_elmt, 'div')
        column_two_elmt.set('class', 'span10')

        for group in view_tree['groups']:
            # Temporary hack to text columns to circumvent UI database positioning errors.
            if group['group_screen_label'] == 'Information':
                group_elmt = ET.SubElement(column_one_elmt, 'div')
            else:
                group_elmt = ET.SubElement(column_two_elmt, 'div')
            
            group_elmt.set('id', group['group_id'])
            group_h2_elmt = ET.SubElement(group_elmt, 'h2')
            group_h2_elmt.text = group['group_screen_label']
            
            tab_ul_elmt = ET.SubElement(group_elmt, 'ul')
            tab_ul_elmt.set('class', 'nav nav-tabs tabby')
            tab_content_elmt = ET.SubElement(group_elmt, 'div')
            tab_content_elmt.set('class', 'tab-content')
            
            for idx, block in enumerate(group['blocks']):
                # BLOCK HTML
                block_elmt = ET.SubElement(tab_content_elmt, 'div')
                block_elmt.set('id', block['block_id'])

                block_li_elmt = ET.SubElement(tab_ul_elmt, 'li')
                block_li_a_elmt = ET.SubElement(block_li_elmt, 'a', {'href': '#' + block['block_id'], 'data-toggle': 'tab'})
                block_li_a_elmt.text = block['name']
                
                if idx == 0:
                    block_elmt.set('class', 'tab-pane active')
                    block_li_elmt.set('class', 'active')
                else:
                    block_elmt.set('class', 'tab-pane')
                
                # block_h3_elmt = ET.SubElement(block_elmt, 'h3')
                # block_h3_elmt.text = block['block_screen_label']
                block_p_elmt = ET.SubElement(block_elmt, 'p')

        body_elmt.append(script_elmt)

    layout_elmt = ET.SubElement(body_elmt, 'script')
    layout_elmt.set('id', 'layout')
    layout_elmt.text = "var LAYOUT_OBJECT = %s;" % json.dumps(layout_schema)

    init_script_elmt = ET.Element('script')
    init_script_elmt.set('type', 'text/javascript')
    init_script_elmt.text = "$(function(){dyn_do_init();});"
    body_elmt.append(init_script_elmt)

    tmpl = ET.tostring(tmpl)
    h = HTMLParser.HTMLParser()
    return h.unescape(tmpl)
