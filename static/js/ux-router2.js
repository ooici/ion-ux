IONUX.Router = Backbone.Router.extend({
  routes: {
    ":resource_type/:view_type/:resource_id/" : "page"
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
  
});