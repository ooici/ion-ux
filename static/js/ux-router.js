// Temp: this will be delivered via the template preprocessor.
AVAILABLE_LAYOUTS = {
    'face': '2163152',
    'status': '2163153',
    'related': '2163154',
    'dashboard': '2163156',
    'command': '2163157'
};

IONUX.Router = Backbone.Router.extend({
    routes: {
        "": "dashboard",
        ":resource_type/list/": "collection",
        ":resource_type/command/:resource_id/": "command",
        ":resource_type/:view_type/:resource_id/" : "page",
    },
    dashboard: function(){
        // this._reset();
        $('#dynamic-container').html($('#' + AVAILABLE_LAYOUTS['dashboard']).html()).show();
        $('.Collection').show();
        new IONUX.Views.DashboardMap({el: '.Collection .map_ooi'}).render().el;
        new IONUX.Views.Footer({resource_id: null, resource_type: null}).render().el;
        beta_tmpl = '<div class="alert alert-warning">This is Release 2 Beta Software.  To access Release 1 software, please click <a href="http://ion-beta-r1.oceanobservatories.org">here</a></div>'
        $('.v00').html(beta_tmpl).css('margin-top', '15px');
    },
    
    // Collection 'face pages'
    collection: function(resource_type){
        $('#error').hide();
        $('#dynamic-container').show();
        $('#dynamic-container').html($('#2163152').html());
        $('.span9 li,.span3 li').hide();
        
        window.MODEL_DATA = new IONUX.Collections.Resources(null, {resource_type: resource_type});
        window.MODEL_DATA.fetch().success(function(data){
            $('li.Collection ,div.Collection').show(); // Show elements based on current view/CSS class
            $('.span9').find('li.Collection:first').find('a').click(); // Manually Set the first tabs 'active'
            
            // Todo: better way of finding the container for the collection.
            var table_elmt = $('.v02 .Collection .table_ooi').first();
            var table_id = table_elmt.attr('id');
            new IONUX.Views.DataTable({el: $(table_elmt), data: data.data});
        });
        
        // Insert footer and buttons
        new IONUX.Views.Footer({resource_id: null, resource_type: resource_type}).render().el;
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
                render_page(resource_type, resource_id, model);
            })
            .error(function(model, resp) {
                render_error();
            });

        // Insert footer and buttons
        new IONUX.Views.Footer({resource_id: resource_id, resource_type: resource_type}).render().el;

    },

    command: function(resource_type, resource_id){
        $('#error').hide();
        $('#dynamic-container').show();
        $('#dynamic-container').html($('#' + AVAILABLE_LAYOUTS['command']).html());        
        $('.span9 li,.span3 li').hide();
        
        $('.v02').empty();
        var resource_extension = new IONUX.Models.ResourceExtension({resource_type: resource_type, resource_id: resource_id});
        if (resource_type == 'InstrumentDevice') {
            new IONUX.Views.InstrumentCommandFacepage({model: resource_extension, el: '.v02'});
        } else if (resource_type == 'PlatformDevice') {
            new IONUX.Views.PlatformCommandFacepage({model: resource_extension, el: '.v02'});
        };
        
        resource_extension.fetch()
            .success(function(model, resp) {
                render_page(resource_type, resource_id, model);
            });
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
            // TEMP: catching links in Google Maps, also catching download links.
            if ($(e.target).attr('href').match(/^http/)) return true;
            // Catch Bootstrap's tabs hash so URL doesn't change, example: "InstrumentDevice/list/" to "/2150593"
            if ($(e.target).attr('data-toggle') == 'tab') return true;
            self.navigate($(this).attr('href'), {trigger:true});
            return false;
        });
    },
    
    

    // graceful Backbone handling of full page refresh on non '/' url.
    // handle_url: function(current_url){
    //     if (current_url != "/"){
    //         this.navigate(current_url, {trigger:true});
    //     }
    // },

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


