IONUX.Views.DataResourceView = Backbone.View.extend({

  el:$("#data-resources"),

  initialize: function(){
    _.bindAll(this, "render");
    this.collection.bind("reset", this.render);
  },
  
  render: function(){
    this.el.show();
    _.each(this.collection.models, function(dataresource) {
        $(this.el).append(new IONUX.Views.DataResourceItemView({model:dataresource}).render().el);
    }, this);
    return this;
  },

})


IONUX.Views.DataResourceItemView = Backbone.View.extend({

  tagName:"ul",

  template: _.template($("#data-resource-item-tmpl").html()),

  render: function(){
    $(this.el).html(this.template(this.model.toJSON()));
    return this;
  }

});


IONUX.Views.DataResourceDetailView = Backbone.View.extend({

  el: $("#data-resource-detail"),

  template: _.template($("#data-resource-detail-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "render");
    this.model.bind("change", this.render);
  },

  render: function(){
    this.el.html(this.template(this.model.toJSON())).show();
    return this;
  }

});


/* marine facilities */

IONUX.Views.MarineFacilitiesView = Backbone.View.extend({

  el:$("#marine-facilities"),

  initialize: function(){
    _.bindAll(this, "render");
    this.collection.bind("reset", this.render);
  },
  
  render: function(){
    this.el.show();
    _.each(this.collection.models, function(data) {
        $(this.el).append(new IONUX.Views.MarineFacilitiesItemView({model:data}).render().el);
    }, this);
    return this;
  },

})


IONUX.Views.MarineFacilitiesItemView = Backbone.View.extend({

  tagName:"ul",

  template: _.template($("#marine-facilities-item-tmpl").html()),

  render: function(){
    $(this.el).html(this.template(this.model.toJSON()));
    return this;
  }

});


IONUX.Views.MarineFacilitiesDetailView = Backbone.View.extend({

  el: $("#marine-facilities-detail"),

  template: _.template($("#marine-facilities-detail-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "render");
    this.model.bind("change", this.render);
  },

  render: function(){
    this.el.html(this.template(this.model.toJSON())).show();
    return this;
  }

});



IONUX.Views.MarineFacilitiesCreateNewView = Backbone.View.extend({

  el:$("#marine-facilities-create-modal"),

  template: _.template($("#new-marine-facility-tmpl").html()),

  events: {
    "click input[type='submit']":"create_new",
    "submit input[type='submit']":"create_new"
  },

  initialize: function(){
    _.bindAll(this, "show", "create_new");
    this.el.bind("show", this.show);
  },

  show: function(){
    this.el.html(this.template({}));
  },

  create_new: function(evt){
    evt.preventDefault();
    this.el.find("input[type='submit']").attr("disabled", true).val("Saving...");
    var mf = new IONUX.Models.MarineFacility();
    $.each(this.el.find("input,textarea").not("input[type='submit']"), function(i, e){
      var key = $(e).attr("name"), val = $(e).val();
      var kv = new Object(); //for using strings for both key and val in Object.
      kv[key] = val;
      mf.set(kv);
    });
    var self = this;
    mf.save(null, {success:function(model, resp){
      self.el.modal("hide");
    }});
  }

});


