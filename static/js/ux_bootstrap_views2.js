// renders the contents of the Header div of the page frame.

IONUX2.Views.Header = Backbone.View.extend({
  el: '#header2',
  initialize: function() {
    this.model.on('change:html', this.render, this);
  },
  render: function(){
    console.log('rendering header view');
    this.$el.html(this.model.html);
    return this;
  }
});

IONUX2.Views.MySearches = Backbone.View.extend({
  el: '.list_mysearches',
  template: _.template(IONUX2.getTemplate('templates/my_searches.html')),
  initialize: function() {
  },
  render: function() {
    console.log('rendering my searches view');
    this.$el.html(this.template(this.collection.toJSON()));
    return this;
  }
});

// responds to model in two ways.  Captures fetched template
// and renders with loaded template when data (session) is
// fetched.
IONUX2.Views.Login = Backbone.View.extend({
  el: '#login',
  events: {
    'click #userprofile': 'userprofile',
    'click #signup': 'create_account'
  },
  initialize: function(){
    console.log('initializing login view');
    console.log(this.model);
    this.model.on('change:html', this.setTemplate, this);
    this.model.on('change:session', this.render, this);
  },
  setTemplate: function(){
    console.log('setting login template');
    this.template = _.template(this.model.html);
    return this;
  },
  render: function(){
    console.log('rendering login view');
    this.$el.html(this.template(this.model.data));
    return this;
  }
});

