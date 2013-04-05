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
            Backbone.history.fragment = null; // Clear history fragment to allow for page "refresh".
            IONUX.ROUTER.navigate(window.location.pathname, {trigger: true});
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
                                                           body: 'Your request has been received and will be reviewed by a manager. When it is approved, you will either need to visit your Account Settings page or logout and login again.',
                                                           buttons: "<button class='btn-blue' data-dismiss='modal'>OK</button>"})).modal()
          .on('hide', function() {
            $('#action-modal').remove();
            Backbone.history.fragment = null; // Clear history fragment to allow for page "refresh".
            IONUX.ROUTER.navigate(window.location.pathname, {trigger: true});
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
            Backbone.history.fragment = null; // Clear history fragment to allow for page "refresh".
            IONUX.ROUTER.navigate(window.location.pathname, {trigger: true});
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
            Backbone.history.fragment = null; // Clear history fragment to allow for page "refresh".
            IONUX.ROUTER.navigate(window.location.pathname, {trigger: true});
          });
      }
    })
  },
});

IONUX.Views.RequestAccess = Backbone.View.extend({
  events: {
    'click #btn-request': 'request_access'
  },
  initialize: function(){
    _.bindAll(this);
  },
  render: function(){
    // devices etc have a list of orgs they are a part of
    // the user has a list of orgs/roles they have
    // need to find where they intersect (as INSTRUMENT_OPERATOR)
    var org_id = null;
    var roles = IONUX.SESSION_MODEL.get('roles');

    // @TODO: there's got to be a better way than this
    var user_orgs = _.map(_.filter(_.pairs(roles), function(r) { return _.contains(r[1], "INSTRUMENT_OPERATOR") } ), function(v) { return v[0] })

    this.matching_orgs = _.filter(window.MODEL_DATA.orgs, function(o) { return _.contains(user_orgs, o.org_governance_name); });

    var resource_name = window.MODEL_DATA.resource.name;

    var cancel_button = "<button class='btn-general' data-dismiss='modal'>Cancel</button>";
    var template_vars = {header_text: 'Request Access: ' + resource_name,
                         body: 'Press the Request Access button below to request access to this resource. All requests must be approved by a manager.',
                         buttons: "<button class='btn-blue' id='btn-request'>Request Access</button>" + cancel_button}

    // sub out message/buttons if we don't have perms
    if (this.matching_orgs.length == 0) {
      template_vars.body = "You must have the instrument operator role in the associated org to request access to this device.";
      template_vars.buttons = cancel_button;
    }

    this.modal = $(_.template(IONUX.Templates.full_modal_template, template_vars));
    this.modal.modal('show')
      .on('hide', function() {
        $('#action-modal').remove();
      });
    this.setElement('#action-modal');
    return this;
  },
  request_access: function(e){
    if (this.matching_orgs.length == 0) {
      alert("Could not find an Org that you are an instrument operator of and this device belongs to!");
      return;
    } else if (this.matching_orgs.length > 1) {
      console.warn("More than one matching Org found (" + this.matching_orgs.length + "), using first: " + this.matching_orgs[0]);
    }

    org_id = this.matching_orgs[0]._id;

    var self = this;
    e.preventDefault();
    $.ajax({
      type: 'POST',
      url: window.location.href + 'request_access/',
      data: {org_id: org_id},
      success: function(resp) {
        self.modal.modal('hide');
        $(_.template(IONUX.Templates.full_modal_template, {header_text:'Request Received',
                                                           body: 'Your request has been received and will be reviewed by a manager.',
                                                           buttons: "<button class='btn-blue' data-dismiss='modal'>OK</button>"})).modal()
          .on('hide', function() {
            $('#action-modal').remove();
            Backbone.history.fragment = null; // Clear history fragment to allow for page "refresh".
            IONUX.ROUTER.navigate(window.location.pathname, {trigger: true});
          });
      }
    })
  },
});

IONUX.Views.ReleaseAccess = Backbone.View.extend({
  events: {
    'click #btn-release': 'release_access'
  },
  initialize: function(){
    _.bindAll(this);
  },
  template_vars: {
    header_text: 'Release Access',
    body: 'Press the Release Access button below to release access to this resource.',
    buttons: "<button class='btn-blue' id='btn-release'>Release Access</button><button class='btn-general' data-dismiss='modal'>Cancel</button>",
  },
  render: function(){
    this.modal = $(_.template(IONUX.Templates.full_modal_template, this.template_vars));
    this.modal.modal('show')
      .on('hide', function() {
        $('#action-modal').remove();
      });
    this.setElement('#action-modal');
    return this;
  },
  release_access: function(e){
    var self = this;
    e.preventDefault();
    $.ajax({
      type: 'POST',
      url: window.location.href + 'release_access/',
      data: {commitment_id: this.options.commitment_id},
      success: function(resp) {
        self.modal.modal('hide');
        $(_.template(IONUX.Templates.full_modal_template, {header_text:'Release Received',
                                                           body: 'Your release has been received.',
                                                           buttons: "<button class='btn-blue' data-dismiss='modal'>OK</button>"})).modal()
          .on('hide', function() {
            $('#action-modal').remove();
            Backbone.history.fragment = null; // Clear history fragment to allow for page "refresh".
            IONUX.ROUTER.navigate(window.location.pathname, {trigger: true});
          });
      }
    })
  },
});

