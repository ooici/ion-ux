// For use with collections of Resource Types, i.e. InstrumentDevice, PlatformDevice, etc.
IONUX.Models.Resource = Backbone.Model.extend({});


IONUX.Models.Layout = Backbone.Model.extend({
  url: '/layout',
  parse: function(resp){
    return resp.data;
  },
});


// Timestamp conversion methods to call when parsing response.
// Maybe put these into IONUX.Helpers namespace?

var epochToISO = function(epoch_time) {
    try {
        return new Date(parseInt(epoch_time)).toISOString();        
    } catch (err) {
        return epoch_time;
    };
};

var makeISOTimestamps = function(resp) {    
  _.each(resp, function(val, key) {      
      if (key == 'ts_created' || key == 'ts_updated') {
        resp[key] = epochToISO(val);
      };      
      if (typeof val == 'object') {
        makeISOTimestamps(val);
      };          
  });
  return;
};



IONUX.Models.DataResource = Backbone.Model.extend({});


IONUX.Models.DataResourceDetails = Backbone.Model.extend({
  url: function(){
    return "/dataresource/"+this.get("data_resource_id")+"/";
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
    makeISOTimestamps(resp);
    return resp.data;
  }
});


IONUX.Models.UserRequest = Backbone.Model.extend({});


IONUX.Models.Platform = Backbone.Model.extend({
  url: "/platforms/",
  idAttribute: "_id",
  
  parse: function(resp){
    makeISOTimestamps(resp);
    return resp;
  },
});


IONUX.Models.PlatformFacepageModel = Backbone.Model.extend({
  url: function(){
    return "/platforms/"+this.get("platform_id")+"/";
  },
  
  parse: function(resp) {
    makeISOTimestamps(resp);
    return resp.data;
  }
});


IONUX.Models.PlatformModel = Backbone.Model.extend({
  url: '/platform_models/',
  idAttribute: '_id',

  parse: function(resp) {
    makeISOTimestamps(resp);
    return resp;
  }
});


IONUX.Models.PlatformModelFacepageModel = Backbone.Model.extend({
  url: function() {
    return '/platform_models/'+this.get('platform_model_id')+'/';
  },
  
  parse: function(resp) {
    makeISOTimestamps(resp);
    return resp.data;
  } 
});


IONUX.Models.Instrument = Backbone.Model.extend({
  url: "/instruments/",
  idAttribute: "_id",
  
  parse: function(resp){
    makeISOTimestamps(resp);
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
    makeISOTimestamps(resp);
    return resp.data;
  }
});



IONUX.Models.InstrumentFacepageModel = Backbone.Model.extend({
  url: function(){
    return "/instruments/ext/"+this.get("instrument_id")+"/";
  },
  
  parse: function(resp) {
    makeISOTimestamps(resp);
    return resp.data;
  }
});


IONUX.Models.InstrumentModel = Backbone.Model.extend({
  url: '/instrument_models/',
  idAttribute: '_id',
  
  parse: function(resp){
    makeISOTimestamps(resp);
    return resp;
  }
});


IONUX.Models.InstrumentModelFacepageModel = Backbone.Model.extend({
  url: function() {
    return '/instrument_models/'+this.get('instrument_model_id')+'/';
  },
  
  parse: function(resp) {
    makeISOTimestamps(resp);
    return resp.data;
  } 
});


IONUX.Models.InstrumentAgent = Backbone.Model.extend({
  url: '/instrument_agents/',
  idAttribute: '_id',
  
  parse: function(resp){
    makeISOTimestamps(resp);
    return resp;
  },
});


IONUX.Models.InstrumentAgentFacepageModel = Backbone.Model.extend({
  url: function() {
    return '/instrument_agents/'+this.get('instrument_agent_id')+'/';
  },
  
  parse: function(resp) {
    makeISOTimestamps(resp);
    return resp.data;
  } 
});


IONUX.Models.DataProcessDefinition = Backbone.Model.extend({
  url: "/data_process_definitions/",
  idAttribute: "_id",
  
  parse: function(resp){
    makeISOTimestamps(resp);
    return resp;
  },
});


IONUX.Models.DataProcessDefinitionFacepageModel = Backbone.Model.extend({
  url: function(){
    return "/data_process_definitions/"+this.get("data_process_definition_id")+"/";
  },
  
  parse: function(resp) {
    makeISOTimestamps(resp);
    return resp.data;
  }
});


IONUX.Models.DataProduct = Backbone.Model.extend({
  url: "/data_products/",
  idAttribute: "_id",
  
  parse: function(resp) {
    makeISOTimestamps(resp);
    return resp;
  }
});


IONUX.Models.DataProductFacepageModel = Backbone.Model.extend({
  url: function(){
    return "/data_products/"+this.get("data_product_id")+"/";
  },
  
  parse: function(resp) {
    makeISOTimestamps(resp);
    return resp.data;
  }
});


IONUX.Models.FrameOfReference = Backbone.Model.extend({
  url: "/frame_of_references/",
  idAttribute: "_id",

  parse: function(resp){
    makeISOTimestamps(resp);
    return resp;
  },
});


IONUX.Models.FrameOfReferenceFacepage = Backbone.Model.extend({
  url: function() {
    return "/frame_of_references/"+this.get("frame_of_reference_id")+"/";
  },
  
  parse: function(resp) {
    makeISOTimestamps(resp);
    return resp.data;
  }
});


IONUX.Models.UserRegistrationModel = Backbone.Model.extend({
  url: "/userprofile/",
  idAttribute: "_id",
   
  parse: function(resp) {
    return resp.data;
  }
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
    makeISOTimestamps(resp);
    return resp.data;
  }
});

IONUX.Models.ResourceType = Backbone.Model.extend({})
