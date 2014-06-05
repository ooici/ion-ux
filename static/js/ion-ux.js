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
    // $('.salt').prop('disabled', true);
    
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
        IONUX.Dashboard.Observatories = new IONUX.Collections.Observatories(_.sortBy(resp.data.observatories,function(o){return o.spatial_area_name + (o.local_name ? o.local_name : '') + o.name}))
        IONUX.Dashboard.PlatformSites = new IONUX.Collections.PlatformSites(resp.data.platformSites)
        new IONUX.Views.ObservatorySelector({collection: IONUX.Dashboard.Observatories, title: 'Site'}).render().el;
        new IONUX.Views.MapFilter().render().el;
        
        // RESOURCES Sidebar (initially hidden)
        IONUX.Dashboard.Orgs = new IONUX.Collections.Orgs(_.sortBy(resp.data.orgs,function(o){return o.name}));
        new IONUX.Views.OrgSelector({collection: IONUX.Dashboard.Orgs, title: 'Facility'}).render().el;
        new IONUX.Views.ListFilter().render().el;
        
        new IONUX.Views.DataAssetFilter().render().el;
        new IONUX.Views.DPFilterActions({el: '#map-filter-heading'});

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
        // $('.wrapper').show();
        // console.log('**** STARTING HISTORY!!!');
        // Backbone.history.start({pushState:true, hashChange: false});
      },
    });
    
    IONUX.SESSION_MODEL = new IONUX.Models.Session();
    IONUX.SESSION_MODEL.fetch({
      async: false, // Don't allow anything to fire until this is done!  Without this, links straight to facepages weren't initting right.
      success: function(resp) {
        new IONUX.Views.Topbar({model: IONUX.SESSION_MODEL}).render().el;
        new IONUX.Views.HelpMenu({model: IONUX.SESSION_MODEL}).render().el;
        new IONUX.Views.Search().render().el;
        
        // Check if on dashboard or facepage, render appropriate menu.
        var href = window.location.href.split('/');
        if (_.contains(href, 'face') || _.contains(href, 'command')) {
          /*
            The following line is commented out because it appears that
            ViewActions() should only be initted by the render_page()
            call from ux-router.js instead of here.
          */
          // new IONUX.Views.ViewActions();
        } else {
          new IONUX.Views.DashboardActions();
        };

        // nag popup!
        if (IONUX.SESSION_MODEL.get('is_logged_in') && !IONUX.SESSION_MODEL.get('is_registered'))
          router.user_profile();
        
        // Enable session polling for updated roles, possibly UI version changes.
        IONUX.SESSION_MODEL.set_polling();
        
        // set theme;
        IONUX.set_ui_theme();
        
      }

   });
    

    console.log('**** STARTING HISTORY!!!');
    Backbone.history.start({pushState:true, hashChange: false});
    
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
  // Returns Org names with create privileges. Otherwise, it returns empty list
  createRoles: function(){
    if(this.is_logged_in())
    {
      return _.filter(_.keys(IONUX.SESSION_MODEL.get('roles')), function(r){
        return _.size(IONUX.SESSION_MODEL.get('roles')[r]) > 1;
      });
    } else {
      return [];
    }
  },
  is_logged_in: function(){
    return IONUX.SESSION_MODEL.get('is_logged_in');
  },
  is_owner: function(){
    var user_id = IONUX.SESSION_MODEL.get('user_id');
    var owner_match = _.findWhere(MODEL_DATA.owners, {_id: user_id}) ? true : false;
    return owner_match;
  },
  set_ui_theme: function() {
    var ui_theme = IONUX.SESSION_MODEL.get('ui_theme_dark');

    if (ui_theme) {
      $('.salt').prop('disabled', true);
      $('.pepper').prop('disabled', false);
    } else {
      $('.pepper').prop('disabled', true);
      $('.salt').prop('disabled', false);
    };
  },
  
  Spinner: {
    large: {
      lines: 13, 
      length: 7,
      width: 4,
      radius: 10,
      corners: 1,
      rotate: 0,
      color: '#ddd',
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
