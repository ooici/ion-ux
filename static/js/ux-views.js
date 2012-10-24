IONUX.Views.Checkbox = Backbone.View.extend({
    template: _.template($('#checkbox-tmpl').html()),
    render: function(){

        var label = this.$el.data('label');
        if (!label) {
            label = "Checkbox"
        }; 
        
        var data_path = this.$el.data('path');
        var data = get_descendant_properties(this.options.data_model, data_path);
        var checked = data === true ? 'checked' : '';
        
        if (data_path) {
            this.$el.html(this.template({label: label, checked: checked}));

        // For integration effort only
        } else {
            var integration_info = this.$el.text();
            this.$el.html(this.template({label: label, integration_info: integration_info}));
            integration_log(this.$el.attr('id'), this.$el.data('path'), integration_info);
        };
        return this;
    }
});


IONUX.Views.ExtentGeospatial = Backbone.View.extend({
    template: _.template($('#extent-geospatial-tmpl').html()),
    render: function(){
        
        var label = this.$el.data('label');
        if (!label) {
            label = "Geospatial Bounds"
        };
        
        var data_path = this.$el.data('path');
        if (data_path && data_path.substring(0,7) != 'unknown') {
            this.$el.html(this.template({label: label}));
        
        // For integration effort only
        } else {
            var integration_info = this.$el.text();
            this.$el.html(this.template({label: label, integration_info: integration_info}));
            console.log('ID: ' + this.$el.attr('id') + ' -- DB-PATH: ' + this.$el.data('path') + ' -- ' + integration_info);
        };
        
        return this;
    }
});

IONUX.Views.ExtentVertical = Backbone.View.extend({
    template: _.template($('#extent-vertical-tmpl').html()),
    render: function(){

        var label = this.$el.data('label');
        if (!label) {
            label = "Vertical Bounds"
        }; 
        var data_path = this.$el.data('path');
        if (data_path && data_path.substring(0,7) != 'unknown') {
            this.$el.html(this.template({label: label, upper_bound: '', lower_bound: ''}));
        
        // For integration effort only
        } else {
            var integration_info = this.$el.text();
            this.$el.html(this.template({label: label, upper_bound: '', lower_bound: '', integration_info: integration_info}));
            console.log('ID: ' + this.$el.attr('id') + ' -- DB-PATH: ' + this.$el.data('path') + ' -- ' + integration_info);
        };
        return this;
    }
});

IONUX.Views.ExtentTemporal = Backbone.View.extend({
    template: _.template($('#extent-temporal-tmpl').html()),
    render: function(){

        var label = this.$el.data('label');
        if (!label) {
            label = "Temporal Bounds"
        }; 
        var data_path = this.$el.data('path');
        if (data_path && data_path.substring(0,7) != 'unknown') {
            var temporal_from, temporal_to;
            this.$el.html(this.template({label: label, temporal_from: temporal_from, temporal_to: temporal_from}));
        
        // For integration effort only
        } else {
            var integration_info = this.$el.text();
            this.$el.html(this.template({label: label, temporal_from: '', temporal_to: '', integration_info: integration_info}));
            console.log('ID: ' + this.$el.attr('id') + ' -- DB-PATH: ' + this.$el.data('path') + ' -- ' + integration_info);
        };
        return this;
    }
});

IONUX.Views.AttributeGroup = Backbone.View.extend({
    template: _.template($('#attribute-group-tmpl').html()),
    render: function(){
        this.$el.html(this.template({label: this.$el.data('label')}));

        var data = this.options.data;
        var metadata = this._get_attribute_group_metadata();
        
        if (data && metadata) {
            this._build_attribute_group(metadata, data);
        } else {
            this.$el.append("Attribute Group missing.");
            if (metadata) this.$el.append('<br />Metadata found: ATTRIBUTE_GROUP_' + this.$el.attr('id'));
            this.$el.css('color', 'orange');
        };

        return this;
    },
    
    _build_attribute_group: function(metadata, data){
        var self = this;
        _.each(this.options.data, function(data_item) {
            _.each(metadata, function(meta_item) {

                // create subelement
                switch(meta_item[0]){
                    case "text_short_ooi":
                        var subelement_view = new IONUX.Views.TextShort({data_model: data_item});
                }
                
                subelement_view.$el.attr('id', meta_item[5]);
                subelement_view.$el.attr('data-position', meta_item[3]);
                subelement_view.$el.attr('data-level', meta_item[4]);
                subelement_view.$el.attr('data-label', meta_item[1]);

                var path = meta_item[2];
                if (path == 'phone_number' || path == 'phone_type') path = 'phones.0.' + path;
                subelement_view.$el.attr('data-path', path);
                
                self.$el.append(subelement_view.render().el);
            });
        });
    },

    _get_attribute_group_metadata: function(){
        var attribute_group_metadata_id = "ATTRIBUTE_GROUP_"+this.$el.attr("id");
        var attribute_metadata = window[attribute_group_metadata_id];
        return attribute_metadata;
    },
    
    
});

