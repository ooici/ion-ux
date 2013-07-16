IONUX = {
  Dashboard: {},
  Templates: {},
  Interactions: {},
  Models:{},
  Collections:{},
  Views: {},
  Router: {},
  init: function(){
    
    // HACK - temporarily disable salt.css on init;
    $('.salt').prop('disabled', true);
    
    var router = new IONUX.Router();
    IONUX.ROUTER = router;
    IONUX.setup_ajax_error();
        
    // Bootstrap navigation menu
    $.ajax({
      async: false,
      url: '/ui/navigation/',
      success: function(resp) {
        new IONUX.Views.ViewControls().render().el;
        
        // MAPS Sidebar (initially shown)
        IONUX.Dashboard.Observatories = new IONUX.Collections.Observatories(resp.data.observatories)
        new IONUX.Views.ObservatorySelector({collection: IONUX.Dashboard.Observatories, title: 'Site'}).render().el;
        new IONUX.Views.MapFilter().render().el;
        
        // RESOURCES Sidebar (initially hidden)
        IONUX.Dashboard.Orgs = new IONUX.Collections.Orgs(resp.data.orgs);
        new IONUX.Views.OrgSelector({collection: IONUX.Dashboard.Orgs, title: 'Facility'}).render().el;
        new IONUX.Views.ListFilter().render().el;
        
        new IONUX.Views.DataAssetFilter().render().el;
        new IONUX.Views.DPFilterActions({el: '#map-filter-heading'});
        // new IONUX.Views.ListFilterActions({el: '#list-filter-heading'});
        
        // new IONUX.Views.AssetFilterActions({el: '#map-filter-heading'});

        $.ajax({
            url: '/get_data_product_group_list/',
            success: function(resp, resp2) {
              new IONUX.Views.DataProductFilter({group_list: resp.data}).render().el;
              $('#left .map-view').show();
            }
        });
      },
      complete: function(resp){
        // Wrapper initially hidden to prevent unformed content from appearing while
        // API calls being made to draw the dashboard;
        $('.wrapper').show();
        Backbone.history.start({pushState:true, hashChange: false});
        // router.handle_navigation();
        // return router;
      },
    });
    
    IONUX.SESSION_MODEL = new IONUX.Models.Session();
    IONUX.SESSION_MODEL.fetch({
      success: function(resp) {
        new IONUX.Views.Topbar({model: IONUX.SESSION_MODEL}).render().el
        new IONUX.Views.Search().render().el;
        
        // Check if on dashboard or facepage, render appropriate menu.
        var href = window.location.href.split('/');
        if (_.contains(href, 'face') || _.contains(href, 'command')) {
          new IONUX.Views.ViewActions();
        } else {
          new IONUX.Views.DashboardActions();
        };

        new IONUX.Views.HelpMenu({model: IONUX.SESSION_MODEL}).render().el;
        
        // nag popup!
        if (IONUX.SESSION_MODEL.get('is_logged_in') && !IONUX.SESSION_MODEL.get('is_registered'))
          router.user_profile();
        
        // Enable session polling for updated roles, possibly UI version changes.
        IONUX.SESSION_MODEL.start_polling();
      }
    });
    
    router.handle_navigation();
    return router;
  },
  setup_ajax_error: function(){
    $(document).ajaxError(function(evt, resp){
      try {
        var json_obj = JSON.parse(resp['responseText'])
        var error_obj = null;
        if (_.isArray(json_obj.data)) {
          error_obj = _.pluck(_.compact(json_obj.data), 'GatewayError');
        } else {
          error_obj = [json_obj.data.GatewayError];
        } 
      } catch(err) {
        // not all errors are JSON or GatewayErrors.. still support them
        error_obj = [{Message:resp['responseText']}]
      }

      $('#spinner').remove();

      var open_modal = $('.modal-ooi').is(':visible') ? true : false;
      if (open_modal) $('#action-modal').modal('hide').remove();

      var force_logout = _.any(_.compact(_.pluck(error_obj, 'NeedLogin')));

      new IONUX.Views.Error({error_objs:error_obj,open_modal:open_modal, force_logout:force_logout}).render().el;
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
