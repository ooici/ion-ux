IONUX.Views.AttributeGroupDynamic = Backbone.View.extend({
  template: _.template('<div class="row-fluid">\
                          <div class="span4 text-short-label">\
                            <%= label %>:&nbsp;\
                          </div>\
                          <div class="span8 text_wrap">\
                            <%= text_short %>\
                          </div>\
                        </div>'),

  initialize: function(){
    var data_path = this.$el.data('path');

    // temp hack until UI database updated.
    if (data_path.substring(0,12) == 'unknown_0594') data_path = 'resource.variables';

    var data_obj = get_descendant_properties(window.MODEL_DATA, data_path);
    this.render_attributes(data_obj);
  },

  render: function(k,v) {
    this.$el.append(this.template({label:k,text_short:v}));
    
    // temp hack until UI database updated.
    $('#2164145 h3:contains("Notification")').text('Variables');
  },

  render_attributes: function(data_obj){
    _.each(data_obj, function(v,k) {
      if (_.isObject(v)) {
        this.render_attributes(v);
      } else {
        this.render(k, v);
      };
    }, this);
  },
});

// UI Representation Base View
IONUX.Views.Base = Backbone.View.extend({
    events: {
        // "hover": IONUX.Interactions.action_controls
    },
    initialize: function() {
        this.render().el;
    },
    render: function() {
        if (this.className) {this.$el.addClass(this.className)};
        this.$el.append(this.template({'block': this.options.block, 'data': this.options.data}));
        return this;
    }
});

IONUX.Views.Lifecycle = Backbone.View.extend({
    el: '#action-modal',
    template: _.template($('#lifecycle-tmpl').html()),
    events: {
        'click #btn-lcstate': 'change_lc_state',
    },
    initialize: function(){
        _.bindAll(this);
        this.resource_name = window.MODEL_DATA['resource']['name'];
        this.resource_label = $(".heading-left:visible .text_static_ooi").text();
        this.current_lcstate = window.MODEL_DATA['resource']['lcstate'];
    },
    render: function(){
        this.$el.html(this.template({resource_label: this.resource_label, resource_name: this.resource_name, current_lcstate: this.current_lcstate}));
        this.get_transition_events();
        return this;
    },
    change_lc_state: function(evt){
        evt.preventDefault();
        $('#btn-cancel').hide();
        $('#btn-lcstate').text('Saving...')
        $('.modal-footer .loading').show();
        var button_elmt = $(evt.target);
        var select_elmt = this.$el.find('select');
        var selected_option = this.$el.find('option:selected');
        var transition_event = selected_option.attr("value");
        $.ajax({
          type: "POST",
          url: 'transition/',
          data: {transition_event: transition_event},
          // global: false,
          success: function(resp){
              $('#btn-cancel').click();
              Backbone.history.fragment = null; // Clear history fragment to allow for page "refresh".
              IONUX.ROUTER.navigate(window.location.pathname, {trigger: true});
          }
        });
    },
    get_transition_events: function(){
        var select_elmt = $('#lc-transitions');
        var option_tmpl = '<option value="<%= transition_event %>"><%= transition_event_long %> (<%= transition_event %>)</option>';
        var lcstate_transition_events = window.MODEL_DATA['lcstate_transitions'];
        _.each(_.keys(lcstate_transition_events), function(transition_event){ // NOTE: Keys are the values.
            var transition_event_long = lcstate_transition_events[transition_event];
            select_elmt.append(_.template(option_tmpl, {transition_event: transition_event, transition_event_long: transition_event_long}));
        });
    }
});

IONUX.Views.Search = Backbone.View.extend({
  el: '#search-production',
  template: _.template('<input id="sidebar-search" class="textfield-search" type="text" />\
                        <i id="btn-input-search" class="icon-search" style="cursor:pointer;"></i>\
                        <a class="btn-advanced-search" href="#">Advanced Search</a>'),
  events: {
    'click #btn-input-search': 'search_on_click',
    'keypress #sidebar-search': 'search_on_enter',
    'click .btn-advanced-search': 'advanced_search'
  },
  render: function(){
    /* Use prepend so that it doesn't erase any unloaded DOM elements
     * set by the AJAX callback
     */
    this.$el.prepend(this.template);
    return this;
  },
  search_on_click: function(e){
    e.preventDefault();
    this.navigate_to_search_results();
    return false; 
  },
  search_on_enter: function(e) {
    if (e.keyCode == 13) this.navigate_to_search_results();
  },
  navigate_to_search_results: function() {
    var search_term = this.$el.find('#sidebar-search').val();
    search_term = search_term.replace(/(type=|type =)/ig, 'type_=');
    IONUX.ROUTER.navigate('/search/?'+ encodeURI(search_term), {trigger:true});
  },
  advanced_search: function(e){
    e.preventDefault();
    new IONUX.Views.AdvancedSearch().render().el;
    return false;
  },
});

