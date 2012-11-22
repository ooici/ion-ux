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