IONUX2.Views.SearchTabContent = Backbone.View.extend({
  el: '#searchTabContent',
  events: {
    'click .accordionTitle': 'expandHide',
    'click #saveSearch': 'saveSearch',
    'click #saveName': 'saveName'
  },
  initialize: function() {
    this.model.on('change:html', this.render, this);
  },
  expandHide: function(e) {
    e.preventDefault();
    var $link = $(e.currentTarget);
    $link.parent().children('.leftAccordionContents').slideToggle('fast', function() {
      if ($(this).is(':visible')) {
              $link.find('.expandHide').removeClass('arrowRight').addClass('arrowDown');              
          } else {
            $link.find('.expandHide').removeClass('arrowDown').addClass('arrowRight');
          }        
    });
  },
  saveName: function() {
      $('#customSearchName').hide();
      $('#saveButtons').show();

      var name = $('.customName').val();
      var d = new Date();
      var month = d.getMonth() + 1;
      var day = d.getDate();
      var year = d.getFullYear();
      var hour = d.getHours();
      var minute = d.getMinutes();
      var time = d.getTime();

      // store spatial input values and set to model
      var spatial_dropdown = $('.latLongMenu option:selected').attr('value'),
        from_latitude = $('#south').val(),
        from_ns = $('.from_ns option:selected').val(),
        from_longitude = $('#west').val(),
        from_ew = $('.from_ew option:selected').val(),
        to_latitude = $('.placeholder_lat').val(),
        to_ns = $('.north_south_menu option:selected').val(),
        to_longitude = $('.show_hide_longitude').val(),
        to_ew = $('.to_ew option:selected').val(),
        radius = $('#radius').val(),
        miles_kilos = $('.milesKilosMenu').val(),
        vertical_from = $('[data-verticalfrom]').val(),
        vertical_to = $('[data-verticalto]').val(),
        feet_miles = $('.feet_miles option:selected').val();

      // save temporal input values and set to model
      var temporal_dropdown = $('.temporal_menu option:selected').attr('value'),
        from_year = $('.from_date_menu .year').val(),
        from_month = $('.from_date_menu .month').val(),
        from_day = $('.from_date_menu .day').val(),
        from_hour = $('.from_date_menu .hour').val(),
        to_year = $('.to_date_menu .year').val(),
        to_month = $('.to_date_menu .month').val(),
        to_day = $('.to_date_menu .day').val(),
        to_hour = $('.to_date_menu .hour').val();

    var searchName = {
      'time': time,
      'name': name,
      'month': month,
      'day': day,
      'year': year,
      'hour': hour,
      'minute': minute
    };

    var spatial = {
      'spatial_dropdown': spatial_dropdown,
      'from_latitude': from_latitude,
      'from_ns': from_ns,
      'from_longitude': from_longitude,
      'from_ew': from_ew,
      'to_latitude': to_latitude,
      'to_ns': to_ns,
      'to_longitude': to_longitude,
      'to_ew': to_ew,
      'radius': radius,
      'miles_kilos': miles_kilos,
      'vertical_from': vertical_from,
      'vertical_to': vertical_to,
      'feet_miles': feet_miles
    };

    IONUX2.Models.spatialModelInstance.set(spatial);
    console.log("spatial model");
    console.log(IONUX2.Models.spatialModelInstance);

    var temporal = {
      'temporal_dropdown': temporal_dropdown,
      'from_year': from_year,
      'from_month': from_month,
      'from_day': from_day,
      'from_hour': from_hour,
      'to_year': to_year,
      'to_month': to_month,
      'to_day': to_day,
      'to_hour': to_hour
    };

    IONUX2.Models.temporalModelInstance.set(temporal);
    console.log("temporal model");
    console.log(IONUX2.Models.temporalModelInstance);

    // get facility checkbox values and add to collection
    (function() {
      var facilities_checked = [];
      $('.list_facilities input').each(function(data) {
        var facility_value = $(this).val();
        var is_checked = $(this).prop('checked');
        facilities_checked.push({/*'facility_accordion_visible' : facility_accordion_visible,*/ 'value' : facility_value, 'is_checked' : is_checked });
      });
      IONUX2.Collections.saveFacilitySearch.set(facilities_checked);
    })();

    // get region checkbox values and add to collection
    (function() {
      var regions_checked = [];
      $('.list_regions input').each(function(data) {
        var region_name = $(this).data('spatial');
        var is_checked = $(this).prop('checked');
        regions_checked.push({/*'region_accordion_visible' : region_accordion_visible,*/ 'region_name' : region_name, 'is_checked' : is_checked });
      });
      IONUX2.Collections.saveRegionSearch.set(regions_checked);
    })();

    (function() {
      // get sites checkbox values and add to collection
      var sites_checked = [];
      $('.list_sites input').each(function(data) {
        var site_id = $(this).data('id');
        var is_checked = $(this).prop('checked');
        sites_checked.push({/*'sites_accordion_visible' : sites_accordion_visible,*/ 'id' : site_id, 'is_checked' : is_checked });
      });
      IONUX2.Collections.saveSiteSearch.set(sites_checked);
    })();

    (function() {
      // get data type checkbox values and add to collection
      var datatype_checked = [];
      $('.listDataTypes input').each(function(data) {
        var datatype_value = $(this).val();
        var is_checked = $(this).prop('checked');
        datatype_checked.push({/*'datatype_accordion_visible' : datatype_accordion_visible,*/ 'datatype_value' : datatype_value, 'is_checked' : is_checked });
      });
      IONUX2.Collections.saveDataTypeSearch.set(datatype_checked);
    })();

      var facilities = IONUX2.Collections.saveFacilitySearch.toJSON();
      var regions = IONUX2.Collections.saveRegionSearch.toJSON();
      var sites = IONUX2.Collections.saveSiteSearch.toJSON();
      var dataTypes = IONUX2.Collections.saveDataTypeSearch.toJSON();

      var values = {
        'searchName': searchName,
        'spatial' : spatial,
        'temporal': temporal,
        'facilities' : facilities,
        'regions': regions,
        'sites': sites,
        'dataTypes': dataTypes
      };

      // add search values to saved search collection
      IONUX2.Collections.saveNames.add(values);
      console.log("saved search collection");
      console.log(IONUX2.Collections.saveNames);     

      //remove previous input text so that name placeholder shows
      $('.customName').val(''); 
      $('#navLeftMinimizeArrow').show();
  },

  saveSearch: function() {
    $('#saveButtons').hide();
    $('#customSearchName').show();
    $('#navLeftMinimizeArrow').hide();
  },

  render: function() {
    console.log('rendering left side view');
    this.$el.html(this.model.html);
    return this;
  }
});

IONUX2.Views.LeftAccordion = Backbone.View.extend({
  el: '#searchTabContent',
  //template: _.template(IONUX2.getTemplate('templates/leftAccordions.html')),
  template: _.template('<article class="leftAccordion" id="<%= id %>Elem"><span class="accordionTitle">' +
   '<div class="expandHide arrowRight"></div><div class="accordionLabel"><%= title %></div></span>' +
  '<section class="leftAccordionContents" style="display:none;position:relative;" id="<%= id %>"></section></article>'),
  initialize: function() {
    console.log('initializing left accordion view');
  },
  addAccordion: function(title, id) {
    params = {'data':{'title':title, 'id':id}};
    this.$el.children('.accordionContainer').append(this.template(params.data));
    //return this;
  }
});

