IONUX.Router = Backbone.Router.extend({
    routes: {
        "": "dashboard",
        "table/": "table",
        "userprofile/": "user_profile",
        "observatories/": "observatories",
        "observatories/new/": "observatory_new",
        "observatories/dyn/:observatory_id/": "dynamic_observatory_facepage",
        "observatories/:marine_facility_id/": "observatory_facepage",
        "observatories/:marine_facility_id/edit/": "observatory_edit",
        "platforms/":"platforms",
        "platforms/new/": "platform_new",
        "platforms/dyn/:platform_id/" : "dynamic_platform_facepage",
        "platforms/:platform_id/": "platform_facepage",
        "platform_models/": "platform_models",
        "platform_models/new/": "platform_model_new",
        "platform_models/:platform_model_id/": "platform_model_facepage",
        "instruments/":"instruments",
        "instruments/new/":"instrument_new",
        "instruments/dyn/:instrument_id/" : "dynamic_instrument_facepage",
        "instruments/:instrument_id/" : "instrument_facepage",
        "instruments/:instrument_id/command/": "instrument_command_facepage",
        "instrument_models/": "instrument_models",
        "instrument_models/new/": "instrument_model_new",
        "instrument_models/:instrument_model_id/": "instrument_model_facepage",
        "instrument_agents/": "instrument_agents",
        "instrument_agents/:instrument_agent_id/": "instrument_agent_facepage",
        "frame_of_references/": "frame_of_references",
        "frame_of_references/new/": "frame_of_reference_new",
        "frame_of_references/:frame_of_reference_id/": "frame_of_reference_facepage",
        "data_process_definitions/": "data_process_definitions",
        "data_process_definitions/:data_process_definition_id/": "data_process_definition_facepage",
        "data_products/": "data_products",
        "data_products/dyn/:data_product_id/" : "dynamic_data_product_facepage",
        "data_products/:data_product_id/": "data_product_facepage",
        "users/": "users",
        "users/:user_id/": "user_facepage",
        "resource_types/:resource_type_id/": "resource_type_details",
    },

    dynamic_observatory_facepage: function(observatory_id) {
        this._reset();
        var view_id = '2050006';
        var observatoryFacepageModel = new IONUX.Models.ObservatoryFacepageModel({observatory_id: observatory_id});
        new IONUX.Views.Page({model: observatoryFacepageModel, view_id: view_id, layout: LAYOUT_OBJECT[view_id]});
        observatoryFacepageModel.fetch();
    },
    
    dynamic_platform_facepage: function(platform_id) {
        this._reset();
        var view_id = '2050002';
        var platformFacepageModel = new IONUX.Models.PlatformFacepageModel({platform_id: platform_id});
        new IONUX.Views.Page({model: platformFacepageModel, view_id: view_id, layout: LAYOUT_OBJECT[view_id]});
        platformFacepageModel.fetch();
    },

    dynamic_instrument_facepage: function(instrument_id) {
        this._reset();
        var view_id = '2050001';
        var instrumentFacepageModel = new IONUX.Models.InstrumentFacepageModel({instrument_id: instrument_id});
        new IONUX.Views.Page({model: instrumentFacepageModel, view_id: view_id, layout: LAYOUT_OBJECT[view_id]});
        instrumentFacepageModel.fetch();
    },
    
    dynamic_data_product_facepage: function(data_product_id) {
        console.log('dynamic_data_product_facepage');
        this._reset();
        var view_id = '2050007';
        var dataproductFacepageModel = new IONUX.Models.DataProductFacepageModel({data_product_id: data_product_id});
        new IONUX.Views.Page({model: dataproductFacepageModel, view_id: view_id, layout: LAYOUT_OBJECT[view_id]});
        dataproductFacepageModel.fetch();
    },
    
    
    dashboard: function() {},
    
    data_products: function() {
        this._reset();
        this.dataProductsList = new IONUX.Collections.DataProducts();
        this.dataProductsListView = new IONUX.Views.DataProducts({collection: this.dataProductsList});
        this.dataProductsList.fetch();
    },
  
    user_profile: function() {
        this._reset();
        var fpModel = new IONUX.Models.UserRegistrationModel();
        new IONUX.Views.UserRegistration({model:fpModel});
        fpModel.fetch();
    },
  
    observatories: function(){
        this._reset();
        $("#observatories-container").show();
        this.observatoriesList = new IONUX.Collections.ObservatoryCollection();
        this.observatoriesListView = new IONUX.Views.ObservatoriesView({collection:this.observatoriesList});
        this.observatoriesList.fetch();
    },
  
    observatory_new: function() {
        this._reset();
        this.newObservatoryView = new IONUX.Views.NewObservatoryView({model: new IONUX.Models.Observatory()});
        this.newObservatoryView.render();
    },

    observatory_facepage: function(observatory_id){
        this._reset();
        var fpModel = new IONUX.Models.ObservatoryFacepageModel({observatory_id:observatory_id});
        new IONUX.Views.ObservatoryFacepage({model:fpModel});
        fpModel.fetch();

        var urCollection = new IONUX.Collections.UserRequestCollection();
        urCollection.observatory_id = observatory_id; //XXX better way to set this?
        var userRequestsView = new IONUX.Views.UserRequestsView({collection:urCollection, facepage_model: fpModel});
        urCollection.fetch();
    },

    observatory_edit: function(marine_facility_id){
        this._reset();    
        var oModel = new IONUX.Models.ObservatoryFacepageModel({marine_facility_id: marine_facility_id});
        var editView = new IONUX.Views.ObservatoryEditView({model:oModel});
        oModel.fetch();
    },

    platforms: function(){
        this._reset();
        $("#platforms-container").show();
        this.platformsList = new IONUX.Collections.Platforms();
        var platformsView = new IONUX.Views.PlatformsView({collection:this.platformsList});
        this.platformsList.fetch();
    },

    platform_new: function() {
        this._reset();
        this.newPlatformView = new IONUX.Views.NewPlatformView({model: new IONUX.Models.Platform()});
        this.newPlatformView.render();    
    },

    platform_facepage: function(platform_id) {
        this._reset();
        var fpModel = new IONUX.Models.PlatformFacepageModel({platform_id: platform_id});
        new IONUX.Views.PlatformFacepage({model:fpModel});
        fpModel.fetch();
    },

    platform_models: function(){
        this._reset();
        $("#platform-models-container").show();
        this.platformModelsList = new IONUX.Collections.PlatformModels();
        var platformModelsView = new IONUX.Views.PlatformModelsView({collection:this.platformModelsList});
        this.platformModelsList.fetch();
    },

    platform_model_new: function() {
        this._reset();
        this.platformModelNewView = new IONUX.Views.NewPlatformModel({model: new IONUX.Models.PlatformModel()});
        this.platformModelNewView.render();
    },

    platform_model_facepage: function(platform_model_id) {
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

    instrument_new: function() {
        this._reset();
        this.instrumentNewView = new IONUX.Views.NewInstrumentView({model: new IONUX.Models.Instrument()});
        this.instrumentNewView.render();
    },

    instrument_facepage: function(instrument_id) {
        this._reset();
        var fpModel = new IONUX.Models.InstrumentFacepageModel({instrument_id: instrument_id});
        window.view = new IONUX.Views.InstrumentFacepage({model:fpModel});
        fpModel.fetch();
    },

    instrument_command_facepage : function(instrument_id) {
        this._reset();
        var fpModel = new IONUX.Models.InstrumentFacepageModel({instrument_id: instrument_id});
        new IONUX.Views.InstrumentCommandFacepage({model: fpModel});
        fpModel.fetch();
    },

    instrument_models: function() {
        this._reset();
        this.instrumentModelsList = new IONUX.Collections.InstrumentModels();
        var instrumentModelsView = new IONUX.Views.InstrumentModels({collection: this.instrumentModelsList});
        this.instrumentModelsList.fetch();
        $("#instrument-models-container").show();
    },

    instrument_model_new: function() {
        this._reset();
        this.instrumentModelView = new IONUX.Views.NewInstrumentModel({model: new IONUX.Models.PlatformModel()});
        this.instrumentModelView.render();
    },

    instrument_model_facepage: function(instrument_model_id) {
        this._reset();
        var fpModel = new IONUX.Models.InstrumentModelFacepageModel({instrument_model_id: instrument_model_id});
        new IONUX.Views.InstrumentModelFacepage({model: fpModel});
        fpModel.fetch();
    },

    instrument_agents: function() {
        this._reset();
        $("#instrument-agents-container").show();
        this.instrumentAgentsList = new IONUX.Collections.InstrumentAgents();
        var instrumentAgentsView = new IONUX.Views.InstrumentAgents({collection: this.instrumentAgentsList});
        this.instrumentAgentsList.fetch();
    },

    instrument_agent_facepage: function(instrument_agent_id) {
        this._reset();
        var fpModel = new IONUX.Models.InstrumentAgentFacepageModel({instrument_agent_id: instrument_agent_id});
        new IONUX.Views.InstrumentAgentFacepage({model: fpModel});
        fpModel.fetch();
    },

    data_process_definitions: function() {
        this._reset();
        $("#data-process-definitions-container").show();
        this.dataProcessDefinitionsList = new IONUX.Collections.DataProcessDefinitions();
        var dataProcessDefinitionsView = new IONUX.Views.DataProcessDefinitions({collection: this.dataProcessDefinitionsList});
        this.dataProcessDefinitionsList.fetch();
    },

    data_process_definition_facepage: function(data_process_definition_id) {
        this._reset();
        var fpModel = new IONUX.Models.DataProcessDefinitionFacepageModel({data_process_definition_id: data_process_definition_id});
        new IONUX.Views.DataProcessDefinitionFacepage({model: fpModel});
        fpModel.fetch();
    },

    data_product_facepage: function(data_product_id) {
        this._reset();
        var fpModel = new IONUX.Models.DataProductFacepageModel({data_product_id: data_product_id});
        new IONUX.Views.DataProductFacepage({model: fpModel});
        fpModel.fetch();
    },

    frame_of_references: function() {
        this._reset();
        $("#frame-of-references-container").show();
        this.frameOfReferencesList = new IONUX.Collections.FrameOfReferences();
        var frameOfReferencesView = new IONUX.Views.FrameOfReferences({collection: this.frameOfReferencesList});
        this.frameOfReferencesList.fetch();
    },

    frame_of_reference_new: function() {
        this._reset();
        this.frameOfReferenceView = new IONUX.Views.NewFrameOfReferenceView({model: new IONUX.Models.FrameOfReference()})
        this.frameOfReferenceView.render();
    },

    frame_of_reference_facepage : function(frame_of_reference_id) {
        this._reset();
        var fpModel = new IONUX.Models.FrameOfReferenceFacepage({frame_of_reference_id: frame_of_reference_id});
        this.forView = new IONUX.Views.FramesOfReferenceFacepage({model: fpModel});
        fpModel.fetch();
    },

    users: function() {
        this._reset();
        $("#users-container").show();
        this.usersList = new IONUX.Collections.Users();
        this.usersListView = new IONUX.Views.UsersView({collection: this.usersList});
        this.usersList.fetch();
    },

    user_facepage : function(user_id) {
        this._reset();
        var fpModel = new IONUX.Models.UserFacepageModel({user_id: user_id});
        new IONUX.Views.UserFacepage({model: fpModel});
        fpModel.fetch();
    },

    resource_type_details: function(resource_type_id) {
        this._reset();
    },

    handle_navigation: function(){
        var self = this;
        $(document).on("click", "a", function(e) {
            if ($(e.target).hasClass('external')) return true;
            self.navigate($(this).attr('href'), {trigger:true});
            return false;
        });
    },

    // graceful Backbone handling of full page refresh on non '/' url.
    handle_url: function(current_url){
        if (current_url != "/"){
            this.navigate(current_url, {trigger:true});
        }
    },

    _reset: function(){ //reset the UI
        $(".viewcontainer").hide();
    }

});
