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

IONUX.Views.ViewControls = Backbone.View.extend({
  el: '#view-controls',
  template: '<button id="btn-map" class="btn-view active">Map</button><button id="btn-resources" class="btn-view">Resources</button>',
  events: {
    'click #btn-map': 'map_view',
    'click #btn-resources': 'list_view'
  },
  initialize: function(){
    _.bindAll(this);
  },
  render: function() {
    this.$el.removeClass('placeholder');
    this.$el.html(this.template);
    return this;
  },
  map_view: function(e) {
    e.preventDefault();
    // Todo: clean up with parent $el CSS
    this.$el.find('.active').removeClass('active');
    $(e.target).addClass('active');
    new IONUX.Views.AssetMap().render().el;
  },
  list_view: function(e) {
    e.preventDefault();
    // Todo: clean up with parent $el CSS
    this.$el.find('.active').removeClass('active');
    $(e.target).addClass('active');
    // -------
    $('#map_canvas').empty().hide();
  },
});


/* 
- - - - - - - - - - - - - - - - - 
  Site Navigation
- - - - - - - - - - - - - - - - - 
*/

IONUX.Collections.Observatories = Backbone.Collection.extend({
  url: '/Observatory/list/',
  parse: function(resp) {
    return resp.data;
  }
});

IONUX.Views.SiteSelector = Backbone.View.extend({
  el: '#site-list',
  template: _.template($('#dashboard-site-list-tmpl').html()),
  events: {},
  initialize: function(){
    console.log('SiteNavigation initialize');
    
    _.bindAll(this);
    this.collection.on('reset', this.render);
  },
  render: function() {
    console.log('sites', this.collection.toJSON());
    
    this.$el.removeClass('placeholder');
    this.$el.html(this.template({sites: this.collection.toJSON()}));
    return this;
  }
});


/* 
- - - - - - - - - - - - - - - - - 
  Asset Map
- - - - - - - - - - - - - - - - - 
*/

IONUX.Views.AssetMap = Backbone.View.extend({
  el: '#map_canvas',
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
    this.$el.show();
    this.draw_map();
    return this;
  },
  draw_map: function(map_options, container_server) {
    if (map_options == null) var map_options = this.default_map_options;
    this.map = new google.maps.Map(document.getElementById('map_canvas'), {
      center: new google.maps.LatLng(0, 0),
      zoom: 3,
      mapTypeId: google.maps.MapTypeId.TERRAIN,
      disableDefaultUI: true
    });
    this.markerClusterer = new MarkerClusterer(this.map)
    this.test_markers();
    // Add the markers to the map clusterer which will handle large collections of markers
    // this.markerClusterer = new MarkerClusterer(this.map);
    // For debugging
    // testMarkers();
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
        var iw = new google.maps.InfoWindow({
            content: _info_content
        });

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
    }

    this.markerClusterer.addMarker(marker);
  },
  clear_all_markers: function(){
    this.markerClusterer.clearMarkers();
  },
  test_markers: function() {
    // var asset_table=document.getElementById("asset_table");
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

































