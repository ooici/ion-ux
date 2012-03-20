IONUX.Views.DataProducts = Backbone.View.extend({
  el: "#data-products-container",
  template: _.template($("#data-products-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "render");
    this.collection.bind("reset", this.render);
  },
  render: function(){
    this.$el.html(this.template({"collection":this.collection.toJSON()})).show();
    return this;
  }
});



IONUX.Views.CreateNewView = Backbone.View.extend({
  events: {
    "click input[type='submit']":"create_new",
    "submit input[type='submit']":"create_new",
    "click .create": "create_new",
    "click .cancel":"cancel"
  },
  
  create_new: function(evt){
    evt.preventDefault();
    this.$el.find("input[type='submit']").attr("disabled", true).val("Saving...");
    // var mf = new IONUX.Models.Observatory();
    
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
    $('.datatable-ize').dataTable();
    return this;
  },
  
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




IONUX.Views.UserRequestItemView = Backbone.View.extend({

  tagName: "tr",

  template: _.template("<td><%= name %></td><td><%= description %></td><td><%= status %></td><td><%= user_id %></td><td><%= ts_updated %></td><td><button>Approve</button></td><td><button>Deny</button></td>"),

  render: function(){
    this.$el.html(this.template(this.model.toJSON()));
    return this;
  }

});



IONUX.Views.UserRequestsView = Backbone.View.extend({

  el:"#user-requests-container", //XXX issue with being child of another 'el'


  //events: { },

  initialize: function(){
    _.bindAll(this, "render");
    this.collection.on("reset", this.render);
  },
  
  render: function(){
    var table_elem = $("#user-requests-container").find("table");
    var self = this;
    _.each(this.collection.models, function(user_request) {
        table_elem.append(new IONUX.Views.UserRequestItemView({model:user_request}).render().el);
    }, this);
    $("#user-requests-container").find(".loading").hide();
    table_elem.show()
    return this;
  },
  
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


IONUX.Views.NewObservatoryView = IONUX.Views.CreateNewView.extend({
  el: "#observatory-new-container",
  template: _.template($("#new-observatory-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "create_new", "render");
    this.model.bind("change", this.render)
  },

  render: function(){
    this.$el.empty().html(this.template(this.model.toJSON())).show();    
    return this;
  },
});


IONUX.Views.NewPlatformView = IONUX.Views.CreateNewView.extend({
  el: "#platform-new-container",
  template: _.template($("#new-platform-tmpl").html()),
  events: function() {
    // extend parent events to avoid overwriting them.
    return _.extend({}, IONUX.Views.CreateNewView.prototype.events, {
      'change #marine_facility_id' : 'get_related_logical_platforms'
    });
  },

  initialize: function(){
    console.log(this.events());
  },

  render: function(){
    this.$el.empty().html(this.template(this.model.toJSON())).show();    
    this.get_marine_facilities();
    this.get_platform_models();
    return this;
  },
  
  get_marine_facilities: function() {
    $.ajax({
      url: '/find_tree/MarineFacility/MarineFacility/',
      dataType: 'json',
      success: function(resp) {
        _.each(resp.data, function(e, i) {
          $('#marine_facility_id').append($('<option>').text(e[0].name).val(e[0].id).addClass('mf'));
        });
      }
    });
  },
  
  get_related_logical_platforms: function(evt) {
    var marine_facility_id = $("option:selected", evt.target).val();
    $.ajax({
      url: '/find_tree/' + marine_facility_id + '/LogicalPlatform/',
      dataType: 'json',
      success: function(resp) {
        $('#logical_platform_id').empty().show();
      
        _.each(resp.data, function(e, i) {
            if (e.length > 1) {
                $('#logical_platform_id').append($('<option>').text(e[1].name + '/' + e[2].name).val(e[2].id));
            } else {
              $('#logical_platform_id').append($('<option>').text('Not found.'));
            }
        });
      }
    });
  },
  
  get_platform_models: function() {
    $.ajax({
      url: '/find_platform_models/',
      dataType: 'json',
      success: function(resp) {
        _.each(resp.data, function(e, i) {
          $('#platform_model_id').append($('<option>').text(e.name).val(e._id));
        });
      }
    });
  }
});


IONUX.Views.NewInstrumentView = IONUX.Views.CreateNewView.extend({
  el: "#instrument-new-container",

  template: _.template($("#new-instrument-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "create_new", "render");
    this.model.bind("change", this.render)
  },

  render: function(){
    this.$el.empty().html(this.template(this.model.toJSON())).show();
    return this;
  },
});


// IONUX.Views.NewInstrumentModelView = IONUX.Views.CreateNewView.extend({
//   el: "#instrument-model-new-container",
// 
//   template: _.template($("#new-instrument-model-tmpl").html()),
// 
//   initialize: function(){
//     _.bindAll(this, "create_new", "render");
//     this.model.bind("change", this.render)
//   },
// 
//   render: function(){
//     this.$el.empty().html(this.template(this.model.toJSON())).show();
//     return this;
//   },
// });
// 
// 



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

  events: {
    'click .enroll': 'enroll_user',
  },

  initialize: function(){
    _.bindAll(this, "render");
    this.model.bind("change", this.render);
    this.model.on("change:org_id", this.render);
  },

  enroll_user: function() {
    $.ajax({
      url: 'request_enrollment/',
      success: function(){
        alert("Your enrollment request was sent.");
      },
    })
  },

  render: function(){
    var visibility = _.any(IONUX.ROLES, function(role){return role === "ORG_MANAGER"})?"invisible":"";
    var tmpl_vars = _.extend(this.model.toJSON(), {"visibility":visibility});
    this.$el.html(this.template(tmpl_vars)).show();
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

IONUX.Views.NewPlatformModel = IONUX.Views.CreateNewView.extend({
  el: "#platform-model-new-container",

  template: _.template($("#platform-model-new-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "create_new", "render");
    this.model.bind("change", this.render)
  },

  render: function(){
    this.$el.empty().html(this.template(this.model.toJSON())).show();
    return this;
  },
});


IONUX.Views.InstrumentFacepage = Backbone.View.extend({

  el: "#instrument-facepage-container",

  template: _.template($("#instrument-facepage-tmpl").html()),

  events: {
    'click #deployment-checkbox': 'handle_deployment'
  },

  initialize: function(){
    _.bindAll(this, "render");
    this.model.bind("change", this.render);
  },

  render: function(){
    this.$el.html(this.template(this.model.toJSON())).show();
  },
  
  handle_deployment: function(e) {
    e.preventDefault();
    confirm('You are changing primary deployment; are you sure?');

    // Grab the logical platform id from the tr id
    var _id = $(e.target).parents('tr').attr('id');
    
    $.ajax({
      url: 'primary_deployment_on/' + _id + '/',
      success: function() {
        // set checkbox to check
      },
    })
  }
});


IONUX.Views.InstrumentCommandFacepage = Backbone.View.extend({
  el: "#instrument-command-facepage-container",
  template: _.template($("#instrument-command-facepage-tmpl").html()),
  
  events: {
    'click #start-instrument-agent-instance': 'start_agent',
    'click #stop-instrument-agent-instance': 'stop_agent',
    'click .issue_command': 'issue_command'
  },

  initialize: function(){
    _.bindAll(this, "render", "start_agent" ); // "stop_agent""issue_command"
    this.model.bind("change", this.render);
  },

  render: function(){
    this.$el.empty().html(this.template(this.model.toJSON())).show();
  },
  
  issue_command: function(evt) {
    var command = this.$el.find("option:selected").attr("value");
    $.ajax({
      url:command,
      dataType: 'json',
      success: function(resp) {
        var data = resp.data;
        $(".command-output").append($('<p class="command-success">').html("OK: '" + command + "' was successful. <br />" + JSON.stringify(data.result)));
      },
      error: function() {
        $(".command-output").append($('<p class="command-failure">').text("ALERT: '" + command + "' was unsuccessful."));
      }
    });
    return false;
  },
  
  start_agent: function(evt) {
    $.ajax({
        url: 'start/',
        success: function() {
          $('.instrument-commands').show();
          $('#start-instrument-agent-instance').hide();
          $('#stop-instrument-agent-instance').show();
        },
        error: function() {
        }
    });    
    return false;
  },
  
  stop_agent: function(evt) {
    $.ajax({
      url: 'stop/',
      success: function() {
        $('#stop-instrument-agent-instance').hide();
        $('#start-instrument-agent-instance').show();
        $('.instrument-commands').hide();
      },
      error: function() {
        alert("An error occured.");
      }
    });
    return false;
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


IONUX.Views.NewInstrumentModel = IONUX.Views.CreateNewView.extend({
  el: "#instrument-model-new-container",

  template: _.template($("#instrument-model-new-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "create_new", "render");
    this.model.bind("change", this.render)
  },

  render: function(){
    this.$el.empty().html(this.template(this.model.toJSON())).show();
    return this;
  },
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
    var data_product_id = this.model.get('_id');
    drawChart(data_product_id)
  }
});

IONUX.Views.FramesOfReferenceFacepage = Backbone.View.extend({
  el: "#frame-of-reference-facepage-container",

  template: _.template($("#frame-of-reference-facepage-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "render");
    this.model.bind("change", this.render);
  },

  render: function(){
    this.$el.empty().html(this.template(this.model.toJSON())).show();
  }
});

IONUX.Views.NewFrameOfReferenceView = IONUX.Views.CreateNewView.extend({
  el: "#frame-of-reference-new-container",

  template: _.template($("#frame-of-reference-new-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "create_new", "render");
    this.model.bind("change", this.render)
  },

  render: function(){
    this.$el.empty().html(this.template(this.model.toJSON())).show();
    return this;
  },
});


IONUX.Views.UserFacepage = Backbone.View.extend({
  el: "#user-facepage-container",

  template: _.template($("#user-facepage-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "render");
    this.model.bind("change", this.render);
  },

  render: function(){
    this.$el.empty().html(this.template(this.model.toJSON())).show();
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

