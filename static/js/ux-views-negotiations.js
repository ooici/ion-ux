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
      data: {},
      success: function(resp) {
        self.modal.modal('hide');
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

IONUX.Views.RequestRole = Backbone.View.extend({
  el: '#action-modal',
  template: _.template($('#request-role-tmpl').html()),
  events: {
    'click #btn-request': 'request_role'
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
  request_role: function(e){
    var self = this;
    var role_name = self.$('select[name="role_name"]').val();
    e.preventDefault();
    $.ajax({
      type: 'POST',
      url: window.location.href + 'request_role/',
      data: {role_name: role_name},
      success: function(resp) {
        self.modal.modal('hide');
        $(_.template(IONUX.Templates.full_modal_template, {header_text:'Request Received',
                                                           body: 'Your request has been received and will be reviewed by a manager.',
                                                           buttons: "<button class='btn-blue' data-dismiss='modal'>OK</button>"})).modal()
          .on('hide', function() {
            $('#action-modal').remove();
          });
      }
    })
  },

});

IONUX.Views.InviteUser = Backbone.View.extend({
  el: '#action-modal',
  template: _.template($('#invite-user-tmpl').html()),
  events: {
    'click #btn-invite': 'invite_user'
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
  invite_user: function(e){
    var self = this;
    var user = self.$('select[name="user"]').val();
    e.preventDefault();
    $.ajax({
      type: 'POST',
      url: window.location.href + 'invite_user/',
      data: {user_id: user},
      success: function(resp) {
        self.modal.modal('hide');
        $(_.template(IONUX.Templates.full_modal_template, {header_text:'Invite Received',
                                                           body: 'Your invite has been received and will be reviewed by the user.',
                                                           buttons: "<button class='btn-blue' data-dismiss='modal'>OK</button>"})).modal()
          .on('hide', function() {
            $('#action-modal').remove();
          });
      }
    })
  },
});

