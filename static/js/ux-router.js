IONUX.Router = Backbone.Router.extend({

  routes: {
    "": "dashboard",
    "data": "data_resource",
    "data/:data_resource_id": "data_resource_details",
    "observatories": "observatories",
    "facilities": "marine_facilities",
    "platforms":"platforms",
    "instruments":"instruments",
    "resource_types/:resource_type_id": "resource_type_details"
  },

  dashboard: function(){
    this._reset();
    $("#dashboard-container").show();
  },

  marine_facilities: function(){
    this._reset();
    $("#marine-facilities-container").show();
    this.marineFacilitiesList = new IONUX.Collections.MarineFacilities();
    this.marineFacilitiesListView = new IONUX.Views.MarineFacilitiesView({collection:this.marineFacilitiesList});
    this.marineFacilitiesList.fetch();
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
    var observatories_view = new IONUX.Views.ObservatoriesView();
    observatories_view.render();
  },
  
  platforms: function(){
    this._reset();
    $("#platforms-container").show();
    var platforms_view = new IONUX.Views.PlatformsView();
    platforms_view.render();
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

  _reset: function(){ //reset the UI
    $(".viewcontainer").hide();
  }

});
