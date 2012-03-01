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


IONUX.Collections.ObservatoryDataProductCollection = Backbone.Collection.extend({

  model: IONUX.Models.ObservatoryDataProduct,
  url: function() {
    return '/observatories/' + this.observatory_id
  }

  // parse: function(resp) {
  //   return resp['data'];
  // }

});
