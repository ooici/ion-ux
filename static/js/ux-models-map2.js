IONUX2.Models.MapResource = Backbone.Model.extend({
  defaults: {
    geospatial_point_center: {
      lat: 39.8106460,
      lon: -98.5569760
    },
    constraint_list: null
  }
});

IONUX2.Collections.MapResources = Backbone.Collection.extend({
  initialize: function(models, options){
    this.resource_id = options.resource_id;
  },
  url: function() {
   return '/related_sites/'+this.resource_id+'/';
  },
  parse: function(resp) {
    var related_sites = [];
    _.each(resp.data, function(site){related_sites.push(site)});
    make_iso_timestamps(related_sites);
    return related_sites;
  }
});

IONUX2.Collections.MapDataProducts = Backbone.Collection.extend({
  initialize: function(models, options){
    this.resource_id = options.resource_id;
  },
  url: function() {
   return '/find_site_data_products/'+this.resource_id+'/';
  },
  parse: function(resp) {
    var data_products = [];
    if (!_.isEmpty(resp.data.data_product_resources)) {
      data_products = _.filter(resp.data.data_product_resources, function(v,k) {
        return !_.isEmpty(v.ooi_product_name); // Only display those with ooi_product_name
      });
      make_iso_timestamps(data_products);
    };
    return data_products;
  }
});

