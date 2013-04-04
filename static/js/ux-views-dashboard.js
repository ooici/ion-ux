// Todo: clean up MapAsset events and get draw_markers/render_table events
// in sync. Possibly move MapBlacklist into it's own collection and listen
// for change events.

IONUX.DashboardView = "Map";

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
    return this;
  },  
  render_map_view: function(e) {
    if (e) e.preventDefault();
    $('#btn-map').addClass('active').siblings('.active').removeClass('active');
    IONUX.ROUTER.navigate('/dev/dashboard', true);
  },
  render_list_view: function(e) {
    if (e) e.preventDefault();
    $('#btn-resources').addClass('active').siblings('.active').removeClass('active');
    IONUX.ROUTER.navigate('/dev/dashboard/resources', true);
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
  el: '#selector-list',
  initialize: function(){
    _.bindAll(this);
    this.title = this.options.title;
    this.collection.on('reset', this.render);
  },
  render: function(){
    this.$el.removeClass('placeholder');
    this.$el.html(this.template({resources: this.collection.toJSON(), title: this.title}));
    return this;
  },
})

IONUX.Views.ObservatorySelector = IONUX.Views.ResourceSelector.extend({
  template: _.template($('#dashboard-observatory-list-tmpl').html()),
  events: {'click .resource-link': 'focus_map'},
  focus_map: function(e){
    e.preventDefault();
  }
});

IONUX.Views.OrgSelector = IONUX.Views.ResourceSelector.extend({
  template: _.template($('#dashboard-org-list-tmpl').html()),
});


/* 
- - - - - - - - - - - - - - - - - 
  Asset Map
- - - - - - - - - - - - - - - - - 
*/

IONUX.MapBlacklist = [];

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
    return related_sites;
  }
});

