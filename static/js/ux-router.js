IONUX.Router = Backbone.Router.extend({

  routes: {
    "": "dashboard",
    "data": "data_resource",
    "data/:data_resource_id": "data_resource_details",
    "observatories": "observatories",
    "observatories/:marine_facility_id": "observatory_facepage",
    "platforms":"platforms",
    "platforms/:platform_id": "platform_facepage",
    "instruments":"instruments",
    "resource_types/:resource_type_id": "resource_type_details"
  },

  dashboard: function(){
    this._reset();
    $("#dashboard-container").show();
    if (_.isUndefined(this.observatory_modal)){
      this.observatory_modal = new IONUX.Views.ObservatoryModalView();
    }
    this.observatory_modal.render();
  },

  data_resource: function(){
    this._reset();
    this.dataResourceList = new IONUX.Collections.DataResources();
    this.dataResourceListView = new IONUX.Views.DataResourceView({collection:this.dataResourceList});
    this.dataResourceList.fetch();
  },

  data_resource_details: function(data_resource_id){
    this._reset();
    var detailsModel = new IONUX.Models.DataResourceDetails({data_resource_id:data_resource_id});
    this.dataResourceDetailView = new IONUX.Views.DataResourceDetailView({model:detailsModel});
    detailsModel.fetch();
  },

  observatories: function(){
    this._reset();
    $("#observatories-container").show();
    this.observatoriesList = new IONUX.Collections.ObservatoryCollection();
    this.observatoriesListView = new IONUX.Views.ObservatoriesView({collection:this.observatoriesList});
    this.observatoriesList.fetch();
  },

  observatory_facepage: function(marine_facility_id){
    this._reset();
    var fpModel = new IONUX.Models.ObservatoryFacepageModel({marine_facility_id:marine_facility_id});
    new IONUX.Views.ObservatoryFacepage({model:fpModel});
    fpModel.fetch();
  },
  
  platforms: function(){
    this._reset();
    $("#platforms-container").show();
    var platforms_view = new IONUX.Views.PlatformsView();
    platforms_view.render();
  },  
  
  platform_facepage: function(platform_id) {
    this._reset();
    var fpModel = new IONUX.Models.PlatformFacepageModel({platform_id: platform_id});
    new IONUX.Views.PlatformFacepage({model:fpModel});
    console.log('You are here.');
    fpModel.fetch();
  },

  instruments: function(){
    this._reset();
    $("#instruments-container").show();
    var instruments_view = new IONUX.Views.InstrumentsView();
    instruments_view.render();
  },
  
  resource_type_details: function(resource_type_id) {
      this._reset();
  },

  handle_navigation: function(){
    var self = this;
    $(document).on("click", "a", function(e) {
        self.navigate($(this).attr('href'), {trigger:true});
        return false;
    });
  },

  handle_url: function(current_url){
    // graceful Backbone handling of full page refresh on non '/' url.
    if (current_url != "/"){
      this.navigate(current_url, {trigger:true});
    }
  },

  _reset: function(){ //reset the UI
    $(".viewcontainer").hide();
  }

});
