// For generic cases
IONUX2.Collections.Resources = Backbone.Collection.extend({
  //model: IONUX.Models.Resource,
  // can't use this model type here because its parse is suited for retreive on itself, not
  // for use with a collection.
  initialize: function(models, options){
      this.resource_type = options.resource_type;
  },
  url: function() {
      return '/' + this.resource_type + '/list/'
  },
  parse: function(resp){
    make_iso_timestamps(resp.data);
    return resp.data;
  } 
});

IONUX2.Models.Header = Backbone.Model.extend({
	url: '/templates/header2.html',
	html: '',
	parse: function(resp){
		console.log('got response from /bootstrap/header2.html.');
		this.html = resp;
		this.trigger('change:html');
		return resp;
	}
});

IONUX2.Models.LoginTemplate = Backbone.Model.extend({
	url: '/templates/partials/login2.html',
	html: '',
	parse: function(resp){
		console.log('got response from /templates/partials/login2.html.');
		this.html = resp;
		this.trigger('change:html');
		return resp;
	}
});

IONUX2.Models.PermittedFacilities = Backbone.Model.extend({
  defaults: {
    orgs: null
  }
});

// For use with collections of Resource Types, i.e. InstrumentDevice, PlatformDevice, etc.
IONUX2.Models.Session = Backbone.Model.extend({
    defaults: {
        actor_id: null,
        user_id: null,
        name: "Guest",
        is_logged_in: false,
        is_registered: null,
        version: {},
        roles: [],
        ui_mode: 'PRODUCTION',
        is_polling: false,
        ui_theme_dark: false,
        valid_until: null
    },
    url: '/session/',
    initialize: function() {
      _.bindAll(this);
    },
    parse: function(resp){
    	console.log('got response from /session/.');
    	this.trigger('change:session');
      var orgs = _.filter(_.pluck(IONUX2.Collections.OrgsInstance.models, 'attributes'), function(o) {
        return _.contains(IONUX2.createRoles(), o.org_governance_name);
      });

      IONUX2.Models.PermittedFacilitiesInstance.attributes.orgs = orgs;
      
      return resp.data;
    },
    is_logged_in: function(){
      return this.get('is_logged_in');
    },
    is_registered: function() {
      return this.get('is_registered');
    },
    is_resource_owner: function(){
      return _.findWhere(MODEL_DATA.owners, {_id: this.get('user_id')}) ? true : false;
    },
    is_valid: function(){
      return new Date(this.get('valid_until') * 1) >= new Date()
    },
    set_polling: function() {
      if (this.get('is_logged_in')) {
        this.set('is_polling', true);
        setTimeout(this.poll, 60000);
      };
    },
    poll: function() {
      // If their session has expired (i.e. their certificate's is_valid date has passed),
      // let the user know and give the option to login.  Do not continue to poll the session.
      if (this.is_logged_in() && !this.is_valid()) {
        // IONUX2.ROUTER.signin_from_expired_session();
        return;
      }
      var self = this;
      var existing_roles = _.clone(this.get('roles'));
      if (this.get('is_polling')) {
        this.fetch({
          global: false,
          success: function(resp) {
            self.set_polling();
            if (!_.isEqual(existing_roles, resp.get('roles'))) {
              self.check_roles(existing_roles);
            };
          },
          error: function(resp) {
            self.set('is_polling', false);
          }
        });
      };
    },
    check_roles: function(existing_roles) {
      var roles = this.get('roles');
      var new_roles = {};
      _.each(roles, function(v,k) {
        if (!_.has(existing_roles, k)) {
          new_roles[k] = v;
        } else {
          var added_roles = _.difference(roles[k], existing_roles[k]);
          if (added_roles.length) new_roles[k] = added_roles;
        };
      });
      // if (!_.isEmpty(new_roles)) new IONUX2.Views.NewRoles({new_roles: new_roles}).render().el;
    },
});

IONUX2.Models.Login = Backbone.Model.extend({
	initialize: function(){
		console.log('initializing login model.');
	},
	setModels: function(templateModel, sessionModel){
		this.templateModel = templateModel;
		this.sessionModel = sessionModel;
		console.log(this.sessionModel);
		this.templateModel.on('change:html', this.setTemplate, this);
		this.sessionModel.on('change:session', this.setSession, this);
	},
	setTemplate: function(){
		console.log('setting html from login template.');
		this.html = this.templateModel.html;
		this.trigger('change:html');
	},
	setSession: function(){
		console.log('setting data from session.');
		this.data = this.sessionModel.toJSON();
    console.log(this.data);
		this.trigger('change:session');
	},
	fetch: function(options){
	    console.log(typeof this.html);
	    if( typeof this.html == 'undefined'){
	  		this.templateModel.fetch({
	  			async: false,
	  			dataType: 'html'
	  		});
	    }

		this.sessionModel.fetch({
			async: false
		});
	}
});

IONUX2.Models.SearchTabContent = Backbone.Model.extend({
  initialize: function() {
    console.log('initializing left sidebar model');
  },
  url: '/templates/accordion.html',
  html: '',
  parse: function(resp){
    console.log('got response from /bootstrap/accordion.html.');
    this.html = resp;
    this.trigger('change:html');
    return resp;
  }
});

