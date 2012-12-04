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
from config import CACHED_LAYOUT, PORTAL_ROOT

from random import randint

DEFINED_VIEWS = [
    '2163152', # Facepage
    '2163153', # Status
    '2163154', # Related
    '2163156', # Dashboard
    # '2163810', # Dashboard 2,
    '2163157', # Command
    '2163158', # Direct Command
    # '2163927', # Callout
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
        env = Environment()
        
        env.loader = FileSystemLoader(PORTAL_ROOT+'/templates')
        tmpl_unparsed = env.get_template('ion_ux.html').render()
        tmpl = ET.fromstring(tmpl_unparsed.encode('utf-8'))

        # Body element for appending scripts/templates
        body_elmt = tmpl.find('body')

        layout_schema = LayoutApi.get_new_layout_schema()

        resource_types = []
        metadata_processed = []
        
        # Do not create HTML elmts for subattributes
        excluded_sub_attributes = ['table_ooi', 'chart_ooi']
        
        for view_id in DEFINED_VIEWS:
            view = layout_schema['spec']['elements'][view_id] 
            script_elmt = ET.SubElement(body_elmt, 'script')
            script_elmt.set('id', view_id)
            script_elmt.set('type', 'text/template')

            # BEGIN BASIC PAGE STRUCTURE 
            # Creating page structure via Twitter Bootstrap
            # conventions. This will be optimized.

            # Fluid row to hold page heading
            row_heading = ET.SubElement(script_elmt, 'div')
            row_heading.set('class', 'row-fluid heading')

            # Fluid row to hold columns for main page
            row_container = ET.SubElement(script_elmt, 'div')
            row_container.set('class', 'row-fluid')

            # Page heading
            v00_elmt = ET.SubElement(row_heading, 'div')
            v00_elmt.set('class', 'v00 span12')
            group_h1_elmt = ET.SubElement(v00_elmt, 'h1')
            group_h1_elmt.text = view['label']

            # Page content - left and right columns
            v01_elmt = ET.SubElement(row_container, 'div')
            v01_elmt.set('class', 'v01 span3')
            v02_elmt = ET.SubElement(row_container, 'div')
            v02_elmt.set('class', 'v02 span9')

            # END BASIC PAGE STRUCTURE

            # GROUPS -------------------------------------------------------------------

            groups = {}
            for gr_idx, gr_element in enumerate(view['embed']):
                group_elid = gr_element['elid']
                group_link_id = group_elid + str(randint(0,1000))
                group_position = gr_element['pos']
                group = layout_schema['spec']['elements'][group_elid]

                # Find the page element for the group
                if group_position == 'V00':
                    parent_elmt = v00_elmt
                elif group_position == 'V01':
                    parent_elmt = v01_elmt
                else:
                    parent_elmt = v02_elmt

                # Active boolean for CSS
                group_is_active = False
                if not group_position in groups.keys():
                    group_is_active = True

                    group_container_elmt = ET.SubElement(parent_elmt, 'div')
                    group_container_elmt.attrib['id'] = group_elid
                    group_container_elmt.attrib['class'] = 'group'

                    # Create ul for navigation
                    group_ul_elmt = ET.SubElement(group_container_elmt, 'ul')
                    group_ul_elmt.attrib['class'] = 'nav nav-tabs'

                    # Create group_block container
                    group_block_container_elmt = ET.SubElement(group_container_elmt, 'div')
                    group_block_container_elmt.attrib['class'] = 'tab-content'

                    # Track positioning elements in dict
                    groups.update({group_position: {'ul_elmt': group_ul_elmt,'group_container_elmt': group_container_elmt ,'group_block_container_elmt': group_block_container_elmt}})
                else:
                    group_ul_elmt = groups[group_position]['ul_elmt']
                    group_block_container_elmt = groups[group_position]['group_block_container_elmt']

                # Create li and a elements
                group_li_elmt = ET.SubElement(group_ul_elmt, 'li')
                group_a_elmt = ET.SubElement(group_li_elmt, 'a')
                group_a_elmt.attrib['href'] = '#' + group_link_id
                group_a_elmt.attrib['data-toggle'] = 'tab'
                # FOR TROUBLESHOOTING
                # group_a_elmt.text = group['label'] + ' (' + group_position + ')'
                group_a_elmt.text = group['label']

                # Create group div inside of tab-content
                group_elmt = ET.SubElement(group_block_container_elmt, 'div')
                group_elmt.attrib['id'] = group_link_id
                group_elmt.attrib['class'] = 'tab-pane row-fluid'

            # END GROUPS -------------------------------------------------------------------

                # Blocks
                for bl_element in group['embed']:
                    block_elid = bl_element['elid']
                    block_position = bl_element['pos']
                    block = layout_schema['spec']['elements'][block_elid]
                    
                    if block.has_key('ie'):
                        block_res_type = block['ie']['ie_name']
                    else:
                        block_res_type = ''

                    block_widget_id = block['wid']
                    block_widget = layout_schema['spec']['widgets'][block_widget_id]
                    block_widget_type = block_widget['name']
                    
                    if not block_res_type in resource_types:
                        resource_types.append(block_res_type)

                    # Set li class based on block_res_type
                    li_css_class = group_li_elmt.get('class')
                    group_css_class = group_elmt.get('class')
                    if li_css_class is None: # Catch empty/unset class on first item
                        li_css_class = ''
                    if not block_res_type in li_css_class:
                        li_css_class += ' %s' % block_res_type #block['ie']['ie_name']
                    if group_is_active:
                        if not 'active' in li_css_class: 
                            li_css_class += ' active'
                        if not 'active' in group_css_class:
                            group_css_class += ' active'
                    
                    group_li_elmt.attrib['class'] = li_css_class
                    group_elmt.attrib['class'] = group_css_class

                    # Set div class based on block_res_type
                    # block_css_class = group_elmt.get('class')
                    block_css_class = None
                    if block_css_class is None:
                        block_css_class = ''
                    if not block_res_type in block_css_class:
                        block_css_class += ' %s' % block_res_type
                    if group_is_active:
                        block_css_class += ' active'
                    
                  
                    ##################################################################
                    # BLOCK LAYOUT 
                    # Determine layout structure of blocks within group
                    ##################################################################

                    wide_container = False
                    if block['embed']:
                        for at_element in block['embed']:
                            attribute = layout_schema['spec']['elements'][at_element['elid']]
                            attribute_widget_type = layout_schema['spec']['widgets'][attribute['wid']]['name']
                            if attribute_widget_type in ('table_ooi', 'chart_ooi'):
                                wide_container = True
                    if wide_container:
                        block_container = ET.SubElement(group_elmt, 'div')
                        block_container.attrib['class'] = 'row-fluid'
                        block_elmt = ET.SubElement(block_container, 'div')
                        block_css_class += ' span12'
                    else:
                        block_elmt = ET.SubElement(group_elmt, 'div')
                        block_css_class += ' block'
                        if group_position not in ('V00','V01'):
                            block_css_class += ' span3'
                    
                    # Set block class based on attribute widget type
                    # if group_position not in ('V00', 'V01') and attribute_widget_type not in ('table_ooi', 'chart_ooi'):
                    #     block_css_class += ' span3'
                    # elif attribute_widget_type in ('table_ooi', 'chart_ooi'):
                    #     block_css_class += ' clear span12'
                            
                    block_elmt.attrib['class'] = block_css_class
                    block_elmt.attrib['style'] = 'display:none;'
                    block_elmt.attrib['id'] = block_elid

                    # FOR TROUBLESHOOTING
                    # block_h3_elmt.text = 'Block: %s (%s) (%s) (%s)' % (block['label'], block_elid, block_widget['name'], block_position)
                    if not group_position == 'V00':
                        if not attribute_widget_type == 'table_ooi':
                            block_h3_elmt = ET.SubElement(block_elmt, 'h3')
                            block_h3_elmt.text = block['label']
                    
                    block_container_elmt = ET.SubElement(block_elmt, 'div')
                    # block_container_elmt.set('class', 'content-wrapper')
                    

                    # Attributes
                    for at_element in block['embed']:
                        attribute_elid = at_element['elid']
                        attribute_position = at_element['pos']
                        attribute_data_path = at_element['dpath']
                        attribute_level = at_element['olevel']
                        attribute = layout_schema['spec']['elements'][attribute_elid]

                        # Widget
                        attribute_widget_id = attribute['wid']
                        attribute_widget_type = layout_schema['spec']['widgets'][attribute_widget_id]['name']
                                                
                        attribute_elmt = ET.SubElement(block_container_elmt, 'div')

                        attribute_elmt.set('id', attribute_elid)
                        attribute_elmt.set('data-position', attribute_position)
                        attribute_elmt.set('data-path', attribute_data_path)
                        attribute_elmt.set('data-level', attribute_level)
                        attribute_elmt.set('data-label', attribute['label'])
                        
                        # Set additional class based on spec['graphics] name
                        # corresponding CSS class applies the sprite.
                        if attribute_widget_type == 'image_ooi':
                            image_class = layout_schema['spec']['graphics'][attribute['gfx']]['name']
                            attribute_elmt.set('class', '%s %s' % (attribute_widget_type, image_class))
                            attribute_elmt.text = '&nbsp;'
                        else:
                            attribute_elmt.set('class', attribute_widget_type)
                            # FOR TROUBLESHOOTING
                            # attribute_elmt.text = 'Attribute: %s (%s) (%s) (%s) (%s)' % (attribute['label'], attribute['name'], attribute_elid, attribute_widget_type, attribute_position)
                            attribute_elmt.text = '%s (%s)' % (attribute['label'], attribute['name'])
                            
                        if attribute_widget_type not in ('table_ooi', 'chart_ooi'):
                            block_container_elmt.set('class', 'content-wrapper')
                        
                        # Generate metadata for nested elements, ex. tables and attribute groups                        
                        if attribute_widget_type in ('table_ooi', 'attribute_group_ooi') and attribute_elid not in metadata_processed:
                            metadata_processed.append(attribute_elid)
                            metadata = []
                            for embedded_attribute in attribute['embed']:
                                embedded_object = layout_schema['spec']['elements'][embedded_attribute['elid']]
                                embedded_widget_type = layout_schema['spec']['widgets'][embedded_attribute['wid']]['name']

                                metadata_items = [embedded_widget_type, embedded_object['label'], embedded_attribute['dpath'], embedded_attribute['pos'], embedded_attribute['olevel']]
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
                        
                        # if attribute['embed'] and not attribute_widget_type in excluded_sub_attributes:
                        #     for sub_at_element in attribute['embed']:
                        #         sub_attribute_elid = sub_at_element['elid']
                        #         sub_attribute_position = sub_at_element['pos']
                        #         sub_attribute_data_path = sub_at_element['dpath']
                        #         sub_attribute_level = sub_at_element['olevel']
                        #         sub_attribute = layout_schema['spec']['elements'][sub_attribute_elid]
                        #         
                        #         sub_attribute_widget_id = sub_attribute['wid']
                        #         sub_attribute_widget_type = layout_schema['spec']['widgets'][sub_attribute_widget_id]['name']
                        #         
                        #         sub_attribute_elmt = ET.SubElement(block_elmt, 'div')
                        #         sub_attribute_elmt.set('id', sub_attribute_elid)
                        #         sub_attribute_elmt.set('class', sub_attribute_widget_type)
                        #         sub_attribute_elmt.set('data-path', sub_attribute_data_path)
                        #         sub_attribute_elmt.set('data-level', sub_attribute_level)
                        #         sub_attribute_elmt.set('data-label', sub_attribute['label'])
                        # 
                        #         # sub_attribute_elmt.text = '%s (%s) (%s) (%s) (%s)' % (sub_attribute['label'], sub_attribute['name'], sub_attribute_elid, sub_attribute_widget_type, sub_attribute_position)
                        #         sub_attribute_elmt.text = '%s (%s)' % (sub_attribute['label'], sub_attribute['name'])

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
        h = HTMLParser.HTMLParser()
        return h.unescape(tmpl)
