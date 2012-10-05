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
        $('.span9 li,.span3 li').hide(); // Hide all elements
        
        var resources = new IONUX.Collections.Resources(null, {resource_type: resource_type});
        resources.fetch().success(function(data){
            // Todo: clean up.
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
        
        var page_model = new IONUX.Models.ResourceExtension({resource_type: resource_type, resource_id: resource_id});
        page_model.fetch()
            .success(function(model, resp) {
                render_page(resource_type, model);
            })
            .error(function(model, resp) {
                render_error();
            });
    },
    
    command: function(resource_type, resource_id){
        var fpModel = new IONUX.Models.InstrumentFacepageModel({instrument_id: resource_id});
        new IONUX.Views.InstrumentCommandFacepage({model: fpModel});
        fpModel.fetch();        
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
            // Catch Bootstrap's tabs so URL doesn't change, example: "InstrumentDevice/list/" to "/2150593"
            // Todo: append hash to the end of URL for bookmarkable tabs.
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
function prepare_table_data(data, columns) {
    var table = {headers: [], data: []}
    
    // Headers
    if (!columns) var columns = _.keys(data[0]);
    _.each(columns, function(column){
        table.headers.push({'sTitle': column});
    });
    
    // Data
    _.each(data, function(row) {
        var row_values = _.pick(row, columns);
        var row_array = _.toArray(row_values);
        table.data.push(row_array);
    });
    return table
};


// Get values from string notation, example:
// <div data-path="resource.serial_number"> will
// result in ['resource']['serial_number']
function get_descendant_properties(obj, desc) {
    var arr = desc.split(".");
    while(arr.length && (obj = obj[arr.shift()]));
    return obj;
};


function render_page(resource_type, model) {
    // Put in global namespance for development/manual inspection
    
    window.model = model.data;

    var attribute_group_elmts = $('.InstrumentDevice .attribute_group_ooi');
    _.each(attribute_group_elmts, function(el) {
        new IONUX.Views.AttributeGroup({el: $(el)}).render().el;
        append_info_level(el);
    });

    var text_static_elmts = $('.InstrumentDevice .text_static_ooi');
    _.each(text_static_elmts, function(el){
        new IONUX.Views.TextStatic({el: $(el)}).render().el;
        append_info_level(el);
    });

    var text_short_elmts = $('.InstrumentDevice .text_short_ooi');
    _.each(text_short_elmts, function(el){
        new IONUX.Views.TextShort({el: $(el), data_model: window.model}).render().el;
        append_info_level(el);
    });

    var text_extended_elmts = $('.InstrumentDevice .text_extended_ooi');
    _.each(text_extended_elmts, function(el){
        new IONUX.Views.TextExtended({el: $(el), data_model: window.model}).render().el;
        append_info_level(el);
    });

    var icon_elmts = $('.InstrumentDevice .icon_ooi');
    _.each(icon_elmts, function(el) {
        new IONUX.Views.Icon({el: $(el)}).render().el;
        append_info_level(el);
    });

    var image_elmts = $('.InstrumentDevice .image_ooi');
    _.each(image_elmts, function(el) {
        new IONUX.Views.Image({el: $(el)}).render().el;
        append_info_level(el);
    });

    var badge_elmts = $('.InstrumentDevice .badge_ooi');
    _.each(badge_elmts, function(el) {
        new IONUX.Views.Badge({el: $(el), data_model: window.model}).render().el;
        append_info_level(el);
    });

    var table_elmts = $('.InstrumentDevice .table_ooi');
    _.each(table_elmts, function(el) {
        var data_path = $(el).data('path');
        if (data_path) {
            var raw_table_data = window.model[data_path];
            var table_data = prepare_table_data(raw_table_data, ['description', 'name', '_id']);
            var columns = ['description, name, _id'];
            new IONUX.Views.DataTable({el: $(el), data: table_data});
        } else {
            new IONUX.Views.DataTable({el: $(el), data: TABLE_DATA});

            // TEMP: make obvious what's not integrated yet.
            $(el).find('.filter-header, .dataTables_wrapper').css('background', 'red');
        };
    });
    
    // Show the relevant elements and click to enable the Bootstrap tabs.
    $('li.' + resource_type + ',div.' + resource_type).show();
    $('.span9 ul, .span3 ul').find('li.' + resource_type + ':first').find('a').click();
};

function render_error(){
    $('#dynamic-container').hide();
    $('#error').show();
};

function append_info_level(el) {
    var info_level = $(el).data('level');
    if (info_level || info_level == '0') {
        $(el).append('<span class="label label-important info-level" style="background:green;color:white;">'+info_level+'</div>');
    };
};