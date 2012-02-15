IONUX.Views.DataResourceView = Backbone.View.extend({

  el:$("#data-resources"),

  initialize: function(){
    _.bindAll(this, "render");
    this.collection.bind("reset", this.render);
  },
  
  render: function(){
    this.el.empty().show();
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

  el:$("#marine-facilities-container"),

  events: {
    "click .create_new":"show_create_new_form",
  },

  initialize: function(){
    _.bindAll(this, "render");
    this.collection.bind("reset", this.render);
  },
  
  render: function(){
    var list_elem = this.el.find(".data-list");
    list_elem.empty();
    _.each(this.collection.models, function(data) {
        $(list_elem).append(new IONUX.Views.MarineFacilitiesItemView({model:data}).render().el);
    }, this);
    return this;
  },

  show_create_new_form: function(){
    if (_.isUndefined(this.marine_facilities_create_new_view)){
      this.marine_facilities_create_new_view = new IONUX.Views.MarineFacilitiesCreateNewView(); 
    }
    this.marine_facilities_create_new_view.render();
  }
  
});


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

  el:$("#marine-facilities-new"),

  template: _.template($("#new-marine-facility-tmpl").html()),

  events: {
    "click input[type='submit']":"create_new",
    "submit input[type='submit']":"create_new",
    "click .cancel":"cancel"
  },

  initialize: function(){
    _.bindAll(this, "create_new");
  },

  render: function(){
    this.el.empty().html(this.template({})).show();
  },

  create_new: function(evt){
    evt.preventDefault();
    this.el.find("input[type='submit']").attr("disabled", true).val("Saving...");
    var mf = new IONUX.Models.MarineFacility();
    $.each(this.el.find("input,textarea").not("input[type='submit'],input[type='cancel']"), function(i, e){
      var key = $(e).attr("name"), val = $(e).val();
      var kv = {};
      kv[key] = val;
      mf.set(kv);
    });
    var self = this;
    mf.save(null, {success:function(model, resp){
      self.el.hide();
    }});
  },

  cancel: function(){
    this.el.hide();
  }

});



/* observatories */

IONUX.Views.ObservatoriesView = Backbone.View.extend({

  el:$("#observatories-container"),

  template: _.template($("#observatories-tmpl").html()),

  events: { },

  initialize: function(){
    _.bindAll(this, "render");
  },
  
  render: function(){
    $(this.el).html(this.template({}));
    return this;
  }
});




/* instrument */

IONUX.Views.InstrumentsView = Backbone.View.extend({

  el:$("#instruments-container"),

  template: _.template($("#instruments-tmpl").html()),

  events: { },

  initialize: function(){
    _.bindAll(this, "render");
  },
  
  render: function(){
    $(this.el).html(this.template({}));
    return this;
  }
});


