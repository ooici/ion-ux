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

IONUX.Views.OfferUserRole = Backbone.View.extend({
  el: '#action-modal',
  template: _.template($('#offer-user-role-tmpl').html()),
  events: {
    'click #btn-offer': 'offer_user_role',
    'change select[name="user"]': 'user_changed'
  },
  initialize: function(){
    _.bindAll(this);
    this.user_cache = {}
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
  user_changed: function(e) {
    var user_id = this.$('select[name="user"]').val();
    var self = this;
    
    if (user_id == null) {
      e.preventDefault();
      return;
    }

    if (this.user_cache.hasOwnProperty(user_id)) {
      var user_roles = this.user_cache[user_id];
      this.update_displayed_roles(user_roles);
    } else {

      self.$('#rolespinner').show();
      self.$('select[name="role_name"]').empty();

      $.ajax({
        url: window.location.protocol + "//" + window.location.host + "/UserInfo/extension/" + user_id + "/",
        success: function(resp) {
          self.$('#rolespinner').hide();

          var user_roles = _.pluck(_.where(resp.data.roles, { org_governance_name: window.MODEL_DATA.resource.org_governance_name }), 'governance_name');
          self.user_cache[user_id] = user_roles;

          self.update_displayed_roles(user_roles);
        }
      });
    }
  },
  update_displayed_roles: function(user_roles) {
    var role = this.$('select[name="role_name"]');
    
    var new_roles = _.filter(window.MODEL_DATA.roles, function(r) { return !_.contains(user_roles, r.governance_name); });

    role.empty();
    _.each(new_roles, function(r) {
      role.append("<option value='" + r.governance_name + "'>" + r.name + "</option>");
    });
  },
  offer_user_role: function(e){
    var self = this;
    var user = self.$('select[name="user"]').val();
    var role_name = self.$('select[name="role_name"]').val();

    if (user == null || role_name == null)
      return;

    e.preventDefault();
    $.ajax({
      type: 'POST',
      url: window.location.href + 'offer_user_role/',
      data: {user_id: user,
             role_name: role_name},
      success: function(resp) {
        self.modal.modal('hide');
        $(_.template(IONUX.Templates.full_modal_template, {header_text:'Role Offer Received',
                                                           body: 'Your role offer has been received and will be reviewed by the user.',
                                                           buttons: "<button class='btn-blue' data-dismiss='modal'>OK</button>"})).modal()
          .on('hide', function() {
            $('#action-modal').remove();
          });
      }
    })
  },
});

