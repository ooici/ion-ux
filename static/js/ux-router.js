IONUX.Router = Backbone.Router.extend({
    routes: {
        "": "dashboard",
        "instruments/:instrument_id/command/": "instrument_command_facepage",
        ":resource_type/:view_type/:resource_id/": "facepage",
        'interactions/': 'interactions',

        // LCA routes
        "userprofile/": "user_profile",
        "observatories/": "observatories",
        "observatories/:marine_facility_id/": "observatory_facepage",
        "platforms/":"platforms",
        "platforms/:platform_id/": "platform_facepage",
        "platform_models/": "platform_models",
        "platform_models/:platform_model_id/": "platform_model_facepage",
        "instruments/":"instruments",
        "instruments/:instrument_id/" : "instrument_facepage",
        "instrument_models/": "instrument_models",
        "instrument_models/:instrument_model_id/": "instrument_model_facepage",
        "instrument_agents/": "instrument_agents",
        "instrument_agents/:instrument_agent_id/": "instrument_agent_facepage",
        "data_process_definitions/": "data_process_definitions",
        "data_process_definitions/:data_process_definition_id/": "data_process_definition_facepage",
        "data_products/": "data_products",
        "data_products/:data_product_id/": "data_product_facepage",
        "users/": "users",
        "users/:user_id/": "user_facepage",
    },
    
    dashboard: function() {
        this._reset();
    },
    
    facepage: function(resource_type, view_type, resource_id) {
        this._reset();
        // Initialize model - TODO: refactor with generic model?
        if (resource_type == 'instruments') {
            var facepage_model = new IONUX.Models.InstrumentFacepageModel({instrument_id: resource_id});
        } else if (resource_type == 'platforms') {
            var facepage_model = new IONUX.Models.PlatformFacepageModel({platform_id: resource_id});
        } else if (resource_type == 'observatories') {
            var facepage_model = new IONUX.Models.ObservatoryFacepageModel({observatory_id: resource_id});
        } else if (resource_type == 'data_products') {
            var facepage_model = new IONUX.Models.DataProductFacepageModel({data_product_id: resource_id});
        } else if (resource_type == 'users') {
            var facepage_model = new IONUX.Models.UserFacepageModel({user_id: resource_id});
        };
        
        // Initialize view.
        var view_id = IONUX.DefinedViews[resource_type]['view_id'];
        if (view_type == 'hybrid') {
            var template_id = IONUX.DefinedViews[resource_type]['template_id'];
            $('#dynamic-container').empty().html($(template_id).html()).show();
        } else {
            $('#dynamic-container').empty().html($('#' + view_id).html()).show();
        };
        
        // Data.
        facepage_model.fetch({success: function() {
            page_builder(LAYOUT_OBJECT[view_id], facepage_model);
        }});
    },


    // BEGIN LCA demo routes    
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

    platforms: function(){
        this._reset();
        // $("#platforms-container").show();
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

    platform_models: function(){
        this._reset();
        $("#platform-models-container").show();
        this.platformModelsList = new IONUX.Collections.PlatformModels();
        var platformModelsView = new IONUX.Views.PlatformModelsView({collection:this.platformModelsList});
        this.platformModelsList.fetch();
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

    instrument_facepage: function(instrument_id) {
        this._reset();
        var fpModel = new IONUX.Models.InstrumentFacepageModel({instrument_id: instrument_id});
        window.view = new IONUX.Views.InstrumentFacepage({model:fpModel});
        fpModel.fetch();
    },

    instrument_command_facepage : function(instrument_id) {
        this._reset();
        var fpModel = new IONUX.Models.InstrumentFacepageModelLegacy({instrument_id: instrument_id});
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
    
    // END LCA demo routes
    
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
