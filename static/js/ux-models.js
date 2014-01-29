

IONUX.Models.EditableResource = Backbone.Model.extend({
  idAttribute: '_id',
  schema: function(){
    return this.make_schema();
  },
  initialize: function(){},
  url: function(){
    return window.location.pathname.replace(/edit$/,'');
  },
  make_schema: function(){
    var self = this;
    var schema = {};
    _.each(this.attributes, function(value, key){
      if (!_.isObject(value) && !(key=='ts_updated' || key=='ts_created')){
        console.log(key, value, typeof value);
        switch(typeof(value)){
          case 'boolean':
            schema[key] = 'Checkbox';
            break;
          case 'number':
            schema[key] = 'Number';
            break;
          default:
            schema[key] = 'Text'
        };
      };
    });
    return schema;
  },
});

IONUX.Models.Search = Backbone.Model.extend();

IONUX.Models.Search = Backbone.Model.extend({
    url: function(){
        return "/search/?query="+this.get("search_query");
    },
    parse: function(resp){
        make_iso_timestamps(resp);
        return resp.data;
    }
});

// For use with collections of Resource Types, i.e. InstrumentDevice, PlatformDevice, etc.
IONUX.Models.Session = Backbone.Model.extend({
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
      return new Date(this.get('valid_until')) >= new Date()
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
        IONUX.ROUTER.signin_from_expired_session();
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
      if (!_.isEmpty(new_roles)) new IONUX.Views.NewRoles({new_roles: new_roles}).render().el;
    },
});

IONUX.Models.Resource = Backbone.Model.extend({
  initialize: function(options) {
    this.resource_id = options.resource_id
  },
  url: function() {
    return '/resource/read/'+this.resource_id+'/';
  },
  parse: function(resp) {
    return resp.data;
  },
});

IONUX.Models.EventType = Backbone.Model.extend({
    url: '/event_types/',
    parse: function(resp){
        return resp.data;
    },
});

IONUX.Models.Layout = Backbone.Model.extend({
  url: '/layout',
  parse: function(resp){
    return resp.data;
  },
});


// Timestamp conversion methods to call when parsing response.
// Maybe put these into IONUX.Helpers namespace?
var epoch_to_iso = function(epoch_time){
    try {
      return new Date(parseInt(epoch_time)).toISOString().replace(/T/, ' ').replace(/.\d{3}Z$/, 'Z');
    } catch (err) {
      return epoch_time;
    };
};

var make_iso_timestamps = function(resp) {
  if(resp != null && 'type_' in resp) {
    if('ts_created' in resp) {
      resp['ts_created'] = epoch_to_iso(resp['ts_created']);
    }
    if('ts_updated' in resp) {
      resp['ts_updated'] = epoch_to_iso(resp['ts_updated']);
    }
  }

  _.each(resp, function(val, key) {
      if (typeof val == 'object') {
        make_iso_timestamps(val);
      };
  });
  return;
};

IONUX.Models.ResourceExtension = Backbone.Model.extend({
    url: function(){
        return '/'+this.get('resource_type')+'/extension/'+this.get('resource_id')+'/';
    },
    parse: function(resp){
        make_iso_timestamps(resp);
        return resp.data;
    }
});


IONUX.Models.Observatory = Backbone.Model.extend({
  url: "/observatories/",
  idAttribute: "_id",
});


IONUX.Models.ObservatoryFacepageModel = Backbone.Model.extend({  
  url: function(){
    return "/observatories/"+this.get("observatory_id")+"/";
  },
  
  parse: function(resp) {
    make_iso_timestamps(resp);
    return resp.data;
  }
});


IONUX.Models.UserRequest = Backbone.Model.extend({});


IONUX.Models.Platform = Backbone.Model.extend({
  url: "/platforms/",
  idAttribute: "_id",
  
  parse: function(resp){
    make_iso_timestamps(resp);
    return resp;
  },
});


IONUX.Models.PlatformFacepageModel = Backbone.Model.extend({
  url: function(){
    return "/platforms/"+this.get("platform_id")+"/";
  },
  
  parse: function(resp) {
    make_iso_timestamps(resp);
    return resp.data;
  }
});


