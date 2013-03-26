IONUX.Spinners = {
  xlarge: {
    lines: 11, // The number of lines to draw
    length: 2, // The length of each line
    width: 12, // The line thickness
    radius: 25, // The radius of the inner circle
    corners: 0.7, // Corner roundness (0..1)
    rotate: 29, // The rotation offset
    color: '#fff', // #rgb or #rrggbb
    speed: 1.3, // Rounds per second
    trail: 54, // Afterglow percentage
    shadow: true, // Whether to render a shadow
    hwaccel: false, // Whether to use hardware acceleration
    className: 'spinner', // The CSS class to assign to the spinner
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    top: 'auto', // Top position relative to parent in px
    left: 'auto' // Left position relative to parent in px
  },
}

IONUX.DashboardState = 'MAP';


IONUX.Views.ViewControls = Backbone.View.extend({
  el: '#view-controls',
  template: '<button id="btn-map">Map</button> <button id="btn-list">List</button>',
  events: {
    'click #btn-map': 'map_view',
    'click #btn-list': 'list_view'
  },
  initialize: function(){
    _.bindAll(this);
  },
  render: function() {
    this.$el.removeClass('placeholder');
    this.$el.html(this.template);
    new IONUX.Views.AssetMap().render().el;
    return this;
  },
  map_view: function(e) {
    e.preventDefault();
    $('#content').html('MAP VIEW!')
  },
  list_view: function(e) {
    e.preventDefault();    
    $('#content').html('LIST VIEW!')
  },
});


/* 
- - - - - - - - - - - - - - - - - 
  Site Navigation
- - - - - - - - - - - - - - - - - 
*/

IONUX.Collections.Sites = Backbone.Collection.extend({
  url: '/Org/list/',
  parse: function(resp) {
    return resp.data;
  }
});

IONUX.Views.SiteNavigation = Backbone.View.extend({
  el: '#site-list',
  template: _.template($('#dashboard-site-list-tmpl').html()),
  events: {
  },
  initialize: function(){
    _.bindAll(this);
    var self = this;
    this.collection.fetch({
      success: function() {
        self.render().el;
      }
    });
  },
  render: function() {
    this.$el.removeClass('placeholder');
    this.$el.html(this.template({sites: this.collection.toJSON()}));
    return this;
  }
});

IONUX.Views.AssetMap = Backbone.View.extend({
  // el: '#map_canvas',
  // template: '<div id="map_canvas" style="background:red;display:block;">alksjf<div style="position:absolute;">word</div></div>',
  default_map_options: {
    center: new google.maps.LatLng(0, 0),
    zoom: 3,
    mapTypeId: google.maps.MapTypeId.TERRAIN,
    disableDefaultUI: true
  },
  
  initialize: function(){
    _.bindAll(this);
  },
  render: function(){
    this.init_map();
    return this;
  },
  init_map: function(map_options, container_server) {
    if (map_options == null) var map_options = this.default_map_options;
    console.log('map_options', map_options);
    // this.map = new google.maps.Map(map, map_options);
    var map = $('#map_canvas')[0];
    console.log('map', map);
    new google.maps.Map(document.getElementById('content'), {
      center: new google.maps.LatLng(0, 0),
      zoom: 3,
      mapTypeId: google.maps.MapTypeId.TERRAIN,
      disableDefaultUI: true
    });

    // Add the markers to the map clusterer which will handle large collections of markers
    // this.markerClusterer = new MarkerClusterer(this.map);

    // For debugging
    // testMarkers();
  }
});

