IONUX.Views.AdvancedSearch = Backbone.View.extend({
  tagName: "div",
  template: _.template($("#advanced-search-tmpl").html()),
  events: {
    "click .filter-add": "add_filter_item",
    "click .filter-remove": "remove_filter_item",
    "click #btn-adv-search": "search_clicked",
    "change select[name='filter_var']": "filter_field_changed",
    "click .vertical-bounds-positive": "toggle_sealevel",
  },
  geodata: { geospatial_latitude_limit_north: null,
             geospatial_latitude_limit_south: null,
             geospatial_longitude_limit_east: null,
             geospatial_longitude_limit_west: null,
             geospatial_vertical_min: null,
             geospatial_vertical_max: null },
  filter_template: _.template($('#filter-item-tmpl').html()),
  render: function() {
    $('body').append(this.$el);
    var modal_html = this.template();
    this.$el.append(modal_html);

    var self = this;

    // set up search views
    new IONUX.Views.ExtentGeospatial({el:$('#adv-geospatial', this.$el), data: self.geodata}).render().el;

    new IONUX.Views.ExtentVertical({el:$('#adv-vertical', this.$el), data: self.geodata}).render().el;
    new IONUX.Views.AdvancedSearchExtentTemporal({el:$('#adv-temporal', this.$el), data: self.geodata}).render().el;
    // new IONUX.Views.ExtentTemporal({el:$('#adv-temporal', this.$el), data: self.geodata}).render().el;

    // enable input in controls
    $('input', this.$el).removeAttr('disabled');
    $('input', '#adv-geospatial')
      .on('change', function() {
        var ninput = $('input[name="north"]', self.$el);
        var sinput = $('input[name="south"]', self.$el);
        var einput = $('input[name="east"]', self.$el);
        var winput = $('input[name="west"]', self.$el);

        //if (ninput.val() > sinput.val()) { ninput.val(sinput.val()); }
        //if (einput.val() < winput.val()) { einput.val(winput.val()); }    // @TODO incorrect

        var bounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(sinput.val(), winput.val()),
          new google.maps.LatLng(ninput.val(), einput.val())
        );

        if (!self.rectangle) {
          // make a rectangle if a user hasn't drawn one
          self.rectangle = new google.maps.Rectangle();
          self.rectangle.setOptions(self.rectangle_options);
          // create a listener on the rectangle to catch modifications / dragging
          google.maps.event.addListener(self.rectangle, 'bounds_changed', function(e) {
            self.update_geo_inputs(self.rectangle.getBounds());
          });
          self.rectangle.setMap(self.map);
        }

        self.rectangle.setBounds(bounds);
      });

    var map_options = {
      center: new google.maps.LatLng(0, 0),
      zoom: 1,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      zoomControlOptions: {
        style: google.maps.ZoomControlStyle.SMALL
      },
      mapTypeControl: false,
      streetViewControl: false,
    };

    $('#advanced-search-overlay').modal()
      .on('shown', function() {

        self.add_filter_item();

        self.map = new google.maps.Map($('#adv_map', self.$el)[0], map_options);

        self.rectangle_options =  {
          fillColor     : '#c4e5fc',
          fillOpacity   : 0.5,
          strokeWeight  : 1,
          strokeColor   : '#0cc1ff',
          strokeOpacity : 0.8,
          draggable     : true,
          editable      : true
        };

        self.drawingManager = new google.maps.drawing.DrawingManager({
          drawingControl: true,
          drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [
              google.maps.drawing.OverlayType.RECTANGLE
            ]
          },
          rectangleOptions: self.rectangle_options
        });
        self.drawingManager.setMap(self.map);

        google.maps.event.addListener(self.drawingManager, 'overlaycomplete', function(e) {
          // Switch back to non-drawing mode after drawing a shape.
          self.drawingManager.setDrawingMode(null);

          // Yuck.  Need to keep a reference to the active shape in case we need to delete it later.
          self.rectangle = e.overlay;
          // And we have to create a listener on the rectangle to catch modifications / dragging.
          google.maps.event.addListener(self.rectangle, 'bounds_changed', function() {
            self.update_geo_inputs(self.rectangle.getBounds());
          });

          // update geo inputs to reflect rectangle
          self.update_geo_inputs(e.overlay.getBounds());
        });

        google.maps.event.addListener(self.drawingManager, 'drawingmode_changed', function(e) {
          // Clear out the rectangle if necessary.
          if (self.rectangle) {
            self.rectangle.setMap(null);
            delete self.rectangle;
          }
        });

      })
      .on('hidden', function() {
        self.$el.remove();
      });

    return false;
  },
  update_geo_inputs: function(bounds) {

    var n, s, e, w = null;

    if (bounds != null) {
      n = Math.round(bounds.getNorthEast().lat() * 10000) / 10000;
      s = Math.round(bounds.getSouthWest().lat() * 10000) / 10000;
      e = Math.round(bounds.getNorthEast().lng() * 10000) / 10000;
      w = Math.round(bounds.getSouthWest().lng() * 10000) / 10000;
    }

    $('input[name="north"]', this.$el).val(n);
    $('input[name="south"]', this.$el).val(s);
    $('input[name="east"]',  this.$el).val(e);
    $('input[name="west"]',  this.$el).val(w);
  },
  search_clicked: function(e) {
    e.preventDefault();
    
    var form_values = this.$('form').serializeArray();
    form_values.splice(0, 0, {name:'adv', value:1})   // insert advanced key on the front

    // switch into an object - much easier to access directly
    var formObj = _.object(_.map(form_values, function(v) {
      return [v.name, v.value];
    }));
    
    // normalize into "down" facing vertical if switched to up
    if (this.$('.vertical-bounds-positive').hasClass('toggle_sealevel_passive')) {
      if (formObj['vertical-lower-bound']) {
        formObj['vertical-lower-bound'] = -formObj['vertical-lower-bound'];
      }
      if (formObj['vertical-upper-bound']) {
        formObj['vertical-upper-bound'] = -formObj['vertical-upper-bound'];
      }
      if (formObj['vertical-upper-bound'] < formObj['vertical-lower-bound']) {
        var tmp = formObj['vertical-upper-bound'];
        formObj['vertical-upper-bound'] = formObj['vertical-lower-bound'];
        formObj['vertical-lower-bound'] = tmp;
      }
    }

    //form_values = _.map(_.pairs(formObj), function(v) {
    //  return {name:v[0], value:v[1]};
    //});

    //Error checking advanced search input params
    function check_Vals() {

      var bValid = true;
      var errorString = '';

      //Check geospatial bounds (all or none)
      var all = form_values[1].value !== '' && form_values[2].value !== '' &&
        + form_values[3].value !== '' && form_values[4].value !== '';

      var none = form_values[1].value == '' && form_values[2].value == '' &&
        + form_values[3].value == '' && form_values[4].value == '';

      if (!(all || none)){
        errorString += 'Error in GEOSPATIAL BOUNDS:\nPartially filled form\n';
        bValid = false;
      }

      //Check vertical bounds (all or none)
      var all_or_none = (form_values[5].value !== '' && form_values[6].value !== '') ||
        + (form_values[5].value == '' && form_values[6].value == '');

      if (!all_or_none){
        errorString += 'Error in VERTICAL BOUNDS:\nPartially filled form\n';
        bValid = false;
      }

      //Check temporal bounds (all or none)
      all_or_none = (form_values[7].value !== '' && form_values[8].value !== '') ||
        + (form_values[7].value == '' && form_values[8].value == '');

      if (!all_or_none){
        errorString += 'Error in TEMPORAL BOUNDS:\nPartially filled form\n';
        bValid = false;
      }

      if (!bValid){
        self.alert(errorString)
      }

      return bValid;
    }

    //Check input values
    var bValid = check_Vals();
    if (!bValid){
      return;
    }

    var search_term = $.param(form_values); 

    IONUX.ROUTER.navigate('/search/?'+ search_term, {trigger:true});
    $('#advanced-search-overlay').modal('hide');

  },
  filter_fields: [
    {field: 'name'                  , label: 'Name'                     , values: []} ,
    {field: 'ooi_short_name'        , label: 'OOI Data Product Code'    , values: []} ,
    {field: 'ooi_product_name'      , label: 'Data Product Type'        , values: []} ,
    {field: 'description'           , label: 'Description'              , values: []} ,
    {field: 'instrument_family'     , label: 'Instrument Family'        , values: []} ,
    {field: 'lcstate'               , label: 'Lifecycle State'          , values: ['DRAFT','PLANNED','DEVELOPED','INTEGRATED','DEPLOYED','RETIRED']} ,
    {field: 'alt_ids'               , label: 'OOI Reference Designator' , values: []} ,
    {field: 'name'                  , label: 'Organization'             , values: []} ,
    {field: 'platform_family'       , label: 'Platform Family'          , values: []} ,
    {field: 'processing_level_code' , label: 'Processing Level'         , values: [['L0 - Unprocessed Data', 'L0'],
                                                                                   ['L1 - Basic Data', 'L1'],
                                                                                   ['L2 - Derived Data', 'L2']]} ,
    {field: 'quality_control_level' , label: 'Quality Control Level'    , values: [['a - No QC applied', 'a'],
                                                                                   ['b - Automatic QC applied', 'b'],
                                                                                   ['c - Human QC applied', 'c']]} ,
    {field: 'name'                  , label: 'Site'                     , values: ['Coastal Endurance',
                                                                                   'Coastal Pioneer',
                                                                                   'Global Argentine Basin',
                                                                                   'Global Irminger Sea',
                                                                                   'Global Southern Ocean',
                                                                                   'Global Station Papa',
                                                                                   'Regional Axial',
                                                                                   'Regional Hydrate Ridge',
                                                                                   'Regional Mid Plate']} ,
    {field: 'aggregated_status'     , label: 'Status'                   , values: ['Critical', 'OK', 'None expected', 'Warning']} ,
    {field: 'type_'                 , label: 'Type'                     , values: [
      ['Attachment','Attachment'],
      ['Data Agent Instance','ExternalDatasetAgentInstance'],
      ['Data Agent','ExternalDatasetAgent'],
      ['Data Process','Data Process'],
      ['Data Product','DataProduct'],
      ['Data Transform','DataProcessDefinition'],
      ['Dataset Agent Instance','ExternalDatasetAgentInstance'],
      ['Dataset Agent','ExternalDatasetAgent'],
      ['Deployment','Deployment'],
      ['Event Type','EventType'],
      ['Event','Event'],
      ['Instrument Agent Instance','InstrumentAgentInstance'],
      ['Instrument Agent','InstrumentAgent'],
      ['Instrument Model','InstrumentModel'],
      ['Instrument','InstrumentDevice'],
      ['Organization [Facility]','Org'],
      ['Platform Agent Instance','PlatformAgentInstance'],
      ['Platform Agent','PlatformAgent'],
      ['Platform Model','PlatformModel'],
      ['Platform','PlatformDevice'],
      ['Port','InstrumentSite'],
      ['Role','UserRole'],
      ['Site','Observatory'],
      ['Station','PlatformSite'],
      ['Subscription','NotificationRequest'],
      ['User','UserInfo']]},
  ],
  filter_field_changed: function(evt){
    var sel = $(evt.currentTarget);
    var filter_container = sel.parent();

    var operators = ['contains', 'like', 'matches', 'starts with', 'ends with'];

    // determine if the selected field is a dropdown type or an entry type
    var entry = _.findWhere(this.filter_fields, {'label': sel.find("option:selected").text() });

    if (entry == null) {
      console.error("Could not find associated entry");
      return;
    }

    if (entry.values.length == 0) {
      // this is a manual textbox entry
      filter_container.find('input[name="filter_operator"]').remove();
      filter_container.find('select[name="filter_arg"]').remove();

      if (filter_container.find('select[name="filter_operator"]').length == 0) {
        var sel_operator = $('<select class="operator" name="filter_operator"></select>');
        filter_container.find('.filter-add').before(sel_operator);
        _.each(operators, function(o) {
          sel_operator.append('<option>' + o + '</option>');
        });
      }

      if (filter_container.find('input[name="filter_arg"]').length == 0) {
        var inp_arg = '<input class="argument" type="text" name="filter_arg" value="" />';
        filter_container.find('.filter-add').before(inp_arg);
      }

    } else {

      filter_container.find('select[name="filter_operator"]').remove();
      filter_container.find('input[name="filter_arg"]').remove();

      if (filter_container.find('input[name="filter_operator"]').length == 0) {
        var sel_operator = '<input type="text" class="argument" style="visibility:hidden;" name="filter_operator" value="matches" />';
        filter_container.find('.filter-add').before(sel_operator);
      }

      var inp_arg = filter_container.find('select[name="filter_arg"]'); 
      if (inp_arg.length == 0) {
        inp_arg = $('<select class="column" name="filter_arg"></select>');
        filter_container.find('.filter-add').before(inp_arg);
      }

      inp_arg.empty();
      _.each(entry.values, function(v) {
        var value = null, label = null;
        if (typeof(v) == "string")
          value = label = v;
        else {
          label = v[0];
          value = v[1];
        }
        inp_arg.append('<option value="' + value + '">' + label + '</option>');
      });
    }
  },
  add_filter_item: function(evt) {
    //var columns = this.get_filter_columns();
    //var data = {"columns":columns, "operators":OPERATORS};


    var filter_item = $(this.filter_template({'fields':this.filter_fields}));
    if (evt == null){
      this.$el.find(".filter-item-holder").append(filter_item);
    } else {
      var target = $(evt.target);
      target.parents('.filter-item').after(filter_item);
    }

    // seems to be no way to get this to cooperate, so we'll just select the first item
    var sel = filter_item.find('select[name="filter_var"]');
    sel.change();
  },
  remove_filter_item: function(evt) {
    var this_filter_item = $(evt.target).parents('.filter-item');
    var filter_items = this_filter_item.siblings();
    if (filter_items.length > 0) {
      this_filter_item.remove();
      return;
    }
  },
  toggle_sealevel: function(evt) {
    var target = $(evt.target);
    target.toggleClass('toggle_sealevel_passive');
    target.toggleClass('toggle_sealevel_result');

    var newtext = (target.hasClass('toggle_sealevel_passive')) ? "UP" : "DOWN";
    target.next('span').text(newtext);
  },
});

