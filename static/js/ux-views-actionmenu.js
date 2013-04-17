/*
Each View, Group, and Block element needs an action menu
that does many element-specfic actions based on a User's
selection for the element's corresponding Action Menu.


todo:
   - user triggering of some event ('hover'?), activated by 'main element hover', 
     to activate showing of action menu controls (that live in main elements 'header' element).
     * How do headers and elements know about each other?

*/

INTERACTIONS_OBJECT = {};
INTERACTIONS_OBJECT.block_interactions = ['More Info'];
INTERACTIONS_OBJECT.group_interactions = ['More Info', /*'Submenu', 'Edit'*/];
INTERACTIONS_OBJECT.view_interactions = ['Subscribe', 'Lifecycle', 'Edit', /*'Submenu',*/ 'Command', 'Download', 'Report Issue'];
INTERACTIONS_OBJECT.event_interactions = ['Add Event'];
INTERACTIONS_OBJECT.attachment_interactions = ['Upload Attachment'];
INTERACTIONS_OBJECT.negotiation_interactions = {owner: ['View Requests'], nonmember: ['Enroll']};


IONUX.Views.ActionMenu = Backbone.View.extend({
    events:  {
        "click .dropdown-menu li": "action_control_click"
    },

    action_controls_onhover: function(evt){
        if (evt.type == 'mouseenter') {
            var btn = $(this.el).find(".btn-group");
            if (btn.length) {
                btn.show();
                return;
            }
        } 
        if (evt.type == 'mouseleave') {
            $(this.el).find(".btn-group").hide();
            return;
        }
        this.create_actionmenu();
    },

    create_actionmenu: function(){
        var dropdown_button_tmpl =
            '<div class="btn-group pull-right">'+
            '<a class="btn dropdown-toggle" data-toggle="dropdown">Actions<span class="caret"></span></a>'+
            '<ul class="dropdown-menu"><% _.each(dropdown_items, function(item) { %> <li><%= item %></li> <% }); %></ul>'+
            '</div>';
        var dropdown_items = INTERACTIONS_OBJECT.block_interactions; 
        var html = _.template(dropdown_button_tmpl, {"dropdown_items":this.interaction_items});
        $(this.el).prepend(html);
    },

    action_control_click: function(evt) {
        evt.preventDefault();
        var action_name = $(evt.target).text();
        var action_event = "action__" + action_name.replace(/ /g, "_").toLowerCase()
        this.trigger(action_event, $(evt.target));
    }
});


