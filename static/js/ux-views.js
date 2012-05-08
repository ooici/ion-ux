IONUX.Views.Layout = Backbone.View.extend({
  tagName: 'div',

  initialize: function(){
    $('body').empty();
    layout = window.layout.toJSON();
    
    view = layout.views['69c62a12e_2250001'];
    this.spitfire(view);
  },
  render: function(item) {
    $('body').append(item);
  },
  spitfire: function(view) {    
    var self = this;
    _.each(view, function(val, key) {
      if (typeof val == 'object') { 
        self.spitfire(val)
      } else {
          // Spit it out on screen real quick-like...
          var obj = layout.objects[val]
          console.log(obj.type_ + ': ',  obj);
          var html = '<h4>' + val + '</h4><p>' + obj['type_'] + '</p>';
          self.render(html);
        
          // Build a list of attributes for the block view;
          var uiAttributes = {};
          if (obj.type_ == 'UIBlock') { 
              _.each(val, function() {
                  
              });
          };
      };
    });
  }
});



IONUX.Views.CreateNewView = Backbone.View.extend({
  events: {
    "click input[type='submit']":"create_new",
    "click .cancel":"cancel"
  },
  
  create_new: function(evt){
    evt.preventDefault();
    alert('create_new!');
    this.$el.find("input[type='submit']").attr("disabled", true).val("Saving...");
    // var mf = new IONUX.Models.Observatory();
    
    var self = this;
    $.each(this.$el.find("input,textarea,select").not("input[type='submit'],input[type='cancel']"), function(i, e){
      var key = $(e).attr("name"), val = $(e).val();
      var kv = {};
      kv[key] = val;
      self.model.set(kv);
    });
    
    self.model.save(null, {success:function(model, resp) {
      // self.$el.hide();
    }});
  },
  
  cancel: function(){
    this.$el.hide();
  }

});


IONUX.Views.NewObservatoryView = Backbone.View.extend({
  el: "#observatory-new-container",
  template: _.template($("#new-observatory-tmpl").html()),
  events: {
    "click input[type='submit']":"save",
    "click .cancel":"cancel"
  },

  render: function(){
    this.$el.empty().html(this.template(this.model.toJSON())).show();
    this.get_all_users();
    return this;
  },
  
  get_all_users: function() {
    $.ajax({
      url: '/observatories/all_users/',
      dataType: 'json',
      success: function(resp) {
        _.each(resp.data, function(e, i) {
          $('#user_id').append($('<option>').text(e.user_info.contact.name).val(e._id));
        });
      }
    });
  },
  
  // This needs to move into it's own utility method early in R2 Construction.
  save: function(evt){
    evt.preventDefault();
    this.$el.find("input[type='submit']").attr("disabled", true).val("Saving...");
    
    var self = this;
    $.each(this.$el.find("input,textarea,select").not("input[type='submit'],input[type='cancel']"), function(i, e){
      var key = $(e).attr("name"), val = $(e).val();
      var kv = {};
      kv[key] = val;
      self.model.set(kv);
    });
    
    self.model.save(null, {success:function(model, resp) {
      var router = new Backbone.Router();
      router.navigate('/observatories/' + resp.data.resource_id.toString() + '/', {trigger: true});
    }});
  },
  
  cancel: function(evt) {
    evt.preventDefault();
    var router = new Backbone.Router();
    router.navigate('/observatories/', {trigger: true})
  },
});