IONUX.Views.TextShort = Backbone.View.extend({
    template: _.template($('#text-short-tmpl').html()),

    render: function(){
        var data_path = this.$el.data('path');
        
        if (data_path){
            var label = this.$el.data('label');
            var text_short = get_descendant_properties(this.options.data_model, data_path);
            this.$el.html(this.template({label: label, text_short: text_short}));
        } else {
            this.$el.css('color', 'orange');
            var integration_info = this.$el.text();
            integration_log(this.$el.attr('id'), this.$el.data('path'), integration_info);
        };
        return this;
    }
});

IONUX.Views.TextStatic = Backbone.View.extend({
    template: _.template($('#text-static-tmpl').html()),
    render: function(){
        var label = this.$el.data('label');
        if (label) {
            this.$el.html(this.template({text_static: label}));
        };
        return this;
    }
});

IONUX.Views.TextExtended = IONUX.Views.TextShort.extend();

IONUX.Views.Icon = Backbone.View.extend({
    template: _.template($('#icon-tmpl').html()),
    render: function(){
        this.$el.html(this.template);
        return this;
    }
});

IONUX.Views.Image = Backbone.View.extend({
    template: _.template($('#image-tmpl').html()),
    render: function(){
        this.$el.html(this.template);
        return this;
    }
});

IONUX.Views.Badge = Backbone.View.extend({
    template: _.template($('#badge-tmpl').html()),
    render: function(){
        var data_path = this.$el.data('path');
        if (data_path && data_path.substring(0,7) != 'unknown') {
            var badge = get_descendant_properties(this.options.data_model, data_path);
            this.$el.html(this.template({badge: badge}));
        } else {
            var integration_info = this.$el.text();
            integration_log(this.$el.attr('id'), this.$el.data('path'), integration_info);
            this.$el.css('color', 'orange');
        };
        return this;
    }
});

IONUX.Views.List = Backbone.View.extend({
    template: _.template($('#list-tmpl').html()),
    render: function(){
        var label = this.$el.data('label');
        
        var data_path = this.$el.data('path');
        if (data_path && data_path.substring(0,7) != 'unknown') {
            var list_items = get_descendant_properties(this.options.data_model, data_path);
            this.$el.html(this.template({list_items: list_items, label: label}));
        } else {
            var integration_info = this.$el.text();
            integration_log(this.$el.attr('id'), this.$el.data('path'), integration_info);
            this.$el.html(this.template({list_items: [], label: label, integration_info: integration_info}));
        };
        return this;
    }
});

function integration_log(id, db_path, integration_info ) {
    console.log('ID: ' + id + ' --DB-PATH: ' + db_path + ' --INTEGRATION-INFO: ' + integration_info);
};


IONUX.Views.Collection = Backbone.View.extend({
    // el:'#dynamic-container',
    template: _.template($("#collection").html()),
    initialize: function() {
        _.bindAll(this, 'render');
        this.collection.on('reset', this.render);
        this.resource_type = this.options.resource_type;
        // console.log(this.resource_type);
    },
    render: function(){
        this.$el.html(this.template({collection: this.collection.toJSON(), resource_type: this.resource_type})).show();
        return this;
    },
});



// UI Representation Base View
IONUX.Views.Base = Backbone.View.extend({
    events: {
        // "hover": IONUX.Interactions.action_controls
    },
    initialize: function() {
        this.render().el;
    },
    render: function() {
        if (this.className) {this.$el.addClass(this.className)};
        this.$el.append(this.template({'block': this.options.block, 'data': this.options.data}));
        return this;
    }
});