IONUX2.Views.Sites = Backbone.View.extend({
  el: '#site',
  template: _.template(IONUX2.getTemplate('templates/sites.html')),
  events: {
    'click .checkAllSites': 'select_all_sites',
    'click .resource_id': 'get_instrument'
  },

  initialize: function() {
    console.log('initializing sites view');
    this.render();
  },

  select_all_sites: function(e) {
    var $check = $(e.currentTarget);
    if ($check.is(':checked')) {
      $('.list_sites').find('input').prop('checked', true);
    }
    else {
      $('.list_sites').find('input').prop('checked', false);
    }
  },

  get_instrument: function(e) {
    var resourceId = $(e.currentTarget).data('id');
    var $check = $(e.currentTarget);
    IONUX2.Collections.instruments = new IONUX2.Collections.Instruments([], {resource_id: resourceId});
    IONUX2.Collections.instrumentGroup.set(IONUX2.Collections.instruments);
    IONUX2.Views.instruments = new IONUX2.Views.Instruments({collection: IONUX2.Collections.instruments});
    
    if ($check.is(':checked')) {
      IONUX2.Collections.instruments.fetch({
        success : function(collection) {
          $('#instrument').append(IONUX2.Views.instruments.render().el);
        }
      });
    }
    else {
      //IONUX2.Collections.instruments.reset();
      var $resourceIdElem = $('.' + IONUX2.Collections.instruments.resource_id + '');
      console.log("resource id element is " + $resourceIdElem);
      $resourceIdElem.remove();
    }
  },

  render: function() {
    console.log('rendering sites');
    this.$el.html(this.template(this.collection.toJSON()));
    return this;
  }
});

IONUX2.Views.InstrumentView = Backbone.View.extend({
  tagName : "li",
  className : "instrument_item",
  /*initialize: function() {
    this.listenTo(this.model, 'change', this.render);
    this.listenTo(this.model, 'destroy', this.remove);
  },*/
  removeInstrumentView: function() {
    console.log('got instrument view to remove');
    $(this.el).html('replace list item');
    return this;
  },
  render : function() {
    // render the sites text as the content of this element.
    $(this.el).html('<input type="checkbox" /> ' + this.model.get("name") + '<br/>');
    return this;
  }
});

IONUX2.Views.Instruments = Backbone.View.extend({
  tagName: "ul",
  className: "instrument_list",
  initialize: function() {
    //this.listenTo(this.collection, 'reset', this.removeView);
  },
  removeView: function() {
    console.log('collection was reset and now the view needs to be removed');
    /*this.collection.each(function(instrument_name) {
      console.log("removing instrument " + instrument_name);
      var instrumentView = new IONUX2.Views.InstrumentView({ model : instrument_name });
      instrumentView.removeInstrumentView();
      //this.remove();
    }, this);*/
    //this.remove();
    //this.unbind();
    //$('.instrument_list').empty();
    //$(this.el).empty();
    //$(this.el).prepend(instrumentView.render().el);
    //this.$el.remove();
    //console.log("this dom element is " + this.$el.html());
  },
  render: function() {
    this.collection.each(function(instrument_name) {
      var instrumentView = new IONUX2.Views.InstrumentView({ model : instrument_name });
      $(this.el).addClass(IONUX2.Collections.instruments.resource_id).prepend(instrumentView.render().el);
    }, this);
    return this;
  }
});