IONUX.Views.ViewActions = IONUX.Views.ActionMenu.extend({
    modal_template: '<div id="action-modal" class="modal hide fade modal-ooi">',
    initialize: function() {
        _.bindAll(this);
        this.interaction_items = INTERACTIONS_OBJECT.view_interactions.slice(0);    // ensure clone

        // append resource-specific items here
        if (window.MODEL_DATA.resource_type == 'Org') {

          // ENROLLMENT
          if (IONUX.is_logged_in()) {
            if (IONUX.is_owner()) {
              // INVITE USER
              this.interaction_items.push("Invite User");
              this.on("action__invite_user", this.action_org__invite_user);

              // INVITE ROLE
              this.interaction_items.push("Offer User Role");
              this.on("action__offer_user_role", this.action_org__offer_user_role);

            } else {
              if (!_.some(window.MODEL_DATA.members, function(x) { return x._id == IONUX.SESSION_MODEL.get("user_id") })) {
                // REQUEST ENROLLMENT
                this.interaction_items.push("Enroll");
                this.on("action__enroll", this.action_org__enroll);
              } else {
                // REQUEST ROLE
                this.interaction_items.push("Request Role");
                this.on("action__request_role", this.action_org__request_role);
              }
            }
          }
        } else if (_.contains(['PlatformDevice', 'InstrumentDevice', 'DataProduct'], window.MODEL_DATA.resource_type)) {
          if (IONUX.is_logged_in() && !IONUX.is_owner()) {
            // check commitments on current object for resource commitments for the current owner
            var resource_commitments = _.filter(window.MODEL_DATA.commitments, function (c) { return c.commitment.type_ == "ResourceCommitment" && c.consumer == IONUX.SESSION_MODEL.get('actor_id'); });

            if (resource_commitments.length > 0) {
              // we have access to this instrument, add item to release it
              this.interaction_items.push("Release Resource");
              // @TODO: assumption, only one commitment?
              this.on("action__release_resource", _.partial(this.action__release_resource, resource_commitments[0]._id));

              // exclusive access?
              var exc = _.find(resource_commitments, function(c) { return c.commitment.exclusive; });
              if (exc == null) {
                this.interaction_items.push("Request Exclusive Access");
                // @TODO: assumption, only one commitment?
                this.on("action__request_exclusive_access", _.partial(this.action__request_exclusive_access, resource_commitments[0].provider));

              } else {
                this.interaction_items.push("Release Exclusive Access");
                this.on("action__release_exclusive_access", _.partial(this.action__release_exclusive_access, exc._id));
              }

            } else {
              this.interaction_items.push("Request Access");
              this.on("action__request_access", this.action__request_access);
            }
          }
        }

        // remove COMMAND/DOWNLOAD unless certain types
        if (!_.contains(['PlatformDevice', 'InstrumentDevice', 'TaskableResource'], window.MODEL_DATA.resource_type))
          this.interaction_items.splice(this.interaction_items.indexOf('Command'), 1);

        if (window.MODEL_DATA.resource_type != 'DataProduct')
          this.interaction_items.splice(this.interaction_items.indexOf('Download'), 1);

        this.create_actionmenu();
        this.on("action__subscribe", this.action__subscribe);
        this.on("action__lifecycle", this.action__lifecycle);
        this.on("action__edit", this.action__edit);
        this.on("action__submenu_toggle", this.action__submenu_toggle);
        this.on("action__command", this.action__command);
        this.on("action__download", this.action__download);
        this.on("action__report_issue", this.action__report_issue);
    },
    
    // action__subscribe:function(){
    //     $(this.modal_template).modal({keyboard:false})
    //         .on('shown', function(){
    //             new IONUX.Views.Subscribe().render().el;
    //         })
    //         .on('hide',function(){
    //             $('#action-modal').remove();
    //     });
    // },
    
    action__subscribe:function(){
        var subscribe_template = '<div id="action-modal" class="modal hide fade modal-ooi">\
                                    <div class="modal-header"><h1>Notifications</h1></div>\
                                    <div class="modal-body">Loading...</div>\
                                    <div class="modal-footer">\
                                      <button id="btn-subscribe-cancel" type="button" data-dismiss="modal" class="btn-blue">Close</button>\
                                    </div>\
                                  </div>';
        $(subscribe_template).modal({keyboard:false})
          .on('shown', function(){
             var notifications = new IONUX.Collections.Notifications();
             new IONUX.Views.Notifications({collection: notifications});
             notifications.fetch({reset:true});
           })
          .on('hide',function(){
            $('#action-modal').remove();
            Backbone.history.fragment = null; // Clear history fragment to allow for page "refresh".
            IONUX.ROUTER.navigate(window.location.pathname, {trigger: true});
        });
    },
    
    action__lifecycle:function(){
        $(this.modal_template).modal({keyboard:false})
            .on('shown', function(){
                new IONUX.Views.Lifecycle().render().el;
            })
            .on('hide',function(){
                $('#action-modal').remove();
        });
    },
    action__edit: function(){
      // alert('Resource editing is currently disabled.');
      IONUX.ROUTER.navigate(window.location.pathname + 'edit', {trigger:true});
    },
    action__submenu_toggle:function(){
        alert("IONUX.Views.ViewActions - ACTION: submenu_toggle");
    },
    action__command:function(){
        var rt = window.MODEL_DATA['resource_type'];
        var resource_type = rt == 'InformationResource' ? 'DataProcess' : rt; // Todo: fix routes.
        var resource_id = window.MODEL_DATA['_id'];
        if (resource_type == 'InstrumentDevice' 
            || resource_type == 'PlatformDevice'
            || resource_type == 'TaskableResource'){
            var router = new IONUX.Router();
            router.navigate('/'+resource_type+'/command/'+resource_id+'/', {trigger:true});
        } else {
            alert("Command not supported for " + resource_type + '.');
        };
    },
    action__download: function(evt){
        if (window.location.pathname.match(/DataProduct/g)){
            var url = get_descendant_properties(window.MODEL_DATA, $('#2164346').data('path'));
            window.open(url, '_blank');
        } else {
            alert("Download not available for this resource.");
        };
    },
    action__report_issue: function(e) {
      // generate guid to use
      // from http://stackoverflow.com/a/2117523/84732
      var slug = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
      });

      var ridtext = "RESOURCE ID: " + window.MODEL_DATA.resource._id;
      var iidtext = "ISSUE ID: " + slug;

      // generate event
      $.ajax({
        type: 'POST',
        url: window.location.href + 'publish_event/',
        data: {description: ridtext + "\n" + iidtext,
               event_type:'ResourceIssueReportedEvent'},
      });

      // trigger mailto link (adapted from http://www.webmasterworld.com/javascript/3290040.htm)
      var email = "helpdesk@oceanobservatories.org";
      var subject = "OOI Report Issue (" + slug + ") - " + window.MODEL_DATA.resource_type + " " + window.MODEL_DATA.resource.name;
      var body = ridtext + "%0D%0A" + iidtext + "%0D%0A%0D%0APlease keep the above identifiers in this email for cross-reference purposes. Below, describe the issue you are encountering:%0D%0A%0D%0A%0D%0A";
      var mailto_link = 'mailto:' + email + '?subject=' + subject + '&body=' + body;

      win = window.open(mailto_link,'email_issue');
      if (win && win.open &&!win.closed) win.close();
    },
    action_org__invite_user: function(e) {
      var model = new IONUX.Collections.Resources(null, {resource_type: 'UserInfo'});
      model.fetch()
        .done(function(data) {
          new IONUX.Views.InviteUser({model: model}).render().el;
        });
    },
    action_org__offer_user_role: function(e) {
      new IONUX.Views.OfferUserRole().render().el;
    },
    action_org__enroll: function(e) {
      new IONUX.Views.Enroll().render().el; 
    },
    action_org__request_role: function(e) {
      new IONUX.Views.RequestRole().render().el;
    },
    action__request_access: function(e) {
      new IONUX.Views.RequestAccess().render().el;
    },
    action__release_resource: function(commitment_id, e) {
      new IONUX.Views.ReleaseAccess({commitment_id: commitment_id}).render().el;
    },
    action__request_exclusive_access: function(org_id, e) {
      new IONUX.Views.RequestExclusiveAccess({org_id: org_id}).render().el;
    },
    action__release_exclusive_access: function(commitment_id, e) {
      new IONUX.Views.ReleaseExclusiveAccess({commitment_id: commitment_id}).render().el;
    },
});


