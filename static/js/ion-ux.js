IONUX = {
    Models:{},
    Collections:{},
    Views: {},
    Router: {},
    init: function() {
        new IONUX.Router();
        Backbone.history.start();
    }
}
