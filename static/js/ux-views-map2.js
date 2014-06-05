IONUX2.Views.Map = Backbone.View.extend({
  el: '#map_canvas',

  // From worst to best ('na' considered the catch-all).
  icons_rank: [
    'critical','warning','ok','na'
  ],

  do_change_spatial_event: true,
 
  // The cluster icons are a handily fixed 240 pixels further down the sprite from the following.
  single_icons: {
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
          origin: new google.maps.Point(540, 120),
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
      
      var bounds_tmpl = '<div style="position:absolute;left:0px;top:0px;">\
                            &nbsp;\
                            <strong>Map Extent:</strong>\
                            SW [ <%= sw.lat().toFixed(4) %>&nbsp;&nbsp;<%= sw.lng().toFixed(4) %> ]\
                            &nbsp;&nbsp;\
                            NE [ <%= ne.lat().toFixed(4) %>&nbsp;&nbsp;<%= ne.lng().toFixed(4) %> ]\
                          </div>\
                          <div style="position:absolute;right:0px;top:0px;text-align:right;">\
                            <strong>Position:</strong>\
                            [ <%= center.lat().toFixed(4) %>&nbsp;&nbsp;<%= center.lng().toFixed(4) %> ]\
                          </div>';
      
      this.map_bounds_elmt.html(_.template(bounds_tmpl, bounds))
  },
  
  initialize: function(){
    _.bindAll(this);
    this.sprite_url = '/static/img/pepper_sprite.png';
    this.active_marker = null; // Track clicked icon
    this.sites_status_loaded = false;
    this.map_bounds_elmt = $('#mapBounds2');
    this.data_types();
    this.model.on('pan:map', this.pan_map);
    this.model.on('set:active', this.set_active_marker);

    // this.collection.on('reset', this.draw_markers);
    // this.collection.on('reset', this.get_sites_status);

    this.observatoryBboxes = [];

    // This is a hack until something can be done more elegantly in the CSS!
    if (!window.resize) {
      window.resize = $(window).resize(function() {
        $('#map_canvas').height($('#map_canvas').parent().height() - 20); // Leave enough room for the banner.
      });
    }

    this.draw_map();
    this.draw_markers();

    // HACK! temporarily workaround to a timing issue in Chrome/Safari.
    // this.get_sites_status();
    window.setTimeout(this.get_sites_status, 1000);

    //Input to drawing manager mapping, for manual updating of inputs. Input -> Map
    IONUX2.Models.spatialModelInstance.on('change:spatialData', this.update_inputs, this);

  },
  
    data_types: function(){
    this.resource_mapping = [
      {label: 'Platform', type: 'PlatformDevice', sprite: 'platformdevice-option'},
      {label: 'Station', type: 'PlatformSite', sprite: 'platformportal-option'},
      {label: 'Site', type: 'Observatory', sprite: 'site-option'},
    ];
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
        var platforms     = [];
        var platforms2ids = {};
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
              platforms.push(PlatSite[id].local_name);
              platforms2ids[PlatSite[id].local_name] = id;
            }else{
              nonstationsite++;
            }
          }
        }
        if (numberOfPlatforms==0){
          //console.log(ObsSite.name);
          PlatformSitesList[ObsSite['_id']] = ObsSite;
        }

        // insert platforms into TOC (natural sort them first)
        platforms.sort(
          // thank you, http://my.opera.com/GreyWyvern/blog/show.dml/1671288
          function (a, b) {
            function chunkify(t) {
              var tz = [], x = 0, y = -1, n = 0, i, j;
              while (i = (j = t.charAt(x++)).charCodeAt(0)) {
                var m = (i == 46 || (i >=48 && i <= 57));
                if (m !== n) {
                  tz[++y] = "";
                  n = m;
                }
                tz[y] += j;
              }
              return tz;
            }
            var aa = chunkify(a);
            var bb = chunkify(b);
            for (x = 0; aa[x] && bb[x]; x++) {
              if (aa[x] !== bb[x]) {
                var c = Number(aa[x]), d = Number(bb[x]);
                if (c == aa[x] && d == bb[x]) {
                  return c - d;
                } else return (aa[x] > bb[x]) ? 1 : -1;
              }
            }
            return aa.length - bb.length;
          }
        );
        if (platforms.length > 0) {
          $('<a href="#" class="secondary-nested-link pull-right"></a>').insertBefore('#observatory-selector [href="/map/' + ObsSite._id + '"]');
          var ul = [];
          ul.push('<ul class="map-nested-ul" style="display:none;" observatory="' + ObsSite._id + '">');
          for (var i = 0; i < platforms.length; i++) {
            ul.push('<li data-resource-id="' + platforms2ids[platforms[i]] + '"class="really-nested"><a class="primary-link nested-primary-link" href="/map/' + platforms2ids[platforms[i]] + '">' + platforms[i] + '</a></li>');
          }
          ul.push('</ul>'); 
          $(ul.join('')).insertAfter('#observatory-selector [data-resource-id="' + ObsSite._id + '"]');
        }
    }
    return PlatformSitesList;
  },

  get_sites_status: function() {
    var resource_ids = this.collection.pluck('_id');
    $('#map_canvas').append('<div id="loadingStatus2" style="">Loading Status...</div>')
    
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
        // clear out platforms from TOC
        $('#observatory-selector').contents().find('.secondary-nested-link.pull-right').remove();
        $('#observatory-selector').contents().find('.secondary-nested-link-selected.pull-right').remove();
        $('#observatory-selector').contents().find('.really-nested').parent().remove();
        //get the platform sites
        self.platformSitesList = self.getPlatformSites(self.sites_status);
        //draw stuff
        self.clear_all_markers();
        self.clear_all_bboxes();
        self.draw_markers();
      },
      complete: function(){
        $('#loadingStatus2').remove();
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

  clear_inputs: function(){
    var attribute = {};
    attribute["from_longitude"] = "";
    attribute["from_latitude"] = "";
    attribute["to_longitude"] = "";
    attribute["to_latitude"] = "";
    attribute["radius"] = "";
    this.update_spatial_model(attribute);

    $("#southFm").val("");
    $("#westFm").val("");
    $("#northFm").val("");
    $("#eastFm").val("");
    $("#radiusFm").val("");
  },

  update_inputs: function(){
      var model = IONUX2.Models.spatialModelInstance.attributes;
      console.log('update_inputs fired.');
      console.log(this.do_change_spatial_event);
      if (this.do_change_spatial_event == true){
        var attribute = {};

        console.log('updating map for model changes.');
        console.log(model);

        if(model.spatial_dropdown == "1"){
          if(this.circle){
            this.circle.setMap(null);
            delete this.circle;
          } 

          var n = model.to_latitude;//$('#north').val();
          var s = model.from_latitude;//$('#south').val();
          var e = model.to_longitude;//$('#east').val();
          var w = model.from_longitude;//$('#west').val();

          console.log('N:' + n +" S:" + s + " E:" + e + " W:" + w);

          if(model.from_ew == "2"){
            w =  w * -1;
          }
          if(model.to_ew == "2"){
            e =  e * -1;
          }
          if(model.to_ns == "2"){
            n =  n * -1;
          }
          if(model.from_ns == "2"){
            s =  s * -1;
          }

          $('#northFm').val(n);
          $('#southFm').val(s);
          $('#eastFm').val(e);
          $('#westFm').val(w);

          console.log('N:' + n +" S:" + s + " E:" + e + " W:" + w);
          
          this.create_rectangle(n, s, e, w);

        } else if(model.spatial_dropdown == "2"){
          if (this.rectangle) {
            this.rectangle.setMap(null);
            delete this.rectangle;
          }

          var s = model.from_latitude;//$('#south').val();
          var w = model.from_longitude;//$('#west').val();
          var r = model.radius;

          if(model.from_ns == "2"){
            s =  s * -1;
          }
          if(model.from_ew == "2"){
            w =  w * -1;
          }

          var rMeters;
          if(model.miles_kilos == "1"){
            // kilometers to meters
            r = r*1000;
          } else {
            // miles to meters
            r = r*1609.34
          }

          $('#southFm').val(s);
          $('#westFm').val(w);
          // convert meters to degrees
          $("#radiusFm").val(r/111325);
            
          this.create_circle(s, w, r);
        }
      }
  },

  update_spatial_model: function (attribute){
    this.do_change_spatial_event = false;
    IONUX2.Models.spatialModelInstance.updateAttributes(attribute);
    this.do_change_spatial_event = true;
  },

  update_latlon: function (ne, sw){

    var n = ne.lat();
    var e = ne.lng();
    var s = sw.lat();
    var w = sw.lng();
    $("#southFm").val(n.toFixed(4));
    $("#westFm").val(e.toFixed(4));
    $("#northFm").val(s.toFixed(4));
    $("#eastFm").val(w.toFixed(4));
    
    var attribute = {};

    if(n >= 0){
      attribute["to_ns"] = "1";
    } else {;
      attribute["to_ns"] = "2";
      n = n * -1;
    }

    if(e >= 0){
      attribute["to_ew"] = "1";
    } else {
      attribute["to_ew"] = "2";
      e = e * -1;
    }

    if(s >= 0){
      attribute["from_ns"] = "1";
    } else {
      attribute["from_ns"] = "2";
      s = s * -1;
    }

    if(w >= 0){
      attribute["from_ew"] = "1";
    } else {
      attribute["from_ew"] = "2";
      w = w * -1;
    }

    attribute["from_longitude"] = w.toFixed(2);
    attribute["from_latitude"] = s.toFixed(2);
    attribute["to_longitude"] = e.toFixed(2);
    attribute["to_latitude"] = n.toFixed(2);
    this.update_spatial_model(attribute);

  },

  update_pointradius: function (radius, sw){
    var model = IONUX2.Models.spatialModelInstance.attributes;
    var s = sw.lat();
    var w = sw.lng();
    $("#southFm").val(s.toFixed(4));
    $("#westFm").val(w.toFixed(4));
    // convert meters to degrees
    $("#radiusFm").val(radius/111325);

    var attribute = {};

    if(s >= 0){
      attribute["from_ns"] = "1";
    } else {
      attribute["from_ns"] = "2";
      s = s * -1;
    }

    if(w >= 0){
      attribute["from_ew"] = "1";
    } else {
      attribute["from_ew"] = "2";
      w = w * -1;
    }

    attribute["from_longitude"] = w.toFixed(2);
    attribute["from_latitude"] = s.toFixed(2);

    if(model.miles_kilos == "1"){
      radius = radius/1000;
    } else {
      radius = radius*0.000621371
    }
    attribute["radius"] = radius.toFixed(2);

    this.update_spatial_model(attribute);

  },

  create_rectangle: function(n, s, e, w){

    var bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(s, w),
      new google.maps.LatLng(n, e)
    );

    var self = this;
    if (!self.rectangle) {
      // make a rectangle if a user hasn't drawn one
      self.rectangle = new google.maps.Rectangle();
      self.rectangle.setOptions(self.overlay_options);
      // create a listener on the rectangle to catch modifications / dragging
      google.maps.event.addListener(self.rectangle, 'bounds_changed', function(e) {
        self.update_latlon(self.rectangle.getBounds().getNorthEast(), self.rectangle.getBounds().getSouthWest());
      });
      self.rectangle.setMap(self.map);
    }

    self.rectangle.setBounds(bounds);
    self.drawingManager.setDrawingMode(null);
  },

  create_circle: function(lat, lng, radius){
    var point = new google.maps.LatLng(lat, lng);
    // var radius = 0.00;
    
    if(radius != null && radius.length > 0){
     radius = parseInt(radius)*1000;
    }

    // $("#radiusFm").val(radius);

    var self = this;
    if (!self.circle) {
      // make a rectangle if a user hasn't drawn one
      self.circle = new google.maps.Circle();
      self.circle.setOptions(self.overlay_options);
      // create a listener on the rectangle to catch modifications / dragging
      google.maps.event.addListener(self.circle, 'radius_changed', function() {
        self.update_pointradius(self.circle.getRadius(), self.circle.getCenter());
      });
      google.maps.event.addListener(self.circle, 'center_changed', function() {
        self.update_pointradius(self.circle.getRadius(), self.circle.getCenter());
      });

      self.circle.setMap(self.map);
    }

    self.circle.setCenter(point);
    self.circle.setRadius((radius > 0 ? radius : 0.00));
    self.drawingManager.setDrawingMode(null);

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

    $(window).trigger('resize');

    this.map.maxZoomService = new google.maps.MaxZoomService();
    
    // add the cable kml
    new google.maps.KmlLayer({
       url                 : 'http://ion-alpha.oceanobservatories.org/static/rsn_cable_layouts_v1.5.3.kml'
      ,preserveViewport    : true
      ,clickable           : false
      ,suppressInfoWindows : true
      ,map                 : this.map
    });

    // add drawing manager
    this.overlay_options =  {
      fillColor     : '#c4e5fc',
      fillOpacity   : 0.5,
      strokeWeight  : 1.0,
      strokeColor   : '#0cc1ff',
      strokeOpacity : 0.8,
      draggable     : true,
      editable      : true
    };

    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          google.maps.drawing.OverlayType.RECTANGLE,
          google.maps.drawing.OverlayType.CIRCLE
        ]
      },
      rectangleOptions: this.overlay_options,
      circleOptions: this.overlay_options
    });
    this.drawingManager.setMap(this.map);

    //DRAWING EVENT LISTENERS
    var self = this;
    google.maps.event.addListener(this.drawingManager, 'overlaycomplete', function(event) {
      // Switch back to non-drawing mode after drawing a shape.
      self.drawingManager.setDrawingMode(null);

      if (event.type == google.maps.drawing.OverlayType.RECTANGLE){
        self.rectangle = event.overlay;
        self.update_latlon(self.rectangle.getBounds().getNorthEast(), self.rectangle.getBounds().getSouthWest());
        // And we have to create a listener on the rectangle to catch modifications / dragging.
        google.maps.event.addListener(self.rectangle, 'bounds_changed', function() {
          self.update_latlon(self.rectangle.getBounds().getNorthEast(), self.rectangle.getBounds().getSouthWest());
        });


      } else if (event.type == google.maps.drawing.OverlayType.CIRCLE){
        self.circle = event.overlay;
        self.update_pointradius(self.circle.getRadius(), self.circle.getCenter());         

        google.maps.event.addListener(self.circle, 'radius_changed', function() {
          self.update_pointradius(self.circle.getRadius(), self.circle.getCenter());
        });
        google.maps.event.addListener(self.circle, 'center_changed', function() {
          self.update_pointradius(self.circle.getRadius(), self.circle.getCenter());
        });

      }
          
    });

    this.spatial_open = false;

    google.maps.event.addListener(this.drawingManager, 'drawingmode_changed', function(event) {
      
      if(!self.spatial_open){
        IONUX2.openSpatialAccordion();
      }

      var mode = this.getDrawingMode();
      var attribute = {};

      if (mode == "rectangle"){
        self.clear_inputs();
        attribute["spatial_dropdown"] = "1";
        self.update_spatial_model(attribute);
        $('.latLongMenu').val("1");
      } else if (mode == "circle"){
        self.clear_inputs();
        attribute["spatial_dropdown"] = "2";
        self.update_spatial_model(attribute);
        $('.latLongMenu').val("2");
      }

      if(mode != null){
        // Clear out the rectangle if necessary.
        if (self.rectangle) {
          self.rectangle.setMap(null);
          delete self.rectangle;
        } else if(self.circle){
          self.circle.setMap(null);
          delete self.circle;
        } 
      }
    });

    google.maps.event.addListener(this.map, "bounds_changed", function(e) {
       self.hide_info_window({rank : 0}); // always hide the infoWindow
       self.render_map_bounds(e);
    });
    
    // Ideally we would put this check on bounds_changed, but that fires so frequently.
    // This will hopefully take care of most cases.  If not, we can think about looking
    // for a 'big-bounds-changed' type of event.
    google.maps.event.addListener(this.map, "zoom_changed", function(e) {
       self.map.maxZoomService.getMaxZoomAtLatLng(self.map.getCenter(),function(r) {
         if (r.status == google.maps.MaxZoomStatus.OK) {
           var z = self.map.getZoom();
           var t = self.map.getMapTypeId();
           // move from sat to road if out of zoom
           if (t.toLowerCase() == 'satellite' && z > r.zoom) {
             self.map.setMapTypeId('roadmap');
           }
           // or move back to sat if OK
           else if (t.toLowerCase() == 'roadmap' && z <= r.zoom) {
             self.map.setMapTypeId('satellite');
           }
         }
       });
    });

    google.maps.event.addListener(this.map, "mousemove", function(e) {
        self.render_map_bounds(e);
    });

    // Create the cluster styles array based on the single_icons structure, and iterate
    // through them using the heirarchy.  Clusters can only be normal or hover (no select).
    var styles = [];
    _.each(self.icons_rank,function(site) {
      _.each(['icon','hover'],function(mouse) {
        styles.push({
           backgroundPosition : 
             '-' + self.single_icons[site][mouse].origin.x + 'px'
             + ' ' + '-' + (self.single_icons[site][mouse].origin.y * 1 + 240) + 'px'
          ,width              : self.single_icons[site][mouse].size.width
          ,height             : self.single_icons[site][mouse].size.height
          ,url                : self.single_icons[site][mouse].url
          ,textSize           : '0'
          ,maxZoom            : 15
          ,rank               : site + ' ' + mouse // for debugging
        });
      });
    });

    this.markerClusterer = new MarkerClusterer(this.map, null, {
       maxZoom    : 10
      ,gridSize   : 30 
      ,styles     : styles
      ,calculator : function(markers,numStyles) {
        // Pull out the lowest rank from the marker set.  The 'index' is off by one in the cluster world.
        // Return the vanilla icon, i.e. not the hover one.
        return {
          text  : 0
         ,index : (_.pluck(markers,'rank').sort(function(a,b){return a - b})[0] + 1) * 2 - 1
         ,title : ''
       };
      }
    });

    google.maps.event.addListener(this.markerClusterer, 'mouseover', function(c) {
      c.clusterIcon_.useStyle({index : c.clusterIcon_.sums_.index * 1 + 1});
      c.clusterIcon_.show();
      var content = [];
      _.each(_.countBy(_.pluck(c.markers_,'resource_type_label_name')),function(v,k) {
        content.push(k + 's: ' + v);
      });
      
      var infoWindow = {
         content     : 'Zoom-in or click on the icon to view:<br>' + content.sort().join('<br>')
        ,pixelOffset : new google.maps.Size(-5,-20)
        ,rank        : 1
        ,position    : c.center_
      };
      self.show_info_window(infoWindow);
    });

    google.maps.event.addListener(this.markerClusterer, 'mouseout', function(c) {
      c.clusterIcon_.useStyle({index : c.clusterIcon_.sums_.index * 1 - 1});
      c.clusterIcon_.show();
      self.hide_info_window({rank : 1});
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
    //set the bounds var
    var bounds;
    var resetZoom;

      if(IONUX2.Dashboard.MapResource.resource_level==3){
        //zoom to pin
        var k =this.platformSitesList[IONUX2.Dashboard.MapResource.tmpId];
        lat  = k.geospatial_point_center.lat;
        lon  = k.geospatial_point_center.lon;
        center = new google.maps.LatLng(lat, lon);
        this.map.setCenter(center);
        this.map.setZoom(11);
        this.markerClusterer.setMap(null);
        this.markerClusterer.setMap(this.map);
        return;
      } else{
        //zoom to SAN
        var sanNames = _.uniq(this.collection.pluck('spatial_area_name'));
        //get san
        var san = this.model.get('spatial_area_name');
        //get tmp san
        var san_tmp = IONUX2.Dashboard.MapResource.tmp;
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
          var resources = this.collection.where({'_id': IONUX2.Dashboard.MapResource.tmpId});
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

        if (san) {
          var n = this.spatial_area_names[san]['north'];
          var e = this.spatial_area_names[san]['east'];
          var s = this.spatial_area_names[san]['south'];
          var w = this.spatial_area_names[san]['west'];
          
          var ne = new google.maps.LatLng(n, e);
          var sw = new google.maps.LatLng(s, w);
          bounds = new google.maps.LatLngBounds(sw, ne)
        }
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
      status_code = this.platformSitesList[resource_id]['status'];
    }
    return status_code;
  },

  create_bbox : function(_path,_hover_text) {
    // create a visible poly and an invisible one which is for the infoWindow
    var poly = new google.maps.Polyline({
       strokeColor   : '#FFE4B5'
      ,strokeOpacity : 0.8
      ,strokeWeight  : 2
      ,path          : _path
      ,map           : this.map
    });
    google.maps.event.addListener(poly,'mouseout',function() {
      this.setOptions({
        strokeWeight : 2
      });
    });
    this.observatoryBboxes.push(poly);

    var invisiblePoly = new google.maps.Polyline({
       strokeColor   : '#FFE4B5'
      ,strokeOpacity : 0
      ,strokeWeight  : 10
      ,path          : _path
      ,infoWindow    : {
         content        : 'Site: ' + _hover_text
        ,pixelOffset    : new google.maps.Size(0,-5) // w/o an offset, the mousout gets fired and we get flashing!
        ,rank           : 3
      }
      ,map           : this.map
      ,visiblePoly   : poly
    });

    // use infoWindow for tooltips so that markers and polys match (polys don't use the alt-title approach)
    var self = this;
    google.maps.event.addListener(invisiblePoly,'mouseover',function(e) {
      this.infoWindow.position = e.latLng;
      self.show_info_window(this.infoWindow);
      this.visiblePoly.setOptions({
         strokeWeight : 3
        ,strokeColor  : '#FFFFFF'
      });
    });
    google.maps.event.addListener(invisiblePoly,'mouseout',function() {
      self.hide_info_window(this.infoWindow);
      this.visiblePoly.setOptions({
         strokeColor  : '#FFE4B5'
        ,strokeWeight : 2
      });
    });
    this.observatoryBboxes.push(invisiblePoly);
  },


  get_resource_type_label_name: function(resource_type){
    //this.resource_mapping
    var label;
     _.each(this.resource_mapping, function(option) {
        if (resource_type==option.type){
          label=option.label;
          return false;
        }
      },this);
     return label;
  },

  create_marker: function(_lat, _lon, _icon, _hover_text, _info_content, _table_row, resource_id,resource_type) {
    
    if (!_lat || !_lon) return null;
    
    latLng = new google.maps.LatLng(_lat, _lon);
    
    var resource_status = 'na';
    if (this.sites_status_loaded) {
      try {
        var status_code = this.get_status_code(resource_id);
        switch(status_code) {
          case 2:
            resource_status = 'ok';
            break;
          case 3:
            resource_status = 'warning';
            break;
          case 4:
            resource_status = 'critical';
            break
          default:
            resource_status = 'na';
        }
      } catch(err) {
        console.log('create_marker status error:', err);
        resource_status = 'na';
      };
    }

    var resource_type_label_name = this.get_resource_type_label_name(resource_type);
    var marker = new google.maps.Marker({
        map: this.map,
        position: latLng,
        icon: this.single_icons[resource_status].icon,
        resource_id: resource_id,
        resource_status: resource_status,
        resource_type_label_name: resource_type_label_name,
        rank: _.indexOf(this.icons_rank,resource_status),
        type: resource_status,
        infoWindow: {
           content     : resource_type_label_name + ': ' +_hover_text + '<br>LAT: ' + _lat + '<br>LON: ' + _lon
          ,pixelOffset : new google.maps.Size(-2,-40)
          ,rank        : 2
        }
      });
   
    // use infoWindow for tooltips so that markers and polys match (polys don't use the alt-title approach)
    var self = this;
    google.maps.event.addListener(marker,'mouseover',function(e) {
      this.infoWindow.position = e.latLng;
      self.show_info_window(this.infoWindow);
    });
    google.maps.event.addListener(marker,'mouseout',function() {
      self.hide_info_window(this.infoWindow);
    });
    
    var _map = this.map;
    
    var self = this;
    google.maps.event.addListener(marker, 'click', function(_map) {
      if (typeof marker.resource_id != 'undefined') {
        if (marker.type =="Observatory"){
          IONUX2.ROUTER.navigate('/map/'+marker.resource_id, {trigger:true});
        }
        else{//(marker.type =="PlatformSite"){
          IONUX2.ROUTER.navigate('/map/'+marker.resource_id, {trigger:true}); 
        }
      };
    });

    google.maps.event.addListener(marker, 'mouseover', function() {
      // _table_row.style.backgroundColor = _row_highlight_color;
      if (marker.icon !== self.single_icons[marker.resource_status]['active']) {
        marker.setIcon(self.single_icons[marker.resource_status]['hover']);
      };
    });
    
    google.maps.event.addListener(marker, 'mouseout', function() {
      // _table_row.style.backgroundColor = _row_background_color;
      if (marker.icon !== self.single_icons[marker.resource_status]['active']) {
        marker.setIcon(self.single_icons[marker.resource_status]['icon']);
      };
    });
    
    this.markerClusterer.addMarker(marker);
  },
  
 set_active_marker: function(){
    //clear it if it is there already
    if (this.active_marker){
      this.clear_active_marker()
    }
    var active_resource_id = this.model.get('_id');
    this.active_marker = _.findWhere(this.markerClusterer.markers_, {resource_id: active_resource_id});
    if (this.active_marker){
      this.active_marker.setIcon(this.single_icons[this.active_marker.resource_status].active);
    }
  },
  
  clear_active_marker: function() {
    this.active_marker.setIcon(this.single_icons[this.active_marker.resource_status].icon);
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

  show_info_window: function(info) {
    // Only show 1 infoWindow at a time, and don't let any lesser-ranked windows bleed through.
    // Currently, the obs outlines have the lowest rank (highest #).
    if (this.infoWindow && this.infoWindow.rank >= info.rank) {
      this.hide_info_window(info);
    }
    if (!this.infoWindow) {
      this.infoWindow = new google.maps.InfoWindow({
         content     : '<div style="line-height:1.35;overflow:hidden;white-space:nowrap;">' + info.content + '</div>'
        ,pixelOffset : info.pixelOffset
        ,position    : info.position
      });
      this.infoWindow.open(this.map);
      this.infoWindow.rank = info.rank;
    }
  },

  hide_info_window: function(info) {
    if (this.infoWindow && this.infoWindow.rank >= info.rank) {
      this.infoWindow.close();
      delete this.infoWindow;
    }
  },
});
