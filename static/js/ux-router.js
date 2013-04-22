// Temp: this will be delivered via the template preprocessor.
AVAILABLE_LAYOUTS = {
  'face': '2163152',
  'status': '2163153',
  'related': '2163154',
  'dashboard': '2163156',
  'command': '2163157'
};

LOADING_TEMPLATE = '<div style="text-align: center; padding-top: 100px;"><img src="/static/img/busy_indicator.gif"</div>'

IONUX.Router = Backbone.Router.extend({
  routes: {
    "": "dashboard_map",
    'map/:resource_id': 'dashboard_map_resource',
    'resources': 'dashboard_list',
    'resources/:resource_id': 'dashboard_list_resource',
    "search/?:query": "search",
    ":resource_type/list/": "collection",
    ":resource_type/command/:resource_id/": "command",
    ":resource_type/:view_type/:resource_id/" : "page",
    ":resource_type/:view_type/:resource_id/edit" : "edit",
    "userprofile" : "user_profile",
    "create_account": "create_account",
    // 'dev/dashboard': 'dev_dashboard',
  },
  
  dashboard_map: function(){
    $('#dynamic-container').empty().hide();
    $('#dashboard-container').hide();
    $('#resource-selector, #list-filter, #map-filter').off().empty().hide(); // Todo: until view manager
    
    // Render Sidebar - need to move this into init and implement timing/triggers.
    IONUX.Dashboard.Observatories = new IONUX.Collections.Observatories();
    IONUX.Dashboard.ObservatoriesView = new IONUX.Views.ObservatorySelector({collection: IONUX.Dashboard.Observatories, title: 'Site/Subsite'});
    IONUX.Dashboard.Observatories.fetch({
      reset: true,
      success: function(resp){
        $('#dashboard-container').show();
        $('#resource-selector #list').jScrollPane({autoReinitialise: true}); // Todo: move into view
        IONUX.Dashboard.MapResources = new IONUX.Collections.MapResources(resp.models, {resource_id: null});
        IONUX.Dashboard.MapResource = new IONUX.Models.MapResource();
        
        IONUX.Dashboard.MapView = new IONUX.Views.Map({
          collection: IONUX.Dashboard.MapResources,
          model: IONUX.Dashboard.MapResource
        });
        
        new IONUX.Views.DashboardTable({el: $('#dashboard-container #2163993'), collection: IONUX.Dashboard.MapResources});
        
        new IONUX.Views.MapFilter().render().el;
        new IONUX.Views.ViewControls().render().el;
      },
    });
  },
  
  dashboard_map_resource: function(resource_id){
    $('#dynamic-container').empty().hide();
    $('#dashboard-container').show();

    var table_elmt = $('#dashboard-container #2163993');
    table_elmt.off().empty().append('<div id="spinner"></div>');
    new Spinner(IONUX.Spinner.large).spin(document.getElementById('2163993'));
    
    var active_resource_attributes = IONUX.Dashboard.Observatories.findWhere({_id: resource_id})['attributes'];

    IONUX.Dashboard.MapResources.resource_id = resource_id;
    IONUX.Dashboard.MapResources.set([]);
    IONUX.Dashboard.MapResources.fetch({
      reset: true,
      success: function(resp) {
        IONUX.Dashboard.MapResource.set(active_resource_attributes);
        IONUX.Dashboard.MapResource.trigger('map:draw');

        new IONUX.Views.DashboardTable({el: $('#dashboard-container #2163993'), collection: resp});
      }
    });
  },
  
  dashboard_list: function() {
    $('#dynamic-container').empty().hide();
    $('#dashboard-container').empty().html($('#dashboard-main-tmpl').html());
    $('#resource-selector, #list-filter, #map-filter').off().empty().hide(); // Todo: until view manager
    $('#dashboard-container #2163993').off(); //.empty();
    
    IONUX.Dashboard.Orgs = new IONUX.Collections.Orgs();
    IONUX.Dashboard.OrgsView = new IONUX.Views.OrgSelector({collection: IONUX.Dashboard.Orgs, title: 'Facility'});
    IONUX.Dashboard.Orgs.fetch({
      reset: true, 
      success: function(resp) {
        $('#dashboard-container #2163993').show();
      },
    });
  },
  
  dashboard_list_resource: function(resource_id){
    console.log('dashboard_list_resource');
    $('#dynamic-container').empty().hide();
    $('#dashboard-container').show();

    $('#2163993').off().empty().append('<div id="spinner"></div>').show();
    new Spinner(IONUX.Spinner.large).spin(document.getElementById('spinner'));

    if (IONUX.Dashboard.ListResources === undefined) {
      IONUX.Dashboard.ListResources = new IONUX.Collections.ListResources(null, {resource_id: resource_id});
    };
    
    IONUX.Dashboard.ListResources.resource_id = resource_id;
    IONUX.Dashboard.ListResources.set([]);
    IONUX.Dashboard.ListResources.fetch({
      reset:true,
      success: function(resp){
        new IONUX.Views.ListFilter().render().el;
        new IONUX.Views.ResourceTable({el: $('#2163993'), collection: resp, list_table: true});
      },
    });
  },

  // dev_dashboard: function() {
  //   // TEMP page setup.
  //   $('#footer').remove(); // Remove legacy footer.
  //   $('.wrapper').html($('#dashboard-tmpl').html());
  //   $('#main').html($('#dashboard-content-tmpl').html());
  //   
  //   // Move to IONUX in production
  //   new IONUX.Views.ViewControls().render().el;
  //   
  //   // Render Sidebar
  //   IONUX.Dashboard.Observatories = new IONUX.Collections.Observatories();
  //   IONUX.Dashboard.ObservatoriesView = new IONUX.Views.ObservatorySelector({collection: IONUX.Dashboard.Observatories, title: 'Site/Subsite'});
  //   IONUX.Dashboard.Observatories.fetch({
  //     reset: true,
  //     success: function(resp){
  //       IONUX.Dashboard.MapResources = new IONUX.Collections.MapResources(resp.models, {resource_id: null});
  //       IONUX.Dashboard.MapResource = new IONUX.Models.MapResource();
  //       new IONUX.Views.Map({
  //         collection: IONUX.Dashboard.MapResources,
  //         model: IONUX.Dashboard.MapResource
  //       });
  //       IONUX.Dashboard.MapResources.trigger('update_markers');
  //       new IONUX.Views.MapFilter().render().el;
  //     },
  //   });
  // },


  edit: function() {
    // Todo move into own view
    $('#dynamic-container > .row-fluid').html('<div id="spinner"></div>').show();
    new Spinner(IONUX.Spinner.large).spin(document.getElementById('spinner'));
    
    var m = new IONUX.Models.EditResourceModel({
      resource_type: window.MODEL_DATA.resource.type_,
      resource_id: window.MODEL_DATA.resource._id
    });
    
    m.fetch({
      success: function(resp) {
        new IONUX.Views.EditResource({model: resp});
      }
    });
  },
  
  search: function(query){
    $('#dashboard-container').hide();
    // Todo move into own view
    $('#dynamic-container').html('<div id="spinner"></div>').show();
    new Spinner(IONUX.Spinner.large).spin(document.getElementById('spinner'));
    
    var search_model = new IONUX.Models.Search();
    // use heuristics to determine what kind of query we have here
    var fetch_opts = {};
    if (query.indexOf("adv=1&") == 0) {
      // advanced search, set fetch_opts properly
      fetch_opts.type = 'POST';
      fetch_opts.data = {'adv_query_string': query}
      query = "advanced";
    }
    search_model.set({search_query: query})
    search_model.fetch(fetch_opts)
      .success(function(resp){
        console.log('Search success:', resp);
        $('#dynamic-container').html($('#2163152').html());
        $('.span9 li,.span3 li').hide();
        $('.v01 ul:visible, .v02 ul:visible').find('li:first').find('a').click();
        $('li.Collection ,div.Collection').show();
        $('.span9').find('li.Collection:first').find('a').click();
        var table_elmt = $('.v02 .Collection .table_ooi').first(); // Todo: better way of finding the container for the collection.
        var table_id = table_elmt.attr('id');
        new IONUX.Views.DataTable({el: $(table_elmt), data: resp.data});
        $('.heading').html('<h1>Search Results</h1>').css('padding-bottom', '15px'); // Temp: css hack to make layout nice.
      });
    new IONUX.Views.Footer({resource_id: null, resource_type: null}).render().el;
  },

  collection: function(resource_type){
    $('#error').hide();
    $('#dynamic-container').show().html(LOADING_TEMPLATE);
    window.MODEL_DATA = new IONUX.Collections.Resources(null, {resource_type: resource_type});
    window.MODEL_DATA.fetch()
      .done(function(data){
        $('#dynamic-container').html($('#2163152').html());
        $('.span9 li,.span3 li').hide();
        $('.v01 ul:visible, .v02 ul:visible').find('li:first').find('a').click();
        $('li.Collection ,div.Collection').show();
        $('.span9').find('li.Collection:first').find('a').click();
        var table_elmt = $('.v02 .Collection .table_ooi').first(); // Todo: better way of finding the container for the collection.
        var table_id = table_elmt.attr('id');
        new IONUX.Views.DataTable({el: $(table_elmt), data: window.MODEL_DATA.toJSON()});
      });
    new IONUX.Views.Footer({resource_id: null, resource_type: resource_type}).render().el;
  },
  page: function(resource_type, view_type, resource_id){
    console.log('page');
    $('#dashboard-container').hide();
    // Todo move into own view
    $('#dynamic-container').html('<div id="spinner"></div>').show();
    new Spinner(IONUX.Spinner.large).spin(document.getElementById('spinner'));
    
    var resource_extension = new IONUX.Models.ResourceExtension({resource_type: resource_type, resource_id: resource_id});
    resource_extension.fetch()
      .success(function(model, resp) {
        $('#dynamic-container').show();
        $('#dynamic-container').html($('#' + AVAILABLE_LAYOUTS[view_type]).html());
        $('.span9 li,.span3 li').hide();
        render_page(resource_type, resource_id, model);
      });
    // new IONUX.Views.Footer({resource_id: resource_id, resource_type: resource_type}).render().el;
  },
  command: function(resource_type, resource_id){
    $('#error').hide();
    $('#dynamic-container').show();
    $('#dynamic-container').html($('#' + AVAILABLE_LAYOUTS['command']).html());
    $('.span9 li,.span3 li').hide();
    // $('.v02').empty();
    var resource_extension = new IONUX.Models.ResourceExtension({resource_type: resource_type, resource_id: resource_id});
    if (resource_type == 'InstrumentDevice') {
      var resource_extension = new IONUX.Models.ResourceExtension({resource_type: resource_type, resource_id: resource_id});
      new IONUX.Views.InstrumentCommandFacepage({model: resource_extension, el: '.v02'});
    } else if (resource_type == 'PlatformDevice') {
      var resource_extension = new IONUX.Models.ResourceExtension({resource_type: resource_type, resource_id: resource_id});
      new IONUX.Views.PlatformCommandFacepage({model: resource_extension, el: '.v02'});
    } else if (resource_type == 'TaskableResource') {
      var resource_extension = new IONUX.Models.ResourceExtension({resource_type: 'InformationResource', resource_id: resource_id});
      console.log('found');
      new IONUX.Views.TaskableResourceCommandFacepage({model: resource_extension, el: '.v02'});
    };
    resource_extension.fetch()
      .success(function(model, resp){
        console.log('resource_extension', resp);
        render_page(resource_type, resource_id, model);
      });
    new IONUX.Views.Footer({resource_id: null, resource_type: null}).render().el;
  },

  user_profile: function() {
    this._reset();
    var model = new IONUX.Models.UserRegistrationModel();
    model.fetch()
      .done(function(data) {
        $("#dynamic-container").show();
        //$("#dynamic-container").html(data);
        new IONUX.Views.EditUserRegistration({model: model}).render();
      });
  },

  create_account: function() {
    new IONUX.Views.CreateAccountView().render();
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
      var target = $(e.target);
      if (target.hasClass('external')) return true;
      // TEMP: catching links in Google Maps, also catching download links.
      var href = target.attr('href'); 
      if (!href) return true;
      if (href.match(/^http/)) return true;
      // Catch Bootstrap's tabs hash so URL doesn't change, example: "InstrumentDevice/list/" to "/2150593"
      if (target.attr('data-toggle') == 'tab') return true;
      self.navigate($(this).attr('href'), {trigger:true});
      return false;
    });
  },
    
  // // graceful Backbone handling of full page refresh on non '/' url.
  // handle_url: function(current_url){
  //     if (current_url != "/"){
  //         this.navigate(current_url, {trigger:true});
  //     }
  // },

  _reset: function(){ //reset the UI
    $(".viewcontainer").hide();
  }
});


