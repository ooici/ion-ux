IONUX = {
    Interactions: {},
    // KEPT FOR REFERENCE
    // DefinedViews:{
    //     instruments: {view_id: '2050001', template_id: '#hybrid-instrument-tmpl'},
    //     platforms: {view_id: '2050002', template_id: '#hybrid-platform-tmpl'},
    //     observatories: {view_id: '2050006', template_id: '#hybrid-observatory-tmpl'},
    //     data_products: {view_id: '2050004', template_id: '#hybrid-data-product-tmpl'},
    //     users: {view_id: '2050007', template_id: '#hybrid-user-tmpl'}
    // },
    Models:{},
    Collections:{},
    Views: {},
    Router: {},
    init: function() {
        var router = new IONUX.Router();
        ROUTER = router;
        Backbone.history.start({pushState:true, hashChange: false});
        router.handle_navigation();
        return router;
    },
    init_session: function() {
        IONUX.SESSION_MODEL = new IONUX.Models.Session();
        var sidebar_view, user_profile_view;
    },
    set_roles:function(roles){
        if (roles){
            IONUX.ROLES = roles.split(",");
        } else {
            IONUX.ROLES = [];
        }
    },
    set_logged_in:function(logged_in){
        console.log('set_logged_in', logged_in);
        IONUX.LOGGED_IN = logged_in == "True" ? "True" : "False";
    },
    set_is_registered:function(is_registered){
        console.log('set_is_registered', is_registered);
        IONUX.IS_REGISTERED = is_registered == "True" ? "True" : "False";
    }
}
