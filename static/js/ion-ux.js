IONUX = {
  Interactions: {},
  Models:{},
  Collections:{},
  Views: {},
  Router: {},
  init: function(){
    var router = new IONUX.Router();
    IONUX.ROUTER = router; // Is this too close to IONUX.Router?
    IONUX.setup_ajax_error();
    IONUX.SESSION_MODEL = new IONUX.Models.Session();
    IONUX.SESSION_MODEL.fetch().complete(function(resp) {
      Backbone.history.start({pushState:true, hashChange: false});
      new IONUX.Views.Sidebar({model: IONUX.SESSION_MODEL}).render().el;
      new IONUX.Views.Topbar({model: IONUX.SESSION_MODEL}).render().el
      new IONUX.Views.Search().render().el;
      new IONUX.Views.HelpMenu({model: IONUX.SESSION_MODEL}).render().el;

      // nag popup!
      if (IONUX.SESSION_MODEL.get('is_logged_in') && !IONUX.SESSION_MODEL.get('is_registered'))
        router.user_profile();
    });
    router.handle_navigation();
    return router;
  },
  setup_ajax_error: function(){
    $(document).ajaxError(function(evt, resp){
      var error_obj = JSON.parse(resp['responseText'])['data']['GatewayError'];
      var open_modal = $('.modal-ooi').is(':visible') ? true : false;
      if (open_modal) $('#action-modal').modal('hide').remove();
      new IONUX.Views.Error({error_obj:error_obj,open_modal:open_modal}).render().el;
    });
  },
}
