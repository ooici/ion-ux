/*
- Show/Hide 

- how will filter specific data/datypes be passed/used?

- visual' columns (e.g first col. in example) need corresponding pre image logic, and type-specific text or mapping.

- "+" row is not a "data element", put outside of datatable / allow click of row and modal or abs. pos. element below.

*/

TEST_TABLE_DATA = [
    {'aggregated_status':"Normal", 'name':"Platform AS02CPSM", 'uuid':274503, 'last_calibration_datetime':"05:12:33", 'description':"Last Note4.."},
    {'aggregated_status':"Alarm", 'name':"Platform AS02CPSM", 'uuid':174501,  'last_calibration_datetime':"05:12:33", 'description':"Last Note2.."},
    {'aggregated_status':"Normal", 'name':"Platform AS02CPSM", 'uuid':473508, 'last_calibration_datetime':"05:12:33", 'description':"Last Note5.."},
    {'aggregated_status':"Normal", 'name':"Platform AS02CPSM", 'uuid':271501, 'last_calibration_datetime':"05:12:33", 'description':"Last Note8.."},
    {'aggregated_status':"Unknown", 'name':"Platform AS02CPSM", 'uuid':275504, 'last_calibration_datetime':"05:12:33", 'description':"Last Note3.."},
    {'aggregated_status':"Normal", 'name':"Platform AS02CPSM", 'uuid':274500, 'last_calibration_datetime':"05:12:33", 'description':"Last Note1.."},
    {'aggregated_status':"Normal", 'name':"Platform AS02CPSM", 'uuid':974508, 'last_calibration_datetime':"05:12:33", 'description':"Last Note7.."},
    {'aggregated_status':"Alert", 'name':"Platform AS02CPSM", 'uuid':274508, 'last_calibration_datetime':"05:12:33",  'description':"Last Note6.."},
    {'aggregated_status':"Unknown", 'name':"Platform AS02CPSM", 'uuid':275504, 'last_calibration_datetime':"05:12:33", 'description':"Last Note3.."}
]



/* The below will be View instance attrs: */
OPERATORS = ['CONTAINS', 'NEWER THAN', 'OLDER THAN', 'GREATER THAN', 'LESS THAN'];
COLUMNS = _.map(TEST_TABLE_DATA.headers, function(e){return e['sTitle']});
COLUMNS_FILTERABLE = _.reject(COLUMNS, function(e){return e==""}); 


function status_indicator(obj){
    var stat = obj.aData[obj.iDataColumn];
    var pos_map = {"Uknown":"0px 0px", "Normal":"0px -20px", "Alert":"0px -40px", "Alarm":"0px 18px"};
    var stat_pos = pos_map[stat];
    var html = "<div class='status_indicator_sprite' style='background-position:"+stat_pos+"' title='"+stat+"'>&nbsp;</div>";
    return html;
}


IONUX.Views.DataTable = IONUX.Views.Base.extend({

    events: {
        "click .filter-add":"add_filter_item",
        "click .filter-remove":"remove_filter_item",
        "click .show-hide-filters":"show_hide_filters",
        "click .filters-apply":"filters_apply",
        "click .filters-reset":"filters_reset",
    },

    template: _.template($('#datatable-tmpl').html()),

    initialize: function() {
        this.render().el;
    },
    render: function() {
        this.$el.html(this.template());
        var header_data = this.header_data();
        var table_data = this.table_data(this.options.data);
        this.datatable = this.$el.find(".datatable-container table").dataTable({
            "sDom":"Rlfrtip",
            "aaData":table_data,
            "aoColumns":header_data
        });
        return this;
    },

    _get_table_metadata: function(){
        var table_metadata_id = "TABLE_"+this.$el.attr("id");
        var table_metadata = window[table_metadata_id];
        return table_metadata;
    },

    header_data: function(){
        var data = [];
        var table_metadata = this._get_table_metadata();
        var self = this;
        _.each(table_metadata, function(item){
            var data_item = {};
            data_item["sTitle"] = item[1];
            data_item["sType"] = "title";
            data_item["fnRender"] = self.preproccesor(item[0]);
            data_item["sClass"] = "center"; //TODO choose dependant on 'item[0]'
            data.push(data_item);
        });
        return data;
    },

    table_data: function(data_objs){
        var data = [];
        var table_metadata = this._get_table_metadata();
        var data_keys = _.map(table_metadata, function(arr){return arr[2];});
        var self = this;
        _.each(data_objs, function(data_obj){
            var data_row = []
            _.each(data_keys, function(key){
                data_row.push(data_obj[key]);
            });
            data.push(data_row);
        });
        return data;
    },

    preproccesor: function(data_type){
        switch(data_type){
            case "icon_ooi":
                return status_indicator; //TODO namespace these
            case "text_short_ooi":
                return function(obj){return obj.aData[obj.iDataColumn];}; //noop
            case "text_extended_ooi":
                return function(obj){return obj.aData[obj.iDataColumn];}; //noop
            default:
                return function(obj){return obj.aData[obj.iDataColumn];};
        }
    },

    add_filter_item: function(evt){
        var filter_item_tmpl = [
          '<div class="filter-item">',
            '<select class="column"><% _.each(columns, function(e){%> <option value="<%= e.replace(/ /g, "_") %>"><%= e %></option><%});%></select>',
            '<select class="operator"><% _.each(operators, function(e){%> <option value="<%= e.replace(/ /g, "_") %>"><%= e %></option><%});%></select>',
            '<input class="argument" type="text" value="">',
            '<span class="filter-add">+</span><span class="filter-remove">-</span>',
          '</div>'].join('');
        var data = {"columns":COLUMNS_FILTERABLE, "operators":OPERATORS};
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
            target.text("CLOSE").removeClass("hidden");
            this.add_filter_item(null);
            filter_items.slideDown("fast", function(){ filter_controls.show();});
        } else {
            target.text("FILTER").addClass("hidden");
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
            var selected_index = _.indexOf(COLUMNS, selected_val);
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
    }
});