IONUX.Models.PlatformModel = Backbone.Model.extend({
  url: '/platform_models/',
  idAttribute: '_id',

  parse: function(resp) {
    make_iso_timestamps(resp);
    return resp;
  }
});


IONUX.Models.PlatformModelFacepageModel = Backbone.Model.extend({
  url: function() {
    return '/platform_models/'+this.get('platform_model_id')+'/';
  },
  
  parse: function(resp) {
    make_iso_timestamps(resp);
    return resp.data;
  } 
});


IONUX.Models.Instrument = Backbone.Model.extend({
  url: "/instruments/",
  idAttribute: "_id",
  
  parse: function(resp){
    make_iso_timestamps(resp);
    return resp;
  },
});


// IONUX.Models.Instrument = Backbone.Model.extend({
//   url: "/instrument_models/",
//   idAttribute: "_id"
// });

IONUX.Models.InstrumentFacepageModelLegacy = Backbone.Model.extend({
  url: function(){
    return "/instruments/"+this.get("instrument_id")+"/";
  },
  
  parse: function(resp) {
    make_iso_timestamps(resp);
    return resp.data;
  }
});


IONUX.Models.InstrumentModel = Backbone.Model.extend({
  url: '/instrument_models/',
  idAttribute: '_id',
  
  parse: function(resp){
    make_iso_timestamps(resp);
    return resp;
  }
});


IONUX.Models.InstrumentModelFacepageModel = Backbone.Model.extend({
  url: function() {
    return '/instrument_models/'+this.get('instrument_model_id')+'/';
  },
  
  parse: function(resp) {
    make_iso_timestamps(resp);
    return resp.data;
  } 
});


IONUX.Models.InstrumentAgent = Backbone.Model.extend({
  url: '/instrument_agents/',
  idAttribute: '_id',
  
  parse: function(resp){
    make_iso_timestamps(resp);
    return resp;
  },
});


IONUX.Models.InstrumentAgentFacepageModel = Backbone.Model.extend({
  url: function() {
    return '/instrument_agents/'+this.get('instrument_agent_id')+'/';
  },
  
  parse: function(resp) {
    make_iso_timestamps(resp);
    return resp.data;
  } 
});


IONUX.Models.DataProcessDefinition = Backbone.Model.extend({
  url: "/data_process_definitions/",
  idAttribute: "_id",
  
  parse: function(resp){
    make_iso_timestamps(resp);
    return resp;
  },
});


IONUX.Models.DataProcessDefinitionFacepageModel = Backbone.Model.extend({
  url: function(){
    return "/data_process_definitions/"+this.get("data_process_definition_id")+"/";
  },
  
  parse: function(resp) {
    make_iso_timestamps(resp);
    return resp.data;
  }
});


IONUX.Models.DataProduct = Backbone.Model.extend({
  url: "/data_products/",
  idAttribute: "_id",
  
  parse: function(resp) {
    make_iso_timestamps(resp);
    return resp;
  }
});


IONUX.Models.DataProductFacepageModel = Backbone.Model.extend({
  url: function(){
    return "/data_products/"+this.get("data_product_id")+"/";
  },
  
  parse: function(resp) {
    make_iso_timestamps(resp);
    return resp.data;
  }
});


IONUX.Models.FrameOfReference = Backbone.Model.extend({
  url: "/frame_of_references/",
  idAttribute: "_id",

  parse: function(resp){
    make_iso_timestamps(resp);
    return resp;
  },
});


IONUX.Models.FrameOfReferenceFacepage = Backbone.Model.extend({
  url: function() {
    return "/frame_of_references/"+this.get("frame_of_reference_id")+"/";
  },
  
  parse: function(resp) {
    make_iso_timestamps(resp);
    return resp.data;
  }
});