IONUX.Views.Map = Backbone.View.extend({
  el: '#map_canvas',
  initialize: function(){
    _.bindAll(this);
    this.draw_map();
    this.render_table();
    this.model.on('change', this.pan_map);
    this.collection.on('update_markers', this.draw_markers);
    this.collection.on('reset', this.render_table);
  },

  render: function(){
    this.$el.show();
    return this;
  },
  
  render_table: function(){
    console.log('render_table');
    var resource_table = $('#2163993');
    resource_table.show();
    if (!_.isEmpty(IONUX.MapBlacklist)) {
      var filtered_resources = []
      _.each(IONUX.Dashboard.MapResources.models, function(resource) {
        if (!_.contains(IONUX.MapBlacklist, resource.get('type_')) && !_.contains(IONUX.MapBlacklist, resource.get('lcstate'))) {
          filtered_resources.push(resource.toJSON());
        };
      });
      new IONUX.Views.DataTable({el: resource_table, data: filtered_resources});
    } else {
      new IONUX.Views.DataTable({el: resource_table, data: this.collection.toJSON()});
    };
  },
  
  draw_map: function(map_options, container_server) {
    console.log('draw_map');
    $('#map_canvas').empty().show();
    this.map = new google.maps.Map(document.getElementById('map_canvas'), {
      center: new google.maps.LatLng(39.8106460, -98.5569760),
      zoom: 3,
      mapTypeId: google.maps.MapTypeId.TERRAIN,
      disableDefaultUI: true
    });
    this.markerClusterer = new MarkerClusterer(this.map);
  },
  
  draw_markers: function() {
    console.log('draw_markers');
    var self = this;
    _.each(this.collection.models, function(resource) {
      var lat = resource.get('geospatial_point_center')['lat'];
      var lon = resource.get('geospatial_point_center')['lon'];
      self.create_marker(lat, lon, null, '_text',"<P>Insert HTML here.</P>", null);
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
      this.draw_markers();
    } catch(err) {
      console.log('pan_map error:', err);
      this.draw_map();
      this.draw_markers();
    }
  },
  
  create_marker: function(_lat, _lon, _icon, _hover_text, _info_content, _table_row) {
    if (!_lat || !_lon) return null;
    // Add marker to map
    latLng = new google.maps.LatLng(_lat, _lon);
    var marker = new google.maps.Marker({
      map: this.map,
      position: latLng,
      icon: _icon,
      title: _hover_text
    });

    // mouse click opens infoWindow
    if (_info_content) {
      var iw = new google.maps.InfoWindow({content: _info_content});
      var _map = this.map;
      // Event when marker is clicked
      google.maps.event.addListener(marker, 'click', function(_map) {
        // iw.open(this.map, marker);
      });

      // Event for mouseover
      // google.maps.event.addListener(marker, 'mouseover', function() {
      //     _table_row.style.backgroundColor = _row_highlight_color;
      // });

      // Event for mouseout
      // google.maps.event.addListener(marker, 'mouseout', function() {
      //     _table_row.style.backgroundColor = _row_background_color;
      // });
    };
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


/* 
- - - - - - - - - - - - - - - - - 
  Map Filters
- - - - - - - - - - - - - - - - - 
*/


IONUX.Views.MapFilter = Backbone.View.extend({
  el: '#map-filter',
  filter_options: {
    asset_options: [
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
    <h3>Filter</h3>\
    <div class="">\
      <input id="radio-assets" type="radio" name="map_filter" value="asset" checked />&nbsp;Asset&nbsp;\
      <input id="radio-data" type="radio" name="map_filter" value="data" />&nbsp;Data&nbsp;\
    </div>\
    <div id="asset-filter"></div>\
    <div id="data-filter"></div>\
    <h3>Lifecycle</h3>\
    <div id="lcstate-filter"></div>\
  ',

  events: {
    'click .filter-option': 'set_filter'
  },
  initialize: function(){
    _.bindAll(this);
  },
  
  render: function(){
    this.$el.show().html(this.template);
    this.render_filter_options();
    return this;
  },
  
  render_filter_options: function(options){
    // Should not be in separate templates? 
    // Waiting for definitive filter behavior before consolidating.
    var item_tmpl = '<div class="filter-option"><%= label %> <input type="checkbox" value="<%= type %>" <%= checked %> /></div>';
    var lcstate_tmpl = '<div class="filter-option"><%= label %> <input type="checkbox" value="<%= lcstate %>" <%= checked %> /></div>';

    var assets_elmt = this.$el.find('#asset-filter');
    _.each(this.filter_options.asset_options, function(option) {
      option['checked'] = _.contains(IONUX.MapBlacklist, option['type']) ? "" : "checked";
      assets_elmt.append(_.template(item_tmpl, option));
    });
    
    var lcstate_elmt = this.$el.find('#lcstate-filter');
    _.each(this.filter_options.lcstate_options, function(option) {
      option['checked'] = _.contains(IONUX.MapBlacklist, option['lcstate']) ? "" : "checked";
      lcstate_elmt.append(_.template(lcstate_tmpl, option));
    });
    
    // Waiting for resource_registry calls
    // var data_elmt = this.$el.find('#data-filter');
    // _.each(this.filter_options.data_options, function(option) {
    //   data_elmt.append(_.template(item_tmpl, option));
    // });
  },
  
  toggle_filter: function(e) {
    this.$el.toggleClass('data-filter');
  },
  
  set_filter: function(e){
    console.log('set_filter');
    var filter_elmt = $(e.target);
    var type = filter_elmt.val();
    if (filter_elmt.is(':checked')) {
      var index = IONUX.MapBlacklist.indexOf(type)
      IONUX.MapBlacklist.splice(index);
    } else {
      IONUX.MapBlacklist.push(type);
    }; 
    IONUX.Dashboard.MapResources.trigger('reset');
  },
});


/* 
- - - - - - - - - - - - - - - - - 
  Asset Lists
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
    console.log('related_objects', related_objects);
    return related_objects;
  }
});


IONUX.Views.List = Backbone.View.extend({
  el: '#2163993',

  initialize: function(){
    _.bindAll(this);
    this.collection.on('reset', this.render_table);
  },

  render: function(){
    this.$el.show();
    return this;
  },
  
  render_table: function(){
    console.log('render_table');
    new IONUX.Views.DataTable({el: this.$el, data: this.collection.toJSON()});
    
    // if (!_.isEmpty(IONUX.MapBlacklist)) {
    //   var filtered_resources = []
    //   _.each(IONUX.Dashboard.ListResources.models, function(resource) {
    //     if (!_.contains(IONUX.MapBlacklist, resource.get('type_')) && !_.contains(IONUX.MapBlacklist, resource.get('lcstate'))) {
    //       filtered_resources.push(resource.toJSON());
    //     };
    //   });
    //   new IONUX.Views.DataTable({el: this.$el, data: filtered_resources});
    // } else {
    //   new IONUX.Views.DataTable({el: this.$el, data: this.collection.toJSON()});
    // };
  },
});