IONUX.Views.Topbar = Backbone.View.extend({
  el: '#topbar',
  template: _.template($('#topbar-tmpl').html()),
  events: {
    'click #userprofile': 'userprofile',
    'click #signup': 'create_account'
  },
  initialize: function(){
    _.bindAll(this, "render");
    this.model.on('change', this.render);
  },
  render: function(){
    this.$el.html(this.template(this.model.toJSON()));
    return this;
  },
  userprofile: function(e){
    e.preventDefault();
    user_info_url = '/UserInfo/face/'+IONUX.SESSION_MODEL.get('user_id')+'/';
    IONUX.ROUTER.navigate(user_info_url, {trigger: true});
    return false;
  },
  create_account: function(e) {
    e.preventDefault();
    IONUX.ROUTER.create_account();
    return false;
  },
});

IONUX.Views.Sidebar = Backbone.View.extend({
  el: '#sidebar',
  initialize: function(){
    _.bindAll(this);
    this.model.on('change', this.render);
  },
  render: function(){
    var ui_mode = this.model.get('ui_mode').toLowerCase();
    this.template = _.template($('#sidebar-'+ui_mode+'-tmpl').html());
    this.$el.html(this.template(this.model.toJSON()));
    return this;
  },
});

IONUX.Views.DashboardMap = Backbone.View.extend({
  initialize: function(){
      this.$el.css({'height': '400px', 'width': '100%'});
  },
  render: function(){
    var mapOptions, mao;
    var initialZoom = 2;
    var oms;
    mapOptions = {
      center: new google.maps.LatLng(0, 0),
      zoom: initialZoom,
      mapTypeId: google.maps.MapTypeId.SATELLITE
    };
    map = new google.maps.Map(this.$el[0], mapOptions);
    //kml_path = 'http://'+window.location.host+'/map2.kml?ui_server=http://'+window.location.host+'&unique_key='+this.create_random_id()+'&return_format=raw_json';
    //console.log('KML_PATH: ', kml_path);
    //var georssLayer = new google.maps.KmlLayer(kml_path);
    //georssLayer.setMap(map);
    return this;
  },
  
  // Kept from Raj's code
  create_random_id: function(){
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var text = "";
    for ( var i=0; i < 16; i++ ) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    };
    return text;
  },
});

