IONUX.Models.ResourceParams = Backbone.Model.extend({
  initialize: function() {
    // console.log('ResourceParams Model initialize:', this.attributes);
  },
  url: function() {
    return location.href + 'set_resource/'
  },  
  schema: function(){
    var sch = {};
    _.each(this.attributes, function(attr, key) {
      if (typeof attr === 'number') {
        sch[key] = 'Number';
      } else if (typeof attr == 'string') {
        sch[key] = 'Text';
      } else if (attr instanceof Array) {
        sch[key] = { type: 'List', itemType: 'Number' }
      };
    });
    return sch;
  }
});



// NOTE: Base class for IONUX.Views.TaskableResourceParams
// in static/js/ux-views-taskable-command.js
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
    
    // Quick hack to disable and hide backbone-forms buttons.
    // Todo: implement custom form templates in IONUX.Templates
    this.$el.find('.bbf-add, .bbf-del').remove();
    
    return this;
  },
  save_params: function(e){
    var self = this;
    var btn = $(e.target);
    btn.prop('disabled', true).text('Saving...');
    this.$el.find('input').prop('disabled', true);
    this.resource_params_form.commit();
    var attrs = this.model.toJSON(); // Hack to force fn complete below. Better way?
    this.model.save(attrs, {
      complete: function(resp){
        btn.prop('disabled', false).text('Save');
        self.$el.find('input').prop('disabled', false);
      }
    });
  }
});



IONUX.Views.InstrumentCommandFacepage = Backbone.View.extend({
  el: "#dynamic-container",
  template: _.template($("#instrument-command-facepage-tmpl").html()),
  command_template: _.template($('#instrument-command-tmpl').html()),
  events: {
    'click #start-instrument-agent-instance': 'start_agent',
    'click #stop-instrument-agent-instance': 'stop_agent',
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
    return this;
  },
  
  start_agent: function(evt){
    var start_btn = $(evt.target);
    start_btn.prop('disabled', true);
    start_btn.prop('value', 'Starting Instrument Agent...');
    var self = this;
    $.ajax({
        type: 'POST',
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
      type: 'POST',
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
    execute_elmt.prop('disabled', true);
    $('#cmds').find('button').prop('disabled', true);
    
    var cap_type = execute_elmt.data('cap-type');
    var command = execute_elmt.data('command');
    var url = command + '/?cap_type='+cap_type;
    if (command == 'RESOURCE_AGENT_EVENT_GO_DIRECT_ACCESS') {
      url += '&session_type='+this.$el.find('option:selected').val();
    };
    
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
          console.log('get_capabilities resp: ', resp);
          self.render_commands(resp.data.commands);
          // Catch 'GatewayError' caused by unsupported/invalid state.
          if (!_.isEmpty(resp.data.resource_params) && !_.has(resp.data.resource_params, 'GatewayError')){
            new IONUX.Views.ResourceParams({model: new IONUX.Models.ResourceParams(resp.data.resource_params)}).render().el;
          } else {
            $('#resource-form').empty();
          };
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
});
