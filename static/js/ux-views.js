IONUX.Views.CreateNewView = Backbone.View.extend({
  events: {
    "click input[type='submit']":"create_new",
    "submit input[type='submit']":"create_new",
    "click .cancel":"cancel"
  },
  
  create_new: function(evt){
    evt.preventDefault();
    this.$el.find("input[type='submit']").attr("disabled", true).val("Saving...");
    // var mf = new IONUX.Models.Observatory();
    
    // var newModel = this.model; //lkajsdflskdf
    var self = this;
    $.each(this.$el.find("input,textarea").not("input[type='submit'],input[type='cancel']"), function(i, e){
      var key = $(e).attr("name"), val = $(e).val();
      var kv = {};
      kv[key] = val;
      self.model.set(kv);
    });
    
    self.model.save(null, {success:function(model, resp){
      self.$el.hide();
    }});
  },
  
  cancel: function(){
    this.$el.hide();
  }
});

// 
// IONUX.Views.DataResourceView = Backbone.View.extend({
// 
//   el: "#data-resources",
// 
//   initialize: function(){
//     _.bindAll(this, "render");
//     this.collection.bind("reset", this.render);
//   },
//   
//   render: function(){
//     this.$el.empty().show();
//     _.each(this.collection.models, function(dataresource) {
//         this.$el.append(new IONUX.Views.DataResourceItemView({model:dataresource}).render().el);
//     }, this);
//     return this;
//   },
// 
// })
// 
// 
// IONUX.Views.DataResourceItemView = Backbone.View.extend({
// 
//   tagName:"ul",
// 
//   template: _.template($("#data-resource-item-tmpl").html()),
// 
//   render: function(){
//     this.$el.html(this.template(this.model.toJSON()));
//     return this;
//   }
// 
// });


// IONUX.Views.DataResourceDetailView = Backbone.View.extend({
// 
//   el: "#data-resource-detail",
// 
//   template: _.template($("#data-resource-detail-tmpl").html()),
// 
//   initialize: function(){
//     _.bindAll(this, "render");
//     this.model.bind("change", this.render);
//   },
// 
//   render: function(){
//     this.$el.html(this.template(this.model.toJSON())).show();
//     return this;
//   }
// 
// });


/* Observatories */

IONUX.Views.ObservatoriesView = Backbone.View.extend({

  el: "#observatories-container",

  template: _.template($("#observatories-tmpl").html()),

  events: {
    "click .create_new":"show_create_new_form"
    //"click table tr":"show_facepage"
  },

  initialize: function(){
    _.bindAll(this, "render", "show_create_new_form");
    this.collection.bind("reset", this.render);
  },
  
  render: function(){
    this.$el.html(this.template({"collection":this.collection.toJSON()})).show();
    return this;
  },

  //show_facepage: function(){ console.log("show_facepage"); },

  show_create_new_form: function(){
    if (_.isUndefined(this.observatories_create_new_view)){
      this.observatories_create_new_view = new IONUX.Views.ObservatoryCreateNewView({model: new IONUX.Models.Observatory()}); 
    }
    this.observatories_create_new_view.render();
  }
});


IONUX.Views.UserRegistration = IONUX.Views.CreateNewView.extend({
  el: "#user-registration-container",
  template: _.template($("#user-registration-tmpl").html()),
  
  initialize: function() {
    _.bindAll(this, "render");
    this.model.bind("change", this.render);
  },
  
  create_new: function(evt){
    evt.preventDefault();
    this.$el.find("input[type='submit']").attr("disabled", true).val("Saving...");
    
    var self = this;
    var contact = {}
    $.each(this.$el.find("input,textarea").not("input[type='submit'],input[type='cancel']"), function(i, e){
      var key = $(e).attr("name"), val = $(e).val();
      contact[key] = val;
    });
    self.model.set("contact", contact);
    
    self.model.save(null, {success:function(model, resp){
      self.$el.hide();
      var router = new Backbone.Router();
      router.navigate("");
    }});
  },
  
  render: function() {
   console.log(this.model.toJSON());
   this.$el.html(this.template(this.model.toJSON())).show();
   $('#name').focus();
   return this; 
  }
});


IONUX.Views.ObservatoriesItemView = Backbone.View.extend({

  tagName: "ul",

  template: _.template($("#observatories-item-tmpl").html()),

  render: function(){
    this.$el.html(this.template(this.model.toJSON()));
    return this;
  }

});