var tmp_map = '<iframe width="425" height="350" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://maps.google.com/?q=http:%2F%2F67.58.49.196:3000%2Fmap2.kml%3Fui_server%3Dhttp:%2F%2Fhttp:%2F%2F67.58.49.196:3000%2F&amp;ie=UTF8&amp;t=h&amp;ll=65.512963,-139.570312&amp;spn=56.353099,149.414063&amp;z=2&amp;iwloc=lyrftr:kml:cO2v7Ri9AUthkCHKZZYaNnFiB8Jrkdztr-0YvQFLYZAhymRIB,g9d9eb12dfa679399,44.590467,-125.332031,0,-32&amp;output=embed"></iframe><br /><small><a href="https://maps.google.com/?q=http:%2F%2F67.58.49.196:3000%2Fmap2.kml%3Fui_server%3Dhttp:%2F%2Fhttp:%2F%2F67.58.49.196:3000%2F&amp;ie=UTF8&amp;t=h&amp;ll=65.512963,-139.570312&amp;spn=56.353099,149.414063&amp;z=2&amp;iwloc=lyrftr:kml:cO2v7Ri9AUthkCHKZZYaNnFiB8Jrkdztr-0YvQFLYZAhymRIB,g9d9eb12dfa679399,44.590467,-125.332031,0,-32&amp;source=embed" style="color:#0000FF;text-align:left">View Larger Map</a></small>'

IONUX.Views.Footer = Backbone.View.extend({
  tagName: 'div',
  className: 'footer',
  render: function(){
    // Hack to prevent multiple instances until I figure out exactly where to call. 
    // Investigating collections and dashboard implementation issues.
    $('.footer').empty();
    
    $('#footer').html(this.$el);
    this.render_versions();
    this.render_buttons();
    return this;
  },
  render_versions: function() {
    var version_tmpl = '<span class="footer-version"><%= lib %>: <%= version %></span>';
    this.$el.append(_.template(version_tmpl)({lib: "OOI Version", version: ""}));
    this.$el.append(_.template(version_tmpl)({lib: "ux", version: IONUX.SESSION_MODEL.attributes.version[0].version}));
    this.$el.append(_.template(version_tmpl)({lib: "coi-services", version: IONUX.SESSION_MODEL.attributes.version[1].version}));
  },
  render_buttons: function(){
    var resource_id = this.options.resource_id;
    var resource_type = this.options.resource_type;
    var buttons = [['Dashboard', 'dashboard'], ['Facepage', 'face'], ['Status', 'status'], ['Related', 'related']];
    var button_tmpl = '<a class="btn-footer <%= view_type %>" href="<%= url %>"><%= label %></a>'
    
    var self = this;
    _.each(buttons, function(button){
      var label = button[0];
      var view_type = button[1];
      
      // Determine URL
      if (label == 'Dashboard'){
        var url = '/';
      } else if  (!resource_id || !resource_type) {
        var url = '.'
      } else {
        var url = '/'+resource_type+'/'+view_type+'/'+resource_id+'/';
      };
      
      // Determine active button
      var path = window.location.pathname.split('/');
      if (path.length == 2 && view_type == 'dashboard'){
        view_type += ' active';
      } else if (path[2] == view_type) {
        view_type += ' active';
      };
      
      self.$el.append(_.template(button_tmpl)({view_type: view_type, url: url, label: label}));
    });
  },
});

IONUX.Views.ContextMap = Backbone.View.extend({});

IONUX.Views.Map = Backbone.View.extend({});

IONUX.Views.Checkbox = Backbone.View.extend({
    template: _.template($('#checkbox-tmpl').html()),
    render: function(){

        var label = this.$el.data('label');
        if (!label) {
            label = "Checkbox"
        }; 
        
        var data_path = this.$el.data('path');
        var data = get_descendant_properties(this.options.data_model, data_path);
        var checked = data === true ? 'checked' : '';
        
        if (data_path) {
            this.$el.html(this.template({label: label, checked: checked}));

        // For integration effort only
        } else {
            var integration_info = this.$el.text();
            this.$el.find('.content-wrapper').html(this.template({label: label, integration_info: integration_info}));
            integration_log(this.$el.attr('id'), this.$el.data('path'), integration_info);
        };
        return this;
    }
});

IONUX.Views.ExtentGeospatial = Backbone.View.extend({
    template: _.template($('#extent-geospatial-tmpl').html()),
    render: function(){
        var label = this.$el.data('label');
        if (!label) {
            label = "Geospatial Bounds (decimal degrees)"
        };
        
        var data_path = this.$el.data('path');
        if (data_path && data_path.substring(0,7) != 'unknown'){            
            this.$el.html(this.template({label: label, data: this.options.data}));
        } else {
            var integration_info = this.$el.text();
            this.$el.find('.content-wrapper').html(this.template({label: label, integration_info: integration_info}));
            console.log('ID: ' + this.$el.attr('id') + ' -- DB-PATH: ' + this.$el.data('path') + ' -- ' + integration_info);
        };
        return this;
    }
});


// Simplified geospatial used in face pages
IONUX.Views.ExtentGeospatial2 = Backbone.View.extend({
  template: _.template($('#extent-geospatial2-tmpl').html()),
  render: function() {
    this.$el.html(this.template({data: this.options.data}));
    return this;
  }
});