IONUX2.Views.Region = Backbone.View.extend({
  el: '#region',
  template: _.template(IONUX2.getTemplate('templates/regions.html')),
  events: {
      'click .checkAll': 'select_all_regions',
      'click #region_item': 'toggle_sites'
  },
  initialize: function() {
    console.log('initializing region view');
    this.render();
  },

  select_all_regions: function(e) {
    var $check = $(e.currentTarget);
    if ($check.is(':checked')) {
      $('.list_regions').find('input').prop('checked', true);
    }
    else {
      $('.list_regions').find('input').prop('checked', false);
    }
  },

  toggle_sites: function(e) {
    var $check = $(e.currentTarget);
    var $checked_item = $check.data('spatial');
    var select_data = '[data-sites="' + $checked_item + '"]';
    if ($check.is(':checked')) {
      console.log('checkbox is checked');
      $(select_data).prop('checked', true);
    }
    else {
      $(select_data).prop('checked', false);
    }
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
  },

   render: function() {
    console.log('rendering region');
    //this.$el.html(this.template(this.collection.toJSON()));
     this.$el.removeClass('placeholder');
     this.$el.html(this.template({resources: this.build_menu(), title: this.title}));
       this.$el.find('#list').jScrollPane({autoReinitialise: true});
       return this;
  }
});

IONUX2.Views.Spatial = Backbone.View.extend({
  el: '#spatial',
  template: _.template(IONUX2.getTemplate('templates/spatial.html')),
  initialize: function() {
    console.log('initializing spatial view');
    this.model.on('change:spatialData', this.updateData, this);
    this.render();
  },
  updateData: function() {
    var spatialModel = IONUX2.Models.spatialModelInstance.attributes;
    console.log("spatial model in Views Spatial");
    console.log(spatialModel);
    // $('.latLongMenu option[value="' + spatialModel.spatial_dropdown + '"]').attr('selected', 'selected');
    $('.latLongMenu').val(spatialModel.spatial_dropdown);
    if (spatialModel.spatial_dropdown == 2) {
      $('.top_search_to, .placeholder_lat, .north_south_menu, .show_hide_longitude').hide();
      $('.topSearchRadius, .noPlaceholderRadius, .milesKilosMenu').show();
    }
    else {
      $('.topSearchRadius, .noPlaceholderRadius, .milesKilosMenu').hide();
      $('.top_search_to, .placeholder_lat, .north_south_menu, .show_hide_longitude').show();
    }
    $('#south').val(spatialModel.from_latitude);
    $('.from_ns option[value="' + spatialModel.from_ns + '"]').attr('selected', 'selected');
    $('#west').val(spatialModel.from_longitude);
    $('.from_ew option[value="' + spatialModel.from_ew + '"]').attr('selected', 'selected');
    $('.placeholder_lat').val(spatialModel.to_latitude);
    $('.north_south_menu option[value="' + spatialModel.to_ns + '"]').attr('selected', 'selected');
    $('.show_hide_longitude').val(spatialModel.to_longitude);
    $('.to_ew option[value="'+ spatialModel.to_ew + '"]').attr('selected', 'selected');
    $('.no_placeholder_radius').val(spatialModel.radius);
    $('.milesKilosMenu').val(spatialModel.miles_kilos);
    $('[data-verticalfrom]').val(spatialModel.vertical_from);
    $('[data-verticalto]').val(spatialModel.vertical_to);
    $('.feet_miles option[value="' + spatialModel.feet_miles + '"]').attr('selected', 'selected');
    $('#radius').val(spatialModel.radius);
  },
  render: function() {
    console.log('rendering spatial');
    this.$el.html(this.template());
    return this;
  },
  
});

IONUX2.Views.Temporal = Backbone.View.extend({
  el: '#temporal',
  template: _.template(IONUX2.getTemplate('templates/temporal.html')),
  initialize: function() {
    console.log('initializing temporal view');
    this.model.on('change:temporalData', this.updateData, this);
    this.render();
  },
  updateData: function() {
    var temporalModel = IONUX2.Models.temporalModelInstance.attributes;
    $('.temporal_menu option[value="' + temporalModel.temporal_dropdown + '"]').attr('selected', 'selected');
    $('.from_date_menu .year option[value="' + temporalModel.from_year + '"]').attr('selected', 'selected');
    $('.from_date_menu .month option[value="' + temporalModel.from_month + '"]').attr('selected', 'selected');
    $('.from_date_menu .day option[value="' + temporalModel.from_day + '"]').attr('selected', 'selected');
    $('.from_date_menu .hour option[value="' + temporalModel.from_hour + '"]').attr('selected', 'selected');
    $('.to_date_menu .year option[value="' + temporalModel.to_year + '"]').attr('selected', 'selected');
    $('.to_date_menu .month option[value="' + temporalModel.to_month + '"]').attr('selected', 'selected');
    $('.to_date_menu .day option[value="' + temporalModel.to_day + '"]').attr('selected', 'selected');
    $('.to_date_menu .hour option[value="' + temporalModel.to_hour + '"]').attr('selected', 'selected');
  },
  render: function() {
    this.$el.html(this.template());
    return this;
  }
});