IONUX.Views.ObservatoriesDetailView = Backbone.View.extend({

  el: "#observatories-detail",

  template: _.template($("#observatories-detail-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "render");
    this.model.bind("change", this.render);
  },

  render: function(){
    this.$el.html(this.template(this.model.toJSON())).show();
    return this;
  }

});

IONUX.Views.ObservatoryCreateNewView = IONUX.Views.CreateNewView.extend({

  el: "#observatories-new",

  template: _.template($("#new-observatory-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "create_new");
  },

  render: function(){
    this.$el.empty().html(this.template({})).show();
  },
});

/* Instruments */

IONUX.Views.InstrumentsView = Backbone.View.extend({
  el:"#instruments-container",
  template: _.template($("#instruments-tmpl").html()),

  events: {
    "click .create_new":"show_create_new_form"
    //"click table tr":"show_facepage"
  },

  initialize: function(){
    _.bindAll(this, "render");
    this.collection.bind("reset", this.render);
  },
  
  render: function(){
    this.$el.html(this.template({"collection":this.collection.toJSON()}));
    return this;
  },
  
  show_create_new_form: function(){
    if (_.isUndefined(this.platforms_create_new_view)){
      this.platforms_create_new_view = new IONUX.Views.InstrumentCreateNewView({model: new IONUX.Models.Instrument()}); 
    }
    this.platforms_create_new_view.render();
  }
});



IONUX.Views.InstrumentCreateNewView = IONUX.Views.CreateNewView.extend({

  el: "#instrument-new",

  template: _.template($("#new-instrument-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "create_new");
  },

  render: function(){
    this.$el.empty().html(this.template({})).show();
  },
});




/* Platforms */

IONUX.Views.PlatformsView = Backbone.View.extend({
  el:"#platforms-container",

  template: _.template($("#platforms-tmpl").html()),

  events: {
    "click .create_new":"show_create_new_form"
  },

  initialize: function(){
    _.bindAll(this, "render");
    this.collection.bind("reset", this.render);
  },
  
  render: function(){
    this.$el.html(this.template({"collection":this.collection.toJSON()}));
    return this;
  },
  
  show_create_new_form: function(){
    if (_.isUndefined(this.platforms_new_view)){
      // var new_model = new IONUX.Models.Platform();
      // console.log("show or create.", new_model);
      this.platforms_new_view = new IONUX.Views.PlatformCreateNewView({model: new IONUX.Models.Platform()}); 
    }
    this.platforms_new_view.render();
  }
});


IONUX.Views.PlatformCreateNewView = IONUX.Views.CreateNewView.extend({

  el: "#platform-new",

  template: _.template($("#new-platform-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "create_new");
  },

  render: function(){
    this.$el.empty().html(this.template({})).show();
  },

  // cancel: function(){
  //   this.$el.hide();
  // }
});


IONUX.Views.ObservatoryModalView = Backbone.View.extend({
  el: "#observatory-modal",

  template: _.template($("#observatory-modal-tmpl").html()),

  events: {
    "click .modal-body":"clicked",
    "click .btn-save":"save",
    "click .btn-close":"close"
  },

  initialize: function(){
    _.bindAll(this, "render", "clicked", "save", "close");
  },
  
  render: function(){
    this.$el.html(this.template({}));
    return this;
  },

  clicked: function(){
    console.log("ObservatoryModalView clicked");
  },

  save: function(){
    console.log("ObservatoryModalView save");
    this.$el.modal("hide");
  },

  close: function(){
    console.log("ObservatoryModalView close");
    this.$el.modal("hide");
  }
});

IONUX.Views.ObservatoryFacepage = Backbone.View.extend({

  el: "#observatory-facepage-container",

  template: _.template($("#observatory-facepage-tmpl").html()),

  //events: { },

  initialize: function(){
    _.bindAll(this, "render");
    this.model.bind("change", this.render);
  },

  render: function(){
    this.$el.html(this.template(this.model.toJSON())).show();
  }

});


IONUX.Views.PlatformFacepage = Backbone.View.extend({

  el: "#platform-facepage-container",

  template: _.template($("#platform-facepage-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "render");
    this.model.bind("change", this.render);
  },

  render: function(){
    this.$el.html(this.template(this.model.toJSON())).show();
  }

});

IONUX.Views.PlatformModelFacepage = Backbone.View.extend({

  el: "#platform-model-facepage-container",

  template: _.template($("#platform-model-facepage-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "render");
    this.model.bind("change", this.render);
  },

  render: function(){
    console.log('PlatformModelFacepage');
    this.$el.html(this.template(this.model.toJSON())).show();
  }
});


IONUX.Views.InstrumentFacepage = Backbone.View.extend({

  el: "#instrument-facepage-container",

  template: _.template($("#instrument-facepage-tmpl").html()),

  //events: { },

  initialize: function(){
    _.bindAll(this, "render");
    this.model.bind("change", this.render);
  },

  render: function(){
    this.$el.html(this.template(this.model.toJSON())).show();
  }
});


IONUX.Views.InstrumentCommandFacepage = Backbone.View.extend({
  el: "#instrument-command-facepage-container",
  template: _.template($("#instrument-command-facepage-tmpl").html()),
  
  events: {
    'click #start-instrument-agent-instance': 'start_agent',
    'click a#stop-instrument-agent-instace': 'stop_agent',
    'click input[type=submit]': 'issue_command'
  },

  initialize: function(){
    _.bindAll(this, "render", "start_agent", "stop_agent");
  },

  render: function(){
    this.$el.empty().html(this.template({})).show();
  },
  
  issue_command: function() {
    
  },
  
  start_agent: function(evt) {
    $(evt.target).closest('div').removeClass('open');
    $.ajax({
              url: 'start_agent/',
              success: function() {
                $('.instrument-commands').show();
              },
              
              error: function() {
                
              }
    });
    // render the command panel with form for submit...
    // replace #start-instrument-agent-instance with #stop-instrument-agent-instance...
    
    return false;
  },
  
  stop_agent: function(evt) {
    evt.preventDefault();
    console.log("stop instrument agent instance");
    $(this).text("Start Instrument Agent Instance");
    $(this).attr('id', 'start-instrument-agent-instance');
    
    // hide the command panel
    // replace #stop-instrument-agent-instance
  }
});

IONUX.Views.InstrumentModelFacepage = Backbone.View.extend({
  el: "#instrument-model-facepage-container",

  template: _.template($("#instrument-model-facepage-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "render");
    this.model.bind("change", this.render);
  },

  render: function(){
    this.$el.html(this.template(this.model.toJSON())).show();
  }
});

IONUX.Views.InstrumentAgentFacepage = Backbone.View.extend({

  el: "#instrument-agent-facepage-container",

  template: _.template($("#instrument-agent-facepage-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "render");
    this.model.bind("change", this.render);
  },

  render: function(){
    this.$el.html(this.template(this.model.toJSON())).show();
  }
});

IONUX.Views.DataProcessDefinitionFacepage = Backbone.View.extend({
  el: "#data-process-definition-facepage-container",
  template: _.template($("#data-process-definition-facepage-tmpl").html()),
  
  initialize: function(){
    _.bindAll(this, "render");
    this.model.bind("change", this.render);
  },
  
  render: function(){
    this.$el.empty().html(this.template(this.model.toJSON())).show();
  }
});

IONUX.Views.DataProductFacepage = Backbone.View.extend({
  el: "#data-product-facepage-container",
  template: _.template($("#data-product-facepage-tmpl").html()),
  
  initialize: function(){
    _.bindAll(this, "render");
    this.model.bind("change", this.render);
  },
  
  render: function(){
    this.$el.empty().html(this.template(this.model.toJSON())).show();
  }
});

IONUX.Views.FramesOfReferenceFacepage = Backbone.View.extend({
  el: "#frames-of-reference-facepage-container",

  template: _.template($("#frames-of-reference-facepage-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "render");
  },

  render: function(){
    this.$el.empty().html(this.template({})).show();
  }
});

IONUX.Views.UserRegistration = IONUX.Views.CreateNewView.extend({
  el: "#user-registration-container",
  template: _.template($("#user-registration-tmpl").html()),
  
  initialize: function() {
    _.bindAll(this, "render");
  },
  
  render: function() {
   this.$el.html(this.template()).show();
   $('#contact__name').focus();
   return this; 
  }
});

IONUX.Views.UserFacepage = Backbone.View.extend({
  el: "#user-facepage-container",

  template: _.template($("#user-facepage-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "render");
  },

  render: function(){
    this.$el.empty().html(this.template({})).show();
  }
});

IONUX.Views.Search = Backbone.View.extend({
  el: "#search",
  
  initialize: function() {
    
  },
  
  render: function() {
    var collection = new IONUX.Collections.ResourceTypes();
    var select_elem = $("#search-select");
    
    collection.fetch({
      success: function(resp) {
        console.log('success', resp);
        _.each(resp.models, function(e, i) {
          select_elem.append($('<option>').text(e.get('name')));
        })
      }
    })
  }
});