function render_page(resource_type, resource_id, model) {
    // Catch and set derivative resources
    if (resource_type == 'InstrumentModel' || resource_type == 'PlatformModel' || resource_type == 'SensorModel') {
        var resource_type = 'DeviceModel';
    } else if (resource_type == 'Observatory' || resource_type == 'InstrumentSite' || resource_type == 'PlatformSite' || resource_type == 'Subsite') {
        var resource_type = 'Site';
    } else if (resource_type == 'SensorDevice') {
        var resource_type = 'Device';
    } else if (resource_type == 'DataProcess') {
        var resource_type = 'TaskableResource';
    } else if (resource_type == 'UserRole') {
        var resource_type = 'InformationResource';
    };
    
    window.MODEL_DATA = model.data;
    window.MODEL_DATA['resource_type'] = resource_type;

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

    _.each($('.'+resource_type+' .image_ooi'), function(el) {
        var data_path = $(el).data('path');
        var data = get_descendant_properties(window.MODEL_DATA, data_path);
        switch(data){
            case 1:
                $(el).html($('<span>').addClass('badge_status_graphic_ok').html('&nbsp;'));
                break;
            case 2:
                $(el).html($('<span>').addClass('badge_status_graphic_warning').html('&nbsp;'));
                break;
            case 3:
                $(el).html($('<span>').addClass('badge_status_graphic_critical').html('&nbsp;'));
                break;
            default:
                $(el).html($('<span>').addClass('badge_status_graphic_unknown').html('&nbsp;'));
        };
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
        var raw_table_data = get_descendant_properties(window.MODEL_DATA, data_path);
        if (!_.isEmpty(raw_table_data)) {
            new IONUX.Views.DataTable({el: $(el), data: raw_table_data});
        } else {
            new IONUX.Views.DataTable({el: $(el), data: []});
        };
    });
    
    var extent_geospatial_elmts = $('.'+resource_type+' .extent_geospatial_ooi');
    _.each(extent_geospatial_elmts, function(el) {
        var data_path = $(el).data('path');
        var data = get_descendant_properties(window.MODEL_DATA, data_path);
        new IONUX.Views.ExtentGeospatial({el: $(el), data: data}).render().el;
    });
    
    var extent_vertical_elmts = $('.'+resource_type+' .extent_vertical_ooi');
    _.each(extent_vertical_elmts, function(el){
        var data_path = $(el).data('path');
        var data = get_descendant_properties(window.MODEL_DATA, data_path);
        if (data) new IONUX.Views.ExtentVertical({el: $(el), data: data}).render().el;
    });

    var extent_temporal_elmts = $('.'+resource_type+' .extent_temporal_ooi');
    _.each(extent_temporal_elmts, function(el) {
        new IONUX.Views.ExtentTemporal({el: $(el)}).render().el;
    });

    var checkbox_elmts = $('.'+resource_type+' .checkbox_ooi');
    _.each(checkbox_elmts, function(el) {
        new IONUX.Views.Checkbox({el: $(el), data_model: window.MODEL_DATA}).render().el;
    });
    
    if (resource_type == 'DataProduct') {
        var chart_elmt = $('.'+resource_type+' .chart_ooi').first();
        $('body').append($('<script>').attr('src', 'https://www.google.com/jsapi?callback=chart_callback').attr("type", "text/javascript"));
        
        chart_callback = function(){
            chart_instance = new IONUX.Views.Chart({resource_id: resource_id, el: chart_elmt});
            chart_instance.render().el;
        };
        
        // TEMP
        var data_url_text = $('#2164346').text();
        $('#2164346').html(replace_url_with_html_links(data_url_text));
    };
    
    _.each($('.v02 .'+resource_type), function(el){
        $(el).find('.content-wrapper:first').css('height', '200px').jScrollPane({autoReinitialise: true});
    });
    
    // ActionMenus
    _.each($('.v01 .group .nav, .v02 .group .nav'), function(el) {
        new IONUX.Views.GroupActions({el:$(el)});
    });
    _.each($('.v01 .'+resource_type+'.block, .v02 .'+resource_type+'.block'), function(el) {
        new IONUX.Views.BlockActions({el:$(el)});
    });    
    new IONUX.Views.ViewActions({el: '.v00'});

    // Show the relevant elements and click to enable the Bootstrap tabs.
    $('li.' + resource_type + ', div.' + resource_type).show();
    $('.span9 ul, .span3 ul').find('li.' + resource_type + ':first').find('a').click();  
    
    $('.tab-pane').find('.'+resource_type+':visible:first').css('margin-left', 0);

    // Todo fix DataTable thead width
    _.each($('table thead'), function(thead){
        $(thead).find('th').first().click();
    });
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

// function table_links(table_elmt, table_data){
//     var table_columns = $(table_elmt + 'tr:first th');
// 
//     var names = []
//     _.each(table_columns, function(column, index){
//         names.push($(column).text());
//     });
//     var link_index = _.indexOf(names, 'Name');
//     
//     var table_rows = $(table_elmt).find('table tr');
//     table_rows.splice(0,1); 
//     var resource_type = table_data[0]['type_'];
//     var link_tmpl = '<a href="<%= url %>"><%= text %></a>';
//     
//     // console.log('TD: ', resource_type, link_index);
//     
//     _.each(table_rows, function(tr, index){
//         var resource_id = table_data[index]['_id'];
//         var child_index = link_index + 1;
//         var td = $(tr).find('td:nth-child('+child_index+')');
//         var text = $(td).text();
//         var url = "/"+resource_type+"/face/"+resource_id+"/";
//         // console.log('URL', url);
//         $(td).html(_.template(link_tmpl, {url: url, text:text}));
//     });
// };
// 
// function collection_links(){
//     var trs = $('table:first tr');
//     trs.splice(0,1);
//     var resource_type = window.MODEL_DATA.models[0].get('type_');
//     
//     _.each(trs, function(tr, index){
//         var td = $(tr).find('td')[1];
//         var text = $(td).text();
//             
//         var resource_id = window.MODEL_DATA.models[index].get('_id');
//         
//         var url = "/"+resource_type+"/face/"+resource_id+"/";
//         var link_tmpl = '<a href="<%= url %>"><%= text %></a>';
//         
//         $(td).html(_.template(link_tmpl, {url: url, text:text}));
//     });
// };


function replace_url_with_html_links(text) {
    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(exp,"<a class='external' target='_blank' href='$1'>$1</a>"); 
}