IONUX.Views.ExtentVertical = Backbone.View.extend({
    template: _.template($('#extent-vertical-tmpl').html()),
    render: function(){
        var label = this.$el.data('label');
        if (!label) label = "Vertical Bounds (meters)";
            
        var data_path = this.$el.data('path');
        if (data_path && data_path.substring(0,7) != 'unknown') {
            this.$el.html(this.template({label: label, data: this.options.data}));
        
        // For integration effort only
        } else {
            var integration_info = this.$el.text();
            this.$el.html(this.template({label: label, upper_bound: '', lower_bound: '', integration_info: integration_info}));
            console.log('ID: ' + this.$el.attr('id') + ' -- DB-PATH: ' + this.$el.data('path') + ' -- ' + integration_info);
        };
        return this;
    }
});

// Simplified vertical used in face pages
IONUX.Views.ExtentVertical2 = Backbone.View.extend({
  template: _.template($('#extent-vertical2-tmpl').html()),
  render: function(){
    this.$el.html(this.template({data: this.options.data}));
    return this;
  }
});


IONUX.Views.AdvancedSearchExtentTemporal = Backbone.View.extend({
    template: _.template($('#extent-temporal-tmpl').html()),
    render: function(){
        
        var label = this.$el.data('label');
        if (!label) label = "Temporal Bounds";
        
        var data_path = this.$el.data('path');
        var temporal_from, temporal_to, temporal_field;
        
        this.$el.html(this.template({label: label, temporal_from: temporal_from, temporal_to: temporal_from, temporal_field: temporal_field}));
        this.$el.find('input').datepicker({
          autoclose:true,
          format: 'yyyy-mm-dd'
        });
        
        return this;
    }
});



IONUX.Views.ExtentTemporal = Backbone.View.extend({
    template: _.template($('#extent-temporal-tmpl').html()),
    render: function(){
        
        var label = this.$el.data('label');
        if (!label) label = "Temporal Bounds";
        
        var data_path = this.$el.data('path');
        var temporal_from, temporal_to;
        
        this.$el.html(this.template({label: label, temporal_from: temporal_from, temporal_to: temporal_from}));
        this.$el.find('input').datepicker({autoclose:true});
        
        return this;
    }
});

IONUX.Views.AttributeGroup = Backbone.View.extend({
    template: _.template($('#attribute-group-tmpl').html()),
    render: function(){
        this.$el.html(this.template({label: this.$el.data('label')}));
        var root_path = this.$el.data('path');
        var data = get_descendant_properties(this.options.data, root_path)
        var metadata = this._get_attribute_group_metadata();
        if (data && metadata) this._build_attribute_group(data, metadata, root_path);
        return this;
    },
    
    _build_attribute_group: function(data, metadata, root_path){
        var self = this;
        _.each(metadata, function(meta_item) {
            switch(meta_item[0]){
                case "text_short_ooi":
                    var subelement_view = new IONUX.Views.TextShort({data_model: self.options.data, attribute_group: true});
            }
            try {
                subelement_view.$el.attr('id', meta_item[6]);
                subelement_view.$el.attr('data-position', meta_item[3]);
                subelement_view.$el.attr('data-level', meta_item[4]);
                subelement_view.$el.attr('data-label', meta_item[1]);
                subelement_view.$el.addClass(meta_item[5]);
                path = root_path + '.' + meta_item[7];
                subelement_view.$el.attr('data-path', path);
                self.$el.append(subelement_view.render().el);
            } catch(e) {
                console.log('$el error id=' + meta_item[5] + ' path=' + meta_item[6] + ' root=' + root_path)
            }
        });
    },

    _get_attribute_group_metadata: function(){
        var attribute_group_metadata_id = "ATTRIBUTE_GROUP_"+this.$el.attr("id");
        var attribute_metadata = window[attribute_group_metadata_id];
        return attribute_metadata;
    },
});

IONUX.Views.TextShort = Backbone.View.extend({
    template: _.template('<span><%= label %>:</span>&nbsp;<%= text_short %>'),
    template_no_label: _.template('<span><%= text_short %></span>'),
    template_attr_group: _.template('<div class="row-fluid">\
                                      <div class="span4 text-short-label">\
                                        <%= label %>:&nbsp;\
                                      </div>\
                                      <div class="span8 text-short-value">\
                                        <% if (link) { %>\
                                          <a href="<%= link %>"><%= text_short %></a>\
                                        <% } else { %>\
                                          <%= text_short %>\
                                        <% } %>\
                                      </div>\
                                    </div>'),
    
    template_link: _.template('<div class="row-fluid"><div class="span4 text-short-label"><%= label %>:&nbsp;</div><div class="span8 text-short-value"><%= text_short %></div></div>'),
    initialize: function(){
      _.bindAll(this);
      this.data_path = this.$el.data('path');
      this.build_link();
    },
    render: function(){
      var data_path = this.$el.data('path');
      if (data_path){
          var label = this.$el.data('label');
          var text_short = get_descendant_properties(this.options.data_model, data_path);

          if (label == "NO LABEL"){
            this.$el.html(this.template_no_label({text_short: text_short}));
            if (this.$el.parent().is('.heading-left')) {
              // Experimental tooltip support (this also handles hover over CSS pseudo element)
              this.$el.tooltip({
                title: 'Resource Type: ' + window.MODEL_DATA.resource.type_.toUpperCase(),
                placement: 'bottom'
              });
            };
          } else if (this.$el.parent().is('.heading-right')) {
            this.$el.html(this.template({label: label, text_short: text_short}));
          } else {
            this.$el.html(this.template_attr_group({label: label, text_short: text_short, link:this.link_url}));
          };
      };
      
      return this;
    },

    build_link: function() {
      if (!_.isUndefined(this.data_path)) {
        var path_array = this.data_path.split('.');
        if (_.contains(path_array, 'name')) {
          var idx = _.lastIndexOf(path_array, 'name');
          
          // Get link id
          var id_path = _.clone(path_array);
          id_path[idx] = '_id';
          var link_id = get_descendant_properties(window.MODEL_DATA, id_path.join('.'));
          
          // Get alt_resource_type and type_
          var alt_type_path = _.clone(path_array);
          alt_type_path[idx] = 'alt_resource_type';
          var type_path = _.clone(path_array);
          type_path[idx] = 'type_';
          
          // Attempt to get alt_resource_type, fall back on type_
          var link_type = get_descendant_properties(window.MODEL_DATA, alt_type_path.join('.'));
          if (typeof(link_type) == 'undefined' || link_type == '') {
            link_type = get_descendant_properties(window.MODEL_DATA, type_path.join('.'));
          };
          
          if (link_id && link_type) {
            this.link_url = '/'+link_type+'/face/'+link_id+'/';
          };

        } else if (_.contains(path_array, 'url')) {
          this.link_url = get_descendant_properties(window.MODEL_DATA, this.data_path);
        };
      };
    },
});


IONUX.Views.TextStatic = Backbone.View.extend({
    template: _.template($('#text-static-tmpl').html()),
    render: function(){
        var label = this.$el.data('label');
        if (label) {
            // Work around formatting issue in UI database
            if (this.$el.parent().is('.heading-left')) label = label + ': ';
            this.$el.html(this.template({text_static: label}));
        };
        return this;
    }
});

