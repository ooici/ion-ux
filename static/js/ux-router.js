// Temp: this will come with the preprocessed templates eventually.
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
    
    // Handles collection 'face pages'
    collection: function(resource_type){
        var resources = new IONUX.Collections.Resources(null, {resource_type: resource_type});
        
        // Manually insert template
        $('#dynamic-container').show();
        $('#dynamic-container').html($('#2163152').html());
        $('.span9 li,.span3 li').hide(); // Hide all elements
        
        resources.fetch().success(function(data){
            // Todo: clean up.
            $('li.Collection ,div.Collection').show(); // Show elements based on current view/CSS class, i.e. .InstrumentDevice
            $('.span9 ul').find('li.Collection:first').find('a').click(); // Manually Set the first tabs 'active'
            
            // Todo: better way of finding the container for the collection.
            var elmt_id = $('.Collection .table:first').parent('div').attr('id');
            
            // Temp: render hybrid collectionview
            // var table_data = prepareTableData(data.data, ['name', '_id', 'type_']);
            // new IONUX.Views.DataTable({el: '#' + elmt_id, data: table_data});

            var resource_collection = new IONUX.Collections.Resources(data.data, {resource_type: resource_type});
            new IONUX.Views.Collection({el: '#' + elmt_id, collection: resource_collection, resource_type: resource_type}).render().el;
        });
    },
    
    // Handles face, status, related pages
    page: function(resource_type, view_type, resource_id){
        // Manually insert template
        $('#dynamic-container').show();
        $('#dynamic-container').html($('#' + AVAILABLE_LAYOUTS[view_type]).html());
        
        // Todo: clean up.
        // Hides all elements, shows elements based on resource_type/CSS class and clicks the first tab.
        $('.span9 li,.span3 li').hide();
        $('li.' + resource_type + ',div.' + resource_type).show();
        $('.span9 ul, .span3 ul').find('li.' + resource_type + ':first').find('a').click();
        
        // Todo: put this in Backbone View, make generic model, etc.
        if (resource_type == 'InstrumentDevice') {
            var pageData = new IONUX.Models.InstrumentFacepageModel({instrument_id: resource_id});
            pageData.fetch().success(function(model, resp) {
                window.model = model.data;
                
                
                var attribute_group_elmts = $('.InstrumentDevice .attribute_group');
                console.log('attribute_group_elmts',attribute_group_elmts);
                
                var text_static_elmts = $('.InstrumentDevice .text_static');
                _.each(text_static_elmts, function(el){
                    new IONUX.Views.TextStatic({el: $(el)}).render().el;
                });
                
                var text_short_elmts = $('.InstrumentDevice .text_short');
                _.each(text_short_elmts, function(el){
                    new IONUX.Views.TextShort({el: $(el), data_model: window.model}).render().el;
                });
                
                var text_extended_elmts = $('.InstrumentDevice .text_extended');
                _.each(text_extended_elmts, function(el){
                    new IONUX.Views.TextExtended({el: $(el), data_model: window.model}).render().el;
                });
                
                
                var icon_elmts = $('.InstrumentDevice .icon');
                _.each(icon_elmts, function(el) {
                    new IONUX.Views.Icon({el: $(el)}).render().el;
                });
                
                var image_elmts = $('.InstrumentDevice .image');
                _.each(image_elmts, function(el) {
                    new IONUX.Views.Image({el: $(el)}).render().el;
                });
                
                var badge_elmts = $('.InstrumentDevice .badge');
                _.each(badge_elmts, function(el) {
                    new IONUX.Views.Badge({el: $(el), data_model: window.model}).render().el;
                });
                
            });
        };
        
        // Temp: "SLAM!" tables to demonstrate integration.
        var tables = $('.' + resource_type + ' .table');
        _.each(tables, function(table) {
            new IONUX.Views.DataTable({el: $(table), data: TABLE_DATA});
        });
        

        
    },
    
    command: function(resource_type, resource_id){
        var fpModel = new IONUX.Models.InstrumentFacepageModel({instrument_id: resource_id});
        new IONUX.Views.InstrumentCommandFacepage({model: fpModel});
        fpModel.fetch();        
    },
    
    // KEPT FOR REFERENCE
    // facepage: function(resource_type, view_type, resource_id) {
    //     this._reset();
    //     // Initialize model - TODO: refactor with generic model?
    //     if (resource_type == 'instruments') {
    //         var facepage_model = new IONUX.Models.InstrumentFacepageModel({instrument_id: resource_id});
    //     } else if (resource_type == 'platforms') {
    //         var facepage_model = new IONUX.Models.PlatformFacepageModel({platform_id: resource_id});
    //     } else if (resource_type == 'observatories') {
    //         var facepage_model = new IONUX.Models.ObservatoryFacepageModel({observatory_id: resource_id});
    //     } else if (resource_type == 'data_products') {
    //         var facepage_model = new IONUX.Models.DataProductFacepageModel({data_product_id: resource_id});
    //     } else if (resource_type == 'users') {
    //         var facepage_model = new IONUX.Models.UserFacepageModel({user_id: resource_id});
    //     };
    //     
    //     // Initialize view.
    //     var view_id = IONUX.DefinedViews[resource_type]['view_id'];
    //     if (view_type == 'hybrid') {
    //         var template_id = IONUX.DefinedViews[resource_type]['template_id'];
    //         $('#dynamic-container').empty().html($(template_id).html()).show();
    //     } else {
    //         $('#dynamic-container').empty().html($('#' + view_id).html()).show();
    //     };
    //     
    //     // Data.
    //     facepage_model.fetch({success: function() {
    //         page_builder(LAYOUT_OBJECT[view_id], facepage_model);
    //     }});
    // },

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
    
    // KEPT FOR REFERENCE - COMMAND
    // instrument_command_facepage : function(instrument_id) {
    //     this._reset();
    //     var fpModel = new IONUX.Models.InstrumentFacepageModelLegacy({instrument_id: instrument_id});
    //     new IONUX.Views.InstrumentCommandFacepage({model: fpModel});
    //     fpModel.fetch();
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
function prepareTableData(data, columns) {
    var table = {headers: [], data: []}
    
    // Prepare table.headers
    if (!columns) var columns = _.keys(data[0]);
    _.each(columns, function(column){
        table.headers.push({'sTitle': column});
    });
    
    // Prepare table.data
    _.each(data, function(row) {
        var row_values = _.pick(row, columns);
        var row_array = _.toArray(row_values);
        table.data.push(row_array);
    });
    return table
};

// Get values from string notation, example:
// <div data-path="resource.serial_number">
function getDescendantProp(obj, desc) {
    var arr = desc.split(".");
    while(arr.length && (obj = obj[arr.shift()]));
    return obj;
}