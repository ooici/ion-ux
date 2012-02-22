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
    }
}