IONUX.Views.GroupActions = IONUX.Views.ActionMenu.extend({

    "events": _.extend({
        "hover": "action_controls_onhover",
    }, IONUX.Views.ActionMenu.prototype.events),

    initialize: function() {
        this.interaction_items = INTERACTIONS_OBJECT.group_interactions;
        this.on("action__more_info", this.action__more_info);
        this.on("action__submenu_toggle", this.action__submenu_toggle);
        this.on("action__edit", this.action__edit);
        this.create_actionmenu();
    },

    action__more_info:function(){
        var modal_tmpl = '<div class="modal hide fade"><h1>More Info</h1><h3>Element: <%= elem_id %></h3></div>';
        var modal_html = _.template(modal_tmpl, {"elem_id":this.$el.attr("id")});
        $(modal_html).modal();
    },

    action__submenu_toggle:function(){
        alert("IONUX.Views.GroupActions - ACTION: submenu_toggle");
    },

    action__edit:function(){
        alert("IONUX.Views.GroupActions - ACTION: edit");
    }
});

IONUX.Views.BlockActions = IONUX.Views.ActionMenu.extend({

    "events": _.extend({
        "hover": "action_controls_onhover",
    }, IONUX.Views.ActionMenu.prototype.events),

    initialize: function() {
        this.interaction_items = INTERACTIONS_OBJECT.block_interactions;
        this.on("action__more_info", this.action__more_info);
        this.on("action__less_info", this.action__less_info);
        this.on("action__detailed_view", this.action__detailed_view);
        this.on("action__hide", this.action__hide);
        this.on("action__edit", this.action__edit);
        this.create_actionmenu();
    },

    action__more_info:function(target){
      this.$el.addClass('show-all');
      target.text('Less Info');
    },
    
    action__less_info:function(target){
      this.$el.removeClass('show-all');
      target.text('More Info');
    },
    
    action__detailed_view:function(){
        alert("IONUX.Views.BlockActions - ACTION: detailed_view");
    },
    action__hide:function(){
        alert("IONUX.Views.BlockActions - ACTION: hide");
    },
    action__edit:function(){
        alert("IONUX.Views.BlockActions - ACTION: edit");
    }
});

IONUX.Views.EventActions = IONUX.Views.ActionMenu.extend({
    "events": _.extend({
        "hover": "action_controls_onhover",
    }, IONUX.Views.ActionMenu.prototype.events),

    initialize: function() {
        this.interaction_items = INTERACTIONS_OBJECT.event_interactions;
        this.on("action__add_event", this.add_event);
        this.create_actionmenu();
    },
    
    add_event: function(){
      if (IONUX.SESSION_MODEL.get('is_logged_in') != true) {
        alert("You must be signed in to add an event")
      } else {
        new IONUX.Views.ResourceAddEventView().render().el;
      }
    },
});

IONUX.Views.AttachmentActions = IONUX.Views.ActionMenu.extend({
    "events": _.extend({
        "hover": "action_controls_onhover",
    }, IONUX.Views.ActionMenu.prototype.events),

    initialize: function() {
        this.interaction_items = INTERACTIONS_OBJECT.attachment_interactions;
        this.on("action__upload_attachment", this.upload_attachment);
        this.create_actionmenu();
    },
    
    upload_attachment: function(){
      new IONUX.Views.ResourceAddAttachmentView().render().el;
    },
});

IONUX.Views.NegotiationActions = IONUX.Views.ActionMenu.extend({
    "events": _.extend({
        "hover": "action_controls_onhover",
    }, IONUX.Views.ActionMenu.prototype.events),

    initialize: function() {
      this.interaction_items = INTERACTIONS_OBJECT.negotiation_interactions['nonmember'];
      this.on('action__enroll', this.enroll);
      this.create_actionmenu();
    },
    
    enroll: function(){
      if (!IONUX.SESSION_MODEL.is_logged_in()) {
        alert("You must be signed in to request a role.")
      } else {
        console.log('request_role');
        new IONUX.Views.Enroll().render().el;
      }
    },
});
// 
