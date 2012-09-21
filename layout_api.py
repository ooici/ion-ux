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

# OLD_DEFINED_VIEWS = ['2050001', # Instrument
#                  '2050002', # Platform
#                  '2050004', # Data Product
#                  '2050006', # Observatory
#                  '2050007', # User
#                  '2050011', # Resource
#                  '2050012', # Information Resource
#                 ]

DEFINED_VIEWS = [
    '2163152', # Facepage
    '2163153', # Status
    '2163154', # Related
    '2163156', # Dashboard
    '2163810', # Dashboard 2
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
        env.loader = FileSystemLoader('templates')
        tmpl_unparsed = env.get_template('ion_ux.html').render()
        tmpl = ET.fromstring(tmpl_unparsed.encode('utf-8'))

        # Body element for appending scripts/templates
        body_elmt = tmpl.find('body')

        layout_schema = LayoutApi.get_new_layout_schema()

        resource_types = []
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
            v00_elmt.set('class', 'span12 v00')
            group_h1_elmt = ET.SubElement(v00_elmt, 'h1')
            group_h1_elmt.text = view['label']

            # Page content - left and right columns
            v01_elmt = ET.SubElement(row_container, 'div')
            v01_elmt.set('class', 'span3')
            v02_elmt = ET.SubElement(row_container, 'div')
            v02_elmt.set('class', 'span9')

            # END BASIC PAGE STRUCTURE

            # GROUPS -------------------------------------------------------------------

            groups = {}
            for gr_idx, gr_element in enumerate(view['embed']):
                group_elid = gr_element['elid']
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
                group_a_elmt.attrib['href'] = '#' + group_elid
                group_a_elmt.attrib['data-toggle'] = 'tab'
                group_a_elmt.text = group['label'] + ' (' + group_position + ')'

                # Create group div inside of tab-content
                group_elmt = ET.SubElement(group_block_container_elmt, 'div')
                group_elmt.attrib['id'] = group_elid
                group_elmt.attrib['class'] = 'tab-pane'

            # END GROUPS -------------------------------------------------------------------

                # Blocks
                for bl_element in group['embed']:
                    block_elid = bl_element['elid']
                    block = layout_schema['spec']['elements'][block_elid]
                    block_position = bl_element['pos']
                    block_res_type = block['ie']['ie_name']

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

                    # Set block div
                    block_elmt = ET.SubElement(group_elmt, 'div')

                    # Set div class based on block_res_type
                    block_css_class = group_elmt.get('class')
                    if block_css_class is None:
                        block_css_class = ''
                    if not block_res_type in block_css_class:
                        block_css_class += ' %s' % block['ie']['ie_name']
                    if group_is_active:
                        block_css_class += ' active'
                    block_elmt.attrib['class'] = block_css_class
                    block_elmt.attrib['style'] = 'display:none;'
                    block_elmt.attrib['id'] = block_elid

                    block_h3_elmt = ET.SubElement(block_elmt, 'h3')
                    block_h3_elmt.text = block['label'] #block['name'] + ' (' + bl_element['elid'] + ': '+ block_position + ')'

                    # Attributes
                    for at_element in block['embed']:
                        attribute = layout_schema['spec']['elements'][at_element['elid']]
                        attribute_position = at_element['pos']
                        attribute_elmt = ET.SubElement(block_elmt, 'div')
                        attribute_elmt.text =  attribute['label'] #+ ' (' + at_element['elid'] + ': ' + attribute_position + ')'

                        if len(attribute['embed']) > 0:
                            for att in attribute['embed']:
                                attr = layout_schema['spec']['elements'][att['elid']]
                                attr_elmt = ET.SubElement(attribute_elmt, 'div')
                                attr_elmt.text = attr['label'] #attr['name']


        layout_elmt = ET.SubElement(body_elmt, 'script')
        layout_elmt.set('id', 'layout')
        layout_elmt.text = "var LAYOUT=%s;" % json.dumps(layout_schema)

        resource_types_elmt = ET.SubElement(body_elmt, 'script')
        resource_types_elmt.set('id', 'resource_types')
        resource_types_elmt.text = "var RESOURCE_TYPES=%s" % json.dumps(resource_types)

        init_script_elmt = ET.Element('script')
        init_script_elmt.set('type', 'text/javascript')
        init_script_elmt.text = "$(function(){dyn_do_init();});"
        body_elmt.append(init_script_elmt)

        tmpl = ET.tostring(tmpl)
        h = HTMLParser.HTMLParser()
        return h.unescape(tmpl)


        # @staticmethod
        # def process_layout():
        #     layout_json = layout_json_tree()
        #     interaction_json = interaction_layout_tree()
        #     processed_layout = build_partials(layout_schema=layout_json, interactions=interaction_json)
        #     return processed_layout
        # 
        # @staticmethod
        # def get_layout_schema():
        #     if CACHED_LAYOUT:
        #         layout_schema = LAYOUT_SCHEMA
        #     else:
        #         layout_schema = service_gateway_get('directory', 'get_ui_specs', params={'user_id': 'tboteler'})
        #     return layout_schema

# def interaction_layout_tree():
#     interactions = {'block_interactions': ['Save', 'Edit', 'Close']}
#     return interactions


# # TODO: much more efficiency/clean-up to do with *_view dicts
# def layout_json_tree():
#     layout_schema = LayoutApi.get_layout_schema()
#     layout_objects = layout_schema['objects']
#     view_group_ids = layout_schema['UIViewGroup']
#     layout_json = {}
#     
#     for defined_view in OLD_DEFINED_VIEWS:
#         # Fetch the view resource
#         view_id = [view for view in layout_schema['UIResourceType'] if view.endswith(defined_view)][0]
#         view_obj = layout_objects[view_id]
#         view_uirefid = view_obj['uirefid']
#         
#         # TEMP - catching unassociatedd screen_labels
#         # if view_obj['screen_label_id']:
#         #     view_screen_label = layout_objects['screen_label_id']
#         # else:
#         #     view_screen_label = view_obj['name']
#         
#         view_screen_label = view_obj['name']
#         # Set the view tree
#         layout_json.update({view_uirefid: {'screen_label': view_screen_label, 'groups': []}})
#         view_json = layout_json[view_uirefid]
#         # Fetch the view's blocks via associated_from
#         view_block_associations = layout_schema['associated_from'][view_id]
#         
#         for block_association in view_block_associations:
#             # Extract block and group objects
#             block_id = block_association[1]
#             block_obj = layout_objects[block_id]
#             
#             # Skip unused blocks (Data Products)
#             try:
#                 group_id = layout_schema['associated_from'][block_id][0][1]
#             except Exception, e:
#                 continue
#             
#             group_obj = layout_objects[group_id]
#                         
#             try:
#                 group_screen_label = group_obj['name'] # "Group" #layout_objects[group_obj['screen_label_id']]['text']
#             except Exception, e:
#                 continue # Skip this block, will not render until block -> group association is made.
# 
#             # Get group position
#             group_position = ''
#             for view_group_id in view_group_ids:
#                 view_group_obj = layout_objects[view_group_id]
#                 if view_group_obj['group_id'] == group_id:
#                     group_position = view_group_obj['position']
#                 else:
#                     group_position = None
#             
#             is_new_group = True
#             group_view = {'_id': group_obj['_id'], 'group_id': group_obj['uirefid'], 'group_screen_label': group_screen_label, 'group_position': group_position,'blocks': []}
#             for group in view_json['groups']:
#                 if group['group_id'] == group_obj['uirefid']:
#                     is_new_group = False
#                     group_view = group
#             
#             # Assemble block
#             block_position = None # TODO
#             
#             # Juking a key error in the UI database
#             block_name = None
#             try:
#                 # TODO - switch this back to a screen label
#                 # block_screen_label = layout_objects[block_obj['screen_label_id']]['text']
#                 block_name = block_obj['name']
#             except Exception, e:
#                 print 'Block screen label error: %s' % e
#             
#             block_view = {'block_id': block_obj['uirefid'], 'name': block_name, 'attributes': []}
#             
#             # Assemble attributes
#             # Fetch the block's attributes.
#             block_associations = layout_schema['associated_to'][block_id]
#             for block_association in block_associations:
#                 
#                 if block_association[0] == 'hasUIRepresentation':
#                     block_view.update({'ui_representation': layout_objects[block_association[1]]['name']})
#                 
#                 if block_association[0] == 'hasUIAttribute':
#                     attribute_obj = layout_objects[block_association[1]]
#                     attributes_view = {}
#                     # Fetch attribute screen label (full and abbreviated)
#                     # Juking a key error in the UI database
#                     screen_label_obj = None
#                     try:
#                         screen_label_obj = layout_objects[attribute_obj['screen_label_id']]
#                     except Exception, e:
#                         print 'Attribute screen label error: %s' % e
# 
#                     if screen_label_obj:
#                         attributes_view.update({'screen_label_text': screen_label_obj['text']})
#                         attributes_view.update({'screen_label_abbreviation': screen_label_obj['abbreviation']})
# 
#                     # TEMP until screen labels are fixed.
#                     attributes_view.update({
#                         'name': attribute_obj['name'],
#                         'screen_label_text': attribute_obj['name'], # TODO - set screen_label to actual value
#                         'attribute_id': attribute_obj['uirefid'],
#                         'path': attribute_obj['path']})
#                     
#                     if attribute_obj['information_level_id']:
#                         pass
#                         # attributes_view.update({'information_level': layout_objects[attribute_obj['information_level_id']]['level']})
# 
#                     block_view['attributes'].append(attributes_view)
#             
#             group_view['blocks'].append(block_view)
#             
#             if is_new_group:
#                 view_json['groups'].append(group_view)
# 
#     return layout_json

# def build_partials(layout_schema=None, interactions=None):
#     env = Environment()
#     env.loader = FileSystemLoader('templates')
#     tmpl_unparsed = env.get_template('ion-ux.html').render()
#     tmpl = ET.fromstring(tmpl_unparsed.encode('utf-8'))
#     body_elmt = tmpl.find('body')
#     # if layout_schema is None:
#     #     layout_schema = LayoutApi.layout_json_tree(LAYOUT_SCHEMA)
# 
#     for view_id, view_tree in layout_schema.iteritems():
#         script_elmt = ET.Element('script')
#         script_elmt.set('id', view_id)
#         script_elmt.set('type', 'text/template')
# 
#         pagename_container_elmt = ET.SubElement(script_elmt, 'div')
#         pagename_container_elmt.set('class', 'row-fluid')
#         pagename_emlt = ET.SubElement(pagename_container_elmt, 'div')
#         pagename_emlt.set('class', 'span12')
#         pagename_h1_elmt = ET.SubElement(pagename_emlt, 'h1')
#         pagename_h1_elmt.text = view_tree['screen_label']
# 
#         # Set columns here
#         column_container_elmt = ET.SubElement(script_elmt, 'div')
#         column_container_elmt.set('class', 'row-fluid')
#         column_one_elmt = ET.SubElement(column_container_elmt, 'div')
#         column_one_elmt.set('class', 'span2')
#         column_two_elmt = ET.SubElement(column_container_elmt, 'div')
#         column_two_elmt.set('class', 'span10')
# 
#         for group in view_tree['groups']:
#             # Temporary hack to text columns to circumvent UI database positioning errors.
#             if group['group_screen_label'] == 'Information':
#                 group_elmt = ET.SubElement(column_one_elmt, 'div')
#             else:
#                 group_elmt = ET.SubElement(column_two_elmt, 'div')
#             
#             group_elmt.set('id', group['group_id'])
#             group_h2_elmt = ET.SubElement(group_elmt, 'h2')
#             group_h2_elmt.text = group['group_screen_label']
#             
#             tab_ul_elmt = ET.SubElement(group_elmt, 'ul')
#             tab_ul_elmt.set('class', 'nav nav-tabs tabby')
#             tab_content_elmt = ET.SubElement(group_elmt, 'div')
#             tab_content_elmt.set('class', 'tab-content')
#             
#             for idx, block in enumerate(group['blocks']):
#                 # BLOCK HTML
#                 block_id = 'block_' + block['block_id']
#                 block_elmt = ET.SubElement(tab_content_elmt, 'div')
#                 block_elmt.set('id', block_id)
# 
#                 block_li_elmt = ET.SubElement(tab_ul_elmt, 'li')
#                 block_li_a_elmt = ET.SubElement(block_li_elmt, 'a', {'href': '#' + block['block_id'], 'data-toggle': 'tab'})
#                 block_li_a_elmt.text = block['name']
#                 
#                 if idx == 0:
#                     block_elmt.set('class', 'tab-pane active')
#                     block_li_elmt.set('class', 'active')
#                 else:
#                     block_elmt.set('class', 'tab-pane')
#                 
#                 # block_h3_elmt = ET.SubElement(block_elmt, 'h3')
#                 # block_h3_elmt.text = block['name']
#                 block_p_elmt = ET.SubElement(block_elmt, 'p')
# 
#         body_elmt.append(script_elmt)
# 
#     layout_elmt = ET.SubElement(body_elmt, 'script')
#     layout_elmt.set('id', 'layout')
#     layout_elmt.text = "var LAYOUT_OBJECT = %s;" % json.dumps(layout_schema)
# 
#     interactions_elmt = ET.SubElement(body_elmt, 'script')
#     interactions_elmt.set('id', 'interactions')
#     interactions_elmt.text = "var INTERACTIONS_OBJECT = %s;" % json.dumps(interactions)
# 
#     init_script_elmt = ET.Element('script')
#     init_script_elmt.set('type', 'text/javascript')
#     init_script_elmt.text = "$(function(){dyn_do_init();});"
#     body_elmt.append(init_script_elmt)
# 
#     tmpl = ET.tostring(tmpl)
#     h = HTMLParser.HTMLParser()
#     return h.unescape(tmpl)
