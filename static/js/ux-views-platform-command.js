IONUX.Views.PlatformCommandFacepage = Backbone.View.extend({
  el: "#dynamic-container",
  template: _.template($("#platform-command-facepage-tmpl").html()),
  
  events: {
    'click #start-instrument-agent-instance': 'start_agent',
    'click #stop-instrument-agent-instance': 'stop_agent',
    'click .issue_command': 'issue_command',
    'click .get_capabilities': 'get_capabilities'
  },

  initialize: function(){
    _.bindAll(this, "render", "start_agent" );
    this.model.bind("change", this.render);
    
    // console.log($('#start-instrument-agent-instance'));
  },

  render: function(){
    this.$el.empty().html(this.template(this.model.toJSON())).show();
    var agent_process_id = this.model.get('agent_instance')['agent_process_id'];
    if (agent_process_id) {
        $("#start-instrument-agent-instance").hide();
        $("#stop-instrument-agent-instance, .instrument-commands").show();
        this.get_capabilities();
    };
    
    $('#start-instrument-agent-instance').attr('value', 'Start Platform Agent');
    $('#stop-instrument-agent-instance').attr('value', 'Stop Platform Agent');
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
      error: function() {
        $(".command-output").append($('<p class="command-failure">').text("ALERT: '" + command + "' was unsuccessful."));
      },
      complete: function(resp){
          button_elmt.removeAttr("disabled");
          select_elmt.removeAttr("disabled");
          self.get_capabilities();
      }
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
            console.log('option_elmts', option_elmts);
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
