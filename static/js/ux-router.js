// Temp: this will be delivered via the template preprocessor.
AVAILABLE_LAYOUTS = {
    'face': '2163152',
    'status': '2163153',
    'related': '2163154',
    'dashboard': '2163156'
};

IONUX.Router = Backbone.Router.extend({
    routes: {
        "": "dashboard",
        ":resource_type/list/": "collection",
        ":resource_type/command/:resource_id/": "command",
        ":resource_type/:view_type/:resource_id/" : "page",
        // "instruments/:instrument_id/command/": "instrument_command_facepage",
        // "userprofile/": "user_profile",
    },
    
    dashboard: function(){
        this._reset();
    },
    
    // Collection 'face pages'
    collection: function(resource_type){
        $('#error').hide();
        $('#dynamic-container').show();
        $('#dynamic-container').html($('#2163152').html());
        $('.span9 li,.span3 li').hide();
        
        var resources = new IONUX.Collections.Resources(null, {resource_type: resource_type});
        resources.fetch().success(function(data){
            $('li.Collection ,div.Collection').show(); // Show elements based on current view/CSS class, i.e. .InstrumentDevice
            $('.span9 ul').find('li.Collection:first').find('a').click(); // Manually Set the first tabs 'active'
            
            // Todo: better way of finding the container for the collection.
            var elmt_id = $('.Collection .table_ooi:first').parent('div').attr('id');
            var resource_collection = new IONUX.Collections.Resources(data.data, {resource_type: resource_type});
            new IONUX.Views.Collection({el: '#' + elmt_id, collection: resource_collection, resource_type: resource_type}).render().el;
        });
    },
    
    // Face, status, related pages
    page: function(resource_type, view_type, resource_id){
        $('#error').hide();
        $('#dynamic-container').show();
        $('#dynamic-container').html($('#' + AVAILABLE_LAYOUTS[view_type]).html());        
        $('.span9 li,.span3 li').hide();
        
        var resource_extension = new IONUX.Models.ResourceExtension({resource_type: resource_type, resource_id: resource_id});
        resource_extension.fetch()
            .success(function(model, resp) {
                render_page(resource_type, model);
            })
            .error(function(model, resp) {
                render_error();
            });
    },
    
    command: function(resource_type, resource_id){
        var resource_extension = new IONUX.Models.ResourceExtension({resource_type: 'InstrumentDevice', resource_id: resource_id});
        var instrument_command = new IONUX.Views.InstrumentCommandFacepage({model: resource_extension});
        resource_extension.fetch();
        window.MODEL_DATA = resource_extension;
    },
    
    // KEPT FOR REFERENCE
    // user_profile: function() {
    //     this._reset();
    //     var fpModel = new IONUX.Models.UserRegistrationModel();
    //     new IONUX.Views.UserRegistration({model:fpModel});
    //     fpModel.fetch();
    // },
  
    // KEPT FOR REFERENCE - ALEX'S USER REQUESTS
    // observatory_facepage: function(observatory_id){
    //     this._reset();
    //     var fpModel = new IONUX.Models.ObservatoryFacepageModel({observatory_id:observatory_id});
    //     new IONUX.Views.ObservatoryFacepage({model:fpModel});
    //     fpModel.fetch();
    // 
    //     var urCollection = new IONUX.Collections.UserRequestCollection();
    //     urCollection.observatory_id = observatory_id; //XXX better way to set this?
    //     var userRequestsView = new IONUX.Views.UserRequestsView({collection:urCollection, facepage_model: fpModel});
    //     urCollection.fetch();
    // },
        
    handle_navigation: function(){
        var self = this;
        $(document).on("click", "a", function(e) {
            if ($(e.target).hasClass('external')) return true;
            
            // Catch Bootstrap's tabs hash so URL doesn't change, example: "InstrumentDevice/list/" to "/2150593"
            if ($(e.target).attr('data-toggle') == 'tab') return true;
            self.navigate($(this).attr('href'), {trigger:true});
            return false;
        });
    },

    // graceful Backbone handling of full page refresh on non '/' url.
    handle_url: function(current_url){
        if (current_url != "/"){
            this.navigate(current_url, {trigger:true});
        }
    },

    _reset: function(){ //reset the UI
        $(".viewcontainer").hide();
    }

});


// Prepare response from server for IONUX.Views.DataTable;
// function prepare_table_data(data, columns) {
//     var table = {headers: [], data: []}
//     
//     // // Headers
//     // if (!columns) var columns = _.keys(data[0]);
//     // _.each(columns, function(column){
//     //     table.headers.push({'sTitle': column});
//     // });
//     
//     // Data
//     _.each(data, function(row) {
//         var row_values = _.pick(row, columns);
//         var row_array = _.toArray(row_values);
//         table.data.push(row_array);
//     });
//     return table
// };


