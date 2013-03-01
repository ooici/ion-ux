IONUX.Models.ResourceParams = Backbone.Model.extend({
  initialize: function(options){
    console.log('ResourceParams', this.toJSON(), this.attributes);
  },
  
  schema: function() {
    
  }
  
});


IONUX.Views.InstrumentCommandFacepage = Backbone.View.extend({
  el: "#dynamic-container",
  template: _.template($("#instrument-command-facepage-tmpl").html()),
  
  events: {
    'click #start-instrument-agent-instance': 'start_agent',
    'click #stop-instrument-agent-instance': 'stop_agent',
    'click .issue_command': 'issue_command',
    'click .get_capabilities': 'get_capabilities',
    'click .execute-command': 'execute_command'
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
        $('.instrument-commands').hide();
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
        var data = resp.data;
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
          self.render_parameters(resp.data.resource_params);
          new IONUX.Models.ResourceParams(resp.data.resource_params);
        }
      });
  },
  
  render_commands: function(options) {
    var cmd_tmpl = '<tr class="execute_command">\
                    <td style="width:90%;"><%= name %></td>\
                    <td style="text-align:right">\
                    <button class="btn-blue execute-command" data-cap-type="<%= cap_type %>" data-command="<%= name %>">Execute</button>\
                    </td></tr>'
    _.each(options, function(option) {
      $('#cmds tbody').append(_.template(cmd_tmpl, option));
    });
  },
  
  render_parameters: function(options){
    var param_tmpl = '<label><%= label %></label>\
                      <input type="text" value="<%= value %>" />'
    var params = _.pairs(options);
    _.each(params, function(param) {
      // console.log(param[0], param[1]);
      $('#resource-params tbody').append(_.template(param_tmpl, {label: param[0], value: param[1]}));
    });

    // _.each(options, function(v, k){
    //   // console.log(k, v);
    //   
    //   // $('#instrument-params').append(_.template(param_tmpl, {label: option['name']}));
    // });
  },
  
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
