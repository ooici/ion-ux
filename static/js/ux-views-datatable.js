/*

- Need a way to create links, see items marked KEEPING FOR REFERENCE below.

- Show/Hide 

- how will filter specific data/datypes be passed/used?

- visual' columns (e.g first col. in example) need corresponding pre image logic, and type-specific text or mapping.

- "+" row is not a "data element", put outside of datatable / allow click of row and modal or abs. pos. element below.

*/

TEST_TABLE_DATA = [
    {'aggregated_status':"Normal", 'name':"Platform 0 -AS02CPSM", 'uuid':274503, 'last_calibration_datetime':"05:12:33", 'description':"Last Note4..", "_id":"a0bc123", "type_":"InstrumentDevice", 'timestamp':1156049834855},
    {'aggregated_status':"Alarm", 'name':"Platform 1 - AS02CPSM", 'uuid':174501,  'last_calibration_datetime':"05:12:33", 'description':"Last Note2..", "_id":"a1bc123", "type_":"PlatformDevice", 'timestamp':1256049834855},
    {'aggregated_status':"Normal", 'name':"Platform 2 - AS02CPSM", 'uuid':473508, 'last_calibration_datetime':"05:12:33", 'description':"Last Note5..", "_id":"a2bc123", "type_":"InstrumentDevice", 'timestamp':1356049834855},
    {'aggregated_status':"Normal", 'name':"Platform 6 -AS02CPSM", 'uuid':271501, 'last_calibration_datetime':"05:12:33", 'description':"Last Note8..", "_id":"a3bc123", "type_":"PlatformDevice", 'timestamp':1456049834855},
    {'aggregated_status':"Unknown", 'name':"Platform 4 - AS02CPSM", 'uuid':275504, 'last_calibration_datetime':"05:12:33", 'description':"Last Note3..", "_id":"a4bc123", "type_":"InstrumentDevice", 'timestamp':1336049834855},
    {'aggregated_status':"Normal", 'name':"Platform 0 -AS02CPSM", 'uuid':274503, 'last_calibration_datetime':"05:12:33", 'description':"Last Note4..", "_id":"a0bc123", "type_":"InstrumentDevice", 'timestamp':1156049834855},
    {'aggregated_status':"Normal", 'name':"Platform 5 - AS02CPSM", 'uuid':274500, 'last_calibration_datetime':"05:12:33", 'description':"Last Note1..", "_id":"a5bc123", "type_":"InstrumentDevice", 'timestamp':1136049834855},
    {'aggregated_status':"Normal", 'name':"Platform 6 - AS02CPSM", 'uuid':974508, 'last_calibration_datetime':"05:12:33", 'description':"Last Note7..", "_id":"a6bc123", "type_":"InstrumentDevice", 'timestamp':1806049834855},
    {'aggregated_status':"Alarm", 'name':"Platform 1 - AS02CPSM", 'uuid':174501,  'last_calibration_datetime':"05:12:33", 'description':"Last Note2..", "_id":"a1bc123", "type_":"PlatformDevice", 'timestamp':1256049834855},
    {'aggregated_status':"Normal", 'name':"Platform 6 - AS02CPSM", 'uuid':974508, 'last_calibration_datetime':"05:12:33", 'description':"Last Note7..", "_id":"a6bc123", "type_":"InstrumentDevice", 'timestamp':1806049834855},
    {'aggregated_status':"Alarm", 'name':"Platform 1 - AS02CPSM", 'uuid':174501,  'last_calibration_datetime':"05:12:33", 'description':"Last Note2..", "_id":"a1bc123", "type_":"PlatformDevice", 'timestamp':1256049834855},
    {'aggregated_status':"Normal", 'name':"Platform 0 -AS02CPSM", 'uuid':274503, 'last_calibration_datetime':"05:12:33", 'description':"Last Note4..", "_id":"a0bc123", "type_":"InstrumentDevice", 'timestamp':1156049834855},
    {'aggregated_status':"Normal", 'name':"Platform 6 - AS02CPSM", 'uuid':974508, 'last_calibration_datetime':"05:12:33", 'description':"Last Note7..", "_id":"a6bc123", "type_":"InstrumentDevice", 'timestamp':1806049834855},
    {'aggregated_status':"Alert", 'name':"Platform 7 - AS02CPSM", 'uuid':274508, 'last_calibration_datetime':"05:12:33",  'description':"Last Note6..", "_id":"a7bc123", "type_":"PlatformDevice", 'timestamp':1726049834855},
    {'aggregated_status':"Normal", 'name':"Platform 6 - AS02CPSM", 'uuid':974508, 'last_calibration_datetime':"05:12:33", 'description':"Last Note7..", "_id":"a6bc123", "type_":"InstrumentDevice", 'timestamp':1806049834855},
    {'aggregated_status':"Normal", 'name':"Platform 6 - AS02CPSM", 'uuid':974508, 'last_calibration_datetime':"05:12:33", 'description':"Last Note7..", "_id":"a6bc123", "type_":"InstrumentDevice", 'timestamp':1806049834855},
    {'aggregated_status':"Alert", 'name':"Platform 7 - AS02CPSM", 'uuid':274508, 'last_calibration_datetime':"05:12:33",  'description':"Last Note6..", "_id":"a7bc123", "type_":"PlatformDevice", 'timestamp':1726049834855},
    {'aggregated_status':"Unknown", 'name':"Platform 6 - AS02CPSM", 'uuid':275504, 'last_calibration_datetime':"05:12:33", 'description':"Last Note3..", "_id":"a8bc123", "type_":"PlatformDevice", 'timestamp':1056049834855}
]