// Get values from string notation, example:
// <div data-path="resource.serial_number"> will
// result in ['resource']['serial_number']
function get_descendant_properties(obj, desc) {
    var arr = desc.split(".");
    while(arr.length && (obj = obj[arr.shift()]));
    return obj;
};

function render_page(resource_type, model) {
    
    // Catch specific routes that need generic resources...
    if (resource_type == 'InstrumentModel' || resource_type == ('PlatformModel')) {
        var resource_type = 'DeviceModel';
    } else if (resource_type == 'Observatory') {
        var resource_type = 'Org'
    };
    
    window.MODEL_DATA = model.data;

    var attribute_group_elmts = $('.'+resource_type+' .attribute_group_ooi');
    _.each(attribute_group_elmts, function(el){
        var data_path = $(el).data('path');
        var data = get_descendant_properties(window.MODEL_DATA, data_path);
                
        new IONUX.Views.AttributeGroup({el: $(el), data: window.MODEL_DATA}).render().el;
        append_info_level(el);
    });

    var text_static_elmts = $('.'+resource_type+' .text_static_ooi');
    _.each(text_static_elmts, function(el){
        new IONUX.Views.TextStatic({el: $(el)}).render().el;
        append_info_level(el);
    });

    var text_short_elmts = $('.'+resource_type+' .text_short_ooi');
    _.each(text_short_elmts, function(el){
        new IONUX.Views.TextShort({el: $(el), data_model: window.MODEL_DATA}).render().el;
        append_info_level(el);
    });

    var text_extended_elmts = $('.'+resource_type+' .text_extended_ooi');
    _.each(text_extended_elmts, function(el){
        new IONUX.Views.TextExtended({el: $(el), data_model: window.MODEL_DATA}).render().el;
        append_info_level(el);
    });

    var icon_elmts = $('.'+resource_type+' .icon_ooi');
    _.each(icon_elmts, function(el) {
        new IONUX.Views.Icon({el: $(el)}).render().el;
        append_info_level(el);
    });

    var image_elmts = $('.'+resource_type+' .image_ooi');
    _.each(image_elmts, function(el) {
        new IONUX.Views.Image({el: $(el)}).render().el;
        append_info_level(el);
    });

    var badge_elmts = $('.'+resource_type+' .badge_ooi');
    _.each(badge_elmts, function(el) {
        new IONUX.Views.Badge({el: $(el), data_model: window.MODEL_DATA}).render().el;
        append_info_level(el);
    });
    
    var list_elmts = $('.'+resource_type+' .list_ooi');
    _.each(list_elmts, function(el) {
        new IONUX.Views.List({el: $(el), data_model: window.MODEL_DATA}).render().el;
    });
    
    var table_elmts = $('.'+resource_type+' .table_ooi');
    _.each(table_elmts, function(el) {
        var data_path = $(el).data('path');
        
        if (!data_path.substring(0,6) == 'unknown') {
            var raw_table_data = window.MODEL_DATA[data_path];
            var raw_table_data = get_descendant_properties(window.MODEL_DATA, data_path);
            new IONUX.Views.DataTable({el: $(el), data: raw_table_data});
        } else {
            // new IONUX.Views.DataTable({el: $(el), data: []});
        };
    });
    
    var extent_geospatial_elmts = $('.'+resource_type+' .extent_geospatial_ooi');
    _.each(extent_geospatial_elmts, function(el) {
        new IONUX.Views.ExtentGeospatial({el: $(el)}).render().el;
    });

    var extent_vertical_elmts = $('.'+resource_type+' .extent_vertical_ooi');
    _.each(extent_vertical_elmts, function(el) {
        new IONUX.Views.ExtentVertical({el: $(el)}).render().el;
    });

    var extent_temporal_elmts = $('.'+resource_type+' .extent_temporal_ooi');
    _.each(extent_temporal_elmts, function(el) {
        new IONUX.Views.ExtentTemporal({el: $(el)}).render().el;
    });

    var checkbox_elmts = $('.'+resource_type+' .checkbox_ooi');
    _.each(checkbox_elmts, function(el) {
        new IONUX.Views.Checkbox({el: $(el), data_model: window.MODEL_DATA}).render().el;
    });
    
    // Show the relevant elements and click to enable the Bootstrap tabs.
    $('li.' + resource_type + ', div.' + resource_type).show();
    $('.span9 ul, .span3 ul').find('li.' + resource_type + ':first').find('a').click();
    
    $('.tab-pane').find('.'+resource_type+':visible:first').css('margin-left', 0)
};

function render_error(){
    $('#dynamic-container').hide();
    $('#error').show();
};

function append_info_level(el) {
    // var info_level = $(el).data('level');
    // if (info_level || info_level == '0') {
    //     $(el).append('<span class="label label-important info-level" style="background:green;color:white;">'+info_level+'</div>');
    // };
};