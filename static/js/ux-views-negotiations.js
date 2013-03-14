IONUX.Views.Enroll = Backbone.View.extend({
  el: '#action-modal',
  template: _.template($('#enroll-request-tmpl').html()),
  events: {
    'click #btn-request': 'request_enrollment'
  },
  initialize: function(){
    _.bindAll(this);
  },
  render: function(){
    var resource_name = window.MODEL_DATA.resource.name;
    $(IONUX.Templates.modal_template).html(this.template({resource_name: resource_name})).modal()
      .on('hide', function(){
        $('#action-modal').remove();
      });
    this.setElement('#action-modal');
    return this;
  },
  request_enrollment: function(e){
    e.preventDefault();
    $.ajax({
      type: 'POST',
      url: window.location.href + 'enroll/',
      data: 'Word',
      success: function(resp) {
        
      }
    })
  },
});