IONUX = {
    Models:{},
    Collections:{},
    Views: {},
    Router: {},
    init: function() {
        var router = new IONUX.Router();
        Backbone.history.start({pushState:true});
        router.handle_navigation();
        return router;
    },
    set_roles:function(roles){
        if (roles){
            IONUX.ROLES = roles.split(",");
        } else {
            IONUX.ROLES = [];
        }
    }
}
