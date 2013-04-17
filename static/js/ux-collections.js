// For generic cases
IONUX.Collections.Resources = Backbone.Collection.extend({
  model: IONUX.Models.Resource,
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

IONUX.Collections.DataProducts = Backbone.Collection.extend({
  model: IONUX.Models.DataProduct,
  url: "/data_products/",
    
  parse: function(resp) {
    return resp.data;
  } 
});

IONUX.Collections.DataResources = Backbone.Collection.extend({
  model: IONUX.Models.DataResource,
  url: "/dataresource"
});


IONUX.Collections.ObservatoryCollection = Backbone.Collection.extend({
  model: IONUX.Models.Observatory,
  url: "/observatories/",

  parse: function(resp) {
    return resp.data;
  }
});


IONUX.Collections.Platforms = Backbone.Collection.extend({
  model: IONUX.Models.Platform,
  url: "/platforms/",

  parse: function(resp) {
    return resp.data;
  }
});


IONUX.Collections.PlatformModels = Backbone.Collection.extend({
  model: IONUX.Models.PlatformModel,
  url: "/platform_models/",

  parse: function(resp) {
    return resp.data;
  }
});


IONUX.Collections.Users = Backbone.Collection.extend({
  model: IONUX.Models.User,
  url: "/users/",

  parse: function(resp) {
    return resp.data;
  }
});


IONUX.Collections.Instruments = Backbone.Collection.extend({
  model: IONUX.Models.Instrument,
  url: "/instruments/",

  parse: function(resp) {
    return resp.data;
  }
});


IONUX.Collections.InstrumentModels = Backbone.Collection.extend({
  model: IONUX.Models.InstrumentModel,
  url: "/instrument_models/",

  parse: function(resp) {
    return resp.data;
  }
});


IONUX.Collections.InstrumentAgents = Backbone.Collection.extend({
  model: IONUX.Models.InstrumentAgent,
  url: "/instrument_agents/",

  parse: function(resp) {
    return resp.data;
  }
});


IONUX.Collections.DataProcessDefinitions = Backbone.Collection.extend({
  model: IONUX.Models.DataProcessDefinition,
  url: "/data_process_definitions/",

  parse: function(resp) {
    return resp.data;
  }
});

IONUX.Collections.FrameOfReferences = Backbone.Collection.extend({
  model: IONUX.Models.FrameOfReference,
  url: "/frame_of_references/",

  parse: function(resp) {
    return resp.data;
  }
});

IONUX.Collections.ObservatoryDataProductCollection = Backbone.Collection.extend({
  model: IONUX.Models.ObservatoryDataProduct,
  url: function() {
    return '/observatories/' + this.observatory_id
  }

});

IONUX.Collections.ResourceTypes = Backbone.Collection.extend({
  model: IONUX.Models.ResourceType,
  url: "/resource_types",
  
  parse: function(resp) {
    return _.map(resp.data, function(resource_type) {return {"name": resource_type}});
  }
});


IONUX.Collections.UserRequestCollection = Backbone.Collection.extend({
  model: IONUX.Models.UserRequest,

  url: function() {
    console.log(this);
    return "/observatories/" + this.observatory_id + "/user_requests/";
  },
  
  parse: function(resp) {
    return resp.data;
  }
});
