/*
Each View, Group, and Block element needs an action menu
that does many element-specfic actions based on a User's
selection for the element's corresponding Action Menu.


*/

INTERACTIONS_OBJECT = {};
INTERACTIONS_OBJECT.block_interactions = ['More Info', 'Detailed View', 'Hide', 'Edit'];
INTERACTIONS_OBJECT.group_interactions = ['More Info', 'Detailed View', 'Submenu Toggle', 'Edit'];
INTERACTIONS_OBJECT.view_interactions = ['Subscribe', 'Detailed View', 'Submenu Toggle', 'Command'];


IONUX.Views.ActionMenu = Backbone.View.extend({

});


IONUX.Views.ViewActions = IONUX.Views.ActionMenu({

});

IONUX.Views.GroupActions = IONUX.Views.ActionMenu({

});

IONUX.Views.BlockActions = IONUX.Views.ActionMenu({

});

