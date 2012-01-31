IONUX.Collections.DataResources = Backbone.Collection.extend({

  model: IONUX.Models.DataResource,
  url: "/dataresource"

});


IONUX.Collections.MarineFacilities = Backbone.Collection.extend({

  model: IONUX.Models.MarineFacility,
  url: "/marine_facilities",

  parse: function(resp) {
    return resp.data;
  }

});