// IONUX.Views.NewObservatoryView = IONUX.Views.CreateNewView.extend({
//   el: "#observatory-new-container",
//   template: _.template($("#new-observatory-tmpl").html()),
// 
//   // initialize: function(){
//   //   _.bindAll(this, "create_new", "render");
//   //   this.model.bind("change", this.render)
//   // },
// 
//   render: function(){
//     this.$el.empty().html(this.template(this.model.toJSON())).show();
//     this.get_all_users();
//     return this;
//   },
//   
//   get_all_users: function() {
//     $.ajax({
//       url: '/observatories/all_users/',
//       dataType: 'json',
//       success: function(resp) {
//         _.each(resp.data, function(e, i) {
//           $('#user_id').append($('<option>').text(e.user_info.contact.name).val(e._id));
//         });
//       }
//     });
//   },
//   
//   goto_facepage: function() {
//     var router = new Backbone.Router();
//     var destination = document.location.pathname.replace("edit/", "");
//     router.navigate(destination, {trigger:true});
//   }
// });


IONUX.Views.DataProducts = Backbone.View.extend({
  el: "#data-products-container",
  template: _.template($("#data-products-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "render");
    this.collection.bind("reset", this.render);
  },
  render: function(){
    this.$el.html(this.template({"collection":this.collection.toJSON()})).show();
    $('.datatable-ize').dataTable();
    return this;
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
   this.$el.html(this.template(this.model.toJSON())).show();
   $('#name').focus();
   return this; 
  }
});


IONUX.Views.UserRequestItemView = Backbone.View.extend({

  tagName: "tr",

  template: _.template($("#user-request-item-tmpl").html()),

  render: function(){
    var org_manager = _.any(IONUX.ROLES, function(role){return role === "ORG_MANAGER"});
    var org_member = _.any(IONUX.ROLES, function(role){return role === "ORG_MEMBER"});
    var tmpl_vars = _.extend(this.model.toJSON(), {'org_manager':org_manager, 'org_member':org_member});
    this.$el.attr('id', tmpl_vars._id).html(this.template(tmpl_vars));
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
    this.button_events();
    return this;
  },

  button_events:function(){
    $("#user-requests-container a").on("click", function(evt){
        evt.preventDefault();
        var target = $(evt.target);
        var request_id = $(evt.target).closest('tr').attr('id');
        var action = "user_requests/" + request_id + '/' + target.attr("href");
        var button_txt = target.text();
        target.text("Saving...");
        $.ajax({
          url :action,
          dataType: 'json',
          success: function(resp) {
            target.text(button_txt);
          },
          error: function(resp) {
            target.text(button_txt);
          }
        });
        return false;
    });
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
    $('.datatable-ize').dataTable();
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
    $('.datatable-ize').dataTable();
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

IONUX.Views.UsersView = Backbone.View.extend({
  el:"#users-container",
  template: _.template($("#users-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "render");
    this.collection.bind("reset", this.render);
  },
  
  render: function(){
    this.$el.html(this.template({"collection":this.collection.toJSON()}));
    $('.datatable-ize').dataTable();
    return this;
  },
});


IONUX.Views.PlatformModelsView = Backbone.View.extend({
  el:"#platform-models-container",
  template: _.template($("#platform-models-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "render");
    this.collection.bind("reset", this.render);
  },
  
  render: function(){
    this.$el.html(this.template({"collection":this.collection.toJSON()}));
    $('.datatable-ize').dataTable();
    return this;
  },
});

// Not using this any longer, but left for reference.
// 
// IONUX.Views.ObservatoryModalView = Backbone.View.extend({
//   el: "#observatory-modal",
// 
//   template: _.template($("#observatory-modal-tmpl").html()),
// 
//   events: {
//     "click .modal-body":"clicked",
//     "click .btn-save":"save",
//     "click .btn-close":"close"
//   },
// 
//   initialize: function(){
//     _.bindAll(this, "render", "clicked", "save", "close");
//   },
//   
//   render: function(){
//     this.$el.html(this.template({}));
//     return this;
//   },
// 
//   clicked: function(){
//     console.log("ObservatoryModalView clicked");
//   },
// 
//   save: function(){
//     console.log("ObservatoryModalView save");
//     this.$el.modal("hide");
//   },
// 
//   close: function(){
//     console.log("ObservatoryModalView close");
//     this.$el.modal("hide");
//   }
// });


IONUX.Views.ObservatoryEditView = Backbone.View.extend({
  el: "#observatory-edit-container",

  template: _.template($("#observatory-edit-tmpl").html()),

  events: {
    "click .save":"save",
    "click .cancel":"cancel"
  },

  initialize: function(){
    _.bindAll(this, "render", "save");
    this.model.bind("change", this.render);
  },
  
  render: function(){
    this.$el.html(this.template(this.model.toJSON()));
    this.$el.show();
    return this;
  },

  save: function(evt){
    evt.preventDefault();
    this.$el.find("input[type='submit']").attr("disabled", true).val("Saving...");
    // var mf = new IONUX.Models.Observatory();
    
    var self = this;
    $.each(this.$el.find("input,textarea").not("input[type='submit'],input[type='cancel']"), function(i, e){
      var key = $(e).attr("name"), val = $(e).val();
      if (key.indexOf("__") != -1){
        var attrslist = key.split("__");
        var attr0 = attrslist[0], attr1 = attrslist[1];
        self.model.attributes[attr0][attr1] = val; //XXX not the best practice of setting Backbone model attrs - see: http://stackoverflow.com/questions/6351271/backbone-js-get-and-set-nested-object-attribute
      } else {
        var kv = {};
        kv[key] = val;
        self.model.set(kv);
      }
    });
    
    self.model.save(null, {success:function(model, resp){
      self.goto_facepage();
    }});
  },

  cancel: function(){
     this.goto_facepage();
  },

  goto_facepage: function(){
    var router = new Backbone.Router();
    var destination = document.location.pathname.replace("edit/", "");
    router.navigate(destination, {trigger:true});
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
    this.$el.html(this.template(this.model.toJSON())).show();
    $('.datatable-ize').dataTable();
    return this;
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
    
    // Check if instrument agent instance is present (running)...
    var instrumentAgent = this.model.get('instrument_agent');
    if (instrumentAgent.agent_process_id !== '') {
        console.log(instrumentAgent.agent_process_id);
        $("#start-instrument-agent-instance").hide();
        $("#stop-instrument-agent-instance").show();
        $(".instrument-commands").show();    
    };
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


IONUX.Views.InstrumentModels = Backbone.View.extend({
  el:"#instrument-models-container",

  template: _.template($("#instrument-models-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "render");
    this.collection.bind("reset", this.render);
  },
  
  render: function(){
    this.$el.html(this.template({"collection": this.collection.toJSON()}));
    return this;
  }
});


IONUX.Views.InstrumentAgents = Backbone.View.extend({
  el:"#instrument-agents-container",

  template: _.template($("#instrument-agents-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "render");
    this.collection.bind("reset", this.render);
  },
  
  render: function(){
    this.$el.html(this.template({"collection": this.collection.toJSON()}));
    return this;
  }
});


IONUX.Views.DataProcessDefinitions = Backbone.View.extend({
  el:"#data-process-definitions-container",

  template: _.template($("#data-process-definitions-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "render");
    this.collection.bind("reset", this.render);
  },
  
  render: function(){
    this.$el.html(this.template({"collection": this.collection.toJSON()}));
    return this;
  }
});

IONUX.Views.FrameOfReferences = Backbone.View.extend({
  el:"#frame-of-references-container",

  template: _.template($("#frame-of-references-tmpl").html()),

  initialize: function(){
    _.bindAll(this, "render");
    this.collection.bind("reset", this.render);
  },
  
  render: function(){
    this.$el.html(this.template({"collection": this.collection.toJSON()}));
    return this;
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
    drawChart(data_product_id);
    drawChartReplay(data_product_id);
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
    $('.datatable-ize').dataTable();
    return this;
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
        _.each(resp.models, function(e, i) {
          select_elem.append($('<option>').text(e.get('name')));
        })
      }
    })
  }
});

