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
