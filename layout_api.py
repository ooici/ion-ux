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
from config import PORTAL_ROOT, UI_MODE, STATIC_ASSETS

from random import randint

DEFINED_VIEWS = [
    '2163152', # Facepage
    '2163153', # Status
    '2163154', # Related
    '2163156', # Dashboard
    '2163157', # Command
    '2163158', # Direct Command
]

class LayoutApi(object):
    @staticmethod
    def get_new_layout_schema():
        layout_schema = service_gateway_get('directory', 'get_ui_specs', params={'user_id': 'tboteler'})
        return layout_schema
    
    # Brute force method to quickly experiment with different rendering strategies
    # with CSS rules, etc. Optimizations/refactoring will be underway soon.
    @staticmethod
    def process_layout(layout_schema=None, interactions=None):
        
        # Load template and find 'body' for template appendation
        env = Environment()
        env.loader = FileSystemLoader(PORTAL_ROOT+'/templates')
        tmpl_unparsed = env.get_template('ion_ux4.html').render(static_assets=STATIC_ASSETS)
        tmpl = ET.fromstring(tmpl_unparsed.encode('utf-8'))
        body_elmt = tmpl.find('body')

        # Fetch the layout schema
        layout_schema = LayoutApi.get_new_layout_schema()
        
        # Track resource types, metadata and widgets without processed sub-attributes
        resource_types = []
        metadata_processed = []
        exclude_sub_attributes = ['table_ooi', 'chart_ooi']
        attribute_levels = ['level-zero', 'level-one', 'level-two', 'level-three', 'level-four', 'level-five', 'level-six']

        # --------------------------------------------------------------------------        
        # VIEWS
        # --------------------------------------------------------------------------

        # Loop through defined views and build <script> templates with following heirarchy:
        # view -> groups -> blocks -> attributes -> sub-attributes.
        for view_id in DEFINED_VIEWS:
            view = layout_schema['spec']['elements'][view_id] 
            
            script_elmt = _make_element(body_elmt, 'script', id=view_id, type='text/template')
            
            # heading_elmt = _make_element(script_elmt, 'div', css='row-fluid heading')
            v00_elmt = _make_element(script_elmt, 'div', css='v00 heading')
            
            content_elmt = _make_element(script_elmt, 'div', css='row-fluid')
            v01_elmt = _make_element(content_elmt, 'div', css='v01 span3')
            v02_elmt = _make_element(content_elmt, 'div', css='v02 span9')
            
            # --------------------------------------------------------------------------        
            # GROUPS
            # --------------------------------------------------------------------------
            
            # Track groups on per view basis
            groups = {}
            
            # Loop through groups
            for gr_idx, gr_element in enumerate(view['embed']):
                group_elid = gr_element['elid']
                group_link_id = group_elid + str(randint(0,1000))
                group_position = gr_element['pos']
                group = layout_schema['spec']['elements'][group_elid]
                
                # Set the parent element for the group
                if group_position == 'V00':
                    parent_elmt = v00_elmt
                elif group_position == 'V01':
                    parent_elmt = v01_elmt
                else:
                    parent_elmt = v02_elmt
                
                # LABEL OVERRIDES
                if gr_element.has_key('olabel'):
                    #print 'group label override:', group['label'], '->', gr_element['olabel'], group_elid
                    group_label = gr_element['olabel']
                else:
                    group_label = group['label']
                
                # CHECK FOR TITLE BAR (V00), creates tabs for V01 and V02 groups
                if group_position == 'V00':
                    group_elmt = parent_elmt
                else:
                    if not group_position in groups.keys():
                        group_container_elmt = _make_element(parent_elmt, 'div', id=group_elid, css='group')
                        group_ul_elmt = _make_element(group_container_elmt, 'ul', css='nav nav-tabs')
                        group_block_container_elmt = _make_element(group_container_elmt, 'div', css='tab-content')
                    
                        groups.update({group_position: {'ul_elmt': group_ul_elmt,'group_container_elmt': group_container_elmt ,'group_block_container_elmt': group_block_container_elmt}})
                    else:
                        group_ul_elmt = groups[group_position]['ul_elmt']
                        group_block_container_elmt = groups[group_position]['group_block_container_elmt']
                    
                    # <li>, <a> and group element
                    group_li_elmt = _make_element(group_ul_elmt, 'li', css='')
                    group_a_elmt = _make_element(group_li_elmt, 'a', href="#%s" % group_link_id, data_toggle='tab', content=group_label)
                    group_elmt = _make_element(group_block_container_elmt, 'div', id=group_link_id, css='tab-pane row-fluid')
                    

                # --------------------------------------------------------------------------
                # BLOCKS
                # --------------------------------------------------------------------------

                # Loop through blocks
                for bl_element in group['embed']:
                    block_elid = bl_element['elid']
                    block_position = bl_element['pos']
                    block = layout_schema['spec']['elements'][block_elid]
                    
                    block_widget_id = block['wid']
                    block_widget = layout_schema['spec']['widgets'][block_widget_id]
                    block_widget_type = block_widget['name']
                    block_res_type = block['ie']['ie_name'] if block.has_key('ie') else ''
                    
                    if not block_res_type in resource_types:
                        resource_types.append(block_res_type)
                    
                    # Set li class based on block_res_type
                    if group_position != 'V00':
                        li_css_class = group_li_elmt.get('class')
                        if not block_res_type in li_css_class:
                            li_css_class += ' %s' % block_res_type
                            group_li_elmt.attrib['class'] = li_css_class
                    
                    # LABEL OVERRIDES
                    if bl_element.has_key('olabel'):
                        #print 'block label override:', block['label'], '->', bl_element['olabel'], block_elid
                        block_label = bl_element['olabel']
                    else:
                        block_label = block['label']
                    
                    block_css_class = block_res_type
                    
                    # if not block_res_type in block_css_class:
                    #     block_css_class += ' %s' % block_res_type
                  
                    # BLOCK LAYOUT

                    if block['embed']:
                        for at_element in block['embed']:
                            attribute = layout_schema['spec']['elements'][at_element['elid']]
                            attribute_widget_type = layout_schema['spec']['widgets'][attribute['wid']]['name']
                            
                            wide_container = True if attribute_widget_type in ('table_ooi', 'chart_ooi') else False

                    if wide_container:
                        block_container = _make_element(group_elmt, 'div', css='row-fluid')
                        block_elmt = _make_element(block_container, 'div', style="display:none;", id=block_elid)
                        block_css_class += ' span12'
                    else:
                        block_elmt = _make_element(group_elmt, 'div', style="display:none;", id=block_elid)
                        block_css_class += ' block'

                        # Greater than V01
                        if group_position not in ('V00','V01'):
                            block_css_class += ' span3'
                        # CHECK FOR TITLE BAR (V00)
                        elif group_position == 'V00':
                            block_css_class += ' row-fluid'
                    
                    block_elmt.attrib['class'] = block_css_class

                    # SET GROUP HEADINGS
                    if group_position != 'V00':
                        # Hide table headers for now.
                        if not attribute_widget_type == 'table_ooi':
                            block_h3_elmt = _make_element(block_elmt, 'h3', content=block_label)
                    if group_position == 'V00':
                        block_container_elmt = block_elmt
                        left_elmt = _make_element(block_container_elmt, 'div', css='span6 heading-left')
                        right_elmt = _make_element(block_container_elmt, 'div', css='span6 heading-right', style="display:none;")
                    else:
                        block_container_elmt = _make_element(block_elmt, 'div')
                    
                    # Attributes
                    for at_element in block['embed']:
                        attribute_elid = at_element['elid']
                        attribute_position = at_element['pos']
                        attribute_data_path = at_element['dpath']
                        attribute_level = at_element['olevel']
                        attribute_css = attribute_levels[int(attribute_level)] if attribute_level else ''
                        attribute = layout_schema['spec']['elements'][attribute_elid]
                        attribute_widget_id = attribute['wid']
                        attribute_widget_type = layout_schema['spec']['widgets'][attribute_widget_id]['name']
                        
                        # LABEL OVERRIDES
                        if at_element.has_key('olabel'):
                            #print 'attribute label override:', attribute['label'], '->', at_element['olabel'], attribute_elid
                            attribute_label = at_element['olabel']
                        else:
                            attribute_label = attribute['label']
                        
                        if attribute_widget_type == 'image_ooi':
                            image_class = layout_schema['spec']['graphics'][attribute['gfx']]['name']
                            attribute_css += ' %s %s' % (attribute_widget_type, image_class)
                        else:
                            attribute_css += ' %s' % attribute_widget_type
                        
                        # CHECK FOR TITLE BAR
                        if attribute_widget_type not in ('table_ooi', 'chart_ooi') and group_position != 'V00':
                            block_container_elmt.set('class', 'content-wrapper')
                        
                        attribute_options = {
                            'id': attribute_elid, 
                            'data-position': attribute_position,
                            'data-path': attribute_data_path,
                            'data-level': attribute_level,
                            'data-label': attribute_label,
                            'css': attribute_css
                        }
                        
                        if group_position == 'V00':
                            if attribute_position == 'B01' or attribute_position == 'B02':
                                attribute_elmt = _make_element(left_elmt, 'div', **attribute_options)
                            else:
                                attribute_elmt = _make_element(right_elmt, 'div', **attribute_options)
                        else:
                            attribute_elmt = _make_element(block_container_elmt, 'div', **attribute_options)
                        
                        # FOR INTEGRATION
                        # if UI_MODE == 'DEVELOPMENT':
                        #     attribute_elmt.text = 'Attribute: %s (%s) (%s) (%s) (%s)' % (attribute['label'], attribute['name'], attribute_elid, attribute_widget_type, attribute_position)
                        
                        
                        # Generate metadata for nested elements, ex. tables and attribute groups                        
                        if attribute_widget_type in ('table_ooi', 'attribute_group_ooi') and attribute_elid not in metadata_processed:
                            metadata_processed.append(attribute_elid)
                            metadata = []
                            for embedded_attribute in attribute['embed']:
                                embedded_object = layout_schema['spec']['elements'][embedded_attribute['elid']]
                                embedded_widget_type = layout_schema['spec']['widgets'][embedded_attribute['wid']]['name']

                                # LABEL OVERRIDE
                                if embedded_attribute.has_key('olabel'):
                                    #print 'sub-attribute label override:', embedded_object['label'], '->', embedded_attribute['olabel'], attribute_elid
                                    embedded_object_label = embedded_attribute['olabel']
                                else:
                                    embedded_object_label = embedded_object['label']
                                                                
                                embedded_info_level = embedded_attribute['olevel']
                                if embedded_info_level:
                                    embedded_info_level_index = int(embedded_info_level) 

                                metadata_items = [embedded_widget_type, embedded_object_label, embedded_attribute['dpath'], embedded_attribute['pos'], embedded_info_level, attribute_levels[embedded_info_level_index]]
                                if attribute_widget_type == 'attribute_group_ooi':
                                    meta_elmt_id = 'ATTRIBUTE_GROUP_' + attribute_elid
                                    metadata_items.append(embedded_attribute['elid'])
                                    metadata_items.append(embedded_attribute['dpath'])
                                elif attribute_widget_type == 'table_ooi':
                                    meta_elmt_id = 'TABLE_' + attribute_elid
                                
                                metadata.append(metadata_items)
                                
                            # Append metadata to body as a JSON script
                            meta_elmt = ET.SubElement(body_elmt, 'script')
                            meta_elmt.set('id', meta_elmt_id)
                            meta_elmt.text = "var %s=%s" % (meta_elmt_id, json.dumps(metadata))
                        

        layout_elmt = ET.SubElement(body_elmt, 'script')
        layout_elmt.set('id', 'layout')
        layout_elmt.text = "var LAYOUT=%s;" % json.dumps(layout_schema)

        resource_types_elmt = ET.SubElement(body_elmt, 'script')
        resource_types_elmt.set('id', 'resource_types')
        resource_types_elmt.text = "var RESOURCE_TYPES=%s" % json.dumps(resource_types)

        init_script_elmt = ET.Element('script')
        init_script_elmt.set('type', 'text/javascript')
        init_script_elmt.text = "$(function(){initialize_app();});"
        body_elmt.append(init_script_elmt)

        tmpl = ET.tostring(tmpl)
        tmpl = '<!DOCTYPE html>\n' + tmpl
        
        h = HTMLParser.HTMLParser()
        return h.unescape(tmpl)


def _make_element(parent_elmt, elmt_type, **kwargs):
    elmt = ET.SubElement(parent_elmt, elmt_type)
    for (key, value) in kwargs.items():
        if key == 'css':
            elmt.set('class', value)
        elif key.startswith('data'):
            elmt.set(key.replace('_','-'), value)
        elif key == 'content':
            elmt.text = value
        else:
            elmt.set(key, value)

    return elmt

