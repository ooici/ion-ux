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
  events: {
    'click span': 'filter',
  },
  initialize: function() {},
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

IONUX.Collections.PlatformSites = Backbone.Collection.extend({
  url: '/PlatformSite/list/',
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

  events: {
      'click .secondary-link': 'click_action',
      'click .secondary-link-selected': 'click_action',
      'click .toggle-all-menu': 'toggle_action',
      'click .toggle-all-menu-selected': 'toggle_action',
      'click .primary-link': 'trigger_pan_map'
  },

  trigger_pan_map: function(e) {
   IONUX.Dashboard.MapResource.tmp = e.target.innerHTML.toString().trim();
   //get selected id
   var res = e.target.pathname.split("/",3);
   IONUX.Dashboard.MapResource.tmpId = res[2];
   IONUX.Dashboard.MapResource.trigger('pan:map');
  },
  
   click_action_map: function(e){
       e.preventDefault();
       var target = $(e.target);
       target.parent().next('ul').toggle();
  },

  click_action: function(e){
      e.preventDefault();
      var target = $(e.target);
      target.parent().parent().next('ul').toggle()
      if (target.parent().parent().next('ul').is(":visible")) {
          target.attr('class','secondary-link-selected  pull-right');
      }
      else {
          target.attr('class','secondary-link pull-right');
      }

      console.log(target.parent().parent().next('ul').is(":visible"))
  },

   toggle_action: function(e){
       e.preventDefault();
       var map_target = $('.map-nested-ul');
       map_target.toggle();
       var target = $(e.target);
       console.log(target.attr('class'));
       if (target.attr('class') == 'toggle-all-menu pull-right'){
           target.attr('class', 'toggle-all-menu-selected pull-right')
       }
       else {
           target.attr('class', 'toggle-all-menu pull-right')
       }
   },

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
  
  new_markers: {
    na: {
      icon: {
        anchor: new google.maps.Point(20, 45),
        origin: new google.maps.Point(420, 180),
        size: new google.maps.Size(50, 50),
        url: '/static/img/pepper_sprite.png'
      },
      hover: {
        anchor: new google.maps.Point(20, 45),
        origin: new google.maps.Point(480, 180),
        size: new google.maps.Size(50, 50),
        url: '/static/img/pepper_sprite.png'
      },
      active: {
          anchor: new google.maps.Point(20, 45),
          origin: new google.maps.Point(540, 180),
          size: new google.maps.Size(50, 50),
          url: '/static/img/pepper_sprite.png'
      }
    },
    
    critical: {
      icon: {
        anchor: new google.maps.Point(20, 45),
        origin: new google.maps.Point(420, 60),
        size: new google.maps.Size(50, 50),
        url: '/static/img/pepper_sprite.png'
      },
      hover: {
        anchor: new google.maps.Point(20, 45),
        origin: new google.maps.Point(480, 60),
        size: new google.maps.Size(50, 50),
        url: '/static/img/pepper_sprite.png'
      },
      active: {
          anchor: new google.maps.Point(20, 45),
          origin: new google.maps.Point(540, 60),
          size: new google.maps.Size(50, 50),
          url: '/static/img/pepper_sprite.png'
      },
    },

    warning: {
      icon: {
          anchor: new google.maps.Point(20, 45),
          origin: new google.maps.Point(420, 120),
          size: new google.maps.Size(50, 50),
          url: '/static/img/pepper_sprite.png'
      },
      hover: {
        anchor: new google.maps.Point(20, 45),
        origin: new google.maps.Point(480, 120),
        size: new google.maps.Size(50, 50),
        url: '/static/img/pepper_sprite.png'
      },
      active: {
          anchor: new google.maps.Point(20, 45),
          origin: new google.maps.Point(540, 180),
          size: new google.maps.Size(50, 50),
          url: '/static/img/pepper_sprite.png'
      },
    },

    ok: {
      icon: {
          anchor: new google.maps.Point(20, 45),
          origin: new google.maps.Point(420, 0),
          size: new google.maps.Size(50, 50),
          url: '/static/img/pepper_sprite.png'
      },
      hover: {
        anchor: new google.maps.Point(20, 45),
        origin: new google.maps.Point(480, 0),
        size: new google.maps.Size(50, 50),
        url: '/static/img/pepper_sprite.png'
      },
      active: {
          anchor: new google.maps.Point(20, 45),
          origin: new google.maps.Point(540, 0),
          size: new google.maps.Size(50, 50),
          url: '/static/img/pepper_sprite.png'
      },
    }
  },
  
  events: {
    'click': 'render_map_bounds'
  },
  
  render_map_bounds: function(e){
     var bounds = this.map.getBounds();
      
    if (e && e.latLng){
      bounds['center'] = e.latLng;
    }else{
      bounds['center'] = this.map.getCenter();
    }  
      bounds['ne'] = bounds.getNorthEast();
      bounds['sw'] = bounds.getSouthWest();
      
      var bounds_tmpl = '<div class="row">\
                          <div class="span6">\
                            &nbsp;\
                            <strong>Lat:</strong> <%= ne.lat().toFixed(4) %> / <%= sw.lat().toFixed(4) %>&nbsp;&nbsp;\
                            <strong>Lon:</strong> <%= ne.lng().toFixed(4) %> / <%= sw.lng().toFixed(4) %>\
                          </div>\
                          <div class="span6" style="text-align:right">\
                            <strong>Center:</strong> <%= center.lat().toFixed(4) %> / <%= center.lng().toFixed(4) %>\
                          </div>';
      
      this.map_bounds_elmt.html(_.template(bounds_tmpl, bounds))
  },
  
  initialize: function(){
    _.bindAll(this);
    
    this.sprite_url = '/static/img/pepper_sprite.png';
    this.active_marker = null; // Track clicked icon
    this.sites_status_loaded = false;
    this.map_bounds_elmt = $('#map_bounds');
    
    this.model.on('pan:map', this.pan_map);
    this.model.on('set:active', this.set_active_marker);

    // this.collection.on('reset', this.draw_markers);
    // this.collection.on('reset', this.get_sites_status);

    this.observatoryBboxes = [];

    this.draw_map();
    this.draw_markers();
    
    // HACK! temporarily workaround to a timing issue in Chrome/Safari.
    // this.get_sites_status();
    window.setTimeout(this.get_sites_status, 1000);
  },
  
  getPlatformSites: function(obs){
    var PlatformSitesId = [];
    var PlatformSitesList = {};
    var PlatformSite;
    var nonstationsite =0;
    for (var observatory in obs){
        PlatSite = (obs[observatory].site_resources);
        ObsSite = (obs[observatory]['site_resources'][observatory]);
        var numberOfPlatforms = 0;
        for (var p in PlatSite) {
          id = p.toString();
          var type =PlatSite[id]['type_'];
          var alt_type =PlatSite[id]['alt_resource_type'];
          if (type == "PlatformSite"){
            if (alt_type == "StationSite"){
              PlatformSitesId.push(id);
              PlatSite[id].status =obs[observatory]['site_aggregate_status'][id]
              PlatSite[id].parentId = ObsSite['_id'];
              PlatSite[id].spatial_area_name = ObsSite['spatial_area_name'];
              PlatformSitesList[id] = PlatSite[id];
              numberOfPlatforms++;
            }else{
              nonstationsite++;
            }
          }
        }
        if (numberOfPlatforms==0){
          //console.log(ObsSite.name);
          PlatformSitesList[ObsSite['_id']] = ObsSite;
        }
    }
      return PlatformSitesList;
  },

  get_sites_status: function() {
    var resource_ids = this.collection.pluck('_id');
    $('#map_canvas').append('<div id="loading-status" style="">Loading Status...</div>')
    
    var self = this;
    $.ajax({
      type: 'POST',
      contentType: 'application/json',
      url: '/get_sites_status/',
      data: JSON.stringify({resource_ids: resource_ids}),
      dataType: 'json',
      global: false,
      success: function(resp) {
        self.sites_status_loaded = true;
        //gets the observatories
        self.sites_status = resp.data;
        //get the platform sites
        self.platformSitesList = self.getPlatformSites(self.sites_status);
        //draw stuff
        self.clear_all_markers();
        self.clear_all_bboxes();
        self.draw_markers();
      },
      complete: function(){
        $('#loading-status').remove();
      },
    });
  },
    
  group_spatial_area_names: function(){
    this.spatial_area_names = {};
    var sans = _.uniq(this.collection.pluck('spatial_area_name'));
    _.each(sans, function(san) {
      
      var resources = this.collection.where({'spatial_area_name': san});
      
      var north_points = _.map(resources, function(resource) {return resource.get('constraint_list')[0]['geospatial_latitude_limit_north']});
      var north = _.max(north_points);
      
      var east_points = _.map(resources, function(resource) {return resource.get('constraint_list')[0]['geospatial_longitude_limit_east']});
      var east = _.max(east_points);
      
      var south_points = _.map(resources, function(resource) {return resource.get('constraint_list')[0]['geospatial_latitude_limit_south']});
      var south = _.min(south_points);
      
      var west_points = _.map(resources, function(resource) {return resource.get('constraint_list')[0]['geospatial_longitude_limit_west']});
      var west = _.min(west_points);
      
      // Catch single items and add some padding to avoid 
      // Google Maps 'Image Not Found' when panning to a tight boundary.
      if (resources.length < 4) {
        north += 1.0;
        east += 1.0;
        south -= 1.0;
        west -= 1.0;
      };
      
      if (! _.has(this.spatial_area_names, san)) {
        this.spatial_area_names[san] = {
          north: north,
          east: east,
          south: south,
          west: west
        };
      };
    
    }, this); // _.each
  },
  
  draw_map: function(map_options, container_server) {
    console.log('draw_map');
    $('#map_canvas').empty().show();
    
    this.map = new google.maps.Map(document.getElementById('map_canvas'), {
      center: new google.maps.LatLng(39.8106460, -98.5569760),
      zoom: 3,
      mapTypeId: google.maps.MapTypeId.SATELLITE,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: {style: google.maps.ZoomControlStyle.SMALL, position: google.maps.ControlPosition.TOP_RIGHT}
    });
    
        // add the cable kml
    new google.maps.KmlLayer({
       url                 : 'http://ion-alpha.oceanobservatories.org/static/data/rsn_cable_layouts_v1.5.3.kml'
      ,preserveViewport    : true
      ,clickable           : false
      ,suppressInfoWindows : true
      ,map                 : this.map
    });
    
    // register event to get and render map bounds
    var self = this;
    google.maps.event.addListener(this.map, "bounds_changed", function(e) {
       self.render_map_bounds(e);
    });
    

    google.maps.event.addListener(this.map, "mousemove", function(e) {
        self.render_map_bounds(e);
    });
    
    this.markerClusterer = new MarkerClusterer(this.map, null, {
      maxZoom: 10,
      gridSize: 10, 
      styles: [{
        backgroundPosition: '-420px -420px',
        height: 50,
        width: 50,
        url: '/static/img/pepper_sprite.png',
        textSize: '0',
        maxZoom: 15
      }]
    });
  },
  
  draw_markers: function() {
    console.log('draw_markers');
    this.group_spatial_area_names();
    var self = this;
    //get the observatories
    self.observatoryBboxes = [];
    _.each(this.collection.models, function(resource) {
      var lat = resource.get('geospatial_point_center')['lat'];
      var lon = resource.get('geospatial_point_center')['lon'];
      var rid = resource.get('_id');
      var rname = resource.get('name');
      //self.create_marker(lat, lon, null, rname,"<P>Insert HTML here.</P>", null, rid,false);

      // Fudge any point bboxes into real bboxes.  Google doesn't have any real geographic
      // functions, so assume the world is flat!
      var bbox  = [
         resource.get('constraint_list')[0]['geospatial_longitude_limit_west']
        ,resource.get('constraint_list')[0]['geospatial_latitude_limit_south']
        ,resource.get('constraint_list')[0]['geospatial_longitude_limit_east']
        ,resource.get('constraint_list')[0]['geospatial_latitude_limit_north']
      ];
      var area  = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]);
      var fudge = 1 / 110400 * (1000 + area * 5000); // 1 DD = 110400 m
      var path  = [
        new google.maps.LatLng(
           bbox[1] - fudge
          ,bbox[0] - fudge
        )
        ,new google.maps.LatLng(
           bbox[1] - fudge
          ,bbox[2] + fudge
        )
        ,new google.maps.LatLng(
           bbox[3] + fudge
          ,bbox[2] + fudge
        )
        ,new google.maps.LatLng(
           bbox[3] + fudge
          ,bbox[0] - fudge
        )
        ,new google.maps.LatLng(
           bbox[1] - fudge
          ,bbox[0] - fudge
        )
      ];
      self.create_bbox(path,rname);
    });
    
    
    //get the platform sites
   _.each(this.platformSitesList, function(resource) {
        var lat = resource['geospatial_point_center']['lat'];
        var lon = resource['geospatial_point_center']['lon'];
        var rid = resource['_id'];
        var rname = resource['name'];
        var type = resource['type_'];
        self.create_marker(lat, lon, null, rname,"<P>Insert HTML here.</P>", null, rid,type);
      });

    //stops zoom out to max level
     this.pan_map();
  },
  

  pan_map: function() {
    
      var sanNames = _.uniq(this.collection.pluck('spatial_area_name'));
      //get san
      var san = this.model.get('spatial_area_name');
      //get tmp san
      var san_tmp = IONUX.Dashboard.MapResource.tmp;
      //check if site or pin selected
      var idx = sanNames.indexOf(san_tmp);
      var isSite = false;
      if (idx>=0){
        isSite = true;
      }
      //if not site find the spatial area
       if (!isSite){
        if (san_tmp){
        var tmpPin = san_tmp;
        //get the resource id from the selected model
        var resources = this.collection.where({'_id': IONUX.Dashboard.MapResource.tmpId});
         if (resources.length==1){
            san_tmp = resources[0].get('spatial_area_name');
         }else if(resources.length>1){
            console.log("too many resources");
         }
       }
      }

      //first check to see if spatial area name selected is valid
      var loc = this.spatial_area_names[san_tmp]
      if (loc){
          //if so thats the one we are interested in
          san = san_tmp;
          this.model.set('spatial_area_name',san);
          this.group_spatial_area_names();
      }else{
          //try using the set spatial area name
          loc = this.spatial_area_names[san]
          if (!loc){
            this.model.set('spatial_area_name',san);
            this.group_spatial_area_names();
          }
      }

      var bounds
      if (san) {
        var n = this.spatial_area_names[san]['north'];
        var e = this.spatial_area_names[san]['east'];
        var s = this.spatial_area_names[san]['south'];
        var w = this.spatial_area_names[san]['west'];
        
        var ne = new google.maps.LatLng(n, e);
        var sw = new google.maps.LatLng(s, w);
        bounds = new google.maps.LatLngBounds(sw, ne)
      }

      //checks for BB already at location
      if (bounds){
        var curBounds = this.map.getBounds();
        if(curBounds.fa){
          if ((curBounds.fa.b == bounds.fa.b) && (curBounds.fa.d == bounds.fa.d) && (curBounds.ga.d == bounds.ga.d) && (curBounds.ga.b == bounds.ga.b)){
            console.log("bounds ok");
          }else{
            this.map.fitBounds(bounds);
            // Redraw the markers because it may have gotten confused (missing cluster markers).
            if (this.markerClusterer) {
              this.markerClusterer.setMap(null);
              this.markerClusterer.setMap(this.map);
            }
            console.log('pan_map');
          }
        }else{
          this.map.fitBounds(bounds);
          // The following may not be necessary, but I thought it would be safe to match what was done above.
          // Redraw the markers becuase it may have gotten confused (missing cluster markers).
          if (this.markerClusterer) {
            this.markerClusterer.setMap(null);
            this.markerClusterer.setMap(this.map);
          }
        }
      }else{
      //logs range error
        console.log('pan_map error:', 'invalid range');
      }
  },
  
   get_status_code: function(resource_id){
    var status_code;
    //try and get it from the obs data
    var station = this.sites_status[resource_id];
    
    if (station){
      status_code = station['site_aggregate_status'][resource_id];
       
    }else{
       this.platformSitesList[resource_id]['status'];
    }
    return status_code;
  },

  create_bbox : function(_path,_hover_text) {
    var poly = new google.maps.Polyline({
       strokeColor   : '#FFE4B5'
      ,strokeOpacity : 0.8
      ,strokeWeight  : 2
      ,path          : _path
      ,title         : _hover_text
      ,map           : this.map
    });

/*
    // Title's don't create tooltips
    google.maps.event.addListener(poly,'mouseover',function() {
      console.log(_hover_text);
    });
    google.maps.event.addListener(poly,'mouseout',function() {
    });
*/

    this.observatoryBboxes.push(poly);
  },

  create_marker: function(_lat, _lon, _icon, _hover_text, _info_content, _table_row, resource_id,resource_type) {
    
    if (!_lat || !_lon) return null;
    
    latLng = new google.maps.LatLng(_lat, _lon);
    
    if (this.sites_status_loaded) {
      try {
        var status_code = this.get_status_code(resource_id);
        switch(status_code) {
          case 2:
            var resource_status = 'ok';
            break;
          case 3:
            var resource_status = 'warning';
            break;
          case 4:
            var resource_status = 'critical';
            break
          default:
            var resource_status = 'na';
        }
      } catch(err) {
        console.log('create_marker status error:', err);
        var resource_status = 'na';
      };
    } else {
      var resource_status = 'na';
    };
    
    var marker = new google.maps.Marker({
        map: this.map,
        position: latLng,
        icon: this.new_markers[resource_status].icon,
        title: resource_type+'\n'+_hover_text + '\nLAT: ' + _lat + '\nLON: ' + _lon,
        resource_id: resource_id,
        resource_status: resource_status,
        type: resource_status
      });
    
    
    // var iw = new google.maps.InfoWindow({content: _info_content});
    var _map = this.map;
    
    var self = this;
    google.maps.event.addListener(marker, 'click', function(_map) {
      if (typeof marker.resource_id != 'undefined') {
        if (marker.type =="Observatory"){
          IONUX.ROUTER.navigate('/map/'+marker.resource_id, {trigger:true});
        }
        else{//(marker.type =="PlatformSite"){
          IONUX.ROUTER.navigate('/map/'+marker.resource_id, {trigger:true}); 
        }
      };
    });

    google.maps.event.addListener(marker, 'mouseover', function() {
      // _table_row.style.backgroundColor = _row_highlight_color;
      if (marker.icon !== self.new_markers[marker.resource_status]['active']) {
        marker.setIcon(self.new_markers[marker.resource_status]['hover']);
      };
    });
    
    google.maps.event.addListener(marker, 'mouseout', function() {
      // _table_row.style.backgroundColor = _row_background_color;
      if (marker.icon !== self.new_markers[marker.resource_status]['active']) {
        marker.setIcon(self.new_markers[marker.resource_status]['icon']);
      };
    });
    
    this.markerClusterer.addMarker(marker);
  },
  
  set_active_marker: function(){
    if (this.active_marker) this.clear_active_marker();
    var active_resource_id = this.model.get('_id');
    this.active_marker = _.findWhere(this.markerClusterer.markers_, {resource_id: active_resource_id});
    this.active_marker.setIcon(this.new_markers[this.active_marker.resource_status].active);
  },
  
  clear_active_marker: function() {
    this.active_marker.setIcon(this.new_markers[this.active_marker.resource_status].icon);
  },

  clear_all_markers: function(){
    this.markerClusterer.clearMarkers();
  },

  clear_all_bboxes: function() {
    for (var i = 0; i < this.observatoryBboxes.length; i++) {
      this.observatoryBboxes[i].setMap(null);
    }
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
      this.create_marker(_lat, _lon, null, _text,"<P>Insert HTML here.</P>", null,'PlatformSite');

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
      this.options.data = [];
      // this.options.data = this.collection.toJSON();
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
    this.filter_data();
    this.collection.on('data:filter_render', this.filter_and_render);
    IONUX.Views.DataTable.prototype.initialize.call(this);
  },
  
  filter_data: function() {
    this.options.data = [];
    if (!_.isEmpty(IONUX.ListWhitelist)) {
       _.each(this.collection.models, function(resource) {
         if (_.contains(IONUX.ListWhitelist, resource.get('type_'))) {
           this.options.data.push(resource.toJSON());
         };
       }, this);
    } else {
      this.options.data = [];
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
      {label: 'Station', type: 'PlatformSite', sprite: 'station-option'},
      {label: 'Instrument', type: 'InstrumentSite', sprite: 'site-option'},
      {label: 'Platform', type: 'PlatformDevice', sprite: 'platformdevice-option'},
    ],
    long_asset_options: [
      {label: 'Station', type: 'PlatformSite', sprite: 'station-option'},
      {label: 'Instrument', type: 'InstrumentSite', sprite: 'site-option'},
      {label: 'Platform', type: 'PlatformDevice', sprite: 'platformdevice-option'},
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
    var item_tmpl = '<div class="filter-option <%= sprite %>"><%= label %> <div class="pull-right"><input type="checkbox" value="<%= type %>" checked /></div></div>';
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

IONUX.ListWhitelist = ['DataProduct', 'InstrumentDevice', 'PlatformDevice', 'PlatformSite', 'Observatory'];
IONUX.Views.ListFilter = Backbone.View.extend({
  el: '#list-filter',
  filter: {
    short: [
      {label: 'Data Product', type: 'DataProduct', sprite: 'dataproduct-option'},
      {label: 'Instrument', type: 'InstrumentDevice', sprite: 'instrumentdevice-option'},
      {label: 'Platform', type: 'PlatformDevice', sprite: 'platformdevice-option'},
      {label: 'Station', type: 'PlatformSite', sprite: 'station-option'},
      {label: 'Site', type: 'Observatory', sprite: 'observatory-option'},
    ],
    long: [
      {label: 'Data Product', type: 'DataProduct', sprite: 'dataproduct-option'},
      {label: 'Data Transform', type: 'DataTransform', sprite: 'datatransform-option'},
      {label: 'Data Process', type: 'DataProcess', sprite: 'dataprocess-option'},
      {label: 'Deployment', type: 'Deployment', sprite: 'deployment-option'},
      {label: 'Instrument', type: 'InstrumentDevice', sprite: 'instrumentdevice-option'},
      {label: 'Instrument Model', type: 'InstrumentModel', sprite: 'instrumentmodel-option'},
      {label: 'Instrument Agent Instance', type: 'InstrumentAgentInstance', sprite: 'instrumentagentdef-option'},
      {label: 'Instrument Agent', type: 'InstrumentAgent', sprite: 'instrumentagent-option'},
      {label: 'Platform', type: 'PlatformDevice', sprite: 'platformdevice-option'},
      {label: 'Platform Model', type: 'PlatformModel', sprite: 'platformmodel-option'},
      {label: 'Platform Agent Instance', type: 'PlatformAgentInstance', sprite: 'platformagent-option'},
      {label: 'Platform Agent', type: 'PlatformAgent', sprite: 'platformagentdef-option'},
      {label: 'Station', type: 'PlatformSite', sprite: 'station-option'},
      {label: 'Site', type: 'Observatory', sprite: 'observatory-option'},
      {label: 'Role', type: 'UserRole', sprite: 'role-option'},
      {label: 'Facility', type: 'Org', sprite: 'facility-option'},
      {label: 'Attachment', type: 'Attachment', sprite: 'attachment-option'},
      {label: 'External Dataset Agent Instance',type:'ExternalDatasetAgentInstance', sprite: 'externaldataagentinstance-option'},
      {label: 'External Dataset Agent', type: 'ExternalDatasetAgent', sprite: 'externaldataagent-option'},
    ]
  },
  template: '\
    <h3 id="list-filter-heading">Resource Type\
    <div class="dataproduct-mode action-menu btn-group pull-right">\
      <a class="btn dropdown-toggle" data-toggle="dropdown"><span class="hamburger">&nbsp;</span></a>\
      <ul class="dropdown-menu"><li class="apply-list">Long List</li><li class="act_list_all">Select All</li><li class="act_list_none">Select None</li></ul>\
    </div>\
    </h3>\
    <div class="panelize">\
      <div id="list-filter"></div>\
    </div>',
  item_template: _.template('<div class="filter-option <%= sprite %>">\
                             <%= label %> <div class="pull-right"><input type="checkbox" value="<%= type %>" <%= checked %> /></div>\
                             </div>'),
  events: {
    'click .filter-option input': 'set_filter',
    'click .apply-list': 'apply_list',
    'click .act_list_none': 'act_select_none',
    'click .act_list_all': 'act_select_all'
  },
  
  initialize: function() {
    _.bindAll(this);
  },

   act_select_all:function(target){
    console.log('set_filter');
      _.each($('#list-filter input:not(:checked)'), function(el) {
        var item = $(el).val();
        IONUX.ListWhitelist.push(item);
        $(el).prop('checked', true);
      });
    this.trigger_data_filter();
    },

   act_select_none:function(target){
    console.log('set_filter');
      _.each($('#list-filter input:checked'), function(el) {
        var item = $(el).val();
        var item_idx = IONUX.ListWhitelist.indexOf(item);
        IONUX.ListWhitelist.splice(item_idx, 1);
        $(el).prop('checked', false);
      });
    this.trigger_data_filter();
    },


  render: function() {
    this.$el.html(this.template);
    var filter_elmt = this.$el.find('#list-filter');
    _.each(this.filter.short, function(option) {
      option['checked'] = _.contains(IONUX.ListWhitelist, option['type']) ? "checked" : "";
      filter_elmt.append(this.item_template(option));
    }, this);
    return this;
  },
  
  apply_list: function(e) {
    e.preventDefault();
    
    var check_whitelist = function(type) {
      return _.contains(IONUX.ListWhitelist, type) ? 'checked' : '';
    };
    
    var li_elmt = $(e.target);
    var list = li_elmt.text();
    
    var filter_elmt = this.$el.find('#list-filter');
    filter_elmt.empty();
    
    if (list == 'Long List') {
    
      _.each(this.filter.long, function(option) {
        if (_.findWhere(this.filter.short, {type: option.type})) {
          option['checked'] = check_whitelist(option.type);
        } else {
          option['checked'] = 'checked';
          IONUX.ListWhitelist.push(option.type);
        };
         filter_elmt.append(this.item_template(option));
      }, this);
      
      li_elmt.text('Short List');
      this.trigger_data_filter();
    } else {
      
      // Remove whitelisted items not in this.filter.short
      IONUX.ListWhitelist = _.filter(IONUX.ListWhitelist, function(option) {
        return _.findWhere(this.filter.short, {type: option});
      }, this);
      
      _.each(this.filter.short, function(option) {
        option['checked'] = check_whitelist(option.type);
        filter_elmt.append(this.item_template(option));
      }, this);
      
      li_elmt.text('Long List');
      this.trigger_data_filter();
    };
    
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
    
    this.trigger_data_filter();
  },
  
  trigger_data_filter: function() {
    if (IONUX.Dashboard.ListResources) IONUX.Dashboard.ListResources.trigger('data:filter_render');
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


INTERACTIONS_OBJECT.dp_filter_interactions = ['Select All', 'Select None'];
IONUX.Views.DPFilterActions = IONUX.Views.ActionMenu.extend({
  dropdown_button_tmpl: '<div class="dataproduct-mode action-menu btn-group pull-right">\
  <a class="btn dropdown-toggle" data-toggle="dropdown"><span class="hamburger">&nbsp;</span></a>\
  <ul class="dropdown-menu"><% _.each(dropdown_items, function(item) { %> <li><%= item %></li> <% }); %></ul>\
  </div>',
  
  "events": _.extend({
        "hover": "action_controls_onhover",
    }, IONUX.Views.ActionMenu.prototype.events),

    initialize: function() {
        this.interaction_items = INTERACTIONS_OBJECT.dp_filter_interactions;
        this.on("action__select_all", this.action__select_all);
        this.on("action__select_none", this.action__select_none);
        this.create_actionmenu();
    },

    action__select_all:function(target){
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
