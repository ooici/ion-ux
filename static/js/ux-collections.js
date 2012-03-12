IONUX.Collections.DataResources = Backbone.Collection.extend({

  model: IONUX.Models.DataResource,
  url: "/dataresource"

});


IONUX.Collections.ObservatoryCollection = Backbone.Collection.extend({

  model: IONUX.Models.Observatory,
  url: "/observatories",

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




IONUX.Collections.ObservatoryDataProductCollection = Backbone.Collection.extend({

  model: IONUX.Models.ObservatoryDataProduct,
  url: function() {
    return '/observatories/' + this.observatory_id
  }

  // parse: function(resp) {
  //   return resp['data'];
  // }

});

IONUX.Collections.ResourceTypes = Backbone.Collection.extend({

  model: IONUX.Models.ResourceType,
  url: "/resource_types",
  
  parse: function(resp) {

    return _.map(resp.data, function(resource_type) {return {"name": resource_type}});
  
  },
  
  
});
