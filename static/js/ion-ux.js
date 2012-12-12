IONUX = {
    Interactions: {},
    Models:{},
    Collections:{},
    Views: {},
    Router: {},
    init: function(){
        var router = new IONUX.Router();
        IONUX.ROUTER = router; // Is this too close to IONUX.Router?

        IONUX.SESSION_MODEL = new IONUX.Models.Session();
        IONUX.SESSION_MODEL.fetch().complete(function(resp) {
            Backbone.history.start({pushState:true, hashChange: false});
            new IONUX.Views.Sidebar({model: IONUX.SESSION_MODEL}).render().el;
            new IONUX.Views.Topbar({model: IONUX.SESSION_MODEL}).render().el
            new IONUX.Views.Search().render().el;
        });
        router.handle_navigation();
        return router;
    },
    // set_roles:function(roles){
    //     if (roles){
    //         IONUX.ROLES = roles.split(",");
    //     } else {
    //         IONUX.ROLES = [];
    //     }
    // },
    // set_logged_in:function(logged_in){
    //     IONUX.LOGGED_IN = logged_in == "True" ? "True" : "False";
    // },
    // set_is_registered:function(is_registered){
    //     IONUX.IS_REGISTERED = is_registered == "True" ? "True" : "False";
    // }
}