IONUX2.Views.BooleanSearch = Backbone.View.extend({
  el: '#boolean_expression',
  template: _.template(IONUX2.getTemplate('templates/block_boolean2.html')),
  item_template: _.template(IONUX2.getTemplate('templates/partials/block_boolean_item2.html')),
  events: {
    "click .filter-add": "add_filter_item",
    "click .filter-remove": "remove_filter_item",
    "change select[name='filter_var']": "filter_field_changed"
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
      ['Platform Port','PlatformSite'],
      ['Platform','PlatformDevice'],
      ['Port','InstrumentSite'],
      ['Role','UserRole'],
      ['Site','Observatory'],
      ['Station','StationSite'],
      ['Subscription','NotificationRequest'],
      ['User','UserInfo']]},
  ],
  initialize: function() {
    console.log('initializing boolean view');
  },
  render: function() {
    console.log('rendering boolean');
    this.$el.html(this.template());
    this.add_filter_item();
    return this;
  },
  add_filter_item: function(evt) {
    //var columns = this.get_filter_columns();
    //var data = {"columns":columns, "operators":OPERATORS};

    var filter_item = $(this.item_template({'fields':this.filter_fields}));
    if (evt == null){
      this.$el.find(".filter-item-holder").html(filter_item);
      // this.$el.html(filter_item);
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
        // var sel_operator = $('<select class="operator" name="filter_operator"></select>');
        var sel_operator = $('<select class="booleanSelectContainer" name="filter_operator"></select>');
        filter_container.find('.filter-add').before(sel_operator);
        _.each(operators, function(o) {
          sel_operator.append('<option>' + o + '</option>');
        });
      }

      if (filter_container.find('input[name="filter_arg"]').length == 0) {
        // var inp_arg = '<input class="argument" type="text" name="filter_arg" value="" />';
        var inp_arg = '<input type="text" class="booleanInput" name="filter_arg" value="" />';
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
        inp_arg = $('<select class="booleanSelectContainer" name="filter_arg"></select>');
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
  }

});

IONUX2.Views.OrgSelector = Backbone.View.extend({
  el: '#orgSelector',
  template: _.template(IONUX2.getTemplate('templates/partials/block_dashboard_org_list2.html')),
  events: {
    'click .checkAllFacilities': 'select_all_facilities'
  },
  initialize: function() {
    console.log('initializing org selector view');
    this.collection.on('change:data', this.render, this);
  },
  select_all_facilities: function(e) {
    var $check = $(e.currentTarget);
    if ($check.is(':checked')) {
      $('.list_facilities').find('input').prop('checked', true);
    }
    else {
      $('.list_facilities').find('input').prop('checked', false);
    }
  },
  render: function(){
    this.$el.html(this.template({resources: this.collection.toJSON()}));
    return this;
  }
});

IONUX2.Views.ResourceTypeMenu = Backbone.View.extend({
  el: '#ResourceTypes',
  template: _.template('<select name="nested-resource-types" size="4">' + 
                        '<% _.each(list, function(resource) { %>' + 
                        '<option value="<%= resource.value %>"><%= resource.name %></option>' + 
                        '<% }); %>' +
                        '</select>'),
  initialize: function() {
    this.render();
  },
  render: function() {
    this.$el.html(this.template({list: this.collection.toJSON()}));
      return this;
  } 
});

IONUX2.Views.LifeCycleMenu = Backbone.View.extend({
  el: '#lifecycleState',
  template: _.template('<select name="lifecycle-state">' + 
                        '<% _.each(lifecycle, function(cycle) { %>' + 
                        '<option value="<%= cycle.value %>"><%= cycle.name %></option>' + 
                        '<% }); %>' +
                        '</select>'),
  initialize: function() {
    this.render();
  },
  render: function() {
    this.$el.html(this.template({lifecycle: this.collection.toJSON()}));
    return this;
  } 
});  