IONUX.Views.TextExtended = IONUX.Views.TextShort.extend();

IONUX.Views.Icon = Backbone.View.extend({
    template: _.template($('#icon-tmpl').html()),
    render: function(){
        this.$el.html(this.template);
        return this;
    }
});

IONUX.Views.Image = Backbone.View.extend({
    template: _.template($('#image-tmpl').html()),
    render: function(){
        this.$el.html(this.template);
        return this;
    }
});


IONUX.Views.List = Backbone.View.extend({
    template: _.template($('#list-tmpl').html()),
    render: function(){
      var label = this.$el.data('label');
      var data_path = this.$el.data('path');
      var list_items = get_descendant_properties(this.options.data_model, data_path);
      this.$el.html(this.template({list_items: list_items, label: label}));
      return this;
    }
});

function integration_log(id, db_path, integration_info ) {
    console.log('ID: ' + id + ' --DB-PATH: ' + db_path + ' --INTEGRATION-INFO: ' + integration_info);
};

IONUX.Views.ResourceAddEventView = Backbone.View.extend({
  tagName: "div",
  template: _.template($("#resource-add-event-tmpl").html()),
  events: {
    "click #add-event-ok": "ok_clicked"
  },
  render: function() {
    $('body').append(this.$el);
    var modal_html = this.template();
    this.$el.append(modal_html);

    var self = this;

    $('#resource-add-event-overlay').modal()
      .on('hidden', function() {
        self.$el.remove();
      });

    return false;
  },
  ok_clicked: function() {
    // disable ok button from multiple clicks
    $('#add-event-ok', this.$el).attr('disabled', true);

    var url = window.location.href + "publish_event/";
    var vals = { 'description': $('#description', this.$el).val() };

    function remove() {
      $('#resource-add-event-overlay').modal('hide');
    }

    function failure(reason) {
      remove();
      alert("Could not create the event");
    }

    $.post(url, vals)
      .done(function(resp) {
        remove();
        Backbone.history.fragment = null; // Clear history fragment to allow for page "refresh".
        IONUX.ROUTER.navigate(window.location.pathname, {trigger: true});
      })
      .fail(function(resp) {
        failure();
      });
  },
});

IONUX.Views.ResourceAddAttachmentView = Backbone.View.extend({
  tagName: "div",
  template: _.template($("#resource-add-attachment-tmpl").html()),
  events: {
    "click #add-attachment-ok": "ok_clicked"
  },
  up_trigger: null,
  render: function() {
    $('body').append(this.$el);
    var modal_html = this.template();
    this.$el.append(modal_html);

    var self = this;

    // jquery upload initialization
    $('#attachment').fileupload({
      url: "/attachment/",
      dataType: 'json',
      add: function(e, data) {
        self.up_trigger = data;
      },
      replaceFileInput: false,
      done: function(e, data) {
        $('.progress', '#resource-add-attachment-overlay').addClass('progress-success');
        $('#resource-add-attachment-overlay').modal('hide');

        Backbone.history.fragment = null; // Clear history fragment to allow for page "refresh".
        IONUX.ROUTER.navigate(window.location.pathname, {trigger: true});
      },
      fail: function(e, data) {
        console.log(data);
        alert("Failed to upload: " + data.errorText);
      },
      always: function(e, data) {
        $('input', '#resource-add-attachment-overlay').attr('disabled', false);

        var atel = $('#attachment');
        atel.css('display', 'inherit');
        atel.next().css('display', 'inherit'); // should be help-inline span

        $('img.spinner', '#resource-add-attachment-overlay').css('display', 'none');

        $('.progress', atel.parent()).css('display', 'none');
      },
      progressall: function(e, data) {
        var progress = parseInt(data.loaded / data.total * 100, 10);
        $('.bar', '#resource-add-attachment-overlay .progress').css('width', progress + '%');
      },
    });

    $('#resource-add-attachment-overlay').modal()
    .on('hidden', function() {
      self.$el.remove();
    });

    return false;
  },
  ok_clicked: function() {
    if (this.up_trigger == null)
      alert("Please select a file to upload");
    else {
      $('input', '#resource-add-attachment-overlay').attr('disabled', true);
      var atel = $('#attachment');
      atel.css('display', 'none');
      atel.next().css('display', 'none'); // should be help-inline span

      $('.progress', atel.parent()).css('display', 'block');

      $('img.spinner', '#resource-add-attachment-overlay').css('display', 'inline-block');

      this.up_trigger.formData = { 'description' : $('#description').val(),
                                   'resource_id' : window.MODEL_DATA['_id'],
                                   'keywords'    : this.$('#keywords').val(),
                                   'created_by'  : this.$('#created_by').val(),
                                   'modified_by' : this.$('#modified_by').val()};
      this.up_trigger.submit();
    }
  },

});

