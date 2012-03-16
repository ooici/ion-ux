IONUX.Router = Backbone.Router.extend({

  routes: {
    "": "dashboard",
    "register/": "user_registration",
    "observatories/": "observatories",
    "observatories/:marine_facility_id/": "observatory_facepage",
    "platforms/":"platforms",
    "platforms/:platform_id/": "platform_facepage",
    "platform_models/:platform_model_id/": "platform_model_facepage",
    "instruments/":"instruments",
    "instruments/:instrument_id/" : "instrument_facepage",
    "instruments/:instrument_id/command/": "instrument_command_facepage",
    "instrument_models/:instrument_model_id/": "instrument_model_facepage",
    "instrument_agents/:instrument_agent_id/": "instrument_agent_facepage",
    "frames_of_references/": "frames_of_reference_facepage",
    "data_process_definitions/:data_process_definition_id/": "data_process_definition_facepage",
    "data_products/:data_product_id/": "data_product_facepage",
    "users/": "user_facepage",
    "resource_types/:resource_type_id/": "resource_type_details",
  },
  
  user_registration: function() {
    this._reset();
    var fpModel = new IONUX.Models.UserFacepageModel();
    new IONUX.Views.UserRegistration({model:fpModel});
    fpModel.fetch();
  },
  
  dashboard: function(){
    this._reset();
    var search = new IONUX.Views.Search();
    search.render();
    
    $("#dashboard-container").show();
    if (_.isUndefined(this.observatory_modal)){
      this.observatory_modal = new IONUX.Views.ObservatoryModalView();
    }
    this.observatory_modal.render();
  },

  //   LEFT FOR REFERENCE -- VIEWS NO LONGER NEEDED
  //   data_resource: function(){
  //   this._reset();
  //   this.dataResourceList = new IONUX.Collections.DataResources();
  //   this.dataResourceListView = new IONUX.Views.DataResourceView({collection:this.dataResourceList});
  //   this.dataResourceList.fetch();
  // },
  // 
  // data_resource_details: function(data_resource_id){
  //   this._reset();
  //   var detailsModel = new IONUX.Models.DataResourceDetails({data_resource_id:data_resource_id});
  //   this.dataResourceDetailView = new IONUX.Views.DataResourceDetailView({model:detailsModel});
  //   detailsModel.fetch();
  // },

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
    this.platformsList = new IONUX.Collections.Platforms();
    var platformsView = new IONUX.Views.PlatformsView({collection:this.platformsList});
    this.platformsList.fetch();
  },
  
  platform_facepage: function(platform_id) {
    this._reset();
    var fpModel = new IONUX.Models.PlatformFacepageModel({platform_id: platform_id});
    new IONUX.Views.PlatformFacepage({model:fpModel});
    fpModel.fetch();
  },
  
  platform_model_facepage: function(platform_model_id) {
    console.log(platform_model_id);
    this._reset();
    var fpModel = new IONUX.Models.PlatformModelFacepageModel({platform_model_id: platform_model_id});
    new IONUX.Views.PlatformModelFacepage({model: fpModel});
    fpModel.fetch();
  },
  
  instruments: function(){
    this._reset();
    $("#instruments-container").show();
    this.instrumentsList = new IONUX.Collections.Instruments();
    var instrumentsView = new IONUX.Views.InstrumentsView({collection: this.instrumentsList});
    this.instrumentsList.fetch();
  },
  
  instrument_facepage: function(instrument_id) {
    this._reset();
    var fpModel = new IONUX.Models.InstrumentFacepageModel({instrument_id: instrument_id});
    window.view = new IONUX.Views.InstrumentFacepage({model:fpModel});
    fpModel.fetch();
  },
  
  instrument_command_facepage : function(instrument_id) {
    // this._reset();
    // var instrumentCommandFacepageView = new IONUX.Views.InstrumentCommandFacepage();
    // instrumentCommandFacepageView.render();
    
    this._reset();
    var fpModel = new IONUX.Models.InstrumentFacepageModel({instrument_id: instrument_id});
    new IONUX.Views.InstrumentCommandFacepage({model: fpModel});
    fpModel.fetch();
  },
  
  instrument_model_facepage: function(instrument_model_id) {
    this._reset();
    var fpModel = new IONUX.Models.InstrumentModelFacepageModel({instrument_model_id: instrument_model_id});
    new IONUX.Views.InstrumentModelFacepage({model: fpModel});
    fpModel.fetch();
  },
  
  instrument_agent_facepage: function(instrument_agent_id) {
    this._reset();
    var fpModel = new IONUX.Models.InstrumentAgentFacepageModel({instrument_agent_id: instrument_agent_id});
    new IONUX.Views.InstrumentAgentFacepage({model: fpModel});
    fpModel.fetch();
  },
  
  data_process_definition_facepage: function(data_process_definition_id) {
    this._reset();
    var fpModel = new IONUX.Models.DataProcessDefinitionFacepageModel({data_process_definition_id: data_process_definition_id});
    new IONUX.Views.DataProcessDefinitionFacepage({model: fpModel});
    fpModel.fetch();
  },
  
  data_product_facepage: function(data_product_id) {
    console.log("DataProduct!")
    this._reset();
    var fpModel = new IONUX.Models.DataProductFacepageModel({data_product_id: data_product_id});
    new IONUX.Views.DataProductFacepage({model: fpModel});
    fpModel.fetch();
  },
  
  frames_of_reference_facepage : function() {
    this._reset();
    var framesOfReferenceFacepage = new IONUX.Views.FramesOfReferenceFacepage();
    framesOfReferenceFacepage.render();
  },
  
  user_facepage : function() {
    this._reset();
    var userFacepage = new IONUX.Views.UserFacepage();
    userFacepage.render();
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
