IONUX.Models.DataResource = Backbone.Model.extend({

});

IONUX.Models.DataResourceDetails = Backbone.Model.extend({

  url: function(){
    return "/dataresource/"+this.get("data_resource_id");
  }

});


IONUX.Models.Observatory = Backbone.Model.extend({

  url: "/observatories",
  idAttribute: "_id"

});


