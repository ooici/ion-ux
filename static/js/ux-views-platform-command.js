IONUX.Views.PlatformCommandFacepage = Backbone.View.extend({
  el: "#dynamic-container",
  template: _.template($("#platform-command-facepage-tmpl").html()),
  command_template: _.template($('#instrument-command-tmpl').html()),
  events: {
    'click #start': 'start_agent',
    'click #stop': 'stop_agent',
    // 'click .issue_command': 'issue_command',
    'click .get_capabilities': 'get_capabilities',
    'click .execute-command': 'execute_command',
  },

  initialize: function(){
    _.bindAll(this, "render", "start_agent", "get_platform_state" );
    this.model.bind("change", this.render);
    
    // console.log($('#start-instrument-agent-instance'));
  },

  render: function(){
    if (this.model.get('agent_instance') == null) {
      new IONUX.Views.NoConfiguredAgentInstance().render();
    }
    this.$el.prepend(this.template(this.model.toJSON())).show();
    this.get_platform_state();
    return this;
  },
  
  
  get_platform_state: function() {
    console.log('get_platform_state');

    var self = this;
    
    $('#platform_status').show();
    $('#start, #stop').hide();
    
    $.ajax({
      url: 'get_platform_agent_state/',
      global: false,
      dataType: 'json',
      success: function(resp) {
        console.log("get_platform_agent_state SUCCESS:", resp);
        
        $('#platform_status').show();
        
        if (resp.data == 'PLATFORM_AGENT_STATE_LAUNCHING') {
          console.log('get_platform_agent_state LAUNCHING');
          $('#platform_status').prop('value','Agent is launching...');
          self.set_platform_polling();
        } else { 
          console.log('get_platform_agent_state NOT LAUNCHING');
          $('#platform_status').prop('value','Getting platform agent status...');
          self.get_capabilities();
        };
      },
      error: function(resp) {
        console.log("get_platform_agent_state ERROR:", JSON.parse(resp.responseText));
        if (self.model.get('agent_instance') !== null) {
          $('#start').show()
        }
        $('#stop, #platform_status').hide();
      }
    });
  },
  
  set_platform_polling: function() {
    console.log('set_platform_polling');
    setTimeout(this.get_platform_state, 5000);
  },
  
  execute_command: function(evt){
    evt.preventDefault();
    var execute_elmt = $(evt.target);
    execute_elmt.text("Executing...")
    execute_elmt.prop('disabled', true);
    $('#cmds').find('button').prop('disabled', true);
    
    var cap_type = execute_elmt.data('cap-type');
    var command = execute_elmt.data('command');
    var url = command + '/?cap_type='+cap_type;
    if (command == 'RESOURCE_AGENT_EVENT_GO_DIRECT_ACCESS') {
      url += '&session_type='+this.$el.find('option:selected').val();
    };
    
    // Clear any form data to prevent submission.
    $('#resource-form2, #agent-form').empty();
    
    var self = this;
    $.ajax({
      type: 'POST',
      url: url,
      dataType: 'json',
      success: function(resp){
        var result_tmpl = '<p class="command-success">OK: '+command+' was successful.'
        if (resp.data.result !== null) result_tmpl += '<br/>'+JSON.stringify(resp.data.result);
        $(".command-output").append(result_tmpl);
        self.get_capabilities();
      },
      complete: function(){
        execute_elmt.text('Execute');
        $('#cmds').find('button').prop('disabled', false);
      },
    });
    return false;
  },
  
  start_agent: function(evt) {
    var start_btn = $(evt.target);
    start_btn.prop('disabled', true);
    start_btn.prop('value', 'Starting Agent...');
    var self = this;

    $.ajax({
        url: 'start/'+self.model.get('agent_instance')['_id']+'/',
        success: function() {
          // Result appended
          $(".command-output").append('<p class="command-success">OK: PLATFORM AGENT STARTED.</p>');
          
          start_btn.prop('disabled', false);
          start_btn.prop('value', 'Start Agent');
          start_btn.hide();
          
          // $('#platform_status, .get_capabilities').show();
          // $('#stop, .instrument-commands, .get_capabilities').show();
          
          self.get_platform_state();
        },
        error: function() {
        }
    });    
    return false;
  },
  
  get_capabilities: function(evt) {
      // Change the button to indicate activity while fetching caps if we got here via a click.
      if (evt) {
          var but = $(evt.target);
          but.prop('disabled', true);
          but.html('Getting Caps...');
      }
      $('#cmds tbody, #agent-params tbody, #resource-params tbody').empty();
      var self = this;
      $.ajax({
        url: 'get_capabilities?cap_type=abc123',
        dataType: 'json',
        global: false,
        success: function(resp){
          console.log('get_capabilities', resp);
          // Return the button to normal.
          var but = $('.get_capabilities');
          but.prop('disabled', false);
          but.html('Get Capabilities');
          $('#stop, .get_capabilities').show();
          $('#start, #platform_status').hide();
          self.render_commands(resp.data.commands);

          /*
           * Take the agent_params in the JSON response
           * and build a new AgentParams view just like in the instrument command
           */
          if (!_.isEmpty(resp.data.agent_params)) {
            new IONUX.Views.AgentParams({
              model: new IONUX.Models.AgentParams(resp.data.agent_params, {schema: resp.data.agent_schema})
            }).render().el;
          }
          
          /*
           * So far I can't get the resource_params
           */
          if (!_.isEmpty(resp.data.resource_params)) {
            var disabled = !_.findWhere(resp.data.original, {name: 'set_resource'}) ? true : false;
            new IONUX.Views.ResourceParams2({
              model: new IONUX.Models.ResourceParams2(resp.data.resource_params, {schema: resp.data.resource_schema}),
              disabled: disabled
            }).render().el;
          }

        }, /* success */
        error: function(resp) {
          console.log('Error: ', resp);
          // Return the button to normal.
          var but = $('.get_capabilities');
          but.prop('disabled', false);
          but.html('Get Capabilities');
          $('#start').show();
          $('#stop').hide();
        }
      });
      
  },
  
  render_commands: function(options) {
    var cmd_tmpl = '<tr class="execute_command">\
                    <td style="width:90%;"><%= name %></td>\
                    <td style="text-align:right">\
                    <button class="btn-blue execute-command" data-cap-type="<%= cap_type %>" data-command="<%= name %>">Execute</button>\
                    </td></tr>'
    var self = this;
    _.each(options, function(option){
      $('#cmds tbody').append(self.command_template(option));
    });
  },
  
  stop_agent: function(evt) {
    var stop_btn = $(evt.target);
    stop_btn.prop('disabled', true);
    stop_btn.prop('value', 'Stopping Agent...');
    var self = this;
    $.ajax({
      url: 'stop/'+self.model.get('agent_instance')['_id']+'/',
      success: function() {
        // Result appended
        $(".command-output").append('<p class="command-success">OK: PLATFORM AGENT STOPPED.</p>');
        
        stop_btn.prop('disabled', false);
        stop_btn.prop('value', 'Stop Agent');
        stop_btn.hide();
        
        $('#start').show();
        $('#cmds tbody').empty();
        $('.instrument-commands, .get_capabilities').hide();
      },
      error: function() {
        alert("An error occured.");
      }
    });
    return false;
  }
});
