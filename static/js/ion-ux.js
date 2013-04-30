IONUX = {
  Dashboard: {},
  Templates: {},
  Interactions: {},
  Models:{},
  Collections:{},
  Views: {},
  Router: {},
  init: function(){

    var router = new IONUX.Router();
    IONUX.ROUTER = router;
    IONUX.setup_ajax_error();
    
    IONUX.Dashboard.Observatories = new IONUX.Collections.Observatories()
    IONUX.Dashboard.Orgs = new IONUX.Collections.Orgs();
    
    IONUX.SESSION_MODEL = new IONUX.Models.Session();
    IONUX.SESSION_MODEL.fetch({
      success: function(resp) {
        Backbone.history.start({pushState:true, hashChange: false});
        new IONUX.Views.Topbar({model: IONUX.SESSION_MODEL}).render().el
        new IONUX.Views.Search().render().el;
        new IONUX.Views.HelpMenu({model: IONUX.SESSION_MODEL}).render().el;
        // nag popup!
        if (IONUX.SESSION_MODEL.get('is_logged_in') && !IONUX.SESSION_MODEL.get('is_registered'))
          router.user_profile();
      }
    });
    
    // Bootstrap navigation menu
    $.ajax({
      async: false,
      url: '/ui/navigation/',
      success: function(resp) {
        
        // Set up view mode
        // IONUX.Dashboard.ViewMode = new IONUX.Models.ViewMode();
        new IONUX.Views.ViewControls().render().el;
        
        // MAPS Sidebar (initially shown)
        // Observatory selector - observatories reset (triggers initial map markers)
        IONUX.Dashboard.Observatories.reset(resp.data.observatories);
        new IONUX.Views.ObservatorySelector({collection: IONUX.Dashboard.Observatories, title: 'Site'}).render().el;
        new IONUX.Views.MapFilter().render().el;
        
        // RESOURCES Sidebar (initially hidden)
        // Org selector
        IONUX.Dashboard.Orgs.reset(resp.data.orgs);
        new IONUX.Views.OrgSelector({collection: IONUX.Dashboard.Orgs, title: 'Facility'}).render().el;
        new IONUX.Views.ListFilter().render().el;
      
        console.log('IONUX.Dashboard.Orgs', IONUX.Dashboard.Orgs);
        console.log('IONUX.Dashboard.Observatories', IONUX.Dashboard.Observatories);
        
      }
    });
    
    
    router.handle_navigation();
    return router;
    
    
    
    // .complete(function(resp) {
    //   Backbone.history.start({pushState:true, hashChange: false});
    // 
    //   new IONUX.Views.Topbar({model: IONUX.SESSION_MODEL}).render().el
    //   new IONUX.Views.Search().render().el;
    //   new IONUX.Views.HelpMenu({model: IONUX.SESSION_MODEL}).render().el;
    //   
    // 
    //   
    //   // Bootstrap navigation menu
    //   $.ajax({
    //     async: false,
    //     url: '/ui/navigation/',
    //     success: function(resp) {
    //       console.log('ui/navigation', resp);
    // 
    //       // Set up view mode
    //       IONUX.Dashboard.ViewMode = new IONUX.Models.ViewMode();
    //       new IONUX.Views.ViewControls({model: IONUX.Dashboard.ViewMode}).render().el;
    //       
    //       IONUX.Dashboard.Observatories.set(resp.data.observatories);
    //       new IONUX.Views.ObservatorySelector({collection: IONUX.Dashboard.Observatories, title: 'Site'}).render().el;
    // 
    // 
    //       router.handle_navigation();
    //       return router;
    // 
    //       console.log('IONUX.Dashboard.Observatories', IONUX.Dashboard.Observatories);
    //     }
    //   });
    //   
    //   // nag popup!
    //   if (IONUX.SESSION_MODEL.get('is_logged_in') && !IONUX.SESSION_MODEL.get('is_registered'))
    //     router.user_profile();
    // });
  },
  setup_ajax_error: function(){
    $(document).ajaxError(function(evt, resp){
      var error_obj = JSON.parse(resp['responseText'])['data']['GatewayError'];
      var open_modal = $('.modal-ooi').is(':visible') ? true : false;
      if (open_modal) $('#action-modal').modal('hide').remove();
      new IONUX.Views.Error({error_obj:error_obj,open_modal:open_modal}).render().el;
    });
  },
  is_logged_in: function(){
    return IONUX.SESSION_MODEL.get('is_logged_in');
  },
  is_owner: function(){
    var user_id = IONUX.SESSION_MODEL.get('user_id');
    var owner_match = _.findWhere(MODEL_DATA.owners, {_id: user_id}) ? true : false;
    return owner_match;
  },
  Spinner: {
    large: {
      lines: 13, 
      length: 7,
      width: 4,
      radius: 10,
      corners: 1,
      rotate: 0,
      color: '#999',
      speed: 1,
      trail: 60,
      shadow: false,
      hwaccel: false,
      className: 'spinner',
      zIndex: 2e9,
      top: 'auto',
      left: 'auto'
    }
  },
  EditResourceBlacklist: []
}
