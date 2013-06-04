// Todo: clean up MapAsset events and get draw_markers/render_table events
// in sync. Possibly move MapBlacklist into it's own collection and listen
// for change events.

IONUX.Views.ViewControls = Backbone.View.extend({
  el: '#view-controls',
  dashboard_template: _.template($('#dashboard-content-tmpl').html()),
  events: {
    'click #btn-map': 'render_map_view',
    'click #btn-resources': 'render_list_view'
  },
  initialize: function(){
    _.bindAll(this);
  },
  render: function() {
    this.$el.show();
    return this;
  },
  render_map_view: function(e) {
    if (e) e.preventDefault();
    IONUX.ROUTER.navigate('/', true);
  },
  render_list_view: function(e) {
    if (e) e.preventDefault();
    IONUX.ROUTER.navigate('/resources', true);
  },
});

// Keeps track of state -- possibly move into it's own model and bind listeners.
IONUX.CurrentFilter = 'dataproduct';
IONUX.Views.DataAssetFilter = Backbone.View.extend({
  el: '#map-asset-data-menu',
  template: _.template('<span class="data-filter active" data-mode="dataproduct">Data</span><span class="asset-filter" data-mode="asset">Asset</span>'),
  initialize: function() {
    console.log('IONUX.Views.DataAssetFilter');
  },
  events: {
    'click span': 'filter',
  }, 
  render: function(){
    this.$el.html(this.template);
    return this;
  },
  filter: function(e) {
    var target = $(e.target);
    target.addClass('active').siblings().removeClass('active');

    var mode = target.data('mode');
    IONUX.CurrentFilter = mode;
    if (mode == 'dataproduct') {
      $('#left .asset-mode').hide();
      $("#left .dataproduct-mode").show();
    } else {
      $("#left .dataproduct-mode").hide();
      $('#left .asset-mode').show();
    };
    
    this.apply_routing();
  },
  apply_routing: function() {
    if (window.location.pathname.length > 1 && window.location.pathname.split('/')[1] == 'map') {
      Backbone.history.fragment = null;
      IONUX.ROUTER.navigate(window.location.pathname, {trigger: true});
    };
  },
});

/* 
- - - - - - - - - - - - - - - - - 
  Site Navigation
- - - - - - - - - - - - - - - - - 
*/

IONUX.Collections.Orgs = Backbone.Collection.extend({
  url: '/Org/list/',
  parse: function(resp) {
    return resp.data;
  }
});

IONUX.Collections.Observatories = Backbone.Collection.extend({
  url: '/Observatory/list/',
  parse: function(resp) {
    return resp.data;
  }
});


IONUX.Views.ResourceSelector = Backbone.View.extend({
  initialize: function(){
    _.bindAll(this);
    this.title = this.options.title;
    this.listenTo(this.collection, 'reset', this.render);
  },
  render: function(){
    this.$el.removeClass('placeholder');
    this.$el.html(this.template({resources: this.collection.toJSON(), title: this.title}));
    this.$el.find('#list').jScrollPane({autoReinitialise: true});
    return this;
  }
});


IONUX.Views.ObservatorySelector = IONUX.Views.ResourceSelector.extend({
  el: '#observatory-selector',
  template: _.template($('#dashboard-observatory-list-tmpl').html()),
  render: function(){
    this.$el.removeClass('placeholder');
    this.$el.html(this.template({resources: this.build_menu(), title: this.title}));
    this.$el.find('#list').jScrollPane({autoReinitialise: true});
    return this;
  },
  
  build_menu: function(){
    // Grab all spatial names, then uniques; separate for clarity.
    var spatial_area_names = _.map(this.collection.models, function(resource) {
      var san = resource.get('spatial_area_name');
      if (san != '') return san;
    });
    var unique_spatial_area_names = _.uniq(spatial_area_names);
    
    var resource_list = {};
    _.each(unique_spatial_area_names, function(san) {
      resource_list[san] = _.map(this.collection.where({spatial_area_name: san}), function(resource) { return resource.toJSON()});
    }, this);
    return resource_list;
  }
});


IONUX.Views.OrgSelector = IONUX.Views.ResourceSelector.extend({
  el: '#org-selector',
  template: _.template($('#dashboard-org-list-tmpl').html()),
  events: {
    'click .secondary-link': 'set_active_li'
  },
  set_active_li: function(e){
    $('.resource-ul').find('.active').removeClass('active');
    $(e.target).parent('li').addClass('active');
  }
});


