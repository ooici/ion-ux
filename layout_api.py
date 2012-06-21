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

from service_api import ServiceApi, service_gateway_get, build_get_request, pretty_console_log

class LayoutApi(object):
    
    @staticmethod
    def get_layout_schema():
        layout_schema = service_gateway_get('directory', 'get_ui_specs', params={'user_id': 'tboteler'})
        return layout_schema
    
    @staticmethod    
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
    