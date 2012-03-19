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
    },
    set_logged_in:function(logged_in){
        if (logged_in == "True"){
            IONUX.LOGGED_IN = "True";
        } else {
            IONUX.LOGGED_IN = "False";
        }
    },
    set_is_registered:function(is_registered){
        if (is_registered == "True"){
            IONUX.IS_REGISTERED = "True";
        } else {
            IONUX.IS_REGISTERED = "False";
        }
    }
}
