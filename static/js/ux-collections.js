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