IONUX2.Collections.Observatories = Backbone.Collection.extend({
  url: '/Observatory/list/',
  parse: function(resp) {
    return resp.data;
  }
});

IONUX2.Models.DataTypeList = Backbone.Model.extend({
	url: '/get_data_product_group_list/',
	data: '',
	parse: function(resp){
		console.log('got response from /get_data_product_group_list/.');
		this.data = resp.data;
		this.trigger('change:data');
		return resp;
	}
});
		
IONUX2.Collections.Orgs = Backbone.Collection.extend({
  url: '/orgs/list/',
  parse: function(resp) {
	  data = _.sortBy(resp.data.orgs,function(o){return o.name});
	  this.set(data);
	  this.trigger('change:data');
	  return data;
  }
});

IONUX2.Models.Instruments = Backbone.Model.extend({
  defaults: {
    name: 'glider'
  }
});
IONUX2.Models.instruments = new IONUX2.Models.Instruments();

IONUX2.Collections.Instruments = Backbone.Collection.extend({
  model: IONUX2.Models.Instruments,
  initialize: function(models, options){
    console.log("resource id is " + options.resource_id);
    this.resource_id = options.resource_id;
  },
  url: function() {
   return '/find_site_data_products/'+this.resource_id+'/';
  },

  updateView: function() {
    console.log("need to remove the view now");
  },
  
  parse: function(resp) {
    var data_products = [];
    if (!_.isEmpty(resp.data.site_resources)) {
      site_resources = _.filter(resp.data.site_resources, function(v,k) {
        return !_.isEmpty(v);
      });
      make_iso_timestamps(site_resources);
    };
    
    console.log('site resources')
    console.log(site_resources);
    //return new Backbone.Collection.add(site_resources);
    return site_resources;
  }
});

IONUX2.Collections.InstrumentGroup = Backbone.Collection.extend({});
IONUX2.Collections.instrumentGroup = new IONUX2.Collections.InstrumentGroup();

IONUX2.Models.SpatialInit = Backbone.Model.extend({
  defaults: {
      spatial_dropdown: "1",
      from_latitude: "0.00",
      from_ns: "",
      from_longitude: "0.00",
      from_ew: "",
      to_latitude: "0.00",
      to_ns: "",
      to_longitude: "0.00",
      to_ew: "",
      radius: "0.00",
      miles_kilos: "1",
      vertical_from: "",
      vertical_to: "",
      feet_miles: "1"
  },
  updateAttributes: function(attributes) {
    console.log("attributes in spatial model");
    console.log(attributes);
    this.set(attributes);
    this.trigger('change:spatialData');
  }
});

IONUX2.Models.spatialModelInstance = new IONUX2.Models.SpatialInit();

IONUX2.Models.TemporalInit = Backbone.Model.extend({
  defaults: {
    temporal_dropdown: '',
    from_year: '',
    from_month: '',
    from_day: '',
    from_hour: '',
    to_year: '',
    to_month: '',
    to_day: '',
    to_hour: '',
  },
  updateAttributes: function(attributes) {
    console.log("attributes in temporal model");
    console.log(attributes);
    this.set(attributes);
    this.trigger('change:temporalData');
  }
});

IONUX2.Models.temporalModelInstance = new IONUX2.Models.TemporalInit();

IONUX2.Models.SaveCustomName = Backbone.Model.extend({
  defaults: {
    name: '',
    month: '',
    day: '',
    year: '',
    hour: '',
    minute: ''
  }
});

IONUX2.Models.saveCustomName = new IONUX2.Models.SaveCustomName();

IONUX2.Models.SaveConfiguration = Backbone.Model.extend({
  defaults: {
    userId: '',
    name: '',
    validUntil: '',
    configuration: {
      spatial: '',
      temporal: '',
      orgSelector: '',
      region: '',
      site: '',
      dataTypesList: '',
      boolean_expression: '',
      platform: '',
      instrument: ''
    },
    bottom_config: {
      accordionAssets: '',
      accordionData: '',
      accordionPlatform: '',
      accordionInstruments: '',
      accordionDataType: ''
    },
    sortable_order: '',
    bottom_sortable: ''
  }
});
IONUX2.Models.saveConfiguration = new IONUX2.Models.SaveConfiguration();

IONUX2.Collections.SaveNames = Backbone.Collection.extend({});

IONUX2.Collections.saveNames = new IONUX2.Collections.SaveNames();

IONUX2.Collections.SaveFacilitySearch = Backbone.Collection.extend({});
IONUX2.Collections.saveFacilitySearch = new IONUX2.Collections.SaveFacilitySearch();

IONUX2.Collections.SaveRegionSearch = Backbone.Collection.extend({});
IONUX2.Collections.saveRegionSearch = new IONUX2.Collections.SaveRegionSearch();

IONUX2.Collections.SaveSiteSearch = Backbone.Collection.extend({});
IONUX2.Collections.saveSiteSearch = new IONUX2.Collections.SaveSiteSearch();

IONUX2.Collections.SaveDataTypeSearch = Backbone.Collection.extend({});
IONUX2.Collections.saveDataTypeSearch = new IONUX2.Collections.SaveDataTypeSearch();

IONUX2.Models.Facilities = Backbone.Model.extend({});
IONUX2.Models.facilities = new IONUX2.Models.Facilities();

IONUX2.siteData = [];
IONUX2.siteDataObj = {};