IONUX.Models.UserRegistrationModel = IONUX.Models.EditableResource.extend({
  url: "/userprofile/",
  idAttribute: "_id",

  schema: {
    'contact': {
      type: 'Object',
      title: false,
      subSchema: {
        individual_names_given: { type: 'Text', title: 'Given Name(s)' },
        individual_name_family: { type: 'Text', title: 'Family Name' },
        organization_name:      { type: 'Text', title: 'Organization Name' },
        position_name:          { type: 'Text', title: 'Position' },
        email:                  { type: 'Text', title: 'Email', dataType: 'email', validators: ['required', 'email']},
        street_address:         { type: 'Text', title: 'Street Address' },
        city:                   { type: 'Text', title: 'City' },
        postal_code:            { type: 'Text', title: 'Postal Code' },
        country:                { type: 'Text', title: 'Country' },
        url:                    { type: 'Text', title: 'Contact URL' },
        phones:                 { type: 'List', itemType: 'Phone' },
      },
    },

    // 'variables': {
    //   type: 'Object',
    //   title: false,
    //   subSchema: {
    //     notification_contact:   { type: 'Radio',    title: 'Notification Method', options: ['Email', 'SMS'] },
    //     sms_email:              { type: 'Checkbox', title: "Use email->SMS" },
    //     ooi_system_change:      { type: 'Checkbox', title: "OOI system change information" },
    //     ooi_project_updates:    { type: 'Checkbox', title: "OOI project updates" },
    //     ocean_leadership_news:  { type: 'Checkbox', title: "Ocean Leadership News" },
    //     ux_improvement_program: { type: 'Checkbox', title: "Participate in OOI User Experience Improvement Program" },
    //   }
    // },

  },

  attr_convert: {
    'name': {
      parse: function(v) {
        /**
         * Input: value of name field.
         * Ouptut: the same. Not presented on form.
         */
        return v;
      },
      serialize: function(v) {
        /**
         * Input: whatever value we parsed initially. May be empty.
         * Output: the concatentation of contact.individual_names_given + individual_name_family
         */
        var contact = this.get('contact');
        return contact.individual_names_given + " " + contact.individual_name_family;
      },
    },
    'variables': {
      parse: function(v) {
        /**
         * Input: array of { name: <key>, value: <value> } literal objects
         * Output: object with keys -> values
         */
        return _.object(_.map(v, function(vv) { return [vv.name, vv.value]; } ));
      },
      serialize: function(v) {
        /**
         * Input: object with keys -> values
         * Output: array of { name: <key>, value: <value> } literal objects
         */
        return _.map(v, function(vv, kk) { return { name: kk, value: vv }; });
      },
    },
  },

  attr_convert_serialize: function(attrs) {
    /**
     * Call this from your toJSON.
     */
    attrs = _.clone(attrs);
    var self = this;
    _.each(this.attr_convert, function(v, k) {
      if (_.has(attrs, k)) {
        attrs[k] = v.serialize.call(self, attrs[k]);
      }
    });

    return attrs;
  },

  attr_convert_parse: function(data) {
    /**
     * Call this from your parse method.
     */
    data = _.clone(data);
    var self = this;
    _.each(this.attr_convert, function(v, k) {
      if (_.has(data, k)) {
        data[k] = v.parse.call(self, data[k]);
      }
    });

    return data;
  },

  toJSON: function() {
    var o = IONUX.Models.EditableResource.prototype.toJSON.call(this);
    o = this.attr_convert_serialize(o);

    o['contact']['type_'] = 'ContactInformation';

    return o;
  },

  parse: function(resp) {
    var data = resp.data;
    if (data != null)
      data = this.attr_convert_parse(data);
    return data;
  },

  merge: function(attribute, value) {
    /**
     * Instead of overwriting full objects, this method merges the passed in value
     * on top of the current value.
     */

    var curval = _.clone(this.get(attribute) || {});
    _.extend(curval, value);
    this.set(attribute, curval);

    return curval;
  },
});


IONUX.Models.User = Backbone.Model.extend({
  url: "/users/",
  idAttribute: "_id"
});


IONUX.Models.UserFacepageModel = Backbone.Model.extend({
  url: function() {
    return "/users/"+this.get("user_id")+"/";
  },
  parse: function(resp) {
    make_iso_timestamps(resp);
    return resp.data;
  }
});

IONUX.Models.ResourceType = Backbone.Model.extend({})