/* 
- - - - - - - - - - - - - - - - - 
  Asset Map
- - - - - - - - - - - - - - - - - 
*/

IONUX.Models.MapResource = Backbone.Model.extend({
  defaults: {
    geospatial_point_center: {
      lat: 39.8106460,
      lon: -98.5569760
    },
    constraint_list: null
  }
});

IONUX.Collections.MapResources = Backbone.Collection.extend({
  initialize: function(models, options){
    this.resource_id = options.resource_id;
  },
  url: function() {
   return '/related_sites/'+this.resource_id+'/';
  },
  parse: function(resp) {
    var related_sites = [];
    _.each(resp.data, function(site){related_sites.push(site)});
    make_iso_timestamps(related_sites);
    return related_sites;
  }
});




IONUX.Collections.DataProductGroupList = Backbone.Collection.extend({
  url: '/get_data_product_group_list/',
  parse: function(resp) {
    return resp.data;
  }
});


IONUX.Collections.MapDataProducts = Backbone.Collection.extend({
  initialize: function(models, options){
    this.resource_id = options.resource_id;
  },
  url: function() {
   return '/find_site_data_products/'+this.resource_id+'/';
  },
  parse: function(resp) {
    var data_products = [];
    if (!_.isEmpty(resp.data.data_product_resources)) {
      data_products = _.filter(resp.data.data_product_resources, function(v,k) {
        return !_.isEmpty(v.ooi_product_name); // Only display those with ooi_product_name
      });
      make_iso_timestamps(data_products);
    };
    
    return data_products;
  }
});


IONUX.Views.Map = Backbone.View.extend({
  el: '#map_canvas',
  
  markers: {
    na_icon: {
        anchor: new google.maps.Point(30, 30),
        origin: new google.maps.Point(420, 180),
        size: new google.maps.Size(60, 60),
        url: '/static/img/sprite.png'
    },
    na_icon_hover: {
      anchor: new google.maps.Point(30, 30),
      origin: new google.maps.Point(480, 180),
      size: new google.maps.Size(60, 60),
      url: '/static/img/sprite.png'
    },
    na_icon_active: {
        anchor: new google.maps.Point(30, 30),
        origin: new google.maps.Point(540, 180),
        size: new google.maps.Size(60, 60),
        url: '/static/img/sprite.png'
    }
  },
  
  
  initialize: function(){
    _.bindAll(this);
    this.sprite_url = '/static/img/sprite.png';
    this.active_marker = null; // Track clicked icon
    this.draw_map();
    this.model.on('pan:map', this.pan_map);
    // this.collection.on('reset', this.draw_markers);
    // this.collection.on('reset', this.render_table);
  },
  
  render: function(){
    this.$el.show();
    return this;
  },
  
  draw_map: function(map_options, container_server) {
    console.log('draw_map');
    $('#map_canvas').empty().show();
    this.map = new google.maps.Map(document.getElementById('map_canvas'), {
      center: new google.maps.LatLng(39.8106460, -98.5569760),
      zoom: 3,
      mapTypeId: google.maps.MapTypeId.TERRAIN,
      disableDefaultUI: true,
      // scrollwheel: false,
      zoomControl: true,
      zoomControlOptions: {style: google.maps.ZoomControlStyle.SMALL, position: google.maps.ControlPosition.TOP_RIGHT}
    });
    this.markerClusterer = new MarkerClusterer(this.map, null, {
      maxZoom: 10,
      gridSize: 10, 
      styles: [{
        backgroundPosition: '-410px -410px',
        height: 60,
        width: 60,
        url: '/static/img/sprite2.png',
        textSize: '0',
        maxZoom: 15
      }]
    });
    this.draw_markers();
    this.pan_map();
  },
  
  draw_markers: function() {
    console.log('draw_markers');
    var self = this;
    _.each(this.collection.models, function(resource) {
      var lat = resource.get('geospatial_point_center')['lat'];
      var lon = resource.get('geospatial_point_center')['lon'];
      // console.log('lat', lat, 'lon', lon);

      var rid = resource.get('_id');
      var rname = resource.get('name');
      self.create_marker(lat, lon, null, rname,"<P>Insert HTML here.</P>", null, rid);
    });    
  },
  
  pan_map: function() {
    console.log('pan_map');
    try {
      var n = this.model.get('constraint_list')[0]['geospatial_latitude_limit_north'];
      var e = this.model.get('constraint_list')[0]['geospatial_longitude_limit_east'];
      var s = this.model.get('constraint_list')[0]['geospatial_latitude_limit_south'];
      var w = this.model.get('constraint_list')[0]['geospatial_longitude_limit_west'];
      var ne = new google.maps.LatLng(n, e);
      var sw = new google.maps.LatLng(s, w);
      var bounds = new google.maps.LatLngBounds(sw, ne)
      this.map.fitBounds(bounds);

      // Set active marker based on resource_id
      var m = _.findWhere(this.markerClusterer.getMarkers(), {resource_id: this.model.get('_id')});
      m.setIcon(this.markers.na_icon_active);
    } catch(err) {
      console.log('pan_map error:', err);
    }
  },
  
  create_marker: function(_lat, _lon, _icon, _hover_text, _info_content, _table_row, resource_id) {
    if (!_lat || !_lon) return null;

    latLng = new google.maps.LatLng(_lat, _lon);
    var marker = new google.maps.Marker({
      map: this.map,
      position: latLng,
      icon: this.markers.na_icon,
      title: _hover_text,
      resource_id: resource_id
    });
    
    // var iw = new google.maps.InfoWindow({content: _info_content});
    var _map = this.map;
    

    var self = this;
    google.maps.event.addListener(marker, 'click', function(_map) {
      // // iw.open(this.map, marker);
      if (self.active_marker) self.active_marker.setIcon(self.markers.na_icon);
      marker.setIcon(self.markers.na_icon_active);
      self.active_marker = marker;
      if (typeof marker.resource_id != 'undefined') {
        IONUX.ROUTER.navigate('/map/'+marker.resource_id, {trigger:true});
      };
    });

    google.maps.event.addListener(marker, 'mouseover', function() {
      // _table_row.style.backgroundColor = _row_highlight_color;
      if (marker.icon !== self.markers.na_icon_active) {
        marker.setIcon(self.markers.na_icon_hover);
      };
    });
    
    google.maps.event.addListener(marker, 'mouseout', function() {
      // _table_row.style.backgroundColor = _row_background_color;
      if (marker.icon !== self.markers.na_icon_active) {
        marker.setIcon(self.markers.na_icon);
      };
    });
    
    this.markerClusterer.addMarker(marker);
  },

  clear_all_markers: function(){
    this.markerClusterer.clearMarkers();
  },
  test_markers: function() {
    var row, cell;
    var _lat = 32.7;
    var _lon = -117.1;
    var _offset = 0.5; // for randomly shifting points around the map
    var _text;
    for (var i = 0; i < 5; i++) {
      _text = "Marker #" + i.toString();
      // row = asset_table.insertRow(-1);
      // cell = row.insertCell(-1);
      // cell.innerHTML = _text
      this.create_marker(_lat, _lon, null, _text,"<P>Insert HTML here.</P>", null);

      _lat = _lat + _offset;
      _lon = _lon + _offset;
    }
  },
});