// ----------------------------------------------------------------------------
// HELPER METHODS - TODO: move into IONUX namespace
// ----------------------------------------------------------------------------

// Look up chained values found in data-path
function get_descendant_properties(obj, desc) {
  var arr = desc.split(".");
  while(arr.length && (obj = obj[arr.shift()]));
  return obj;
};

// Create <a href> from text
function replace_url_with_html_links(text) {
  var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
  return text.replace(exp,"<a class='external' target='_blank' href='$1'>$1</a>"); 
};

// Filter method for open negotiations shown in a data table
// If this method returns true, there should be a column indicating
// the view will be shown on row click.
function negotiation_show_controls(row_data) {
  var neg_id = row_data[0].split("::")[0];

  var neg = _.findWhere(window.MODEL_DATA.open_requests, {negotiation_id:neg_id});
  if (neg &&
      window.MODEL_DATA.resource_type == "Org" &&
      neg.originator == "CONSUMER" &&
      _.contains(IONUX.SESSION_MODEL.get('roles')[window.MODEL_DATA.resource.org_governance_name], 'ORG_MANAGER'))
    return true;

  if (neg &&
      window.MODEL_DATA.resource_type == "UserInfo" &&
      neg.originator == "PROVIDER")
    return true;

  return false;
};

// Returns a displayable resource type for the resource_type given.
// If the type is not displayable, traverse up the heirarchy of resources
// until one is found.
function get_renderable_resource_type(resource_type) {
  // Check for alt_resource_type and skip if found
  var alt_resource_type = window.MODEL_DATA.resource.alt_resource_type;
  if (!_.isEmpty(alt_resource_type)) return alt_resource_type;

  // conduct initial search of window.LAYOUT
  var re = _.find(window.LAYOUT.spec.restypes, function(v, k) { return v.name == resource_type; });
  while (re != null) {
    if ($("." + re.name).length > 0)
      return re.name;
    re = window.LAYOUT.spec.restypes[re.super];
  }

  // unknown?
  return "Resource";
}