IONUX.Views.AttachmentZoomView = Backbone.View.extend({
  template: _.template($("#attachment-zoom-tmpl").html()),
  events: {
    'click #btn-download': 'download',
    'click #btn-delete': 'confirm_delete',
    'click #btn-confirm-delete': 'delete_attachment',
    'click #btn-facepage': 'goto_facepage'
  },
  initialize: function(){
    _.bindAll(this);

    var row_info_list = this.options.data[0].split("::");
    this.attachment_id = row_info_list[0];
    this.attachment = _.findWhere(window.MODEL_DATA.attachments, {_id:this.attachment_id});
    this._can_delete();   // kick off ajax request
  },
  render: function() {
    var attachment_info = {
      'name'        : this.attachment.name,
      'desc'        : this.attachment.description,
      'mime'        : this.attachment.content_type,
      'keywords'    : this.attachment.keywords.join(", "),
      'created_by'  : this.attachment.created_by,
      'modified_by' : this.attachment.modified_by
    };

    this.modal = $(IONUX.Templates.modal_template).html(this.template(attachment_info));

    this.can_delete(function() {
      this.modal.find('.modal-body p:last').append("<button id='btn-delete' class='btn-general'>Delete</button>");
    });

    this.modal.modal('show')
      .on('hide', function() {
        $('#action-modal').remove();
      });
    this.setElement('#action-modal');
    return this;
  },
  download: function(e) {
    var url = "/attachment/"+this.attachment_id+"/?name="+this.attachment.name;
    window.open(url);
  },
  _can_delete: function() {
    // kicks off async get request, called from init, ensures this.cdreq exists
    var url = window.location.protocol + "//" + window.location.host + "/attachment/" + this.attachment_id + "/is_owner/" + IONUX.SESSION_MODEL.get('actor_id') + "/";
    console.log(url);
    this.cdreq = $.get(url);
    return this.cdreq;
  },
  can_delete: function(cbfunc) {
    if (!IONUX.SESSION_MODEL.get('is_logged_in')) {
      return false;
    }

    // DELETE IF: user is owner of resource, user is an org manager, or if they are the owner of the attachment (requires ajax call)
    // you pass in a callback and if they are allowed to delete, your callback is run (this set to this current view object)

    if (window.MODEL_DATA.hasOwnProperty('orgs')) {
      if (_.any(_.map(_.pluck(window.MODEL_DATA.orgs, 'org_governance_name'), function(o) {
        return _.contains(IONUX.SESSION_MODEL.get('roles')[o], 'ORG_MANAGER');
      }))) {
        cbfunc.call(this);
        return;
      }
    }

    if (IONUX.is_owner()) {
      cbfunc.call(this);
      return;
    }

    var self = this;

    this.cdreq.done(function(res) {
      if (res.data == true)
        cbfunc.call(self);
    }); 
  },
  confirm_delete: function(e) {
    var newel = $("<div class='alert'><button type='button' class='close' data-dismiss='alert'>&times;</button><p>Are you sure you want to delete this attachment?</p><button class='btn-blue' id='btn-confirm-delete'>Delete</button></div>");
    newel.appendTo(this.modal.find('.modal-body')).hide().slideDown(100);
  },
  delete_attachment: function(e) {

    this.$('.alert').alert('close');
    var self = this;

    // user must be either owner or org manager
    this.can_delete(function() {
      $.ajax({
        type: 'DELETE',
        url: window.location.protocol + "//" + window.location.host + "/attachment/" + this.attachment_id + "/",
        error: function(jqxhr, textstatus, errorthrown) {
          var newel = $("<div class='alert alert-error'><button type='button' class='close' data-dismiss='alert'>&times;</button><p>An error occured: " + textstatus + ": " + errorthrown + "</p></div>");
          newel.appendTo(this.modal.find('.modal-body')).hide().slideDown(100);
        },
        success: function(resp) {
          self.modal.modal('hide');

          Backbone.history.fragment = null; // Clear history fragment to allow for page "refresh".
          IONUX.ROUTER.navigate(window.location.pathname, {trigger: true});
        }
      });
    });
  },
  goto_facepage: function(e) {
    Backbone.history.fragment = null; // Clear history fragment to allow for page "refresh".
    IONUX.ROUTER.navigate('/InformationResource/face/'+this.attachment_id+'/', {trigger: true});
  }
});

IONUX.Views.CreateAccountView = Backbone.View.extend({
  tagName: "div",
  template: _.template($("#create-account-modal-tmpl").html()),
  events: {
    'click #get-credentials': 'get_credentials_clicked'
  },
  render: function() {
    $('body').append(this.$el);
    var modal_html = this.template();
    this.$el.append(modal_html);

    var self = this;

    $('#create-account-overlay').modal()
      .on('hidden', function() {
        self.$el.remove();
      });

    return false;
  },
  get_credentials_clicked: function() {
    window.location.href = "https://" + window.location.host + "/login";
  }
});

IONUX.Views.SigninFromExpiredSessionView = Backbone.View.extend({
  tagName: "div",
  template: _.template($("#signin-from-expired-session-modal-tmpl").html()),
  events: {
    'click #signin-from-expired-session': 'signin_clicked'
  },
  render: function() {
    $('body').append(this.$el);
    var modal_html = this.template();
    this.$el.append(modal_html);

    var self = this;

    $('#signin-from-expired-session-overlay').modal()
      .on('hidden', function() {
        self.$el.remove();
      });

    return false;
  },
  signin_clicked: function() {
    window.location.href = "https://" + window.location.host + "/login";
  }
});

IONUX.Views.NoConfiguredAgentInstance = Backbone.View.extend({
  tagName: "div",
  template: _.template($("#no-configured-agent-instance-modal-tmpl").html()),
  events: {
    'click #no-configured-agent-instance': 'ok_clicked'
  },
  render: function() {
    $('body').append(this.$el);
    var modal_html = this.template();
    this.$el.append(modal_html);

    var self = this;
    this.modal = $('#no-configured-agent-instance-overlay').modal()
      .on('hidden', function() {
        self.$el.remove();
      });
    return this;
  },
  ok_clicked : function() {
    var self = this;
    self.modal.modal('hide');
  }
});

IONUX.Views.CreateResourceView = Backbone.View.extend({
  tagName: "div",
  template: _.template($("#create-resource-modal-tmpl").html()),
  events: {
    'click #create-resource': 'createResourceClicked'
  },
  render: function() {
    var orgs = _.filter(_.pluck(IONUX.Dashboard.Orgs.models, 'attributes'), function(o) {
      return _.contains(IONUX.createRoles(), o.org_governance_name);
    });

    $('body').append(this.$el);
    var modal_html = this.template({orgs:orgs});
    this.$el.append(modal_html);

    var self = this;
    this.modal = $('#create-resource-overlay').modal()
      .on('hidden', function() {
        self.$el.remove();
      });
    return this;
  },
  createResourceClicked: function() {
    var url = window.location.protocol + "//" + window.location.host + "/create/",
      rtype = this.$('select[name="resource-type"]').val(),
        org = this.$('select[name="org"]').val(),
       vals = {'resource_type': rtype,
               'org_id': org},
       self = this;
    
    self.modal.modal('hide');

    $('#dynamic-container').html('<div id="spinner"></div>').show();
    new Spinner(IONUX.Spinner.large).spin(document.getElementById('spinner'));

    $.post(url, vals)
      .success(function(resp) {
        var new_res_id = resp.data[0];

        Backbone.history.fragment = null; // Clear history fragment to allow for page "refresh".
        IONUX.ROUTER.navigate('/' + rtype + '/face/' + new_res_id + '/edit', {trigger: true});
      });
  }
});

