IONUX.Router = Backbone.Router.extend({

  routes: {
    "": "init",
    "data_resource_details/:data_resource_id": "data_resource_details"
  },

  _reset: function(){ //reset the UI
    $(".viewcontainer").empty().hide();
  },

  init: function(){
    this._reset();
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
  }

});
