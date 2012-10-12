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
INTERACTIONS_OBJECT.block_interactions = ['More Info', 'Detailed View', 'Hide', 'Edit'];
INTERACTIONS_OBJECT.group_interactions = ['More Info', 'Detailed View', 'Submenu', 'Edit'];
INTERACTIONS_OBJECT.view_interactions = ['Subscribe', 'Detailed View', 'Submenu', 'Subscribe', 'Command', 'Direct Command'];


IONUX.Views.ActionMenu = Backbone.View.extend({
    events:  {
        "hover": "action_controls",
        "click .dropdown-menu li": "action_control_click"
    },

    action_controls: function(evt){
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

        var dropdown_button_tmpl =
            '<div class="btn-group">'+
            '<a class="btn dropdown-toggle" data-toggle="dropdown" href="#">Actions<span class="caret"></span></a>'+
            '<ul class="dropdown-menu"><% _.each(dropdown_items, function(item) { %> <li><%= item %></li> <% }); %></ul>'+
            '</div>';
        var dropdown_items = INTERACTIONS_OBJECT.block_interactions; 
        var html = _.template(dropdown_button_tmpl, {"dropdown_items":this.interaction_items});
        $(this.el).prepend(html);
    },

    action_control_click: function(evt) {
        var action_name = $(evt.target).text();
        var action_event = "action__" + action_name.replace(/ /g, "_").toLowerCase()
        this.trigger(action_event);
    }

});


IONUX.Views.ViewActions = IONUX.Views.ActionMenu.extend({

    initialize: function() {
        this.interaction_items = INTERACTIONS_OBJECT.view_interactions;
        this.on("action__subscribe", this.action__subscribe);
        this.on("action__detailed_view", this.action__detailed_view);
        this.on("action__submenu_toggle", this.action__submenu_toggle);
        this.on("action__command", this.action__command);
    },
    action__subscribe:function(){
        alert("IONUX.Views.ViewActions - ACTION: subscribe");
    },
    action__detailed_view:function(){
        alert("IONUX.Views.ViewActions - ACTION: detailed_view - this.el:" + this.el);
    },
    action__submenu_toggle:function(){
        alert("IONUX.Views.ViewActions - ACTION: submenu_toggle");
    },
    action__command:function(){
        alert("IONUX.Views.ViewActions - ACTION: command");
    }

});


IONUX.Views.GroupActions = IONUX.Views.ActionMenu.extend({

    initialize: function() {
        this.interaction_items = INTERACTIONS_OBJECT.group_interactions;
        this.on("action__more_info", this.action__more_info);
        this.on("action__detailed_view", this.action__detailed_view);
        this.on("action__submenu_toggle", this.action__submenu_toggle);
        this.on("action__edit", this.action__edit);
    },

    action__more_info:function(){
        var modal_tmpl = 
            '<div class="modal hide fade" style="padding:10px">' +
            '<h1><%= classname %> - ID: <%= elem_id %><h1><br><h3>ACTION:</h3><h2><%= action %></h2>' +
            '</div>';
        var modal_html = _.template(modal_tmpl, {"classname":"IONUX.Views.GroupActions", "action":"'More Info'", "elem_id":this.$el.attr("id")});
        $(modal_html).modal();
    },

    action__detailed_view:function(){
        alert("IONUX.Views.GroupActions - ACTION: detailed_view");
    },

    action__submenu_toggle:function(){
        alert("IONUX.Views.GroupActions - ACTION: submenu_toggle");
    },

    action__edit:function(){
        alert("IONUX.Views.GroupActions - ACTION: edit");
    }

});

IONUX.Views.BlockActions = IONUX.Views.ActionMenu.extend({

    initialize: function() {
        this.interaction_items = INTERACTIONS_OBJECT.block_interactions;
        this.on("action__more_info", this.action__more_info);
        this.on("action__detailed_view", this.action__detailed_view);
        this.on("action__hide", this.action__hide);
        this.on("action__edit", this.action__edit);
    },

    action__more_info:function(){
        alert("IONUX.Views.BlockActions - ACTION: more_info");
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