IONUX.Views.ActivateAsPrimaryDeployment = Backbone.View.extend({
  template: _.template($("#activate-as-primary-deployment").html()),
  template_confirm: _.template($("#activate-as-primary-deployment-confirm").html()),
  buttons_one: '<button id="btn-activate-primary" class="btn-blue">Activate</button><button class="btn-general" data-dismiss="modal">Cancel</button>',
  buttons_two: '<button id="btn-confirm-activate" class="btn-blue">Confirm</button>',
  events: {
    'click #btn-activate-primary': 'activate_primary_clicked',
    'click #btn-confirm-activate': 'confirm_clicked'
  },
  render: function() {
    var modal_template_vars = {header_text:"Set Primary Deployment: " + window.MODEL_DATA.resource.name,
                               body: "",
                               buttons: this.buttons_one};

    var template_vars = {deployments: window.MODEL_DATA.deployments};

    this.modal = $(_.template(IONUX.Templates.full_modal_template, modal_template_vars));
    this.modal.find('.modal-body').html(this.template(template_vars));
    this.modal.modal('show')
      .on('hide', function() {
        $('#action-modal').remove();
      });
    this.setElement('#action-modal');

    var curdeployment = _.find(_.pairs(window.MODEL_DATA.deployment_info), function(v) { return v[1].is_primary; });
    if (curdeployment) {
      this.$('select[name="deployment"]').val(curdeployment[0]);
    }

    return this;
  },
  activate_primary_clicked: function() {
    var curdeployment      = _.find(_.pairs(window.MODEL_DATA.deployment_info), function(v) { return v[1].is_primary; }),
        curdeployent_id    = null,
        curdeployment_text = null,
        curdevice          = null,
        self               = this;

    if (curdeployment) {
      curdevice          = window.MODEL_DATA.deployment_info[curdeployment[0]].device_name;
      curdeployment_id   = window.MODEL_DATA.deployment_info[curdeployment[0]].resource_id;
      curdeployment_text = _.findWhere(window.MODEL_DATA.deployments, {'_id': curdeployment_id}).name;
    } else {
      curdeployment_text = "None";
      curdevice = "None";
    }

    this.newdeployment = _.findWhere(window.MODEL_DATA.deployments, {'_id': this.$('select[name="deployment"]').val()});
    var newdevice = _.find(window.MODEL_DATA.deployment_info, function(d) { return d.resource_id == self.newdeployment._id; }).device_name;

    if (curdeployment && curdeployment.length > 0 && this.newdeployment._id == curdeployment_id) {
      this.modal.find('.modal-body').html('<p>This deployment (' + this.newdeployment.name + ') is already the primary.</p>');
      this.modal.find('#btn-activate-primary').remove();
      return;
    }

    var template_vars = {current_deployment: curdeployment_text,
                         current_device: curdevice,
                         new_deployment: this.newdeployment.name,
                         new_device: newdevice};

    this.modal.find('.modal-body').html(this.template_confirm(template_vars));
    this.modal.find('#btn-activate-primary').replaceWith(this.buttons_two);
  },
  confirm_clicked: function() {
    var url = window.location.protocol + "//" + window.location.host + "/activate_primary/",
       vals = {deployment_id: this.newdeployment._id},
       self = this;
    
    $.post(url, vals)
      .done(function(resp) {
        self.modal.modal('hide');

        Backbone.history.fragment = null; // Clear history fragment to allow for page "refresh".
        IONUX.ROUTER.navigate(window.location.pathname, {trigger: true});
      })
      .fail(function(resp) {
        console.error(resp);
      });
  }
});

IONUX.Views.DeactivateAsPrimaryDeployment = Backbone.View.extend({
  template: _.template($("#deactivate-as-primary-deployment").html()),
  events: {
    'click #btn-deactivate-primary': 'deactivate_primary_clicked'
  },
  render: function() {
    var curdeployment = _.find(_.pairs(window.MODEL_DATA.deployment_info), function(v) { return v[1].is_primary; }),
        self          = this;

    if (curdeployment.length == 0)
      return;

    this.deployment_id = window.MODEL_DATA.deployment_info[curdeployment[0]].resource_id;
    var primary_deployment = _.find(window.MODEL_DATA.deployment_info, function(d) { return d.resource_id == self.deployment_id; }).name;

    var template_vars = {resource_name: window.MODEL_DATA.resource.name,
                         primary_deployment: primary_deployment};

    this.modal = $(IONUX.Templates.modal_template).html(this.template(template_vars));
    this.modal.modal('show')
      .on('hide', function() {
        $('#action-modal').remove();
      });
    this.setElement('#action-modal');
    return this;
  },
  deactivate_primary_clicked: function() {
    var url = window.location.protocol + "//" + window.location.host + "/deactivate_primary/",
       vals = {deployment_id: this.deployment_id},
       self = this;
    
    $.post(url, vals)
      .done(function(resp) {
        self.modal.modal('hide');

        Backbone.history.fragment = null; // Clear history fragment to allow for page "refresh".
        IONUX.ROUTER.navigate(window.location.pathname, {trigger: true});
      })
      .fail(function(resp) {
        console.error(resp);
      });
  }
});

IONUX.Views.ActivateDataProductPersistence = Backbone.View.extend({
  events: {
    'click #btn-activate-persistence': 'activate_persistence_clicked'
  },
  buttons: '<button id="btn-activate-persistence" class="btn-blue">Activate Persistence</button><button class="btn-general" data-dismiss="modal">Cancel</button>',
  render: function() {
    var modal_template_vars = {header_text:"Activate Persistence: " + window.MODEL_DATA.resource.name,
                               body: "Click activate below to activate persistence for this data product.",
                               buttons: this.buttons};

    this.modal = $(_.template(IONUX.Templates.full_modal_template, modal_template_vars));
    this.modal.modal('show')
      .on('hide', function() {
        $('#action-modal').remove();
      });
    this.setElement('#action-modal');
    return this;
  },
  activate_persistence_clicked: function() {
    var url = window.location.protocol + "//" + window.location.host + "/activate_persistence/",
       vals = {data_product_id: window.MODEL_DATA.resource._id},
       self = this;
    
    $.post(url, vals)
      .done(function(resp) {
        self.modal.modal('hide');

        Backbone.history.fragment = null; // Clear history fragment to allow for page "refresh".
        IONUX.ROUTER.navigate(window.location.pathname, {trigger: true});
      })
      .fail(function(resp) {
        console.error(resp);
      });
  },
});

IONUX.Views.SuspendDataProductPersistence = Backbone.View.extend({
  events: {
    'click #btn-suspend-persistence': 'suspend_persistence_clicked'
  },
  buttons: '<button id="btn-suspend-persistence" class="btn-blue">Suspend Persistence</button><button class="btn-general" data-dismiss="modal">Cancel</button>',
  render: function() {
    var modal_template_vars = {header_text:"Suspend Persistence: " + window.MODEL_DATA.resource.name,
                               body: "Click Suspend below to suspend persistence for this data product.",
                               buttons: this.buttons};

    this.modal = $(_.template(IONUX.Templates.full_modal_template, modal_template_vars));
    this.modal.modal('show')
      .on('hide', function() {
        $('#action-modal').remove();
      });
    this.setElement('#action-modal');
    return this;
  },
  suspend_persistence_clicked: function() {
    var url = window.location.protocol + "//" + window.location.host + "/suspend_persistence/",
       vals = {data_product_id: window.MODEL_DATA.resource._id},
       self = this;
    
    $.post(url, vals)
      .done(function(resp) {
        self.modal.modal('hide');

        Backbone.history.fragment = null; // Clear history fragment to allow for page "refresh".
        IONUX.ROUTER.navigate(window.location.pathname, {trigger: true});
      })
      .fail(function(resp) {
        console.error(resp);
      });
  },
});