IONUX.Views.MapDashboardTable = IONUX.Views.DataTable.extend({
  initialize: function() {
    _.bindAll(this);
    this.$el.show();
    this.whitelist = this.options.list_table ? IONUX.ListWhitelist : IONUX.MapWhitelist;
    this.filter_data();
    this.collection.on('data:filter_render', this.filter_and_render);
    IONUX.Views.DataTable.prototype.initialize.call(this);
  },
  
  filter_data: function() {
    this.options.data = [];
    if (!_.isEmpty(this.whitelist)) {
       _.each(this.collection.models, function(resource) {
         var rt = resource.get('alt_resource_type') ? resource.get('alt_resource_type') : resource.get('type_');
         var lc = resource.get('lcstate');
         if (_.contains(this.whitelist, rt) && _.contains(this.whitelist, lc)) {
           this.options.data.push(resource.toJSON());
         };
       }, this);
    } else {
      this.options.data = this.collection.toJSON();
    };
  },
  
  filter_and_render: function() {
    this.filter_data();
    this.render();
  },
});


IONUX.Views.MapDataProductTable = IONUX.Views.DataTable.extend({
  initialize: function() {
    _.bindAll(this);
    this.$el.show();
    this.whitelist = IONUX.DataProductWhitelist;
    this.collection.on('data:filter_render', this.filter_and_render);
    this.options.data = this.collection.toJSON();
    IONUX.Views.DataTable.prototype.initialize.call(this);
    this.filter_and_render();
  },
  
  filter_data: function() {
    this.options.data = [];
    if (!_.isEmpty(this.whitelist)) {
       _.each(this.collection.models, function(resource) {
         var opn = resource.get('ooi_product_name')
         var lc = resource.get('lcstate');
           if (_.contains(this.whitelist, lc) && _.contains(this.whitelist, opn)) {
              this.options.data.push(resource.toJSON());
            };
       }, this);
    } else {
      this.options.data = this.collection.toJSON();
    };
  },
  
  filter_and_render: function() {
    this.filter_data();
    this.render();
  },
});