// Renders a page based on resource_type
function render_page(resource_type, resource_id, model) {
  var start_render = new Date().getTime();
  window.MODEL_DATA = model.data;
  
  resource_type = get_renderable_resource_type(resource_type);
  console.log('resource_type', resource_type);

  window.MODEL_DATA['resource_type'] = resource_type;
  
  var attribute_group_elmts = $('.'+resource_type+' .attribute_group_ooi');
  _.each(attribute_group_elmts, function(el){
    var data_path = $(el).data('path');
    var data = get_descendant_properties(window.MODEL_DATA, data_path);
    new IONUX.Views.AttributeGroup({el: $(el), data: window.MODEL_DATA}).render().el;
  });
  
  var attribute_group_dynamic_elmts = $('.'+resource_type+' .attribute_group_dynamic_ooi')
  _.each(attribute_group_dynamic_elmts, function(el){
    new IONUX.Views.AttributeGroupDynamic({el: $(el)}) //.render().el;
  });

  var text_static_elmts = $('.'+resource_type+' .text_static_ooi');
  _.each(text_static_elmts, function(el){
      new IONUX.Views.TextStatic({el: $(el)}).render().el;
  });
  
  var text_short_elmts = $('.'+resource_type+' .text_short_ooi');
  _.each(text_short_elmts, function(el){
      new IONUX.Views.TextShort({el: $(el), data_model: window.MODEL_DATA}).render().el;
  });
  
  var text_extended_elmts = $('.'+resource_type+' .text_extended_ooi');
  _.each(text_extended_elmts, function(el){
      new IONUX.Views.TextExtended({el: $(el), data_model: window.MODEL_DATA}).render().el;
  });
  
  var icon_elmts = $('.'+resource_type+' .icon_ooi');
  _.each(icon_elmts, function(el) {
      new IONUX.Views.Icon({el: $(el)}).render().el;
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
        var opts = {el: $(el), data: raw_table_data}
        if (data_path == "open_requests" && IONUX.SESSION_MODEL.is_logged_in()) {
            _.extend(opts, {popup_view: IONUX.Views.NegotiationCommands,
                            popup_label: "Accept/Reject",
                            popup_filter_method: negotiation_show_controls});
        } else if (data_path == "attachments") {
          _.extend(opts, {popup_view: IONUX.Views.AttachmentZoomView,
                          popup_label: "View",
                          popup_filter_method: function() { return true; }});
        } 
        var table = new IONUX.Views.DataTable(opts);
    } else {
        var table = new IONUX.Views.DataTable({el: $(el), data: []});
    };
    
    // TODO: find a better way of putting a header in table that is not
    // the first/only item in a .tab-pane.
    var elements_len = $(el).closest('.tab-pane').find('.'+resource_type).length;
    if (elements_len > 1){
      var heading = $(el).data('label');
      $(el).find('.filter-header').prepend('<div class="table-heading">'+heading+'</div>');
    };
  
    $(el).find('table').last().dataTable().fnAdjustColumnSizing();
  });
  
  var extent_geospatial_elmts = $('.'+resource_type+' .extent_geospatial_ooi');
  _.each(extent_geospatial_elmts, function(el) {
    var data_path = $(el).data('path');
    var data = get_descendant_properties(window.MODEL_DATA, data_path);
    if (data) new IONUX.Views.ExtentGeospatial({el: $(el), data: data}).render().el;
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
    chart_elmt.css({height: '350px', width: '100%'});
    // new IONUX.Views.Chart({resource_id: resource_id, el: chart_elmt}).render().el;
    chart_elmt.html('<iframe width="100%" height="100%" id="chart" src="/static/visualization/chart.html"></iframe>')
    
    // Todo: manually setting the ERDAP download link
    var data_url_text = $('#2164346').text();
    $('#2164346').html(replace_url_with_html_links(data_url_text));
    
    // Todo: find the cause of double content-wrapping on these two items
    $('#2163118 .content-wrapper:last').remove();
    $('#2164400 .content-wrapper:last').remove();
  } else if (resource_type == "UserInfo" && IONUX.SESSION_MODEL.get('user_id') == resource_id) {
    IONUX.SESSION_MODEL.fetch();
  }
  
  _.each($('.v02 .'+resource_type), function(el){
    $(el).find('.content-wrapper:first').css('height', '200px');
    // Spikes CPU to 100%
    //.jScrollPane({autoReinitialise: true});
  });
  
  
  // Action Menus
  _.each($('.v01 .group .nav, .v02 .group .nav'), function(el) {
    // Todo: finish attachments/events menus
    var group_name = $(el).find('li:first a').text();
    switch(group_name){
      case 'Attachments':
        new IONUX.Views.AttachmentActions({el:$(el)});
        break;
      case 'Recent Events':
        new IONUX.Views.EventActions({el:$(el)});
        break;
      default:
        new IONUX.Views.GroupActions({el:$(el)});
    };
  });
  
  _.each($('.v01 .'+resource_type+'.block, .v02 .'+resource_type+'.block'), function(el) {
    new IONUX.Views.BlockActions({el: el});
  });
  new IONUX.Views.ViewActions({el: '.'+resource_type+' .heading-right'});
  
  
  

  // Show the relevant elements and click to enable the Bootstrap tabs.
  $('li.' + resource_type + ', div.' + resource_type).show();

  $('a[data-toggle="tab"]').on('shown', function (e){
    var table = $($(e.target).attr('href')).find('.'+resource_type+' .table_ooi');
    // Big performance hit with the line below. Need to optimize.
    if (table.length) $(table).find('table').last().dataTable().fnAdjustColumnSizing();
  });  

  $('.span9 ul, .span3 ul, .span12 ul').find('li.' + resource_type + ':first').find('a').click(); 
  $('#dynamic-container .tab-pane').find('.'+resource_type+':visible:first').css('margin-left', 0);

  // DataTables column sizing
  // _.each($('.'+resource_type+' .table_ooi'), function(table){
  //   $(table).find('table').last().dataTable().fnAdjustColumnSizing();
  // });

  console.log('render_page elapsed: ', new Date().getTime() - start_render);
};
