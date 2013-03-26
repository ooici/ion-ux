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
    this.modal = $(IONUX.Templates.modal_template).html(this.template({resource_name: resource_name})).modal()
      .on('hide', function(){
        $('#action-modal').remove();
      });
    this.setElement('#action-modal');
    return this;
  },
  request_enrollment: function(e){
    var self = this;
    e.preventDefault();
    $.ajax({
      type: 'POST',
      url: window.location.href + 'enroll/',
      data: {user_id: IONUX.SESSION_MODEL.get('user_id'),
             org_id: window.MODEL_DATA._id},
      complete: function(resp) {
        self.modal.modal('hide');
      },
      success: function(resp) {
        $(_.template(IONUX.Templates.full_modal_template, {header_text:'Request Received',
                                                           body: 'Your request to enroll has been received and will be reviewed by a manager.',
                                                           buttons: "<button class='btn-blue' data-dismiss='modal'>OK</button>"})).modal()
          .on('hide', function() {
            $('#action-modal').remove();
          });
      }
    })
  },
});