IONUX.Views.DashboardTable = IONUX.Views.DataTable.extend({
  initialize: function() {
    _.bindAll(this);
    this.$el.show();
    this.blacklist = this.options.list_table ? IONUX.ListWhitelist : IONUX.MapBlacklist;
    this.filter_data();
    this.collection.on('data:filter_render', this.filter_and_render);
    IONUX.Views.DataTable.prototype.initialize.call(this);
  },
  
  filter_data: function() {
    this.options.data = [];
    if (!_.isEmpty(this.blacklist)) {
       _.each(this.collection.models, function(resource) {
         if (!_.contains(this.blacklist, resource.get('type_')) && 
             !_.contains(this.blacklist, resource.get('lcstate'))) {
           this.options.data.push(resource.toJSON());
         };
       }, this);
    } else {
      this.options.data = this.collection.toJSON();
    };
  },
  
  filter_and_render: function() {
    this.filter_data();
    this.render();
  },
});


IONUX.Views.ResourceTable = IONUX.Views.DataTable.extend({
  initialize: function() {
    _.bindAll(this);
    this.$el.show();
    this.whitelist = IONUX.ListWhitelist;
    this.filter_data();
    this.collection.on('data:filter_render', this.filter_and_render);
    IONUX.Views.DataTable.prototype.initialize.call(this);
  },
  
  filter_data: function() {
    this.options.data = [];
    if (!_.isEmpty(this.whitelist)) {
       _.each(this.collection.models, function(resource) {
         if (_.contains(this.whitelist, resource.get('type_'))) {
           this.options.data.push(resource.toJSON());
         };
       }, this);
    } else {
      this.options.data = []; //this.collection.toJSON();
    };
  },
  
  filter_and_render: function() {
    this.filter_data();
    this.render();
  },
});



/* 
- - - - - - - - - - - - - - - - - 
  Map Filters
- - - - - - - - - - - - - - - - - 
*/

IONUX.MapWhitelist = [];
IONUX.Views.MapFilter = Backbone.View.extend({
  el: '#map-filter',
  filter_options: {
    short_asset_options: [
      {label: 'Station', type: 'StationSite'},
      {label: 'Instrument', type: 'InstrumentSite'},
      {label: 'Platform', type: 'PlatformSite'},
    ],
    long_asset_options: [
      {label: 'Station', type: 'PlatformSite'},
      {label: 'Instrument', type: 'InstrumentSite'},
      {label: 'Platform', type: 'PlatformDevice'},
    ],
    data_options: [
      {label: 'Data Products', type: 'DataProduct'}
    ],
    lcstate_options: [
      {label: 'Draft', lcstate: 'DRAFT'},
      {label: 'Planned', lcstate: 'PLANNED'},
      {label: 'Integrated', lcstate: 'INTEGRATED'},
      {label: 'Deployed', lcstate: 'DEPLOYED'},
      {label: 'Retired', lcstate: 'RETIRED'}
    ]
  },
  template: '\
    <!-- <div class="panelize">\
      <input id="radio-assets" type="radio" name="map_filter" value="asset" checked />&nbsp;Asset&nbsp;\
      <input id="radio-data" type="radio" name="map_filter" value="data" />&nbsp;Data&nbsp;\
    </div>-->\
    <div id="asset-filter" class="panelize"></div>\
    <h3>Lifecycle</h3>\
    <div id="lcstate-filter" class="panelize"></div>\
  ',

  events: {
    'click .filter-option input': 'set_filter'
  },
  
  initialize: function(){
    _.bindAll(this);
  },
  
  render: function(){
    this.$el.html(this.template);
    this.render_filter_options();
    return this;
  },
  
  render_filter_options: function(options){
    // Should not be in separate templates? 
    // Waiting for definitive filter behavior before consolidating.
    var item_tmpl = '<div class="filter-option resource-option"><%= label %> <div class="pull-right"><input type="checkbox" value="<%= type %>" checked /></div></div>';
    var lcstate_tmpl = '<div class="filter-option lcstate-option"><%= label %> <div class="pull-right"><input type="checkbox" value="<%= lcstate %>" checked /></div></div>';

    var assets_elmt = this.$el.find('#asset-filter');
    _.each(this.filter_options.short_asset_options, function(option) {
      IONUX.MapWhitelist.push(option['type']);
      assets_elmt.append(_.template(item_tmpl, option));
    });
    
    var lcstate_elmt = this.$el.find('#lcstate-filter');
    _.each(this.filter_options.lcstate_options, function(option) {
      IONUX.MapWhitelist.push(option['lcstate']);
      lcstate_elmt.append(_.template(lcstate_tmpl, option));
    });
  },
  
  toggle_filter: function(e) {
    this.$el.toggleClass('data-filter');
  },
  
  set_filter: function(e){
    var filter_elmt = $(e.target);
    var type = filter_elmt.val();
    if (filter_elmt.is(':checked')) {
      IONUX.MapWhitelist.push(type);
    } else {
      var index = IONUX.MapWhitelist.indexOf(type)
      IONUX.MapWhitelist.splice(index, 1);
    };
    IONUX.Dashboard.MapResources.trigger('data:filter_render');
    return;
  }
});


