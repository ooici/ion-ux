IONUX.Views.TaskableResourceParams = IONUX.Views.ResourceParams.extend({
  events: {
    'click .save-params': 'save_params',
  },
  render: function(){
    this.$el.html(this.template);
    this.$el.prepend(this.resource_params_form.el);
    this.$el.find('input').prop('readonly', true);
    return this;
  },
  save_params: function(e){
    alert('Save is currently disabled.');
  }
});

IONUX.Views.TaskableResourceCommandFacepage = Backbone.View.extend({
  el: "#dynamic-container",
  template: _.template($("#taskable-command-facepage-tmpl").html()),
  command_template: _.template($('#instrument-command-tmpl').html()),
  events: {
    // 'click #start-instrument-agent-instance': 'start_agent',
    // 'click #stop-instrument-agent-instance': 'stop_agent',
    'click .get_capabilities': 'get_capabilities',
    'click .execute-command': 'execute_command',
  },
    
  initialize: function(){
    _.bindAll(this);
    this.model.bind("change", this.render);
  },

  render: function(){
    $('#dynamic-container .v02').prepend('')
    this.$el.prepend(this.template(this.model.toJSON())).show();
    this.get_capabilities();
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
  
  get_capabilities: function(evt) {
      $('#cmds tbody, #agent-params tbody, #resource-params tbody').empty();
      var self = this;
      $.ajax({
        url: 'get_capabilities?cap_type=abc123',
        dataType: 'json',
        success: function(resp){
          self.render_commands(resp.data.commands);
          new IONUX.Views.TaskableResourceParams({model: new IONUX.Models.ResourceParams(resp.data.resource_params)}).render().el;
          // Catch 'GatewayError' caused by unsupported/invalid state.
          // if (!_.isEmpty(resp.data.resource_params) && !_.has(resp.data.resource_params, 'GatewayError')){
          //   new IONUX.Views.ResourceParams({model: new IONUX.Models.ResourceParams(resp.data.resource_params)}).render().el;
          // } else {
          //   $('#resource-form').empty();
          // };
        }
      });
  },
  
  render_commands: function(options) {
    var self = this;
    _.each(options, function(option){
      $('#cmds tbody').append(self.command_template(option));
    });
  },
});
