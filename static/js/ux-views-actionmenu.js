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
INTERACTIONS_OBJECT.view_interactions = ['Subscribe', 'Lifecycle', 'Edit', /*'Submenu',*/ 'Command', 'Direct Command', 'Download'];
INTERACTIONS_OBJECT.event_interactions = ['Add Event'];
INTERACTIONS_OBJECT.attachment_interactions = ['Upload Attachment'];


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
        this.interaction_items = INTERACTIONS_OBJECT.view_interactions;
        this.create_actionmenu();
        this.on("action__subscribe", this.action__subscribe);
        this.on("action__lifecycle", this.action__lifecycle);
        this.on("action__edit", this.action__edit);
        this.on("action__submenu_toggle", this.action__submenu_toggle);
        this.on("action__command", this.action__command);
        this.on("action__direct_command", this.action__direct_command);
        this.on("action__download", this.action__download);
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
             notifications.fetch();
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
      IONUX.ROUTER.navigate(window.location.pathname + 'edit', {trigger:true});
    },
    action__submenu_toggle:function(){
        alert("IONUX.Views.ViewActions - ACTION: submenu_toggle");
    },
    action__command:function(){
        var resource_type = window.MODEL_DATA['resource_type'];
        var resource_id = window.MODEL_DATA['_id'];
        if (resource_type == 'InstrumentDevice' || resource_type == 'PlatformDevice'){
            var router = new IONUX.Router();
            router.navigate('/'+resource_type+'/command/'+resource_id+'/', {trigger:true});
        } else {
            alert("Command not supported for " + resource_type + '.');
        };
    },
    action__direct_command:function(){
        alert("Direct Command");
    },
    action__download: function(evt){
        if (window.location.pathname.match(/DataProduct/g)){
            var url = get_descendant_properties(window.MODEL_DATA, $('#2164346').data('path'));
            window.open(url, '_blank');
        } else {
            alert("Download not available for this resource.");
        };
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
    },
    
    add_event: function(){
      if (IONUX.SESSION_MODEL.get('is_logged_in') != true) {
        alert("You must be logged in to add an event")
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
    },
    
    upload_attachment: function(){
      new IONUX.Views.ResourceAddAttachmentView().render().el;
    },
});