/* 
- - - - - - - - - - - - - - - - - 
  Asset List
- - - - - - - - - - - - - - - - - 
*/

IONUX.Collections.ListResources = Backbone.Collection.extend({
  initialize: function(models, options){
    this.resource_id = options.resource_id;
  },
  url: function() {
   return '/related_objects/'+this.resource_id+'/';
  },
  parse: function(resp) {
    var related_objects = [];
    _.each(resp.data, function(obj){related_objects.push(obj)});
    make_iso_timestamps(related_objects);
    return related_objects;
  }
});


/* 
- - - - - - - - - - - - - - - - - 
  List Filter
- - - - - - - - - - - - - - - - - 
*/

IONUX.ListWhitelist = ['DataProduct', 'InstrumentDevice', 'PlatformDevice', 'PlatformSite', 'StationSite', 'Observatory'];
IONUX.Views.ListFilter = Backbone.View.extend({
  el: '#list-filter',
  filter_options: {
    short_list: [
      {label: 'Data Product', type: 'DataProduct'},
      {label: 'Instrument', type: 'InstrumentDevice'},
      {label: 'Platform', type: 'PlatformDevice'},
      {label: 'Station', type: 'PlatformSite'},
      {label: 'Site', type: 'Observatory'},
    ],
    long_list: [
      {label: 'Data Products', type: 'DataProduct'}
    ]
  },
  template: '\
    <h3>Resource Type</h3>\
    <div class="panelize">\
      <div id="long-filter"></div>\
      <div id="short-filter"></div>\
    </div>',
  item_template: _.template('<div class="filter-option resource-option">\
                             <%= label %> <div class="pull-right"><input type="checkbox" value="<%= type %>" <%= checked %> /></div>\
                             </div>'),
  events: {
    'click .filter-option input': 'set_filter'
  },
  
  initialize: function() {
    _.bindAll(this);
  },
  
  render: function() {
    this.$el.html(this.template);
    this.render_short_list();
    return this;
  },
  
  render_short_list: function() {
    var long_list = this.$el.find('#long-filter');
    _.each(this.filter_options.short_list, function(option) {
      option['checked'] = _.contains(IONUX.ListWhitelist, option['type']) ? "checked" : "";
      long_list.append(this.item_template(option));
    }, this);
  },
  
  set_filter: function(e){
    console.log('set_filter');
    var filter_elmt = $(e.target);
    var type = filter_elmt.val();
    if (filter_elmt.is(':checked')) {
      IONUX.ListWhitelist.push(type);
    } else {
      var index = IONUX.ListWhitelist.indexOf(type)
      IONUX.ListWhitelist.splice(index, 1);
    }; 
    IONUX.Dashboard.ListResources.trigger('data:filter_render');
    console.log(IONUX.ListWhitelist);
  },
});



/* 
- - - - - - - - - - - - - - - - - 
  DataProduct Filter
- - - - - - - - - - - - - - - - - 
*/