IONUX.Views.InstrumentCommandFacepage = Backbone.View.extend({
  el: "#dynamic-container",
  template: _.template($("#instrument-command-facepage-tmpl").html()),
  
  events: {
    'click #start-instrument-agent-instance': 'start_agent',
    'click #stop-instrument-agent-instance': 'stop_agent',
    'click .issue_command': 'issue_command',
    'click .get_capabilities': 'get_capabilities'
  },

  initialize: function(){
    _.bindAll(this, "render", "start_agent" ); // "stop_agent""issue_command"
    this.model.bind("change", this.render);
  },

  render: function(){
    this.$el.empty().html(this.template(this.model.toJSON())).show();
    
    // Check if instrument agent instance is present (running)...
    // var instrumentAgent = this.model.get('instrument_agent');
    // if (instrumentAgent.agent_process_id !== '') {
    //     console.log(instrumentAgent);
    //     $("#start-instrument-agent-instance").hide();
    //     $("#stop-instrument-agent-instance").show();
    //     $(".instrument-commands").show();    
    // };
    return this;
  },
  
  issue_command: function(evt){
    var selected_option = this.$el.find('option:selected');
      
    var command = selected_option.attr("value");
    var cap_type = selected_option.data('cap-type');
    if (cap_type) command += '?cap_type=' + cap_type;
    
    console.log('cap_type', cap_type)
    console.log('command', command);
    
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
    var self = this;
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
  
  get_capabilities: function(evt) {
      var self = this;
      $.ajax({
        url: 'get_capabilities?cap_type=abc123',
        dataType: 'json',
        success: function(resp){
            var agent_options = [];
            var resource_options = [];
            
            _.each(resp.data, function(option) {
                if (option.name != 'example'){
                    if (option.cap_type == 1) agent_options.push(option);
                    if (option.cap_type == 3) resource_options.push(option);
                };
            });
            
            var select_elmt = $('#new-commands');
            select_elmt.empty();
            
            var option_elmts = agent_options.concat(resource_options);
            var option_tmpl = '<option data-cap-type="<%= cap_type %>" value="<%= name %>"><%= name %></option>'
            _.each(option_elmts, function(option){
                select_elmt.append(_.template(option_tmpl, option));
            });
        },
        error: function(resp) {
            console.log('Error: ', resp);
        }
      });
      
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


// IONUX.Views.Interactions = IONUX.Views.Base.extend({
//     initialize: function(){
//         
//     },
//     render: function(attribute){
//         console.log('interactions#render');
//     },
// })
// 


// IONUX.Views.CreateNewView = Backbone.View.extend({
//     events: {
//         "click input[type='submit']":"create_new",
//         "click .cancel":"cancel"
//     },
//     create_new: function(evt){
//         evt.preventDefault();
//         this.$el.find("input[type='submit']").attr("disabled", true).val("Saving...");
//         var self = this;
//         $.each(this.$el.find("input,textarea,select").not("input[type='submit'],input[type='cancel']"), function(i, e){
//             var key = $(e).attr("name"), val = $(e).val();
//             var kv = {};
//             kv[key] = val;
//             self.model.set(kv);
//         });
//         self.model.save(null, {success:function(model, resp) {
//             // handle success
//         }});
//     },
//     cancel: function(){
//         this.$el.hide();
//     }
// });


// IONUX.Views.DataProducts = Backbone.View.extend({
//   el: "#dynamic-container",
//   template: _.template($("#data-products-tmpl").html()),
// 
//   initialize: function(){
//     _.bindAll(this, "render");
//     this.collection.bind("reset", this.render);
//   },
//   render: function(){
//     this.$el.html(this.template({"collection":this.collection.toJSON()})).show();
//     $('.datatable-ize').dataTable();
//     return this;
//   }
// });
// 
// IONUX.Views.DataProductFacepage = Backbone.View.extend({
//   el: "#dynamic-container",
//   template: _.template($("#data-product-facepage-tmpl").html()),
//   initialize: function(){
//     _.bindAll(this, "render");
//     this.model.bind("change", this.render);
//   },
//   render: function(){
//     this.$el.empty().html(this.template(this.model.toJSON())).show();
//     var data_product_id = this.model.get('_id');
//     drawChart(data_product_id);
//     drawChartReplay(data_product_id);
//   }
// });
// 
// 
// IONUX.Views.ObservatoriesView = Backbone.View.extend({
//   el: "#dynamic-container",
//   template: _.template($("#observatories-tmpl").html()),
//   events: {},
//   initialize: function(){
//     _.bindAll(this, "render");
//     this.collection.bind("reset", this.render);
//   },
//   render: function(){
//     this.$el.html(this.template({"collection":this.collection.toJSON()})).show();
//     $('.datatable-ize').dataTable();
//     return this;
//   }
// });
// 
// IONUX.Views.ObservatoryFacepage = Backbone.View.extend({
//   el: "#dynamic-container",
//   template: _.template($("#observatory-facepage-tmpl").html()),
//   events: {
//     'click .enroll': 'enroll_user',
//   },
//   initialize: function(){
//     _.bindAll(this, "render");
//     this.model.bind("change", this.render);
//     this.model.on("change:org_id", this.render);
//   },
//   enroll_user: function() {
//     $.ajax({
//       url: 'request_enrollment/',
//       success: function(){
//         alert("Your enrollment request was sent.");
//       },
//     })
//   },
//   render: function(){
//     var visibility = _.any(IONUX.ROLES, function(role){return role === "ORG_MANAGER"})?"invisible":"";
//     var tmpl_vars = _.extend(this.model.toJSON(), {"visibility":visibility});
//     this.$el.html(this.template(tmpl_vars)).show();
//   }
// });
// 
// IONUX.Views.PlatformsView = Backbone.View.extend({
//   el: "#dynamic-container",
//   template: _.template($("#platforms-tmpl").html()),
//   events: {},
//   initialize: function(){
//     _.bindAll(this, "render");
//     this.collection.bind("reset", this.render);
//   },
//   render: function(){
//     this.$el.html(this.template({"collection":this.collection.toJSON()})).show();
//     $('.datatable-ize').dataTable();
//     return this;
//   }
// });
// 
// IONUX.Views.PlatformFacepage = Backbone.View.extend({
//   el: "#dynamic-container",
//   template: _.template($("#platform-facepage-tmpl").html()),
//   initialize: function(){
//       _.bindAll(this, "render");
//       this.model.bind("change", this.render);
//   },
//   render: function(){
//       this.$el.html(this.template(this.model.toJSON())).show();
//   }
// });

// LEFT FOR REFERENCE
// IONUX.Views.UserRegistration = IONUX.Views.CreateNewView.extend({
//   el: "#user-registration-container",
//   // template: _.template($("#user-registration-tmpl").html()),
//   initialize: function() {
//     _.bindAll(this, "render");
//     this.model.bind("change", this.render);
//   },
//   create_new: function(evt){
//     evt.preventDefault();
//     this.$el.find("input[type='submit']").attr("disabled", true).val("Saving...");
//     
//     var self = this;
//     var contact = {}
//     $.each(this.$el.find("input,textarea").not("input[type='submit'],input[type='cancel']"), function(i, e){
//       var key = $(e).attr("name"), val = $(e).val();
//       contact[key] = val;
//     });
//     self.model.set("contact", contact);
//     
//     self.model.save(null, {success:function(model, resp){
//       self.$el.hide();
//       var router = new Backbone.Router();
//       router.navigate("");
//     }});
//   },
//   render: function() {
//    this.$el.html(this.template(this.model.toJSON())).show();
//    $('#name').focus();
//    return this; 
//   }
// });


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
  el: "#user-requests-container", //XXX issue with being child of another 'el'
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

// IONUX.Views.InstrumentsView = Backbone.View.extend({
//   el: "#dynamic-container",
//   template: _.template($("#instruments-tmpl").html()),
//   events: {},
//   initialize: function(){
//     _.bindAll(this, "render");
//     this.collection.bind("reset", this.render);
//   },
//   render: function(){
//     this.$el.html(this.template({"collection":this.collection.toJSON()})).show();
//     $('.datatable-ize').dataTable();
//     return this;
//   }
// });


// IONUX.Views.UsersView = Backbone.View.extend({
//   el:"#dynamic-container",
//   template: _.template($("#users-tmpl").html()),
//   initialize: function(){
//     _.bindAll(this, "render");
//     this.collection.bind("reset", this.render);
//   },
//   render: function(){
//     this.$el.html(this.template({"collection":this.collection.toJSON()})).show();
//     $('.datatable-ize').dataTable();
//     return this;
//   },
// });


// IONUX.Views.PlatformModelsView = Backbone.View.extend({
//   el: "#dynamic-container",
//   template: _.template($("#platform-models-tmpl").html()),
// 
//   initialize: function(){
//     _.bindAll(this, "render");
//     this.collection.bind("reset", this.render);
//   },
//   
//   render: function(){
//     this.$el.html(this.template({"collection":this.collection.toJSON()})).show();
//     $('.datatable-ize').dataTable();
//     return this;
//   },
// });
// 
// 
// IONUX.Views.PlatformModelFacepage = Backbone.View.extend({
//   el: "#dynamic-container",
//   template: _.template($("#platform-model-facepage-tmpl").html()),
//   initialize: function(){
//     _.bindAll(this, "render");
//     this.model.bind("change", this.render);
//   },
//   render: function(){
//     this.$el.html(this.template(this.model.toJSON())).show();
//     $('.datatable-ize').dataTable();
//     return this;
//   }
// });
// 
// IONUX.Views.InstrumentFacepage = Backbone.View.extend({
//   el: "#dynamic-container",
//   template: _.template($("#instrument-facepage-tmpl").html()),
//   events: {
//     'click #deployment-checkbox': 'handle_deployment'
//   },
//   initialize: function(){
//     _.bindAll(this, "render");
//     this.model.bind("change", this.render);
//   },
//   render: function(){
//     this.$el.html(this.template(this.model.toJSON())).show();
//   },
//   handle_deployment: function(e) {
//     e.preventDefault();
//     confirm('You are changing primary deployment; are you sure?');
//     var _id = $(e.target).parents('tr').attr('id'); // Grab the logical platform id from the tr id
//     $.ajax({
//       url: 'primary_deployment_on/' + _id + '/',
//       success: function() {
//         // set checkbox
//       },
//     })
//   }
// });



// IONUX.Views.InstrumentModels = Backbone.View.extend({
//   el:"#dynamic-container",
//   template: _.template($("#instrument-models-tmpl").html()),
//   initialize: function(){
//     _.bindAll(this, "render");
//     this.collection.bind("reset", this.render);
//   },
//   render: function(){
//     this.$el.html(this.template({"collection": this.collection.toJSON()})).show();
//     return this;
//   }
// });
// 
// IONUX.Views.InstrumentModelFacepage = Backbone.View.extend({
//   el: "#dynamic-container",
//   template: _.template($("#instrument-model-facepage-tmpl").html()),
//   initialize: function(){
//     _.bindAll(this, "render");
//     this.model.bind("change", this.render);
//   },
//   render: function(){
//     this.$el.html(this.template(this.model.toJSON())).show();
//   }
// });
// 
// 
// IONUX.Views.InstrumentAgents = Backbone.View.extend({
//   el:"#dynamic-container",
//   template: _.template($("#instrument-agents-tmpl").html()),
//   initialize: function(){
//     _.bindAll(this, "render");
//     this.collection.bind("reset", this.render);
//   },
//   render: function(){
//     this.$el.html(this.template({"collection": this.collection.toJSON()})).show();
//     return this;
//   }
// });
// 
// IONUX.Views.InstrumentAgentFacepage = Backbone.View.extend({
//   el: "#dynamic-container",
//   template: _.template($("#instrument-agent-facepage-tmpl").html()),
//   initialize: function(){
//     _.bindAll(this, "render");
//     this.model.bind("change", this.render);
//   },
//   render: function(){
//     this.$el.html(this.template(this.model.toJSON())).show();
//   }
// });
// 
// 
// IONUX.Views.DataProcessDefinitions = Backbone.View.extend({
//   el:"#dynamic-container",
//   template: _.template($("#data-process-definitions-tmpl").html()),
//   initialize: function(){
//     _.bindAll(this, "render");
//     this.collection.bind("reset", this.render);
//   },
//   render: function(){
//     this.$el.html(this.template({"collection": this.collection.toJSON()})).show();
//     return this;
//   }
// });
// 
// IONUX.Views.DataProcessDefinitionFacepage = Backbone.View.extend({
//   el: "#dynamic-container",
//   template: _.template($("#data-process-definition-facepage-tmpl").html()),
//   initialize: function(){
//     _.bindAll(this, "render");
//     this.model.bind("change", this.render);
//   },
//   render: function(){
//     this.$el.empty().html(this.template(this.model.toJSON())).show();
//   }
// });
// 
// IONUX.Views.UserFacepage = Backbone.View.extend({
//   el: "#dynamic-container",
//   template: _.template($("#user-facepage-tmpl").html()),
//   initialize: function(){
//     _.bindAll(this, "render");
//     this.model.bind("change", this.render);
//   },
//   render: function(){
//     this.$el.empty().html(this.template(this.model.toJSON())).show();
//     $('.datatable-ize').dataTable();
//     return this;
//   }
// });
// 
// IONUX.Views.Search = Backbone.View.extend({
//   el: "#search",
//   initialize: function() {},
//   render: function() {
//     var collection = new IONUX.Collections.ResourceTypes();
//     var select_elem = $("#search-select");
//     
//     collection.fetch({
//       success: function(resp) {
//         _.each(resp.models, function(e, i) {
//           select_elem.append($('<option>').text(e.get('name')));
//         })
//       }
//     })
//   }
// });