/* The below will be View instance attrs: */
OPERATORS = ['CONTAINS', 'NEWER THAN', 'OLDER THAN', 'GREATER THAN', 'LESS THAN'];

IONUX.Views.DataTable = IONUX.Views.Base.extend({

    events: {
        "click .filter-add":"add_filter_item",
        "click .filter-remove":"remove_filter_item",
        "click .show-hide-filters":"show_hide_filters",
        "click .filters-apply":"filters_apply",
        "click .filters-reset":"filters_reset",
        "click table tbody tr":"table_row_click",
        "click th": "apply_sort_indicator"
    },

    template: _.template($('#datatable-tmpl').html()),
    
    apply_sort_indicator: function(e) {
      // This method inserts an icon template to apply styles
      // defined in the UX graphic design spec (asc/desc arrows 
      // at the end of column name). Will re-examine pure 
      // DataTables API/CSS as time permits.
      
      var asc_tmpl = '<span class="sort-indicator asc">&nbsp;</span>';
      var desc_tmpl = '<span class="sort-indicator desc">&nbsp;</span>';
      
      this.$el.find('.sort-indicator').remove();
      
      if (this.$el.find('.sorting_asc').length) {
        var th_elmt = this.$el.find('.sorting_asc');
      } else {
        var th_elmt = this.$el.find('.sorting_desc');
      };
      
      // Check the class datatable
      if (th_elmt.hasClass('sorting_asc')) {
        th_elmt.append(asc_tmpl);
      } else {
        th_elmt.append(desc_tmpl);
      };
      
      // Re-adjust column widths
      this.datatable.fnAdjustColumnSizing()
    },
    
    initialize: function() {
        this.render().el;
        var self = this;
        $(window).resize(function(){
           self.datatable.fnAdjustColumnSizing();
        });
    },
    render: function() {
        this.$el.html(this.template());
        var header_data = this.header_data();
        var table_data = this.table_data(this.options.data);
        this.sort_order();
        
        var self = this;
        this.datatable = this.$el.find(".datatable-container table").dataTable({
            "sDom":"Rlfrtip",
            "aaData":table_data,
            "aoColumns":header_data,
            "bInfo":false,
            'bPaginate':false,
            "sScrollY": "300px",
            "sScrollYInner": "110%",
            "bScrollCollapse": true,
            "sScrollXInner": "100%",
            // Add title to cells, better way to do this?
            "fnRowCallback": function(nRow, aData, iDisplayIndex, iDisplayIndexFull) {
              $('td', nRow).each(function() {
                $(this).attr('title', $(this).text());
              });
            },
        });
        
        if (this.sort_order_array) this.datatable.fnSort(this.sort_order_array);
        if (this.options.data.length == 0) this.$el.find(".dataTables_scrollBody").css("overflow", "hidden");
        this.apply_sort_indicator();
        
        return this;
    },
    
    sort_order: function() {
      var table_id = this.$el.attr('id');
      var table_metadata = this._get_table_metadata();

      // console.log('-----------------------------------');
      // console.log(table_id, this.$el.data('path'), table_metadata);
      
      var get_sort_order_idx = function(column_name) {
        var sort_order_idx;
        
        _.every(table_metadata, function(val,idx) {
          if (_.contains(val, column_name)) {
            sort_order_idx = idx;
            return false; // break _.every loop
          } else {
            return true; // continue _.every loop
          };
        });
        
        return sort_order_idx;
      };
      
      switch(table_id){
        // NOTE: some indexes require +1 because of hidden columns, i.e. resource_type.
        case '2163011': // events
          this.sort_order_array = [[get_sort_order_idx('ts_created') + 1, 'desc']];
          break;
        case '2164033': // variables
          this.sort_order_array = [[get_sort_order_idx('display_name') + 1, 'asc']];
          break;
        case '2164742': // connected devices
          this.sort_order_array = [[get_sort_order_idx('Node') + 1, 'asc']];
          break;
        case '2164477': // members table
          var last_name_idx = get_sort_order_idx('Last') + 1;
          var first_name_idx = get_sort_order_idx('First') + 1; // not currently used
          this.sort_order_array = [[last_name_idx, 'asc']];
          break;
        default:
          this.sort_order_array = [[get_sort_order_idx('name') + 1, 'asc']];
      };
    },
    
    _get_table_metadata: function(){
        var table_metadata_id = "TABLE_"+this.$el.attr("id");
        var table_metadata = window[table_metadata_id];
        var visibility_level = this.options.visibility_level?this.options.visibility_level:0;
        var table_metadata_for_level = _.filter(table_metadata, function(l){return parseInt(l[4]) <= visibility_level});
        return table_metadata_for_level;
    },

    header_data: function(){
        var data = [{"bSearchable": false, "bVisible":false}]; //Initialize with hidden 'row info' element header element.
        var table_metadata = this._get_table_metadata();
        var self = this;
        _.each(table_metadata, function(item){
            var data_item = {};
            data_item["sTitle"] = item[1];
            data_item["sType"] = "title";
            data_item["fnRender"] = self.preproccesor(item[0], item[1]);
            data_item["sClass"] = "center"; //TODO choose dependant on 'item[0]'
            data.push(data_item);
        });

        // blank column for popup column
        if (this.options.hasOwnProperty('popup_view')) {
          data.push({sTitle: "", sType: "title", sClass: "center"});
        }

        return data;
    },

    table_data: function(data_objs){
        var data = [];
        var table_metadata = this._get_table_metadata();
        var data_keys = _.map(table_metadata, function(arr){return arr[2];});
        var self = this;
        _.each(data_objs, function(data_obj, index){

            // type_ (elasticsearch results)
            if (data_obj.hasOwnProperty('_type')) {
               var resource_type = data_obj['_type'];
            // alt_resource_type for PlatformSite only
            } else if (data_obj['type_'] == 'PlatformSite' && data_obj.hasOwnProperty('alt_resource_type')) {
                var resource_type = data_obj['alt_resource_type'];
            } else {
               var resource_type = data_obj['type_'];
            };
            
            var data_row = [data_obj['_id'] + "::" + resource_type]; //Initialize with hidden 'row info' element data element.
            _.each(data_keys, function(key){
                // Needed to check for variable and look up full path if found.
                if (key.match('@index')) {
                    var new_key = key.replace(/@index/, index);
                    var value = get_descendant_properties(window.MODEL_DATA, new_key);
                // Todo subclass, check if search result...
                } else if (data_obj['_source']) {
                    var value = data_obj['_source'][key];
                } else {
                    var value = get_descendant_properties(data_obj, key);
                }
                if (_.isUndefined(value)) value = "[" + key + "]";
                data_row.push(value);
            });
            
            // insert false column for popup
            if (self.options.hasOwnProperty('popup_view')) {
              if (self.options.popup_filter_method(data_row)) {
                var label = self.options.popup_label || "Options";
                data_row.push(label);
              } else {
                data_row.push('');
              }
            }

            // Temp fix to block associations from appearing in search results.
            // Need to sub-class this view eventually.
            if (resource_type != 'Association') data.push(data_row);
        });
        return data;
    },

    status_indicator: function(obj){
        switch(obj.aData[obj.iDataColumn]){
            case 2:
                var status = 'STATUS: OK';
                var status_css = 'status_ok_mini';
                break;
            case 3:
                var status = 'STATUS: WARNING';
                var status_css = 'status_warning_alert_mini';
                break;
            case 4:
                var status = 'STATUS: CRITICAL';
                var status_css = 'status_critical_alert_mini';
                break;
            default:
                var status = 'STATUS: UNKNOWN';
                var status_css = 'status_unknown_mini';
        };

        var html = "<div class='sprite "+status_css+"' title='"+status+"'>&nbsp;</div>";
        return html;    
    },

    type_indicator: function(obj){
        var resource_type = obj.aData[obj.iDataColumn];
        switch(resource_type){
            case "InstrumentDevice":
                var type_css = 'instrument_mini';
                break;
            case "PlatformDevice":
                var type_css = 'platform_mini';
                break;
            case "Org":
                var type_css = 'observatory_mini';
                break;
            case "DataProduct":
                var type_css = 'data_product_mini';
                break;
            case "SensorDevice":
                var type_css = 'sensor_mini';
                break;
            case "Site":
                var type_css = 'site_mini';
                break;
            case "Observatory":
                var type_css = 'site_mini';
                break;
            case "Subsite":
                var type_css = 'site_mini';
                break;
            case "PlatformSite":
                var type_css = 'site_mini';
                break;
            case "InstrumentSite":
                var type_css = 'site_mini';
                break;
            case "Attachment":
                var type_css = 'attachment_mini';
                break;
            case "DataProducer":
                var type_css = 'data_producer_mini';
                break;
            case "Dataset":
                var type_css = 'data_set_mini';
                break;
            case "Deployment":
                var type_css = 'deployment_mini';
                break;
            default:
                var type_css = 'resource_mini';
        };
        
        var html = "<div class='sprite "+type_css+"' title='"+resource_type+"'>&nbsp;</div>";
        return html;
    },

    preproccesor: function(element_type, element_name){
        var self = this;
        if (element_type == "icon_ooi" && element_name == "NO LABEL"){
            return self.status_indicator;
        }
        if (element_type == "icon_ooi" && element_name == "Type"){
           return self.type_indicator 
        }
        if (element_type == "icon_ooi"){
            return self.status_indicator;
        }
        /*
        var named_type_indicator = function(data){return self.type_indicator(element_name, data)};
        if (element_type == "text_short_ooi"){
              if (element_name != "Modified") return named_type_indicator;
        }
        if (element_type == "text_extended_ooi"){
                return named_type_indicator;
        }*/
        return function(obj){return obj.aData[obj.iDataColumn];};
    },

    get_filter_columns:function(){
        var table_metadata = this._get_table_metadata();
        var columns = _.map(table_metadata, function(l){return l[1];});
        return columns;
    },

    facepage_link: function (obj) {
        var self = this;
        if (obj.iDataColumn == 1) {
            var id_position = obj.aData.length -1;
            var name = obj.aData[obj.iDataColumn];
    
            var resource_id = obj.aData[id_position];
            var resource_type = obj.aData[3];
            var url = "/"+resource_type+"/face/"+resource_id+"/";
            var html = '<a href="'+url+'">'+name+'</a>';
            return html;
        } else {
            return obj.aData[obj.iDataColumn];
        };
    },

    add_filter_item: function(evt){
        var filter_item_tmpl = [
          '<div class="filter-item">',
            '<select class="column"><% _.each(columns, function(e){%> <option value="<%= e.replace(/ /g, "_") %>"><%= e %></option><%});%></select>',
            '<select class="operator"><% _.each(operators, function(e){%> <option value="<%= e.replace(/ /g, "_") %>"><%= e %></option><%});%></select>',
            '<input class="argument" type="text" value="">',
            '<span class="filter-add"></span><span class="filter-remove"></span>',
          '</div>'].join('');
        var columns = this.get_filter_columns();
        var data = {"columns":columns, "operators":OPERATORS};
        var filter_item = _.template(filter_item_tmpl)(data);
        if (evt == null){
            var filter_items = this.$el.find(".filter-item");
            if (filter_items.length == 0){
                this.$el.find(".filter-items").append(filter_item);
            }
        } else {
            var target = $(evt.target);
            target.parent().after(filter_item);
        }
    },

    show_hide_filters: function(evt){
        var target = $(evt.target);
        var filter_items = this.$el.find(".filter-items");
        var filter_controls = this.$el.find(".filter-controls");
        if (target.hasClass("hidden")){ 
            target.removeClass("hidden").addClass('active');
            this.add_filter_item(null);
            filter_items.slideDown("fast", function(){ filter_controls.show();});
            this.$el.find('.filter-remove').first().hide(); // Hide the first minus (-) button per spec from designers.
        } else {
            target.addClass("hidden").removeClass('active');
            filter_controls.hide();
            filter_items.slideUp("fast");
        }
    },

    remove_filter_item: function(evt){
        var this_filter_item = $(evt.target).parent();
        var filter_items = this.$el.find(".filter-item");
        if (filter_items.length > 1) {
            this_filter_item.remove();
            return;
        }
        //todo: remove single filter: this.datatable.fnFilter('', filter_index);
    },

    filters_apply: function(evt){
        var filter_items = this.$el.find(".filter-items");
        var self = this;
        filter_items.find(".filter-item").each(function(i, filter_item){
            var selected_val = $(filter_item).find("select.column option:selected").text();
            var columns = self.get_filter_columns();
            var selected_index = _.indexOf(columns, selected_val)+1; // '+1' because of the hidden metadata table;
            var filter_val = $(filter_item).find("input").val();
            self.datatable.fnFilter(filter_val, selected_index);
        });
    },

    filters_reset: function(evt){
        var filter_items = this.$el.find(".filter-items");
        filter_items.find("input").each(function(i, e){
            $(e).val("");
        });
        this.datatable.fnFilterClear();
    },

    table_row_click: function(evt){
        evt.preventDefault();
        var target = $(evt.target);
        var row_index = target.parent().index();
        var data_index = this.datatable.fnSettings().aiDisplay[row_index];
        var table_row_data = this.datatable.fnGetData(data_index);
        var row_info_list = table_row_data[0].split("::");
        var resource_id = row_info_list[0];
        var resource_type = row_info_list[1];
        
        if (resource_type.match(/Event$/)) return false;
          
          if (this.options.hasOwnProperty('popup_view') && this.options.popup_filter_method(table_row_data)) {
            new this.options.popup_view({data:table_row_data, datatable:this.datatable}).render().el;
            return;
          }
          
          var url = "/"+resource_type+"/face/"+resource_id+"/";
          IONUX.ROUTER.navigate(url, {trigger:true});
    }
});