IONUX.DataProductWhitelist = [];
IONUX.Views.DataProductFilter = Backbone.View.extend({
  el: '#map-data-filter',
  filter_options: {
    lcstate_options: [
      {label: 'Draft', lcstate: 'DRAFT'},
      {label: 'Planned', lcstate: 'PLANNED'},
      {label: 'Integrated', lcstate: 'INTEGRATED'},
      {label: 'Deployed', lcstate: 'DEPLOYED'},
      {label: 'Retired', lcstate: 'RETIRED'}
    ]
  },
  template: '\
    <!-- <div class="panelize">\
      <input id="radio-assets" type="radio" name="map_filter" value="asset" checked />&nbsp;Asset&nbsp;\
      <input id="radio-data" type="radio" name="map_filter" value="data" />&nbsp;Data&nbsp;\
    </div>-->\
    <div id="dataproduct-filter" class="panelize"></div>\
    <h3>Lifecycle</h3>\
    <div id="lcstate-filter" class="panelize"></div>\
  ',

  events: {
    'click .filter-option input': 'set_filter'
  },
  
  initialize: function(){
    _.bindAll(this);
    this.group_list = this.options.group_list;
    console.log('this.group_list', this.group_list);
  },
  
  render: function(){
    this.$el.html(this.template);
    this.render_filter_options();
    this.$el.find('#dataproduct-filter').jScrollPane({autoReinitialise: true});
    return this;
  },
  
  render_filter_options: function(options){
    // Should not be in separate templates? 
    // Waiting for definitive filter behavior before consolidating.
    var item_tmpl = '<div class="filter-option dataproduct-option" title="<%= type %>"><span style="display:inline-block;width:150px;text-overflow:ellipsis;white-space: nowrap;overflow: hidden;"><%= type %></span> <div class="pull-right"><input type="checkbox" value="<%= type %>" checked /></div></div>';
    var lcstate_tmpl = '<div class="filter-option lcstate-option"><%= label %> <div class="pull-right"><input type="checkbox" value="<%= lcstate %>" checked /></div></div>';

    var dp_elmt = this.$el.find('#dataproduct-filter');
    _.each(this.group_list, function(option) {
      IONUX.DataProductWhitelist.push(option);
      dp_elmt.append(_.template(item_tmpl, {type: option}));
    });
    
    var lcstate_elmt = this.$el.find('#lcstate-filter');
    _.each(this.filter_options.lcstate_options, function(option) {
      IONUX.DataProductWhitelist.push(option['lcstate']);
      lcstate_elmt.append(_.template(lcstate_tmpl, option));
    });
  },
  
  toggle_filter: function(e) {
    this.$el.toggleClass('data-filter');
  },
  
  set_filter: function(e){
    var filter_elmt = $(e.target);
    var type = filter_elmt.val();
    if (filter_elmt.is(':checked')) {
      IONUX.DataProductWhitelist.push(type);
    } else {
      var index = IONUX.DataProductWhitelist.indexOf(type)
      IONUX.DataProductWhitelist.splice(index, 1);
    };
    
    console.log('set_filter', IONUX.DataProductWhitelist);
    IONUX.Dashboard.MapDataResources.trigger('data:filter_render');
    return;
  }
});




INTERACTIONS_OBJECT.dp_filter_intereactions = ['Select All', 'Select None'];
IONUX.Views.DPFilterActions = IONUX.Views.ActionMenu.extend({
  dropdown_button_tmpl: '<div class="dataproduct-mode action-menu btn-group pull-right">\
  <a class="btn dropdown-toggle" data-toggle="dropdown"><span class="hamburger">&nbsp;</span></a>\
  <ul class="dropdown-menu"><% _.each(dropdown_items, function(item) { %> <li><%= item %></li> <% }); %></ul>\
  </div>',
  
  "events": _.extend({
        "hover": "action_controls_onhover",
    }, IONUX.Views.ActionMenu.prototype.events),

    initialize: function() {
        this.interaction_items = INTERACTIONS_OBJECT.dp_filter_intereactions;
        this.on("action__select_all", this.action__select_all);
        this.on("action__select_none", this.action__select_none);
        this.create_actionmenu();
    },

    action__select_all:function(target){
      console.log('action__select_all');
      
      _.each($('#dataproduct-filter input:not(:checked)'), function(el) {
        var item = $(el).val();
        IONUX.DataProductWhitelist.push(item);
        $(el).prop('checked', true);
      });
      IONUX.Dashboard.MapDataResources.trigger('data:filter_render');
    },
    
    action__select_none:function(target){
      _.each($('#dataproduct-filter input:checked'), function(el) {
        var item = $(el).val();
        var item_idx = IONUX.DataProductWhitelist.indexOf(item);
        IONUX.DataProductWhitelist.splice(item_idx, 1);
        $(el).prop('checked', false);
      });
      IONUX.Dashboard.MapDataResources.trigger('data:filter_render');
    }
});
