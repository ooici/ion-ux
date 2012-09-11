/*
Each View, Group, and Block element needs an action menu
that does many element-specfic actions based on a User's
selection for the element's corresponding Action Menu.


todos:
   - user triggering of some event ('hover'?) from main element to activate showing of action menu controls.

*/

INTERACTIONS_OBJECT = {};
INTERACTIONS_OBJECT.block_interactions = ['More Info', 'Detailed View', 'Hide', 'Edit'];
INTERACTIONS_OBJECT.group_interactions = ['More Info', 'Detailed View', 'Submenu Toggle', 'Edit'];
INTERACTIONS_OBJECT.view_interactions = ['Subscribe', 'Detailed View', 'Submenu Toggle', 'Command'];


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

        var dropdown_button_tmpl = [
            '<div class="btn-group">',
             '<a class="btn dropdown-toggle" data-toggle="dropdown" href="#">Actions<span class="caret"></span></a>',
            '<ul class="dropdown-menu"><% _.each(dropdown_items, function(item) { %> <li><%= item %></li> <% }); %></ul>',
            '</div>'].join('');

        var dropdown_items = INTERACTIONS_OBJECT.block_interactions; 
        var html = _.template(dropdown_button_tmpl, {"dropdown_items":this.interaction_items});
        $(this.el).prepend(html);
    },

    action_control_click: function(evt) {
        alert('Handling ' + $(evt.target).text() + ' of id #' + $(this.el).attr('id') + '.');
    }

});



IONUX.Views.ViewActions = IONUX.Views.ActionMenu.extend({

    initialize: function() {
        this.interaction_items = INTERACTIONS_OBJECT.view_interactions;
    }

});

IONUX.Views.GroupActions = IONUX.Views.ActionMenu.extend({

    initialize: function() {
        this.interaction_items = INTERACTIONS_OBJECT.group_interactions;
    }
});

IONUX.Views.BlockActions = IONUX.Views.ActionMenu.extend({

    initialize: function() {
        this.interaction_items = INTERACTIONS_OBJECT.block_interactions;
    }

});


