IONUX.Router = Backbone.Router.extend({
  routes: {
    ":resource_type/:view_type/:resource_id/" : "page"
    ":resource_type/:view_type/:resource_id/" : "page",
    "dashboard": "showDashboard",
    "assettracking": "assetTracking",
    "resourcemgmt": "resource_management"
  },
  
  page: function(resource_type, view_type, resource_id){
    console.log('rendering ' + resource_type + ' ' + view_type + ' id:' + resource_id);
    $('#mainNewTab').hide();
    $('#mainLegacyTab').show();
    // Todo move into own view
    $('#dynamic-container').html('<div id="spinner"></div>').show();
    new Spinner(IONUX.Spinner.large).spin(document.getElementById('spinner'));
    
    var resource_extension = new IONUX.Models.ResourceExtension({resource_type: resource_type, resource_id: resource_id});
    var self = this;
    resource_extension.fetch()
      .success(function(model, resp) {
        $('#dynamic-container').show();
        $('#dynamic-container').html($('#' + AVAILABLE_LAYOUTS[view_type]).html());
        $('.span9 li,.span3 li').hide();
        render_page(resource_type, resource_id, model);
        // Pull back recent events as a 2nd request.
        fetch_events(window.MODEL_DATA['resource_type'], resource_id);
      });

  },

  showDashboard: function() {
    IONUX2.setPageView("searchResults");
      if(IONUX2.getMapState() == "mapHidden"){
          IONUX2.setMapState('mapSplit');
      }
  },

  assetTracking: function() {
    IONUX2.setPageView("assetTracking");
  },

  resource_management: function() {
    console.log("resource management route");
    IONUX2.setPageView("createResource");
  }
  
});