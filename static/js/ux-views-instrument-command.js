IONUX.Models.ResourceParams = Backbone.Model.extend({
  url: function() {
    return location.href + 'set_resource/'
  },  
  schema: function(){
    var sch = {};
    _.each(this.attributes, function(attr, key) {
      if (typeof attr === 'number') {
        sch[key] = 'Number';
      } else if (typeof attr == 'string') {
        sch[key] = 'String';
      } else if (attr instanceof Array) {
        sch[key] = { type: 'List', itemType: 'Number' }
      };
    });
    return sch;
  }
});


IONUX.Views.ResourceParams = Backbone.View.extend({
  el: '#resource-form',
  template: '<div><button class="btn-blue save-params">Save</button></div>',
  events: {
    'click .save-params': 'save_params',
  },
  initialize: function(){
    _.bindAll(this);
    this.resource_params_form = new Backbone.Form({model: this.model}).render();
  },
  render: function(){
    this.$el.html(this.template);
    this.$el.prepend(this.resource_params_form.el);
    return this;
  },
  save_params: function(){
    this.resource_params_form.commit();
    this.model.save();
  }
})



IONUX.Views.InstrumentCommandFacepage = Backbone.View.extend({
  el: "#dynamic-container",
  template: _.template($("#instrument-command-facepage-tmpl").html()),
  
  events: {
    'click #start-instrument-agent-instance': 'start_agent',
    'click #stop-instrument-agent-instance': 'stop_agent',
    'click .issue_command': 'issue_command',
    'click .get_capabilities': 'get_capabilities',
    'click .execute-command': 'execute_command',
  },
    
  initialize: function(){
    _.bindAll(this, "render", "start_agent" ); // "stop_agent""issue_command"
    this.model.bind("change", this.render);
  },

  render: function(){
    this.$el.prepend(this.template(this.model.toJSON())).show();
    var agent_process_id = this.model.get('agent_instance')['agent_process_id'];
    if (agent_process_id) {
        $("#start-instrument-agent-instance").hide();
        $("#stop-instrument-agent-instance, .instrument-commands").show();
        this.get_capabilities();
    };
  },
  
  start_agent: function(evt){
    var start_btn = $(evt.target);
    start_btn.prop('disabled', true);
    start_btn.prop('value', 'Starting Instrument Agent...');
    var self = this;
    $.ajax({
        url: 'start/',
        success: function() {
          $('.instrument-commands').show();
          start_btn.prop('disabled', false);
          start_btn.prop('value', 'Start Instrument Agent');
          start_btn.hide();
          $(' #stop-instrument-agent-instance').show();
          self.get_capabilities();
        }
    });    
    return false;
  },
  
  stop_agent: function(evt){
    var stop_btn = $(evt.target);
    stop_btn.prop('disabled', true);
    stop_btn.prop('value', 'Stopping Instrument Agent...')
    $.ajax({
      url: 'stop/',
      success: function() {
        stop_btn.hide();
        stop_btn.prop('disabled', false);
        stop_btn.prop('value', 'Stop Instrument Agent');
        $('#start-instrument-agent-instance').show();
        // $('.instrument-commands').hide();
        $('#resource-form').empty();
        $('#cmds tbody').empty();
      }
    });
    return false;
  },
  
  execute_command: function(evt){
    evt.preventDefault();
    var execute_elmt = $(evt.target);
    execute_elmt.text("Executing...")
    execute_elmt.prop('disable', true);
    var cap_type = execute_elmt.data('cap-type');
    var command = execute_elmt.data('command');
    var url = command + '?cap_type='+cap_type;
    var self = this;
    $.ajax({
      url: url,
      dataType: 'json',
      success: function(resp){
        var data = resp.data['commands'];
        $(".command-output").append($('<p class="command-success">').html("OK: '" + command + "' was successful. <br />"));
        self.get_capabilities();
      },
      complete: function(){
        execute_elmt.text('Execute');
      },
    });
    return false;
  },
  
  get_capabilities: function(evt) {
      $('#cmds tbody, #agent-params tbody, #resource-params tbody').empty();
      var self = this;
      $.ajax({
        url: 'get_capabilities?cap_type=abc123',
        dataType: 'json',
        success: function(resp){
          self.render_commands(resp.data.commands);
          new IONUX.Views.ResourceParams({
            model: new IONUX.Models.ResourceParams(resp.data.resource_params)
          }).render().el;
        }
      });
  },
  
  render_commands: function(options) {
    var cmd_tmpl = '<tr class="execute_command">\
                    <td style="width:90%;"><%= name %></td>\
                    <td style="text-align:right">\
                    <button class="btn-blue execute-command" data-cap-type="<%= cap_type %>" data-command="<%= name %>">Execute</button>\
                    </td></tr>'
    _.each(options, function(option){
      $('#cmds tbody').append(_.template(cmd_tmpl, option));
    });
  },
  
  render_parameters: function(params){
    // this.resource_params_model = new IONUX.Models.ResourceParams(params);
    // this.resource_params_form = new Backbone.Form({model: this.resource_params_model}).render();
    // $('#resource-form').append(this.resource_params_form.el);
    // $('#resource-form').append('<button class="btn-blue save-params">Save</button>');
    // 
    // // ---------------------------------------------------------------
    // // var param_tmpl = '<label><%= label %></label>\
    // //                   <input type="text" value="<%= value %>" />'
    // // _.each(_.pairs(params), function(param) {
    // //   $('#resource-params tbody').append(_.template(param_tmpl, {label: param[0], value: param[1]}));
    // // });
  },
  
  // save_params: function() {
  //   console.log('before', this.resource_params_model.toJSON());
  //   this.resource_params_form.commit();
  //   console.log('after: ', this.resource_params_model.toJSON());
  //   this.resource_params_model.save();
  // },
  
  render_select_menu: function(options) {
    var select_elmt = $('#new-commands').empty();
    var option_tmpl = '<option data-cap-type="<%= cap_type %>" value="<%= name %>"><%= name %></option>'
    _.each(options, function(option){
      select_elmt.append(_.template(option_tmpl, option));
    });
  },
  
  issue_command: function(evt){
    var button_elmt = $(evt.target);
    button_elmt.attr("disabled", "disabled");
    var select_elmt = this.$el.find('select');
    select_elmt.attr("disabled", "disabled");
    var selected_option = this.$el.find('option:selected');
    var command = selected_option.attr("value");
    var cap_type = selected_option.data('cap-type');
    if (cap_type) command += '?cap_type=' + cap_type;
    var self = this;

    $.ajax({
      url:command,
      dataType: 'json',
      success: function(resp) {
        var data = resp.data;
        $(".command-output").append($('<p class="command-success">').html("OK: '" + command + "' was successful. <br />" + JSON.stringify(data.result)));
      },
      complete: function(resp){
          button_elmt.removeAttr("disabled");
          select_elmt.removeAttr("disabled");
          self.get_capabilities();
      }
    });
    
    return false;
  },
});