IONUX.Views.RequestExclusiveAccess = Backbone.View.extend({
  template: _.template($("#request-exclusive-access-tmpl").html()),
  events: {
    'click #btn-request': 'request_access'
  },
  initialize: function(){
    _.bindAll(this);
  },
  render: function(){

    // check to see if someone ELSE has exclusive access so we can warn user it will fail
    var exc = _.find(window.MODEL_DATA.commitments, function(c) { return c.commitment.exclusive && c.consumer != IONUX.SESSION_MODEL.get('actor_id'); });
    if (exc != null) {
      $(_.template(IONUX.Templates.full_modal_template, {header_text:'Exclusive Access',
                                                         body: 'Another user already has exclusive access to this device.',
                                                         buttons: "<button class='btn-blue' data-dismiss='modal'>OK</button>"})).modal()
         .on('hide', function() {
           $('#action-modal').remove();
         });

      return;
    }

    var resource_name = window.MODEL_DATA.resource.name;

    this.modal = $(IONUX.Templates.modal_template).html(this.template({resource_name: resource_name}));
    this.modal.modal('show')
      .on('hide', function() {
        $('#action-modal').remove();
      });
    this.setElement('#action-modal');
    return this;
  },
  request_access: function(e){
    var expiration = parseInt(this.$('input[name="time"]').val());
    if (expiration <= 0 || expiration > 12) {
      this.$('.control-group').addClass('error');
      this.$('.help-inline').append("Please enter a value between 0 and 12");
      return;
    } else {
      this.$('.control-group').removeClass('error');
      this.$('.help-inline').empty();
    }

    var self = this;
    e.preventDefault();
    $.ajax({
      type: 'POST',
      url: window.location.href + 'request_exclusive_access/',
      data: {expiration: expiration,
             org_id: this.options.org_id},
      success: function(resp) {
        self.modal.modal('hide');
        $(_.template(IONUX.Templates.full_modal_template, {header_text:'Request Received',
                                                           body: 'Your request has been received and will be reviewed by a manager.',
                                                           buttons: "<button class='btn-blue' data-dismiss='modal'>OK</button>"})).modal()
          .on('hide', function() {
            $('#action-modal').remove();
            Backbone.history.fragment = null; // Clear history fragment to allow for page "refresh".
            IONUX.ROUTER.navigate(window.location.pathname, {trigger: true});
          });
      }
    })
  },
});

IONUX.Views.ReleaseExclusiveAccess = IONUX.Views.ReleaseAccess.extend({
  template_vars: {
    header_text: 'Release Exclusive Access',
    body: 'Press the Release Exclusive Access button below to release access to this resource.',
    buttons: "<button class='btn-blue' id='btn-release'>Release Access</button><button class='btn-general' data-dismiss='modal'>Cancel</button>",
  },
});

IONUX.Views.NegotiationCommands = Backbone.View.extend({
  template: _.template($("#negotiation-commands-tmpl").html()),
  events: {
    'click #btn-accept': 'accept',
    'click #btn-reject': 'reject',
  },
  initialize: function(){
    _.bindAll(this);
    var row_info_list = this.options.data[0].split("::");
    this.neg_id = row_info_list[0];
    this.neg = _.findWhere(window.MODEL_DATA.open_requests, {negotiation_id:this.neg_id});
  },
  render: function(){
    this.modal = $(IONUX.Templates.modal_template).html(this.template({negotiation_id: this.neg_id,
                                                                       submitted: this.options.data[1]}));
    this.modal.modal('show')
      .on('hide', function() {
        $('#action-modal').remove();
      });
    this.setElement('#action-modal');
    return this;
  },
  accept_or_reject: function(verb, header_text, body_text) {
    var self = this;

    // HACK ALERT
    // very hard to determine what originator we need to specify so we're shortcutting it
    // use the OPPOSITE of what's in the request we're working with (we assume it's passed
    // all current checks)
    var originator = (this.neg.originator == "PROVIDER") ? "consumer" : "provider";
    // /HACK
    $.ajax({
      type: 'POST',
      url: window.location.protocol + "//" + window.location.host + "/negotiation/",
      data: {negotiation_id: this.neg_id,
             verb: verb,
             originator: originator},
      success: function(resp) {
        self.modal.modal('hide');
        $(_.template(IONUX.Templates.full_modal_template, {header_text: header_text,
                                                           body: body_text,
                                                           buttons: "<button class='btn-blue' data-dismiss='modal'>OK</button>"})).modal()
          .on('hide', function() {
            $('#action-modal').remove();

            // if this was a negotiation to get a new role, and we accepted, we need to reload the user session model
            // this doesn't check all the conditions
            if (verb == "accept") {
              IONUX.SESSION_MODEL.fetch();
            }

            Backbone.history.fragment = null; // Clear history fragment to allow for page "refresh".
            IONUX.ROUTER.navigate(window.location.pathname, {trigger: true});
          });
      }
    })

  },
  accept: function(e){
    e.preventDefault();
    this.accept_or_reject('accept', 'Accepted', 'You have accepted this negotiation request.');
  },
  reject: function(e){
    e.preventDefault();
    this.accept_or_reject('reject', 'Rejected', 'You have rejected this negotiation request.');
  },
});


