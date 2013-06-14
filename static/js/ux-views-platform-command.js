IONUX.Views.PlatformCommandFacepage = Backbone.View.extend({
  el: "#dynamic-container",
  template: _.template($("#platform-command-facepage-tmpl").html()),
  command_template: _.template($('#instrument-command-tmpl').html()),
  events: {
    'click #start-instrument-agent-instance': 'start_agent',
    'click #stop-instrument-agent-instance': 'stop_agent',
    // 'click .issue_command': 'issue_command',
    'click .get_capabilities': 'get_capabilities',
    'click .execute-command': 'execute_command',
  },

  initialize: function(){
    _.bindAll(this, "render", "start_agent" );
    this.model.bind("change", this.render);
    
    // console.log($('#start-instrument-agent-instance'));
  },

  render: function(){
    this.$el.prepend(this.template(this.model.toJSON())).show();
    var agent_process_id = this.model.get('agent_instance')['agent_process_id'];
    if (agent_process_id) {
        $("#start-instrument-agent-instance").hide();
        $("#stop-instrument-agent-instance, .instrument-commands").show();
        this.get_capabilities();
    };
    
    $('#start-instrument-agent-instance').attr('value', 'Start Platform Agent');
    $('#stop-instrument-agent-instance').attr('value', 'Stop Platform Agent');
    return this;
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
    var self = this;
    $.ajax({
        url: 'start/'+self.model.get('agent_instance')['_id']+'/',
        success: function() {
          $('.instrument-commands').show();
          $('#start-instrument-agent-instance').hide();
          $(' #stop-instrument-agent-instance').show();
          self.get_capabilities();
        },
        error: function() {
        }
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
          console.log('get_capabilities', resp);
            self.render_commands(resp.data.commands);
        },
        error: function(resp) {
            console.log('Error: ', resp);
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
    var self = this;
    $.ajax({
      url: 'stop/'+self.model.get('agent_instance')['_id']+'/',
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
