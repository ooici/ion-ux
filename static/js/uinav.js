var UINAV = {
	reorder: function(orderArray, configurationList, elementContainer) {
        $.each(orderArray, function(key, val){
            console.log("value is " + val);
            elementContainer.append($("#"+val));
            for (item in configurationList) {
            	if (configurationList[item]) {
            		$('#'+item + ' .leftAccordionContents').show();
            	}
            	else {
            		$('#'+item + ' .leftAccordionContents').hide();
            	}
            }
     	});
    },
    reorder_bottom: function(orderArray, configurationList, elementContainer) {
        $.each(orderArray, function(key, val){
            console.log("value is " + val);
            elementContainer.append($("#"+val));
            for (item in configurationList) {
                if (configurationList[item]) {
                    $('#'+item + ' .accordionContents').show();
                }
                else {
                    $('#'+item + ' .accordionContents').hide();
                }
            }
        });
    },
    loadSpatial: function(spatialModel) {
        IONUX2.Models.spatialModelInstance.updateAttributes(spatialModel);
    },
    loadTemporal: function(temporalModel) {
        IONUX2.Models.temporalModelInstance.updateAttributes(temporalModel);
    },
    loadFacilities: function(facilitiesModel) {        
        $('.list_facilities input').each(function(index) {
            $(this).prop('checked', facilitiesModel[index].is_checked);
        });
    },
    loadRegions: function(regionsModel) {
        $('.list_regions input').each(function(index) {
        	$(this).prop('checked', regionsModel[index].is_checked);
        });
    },
    loadSites: function(sitesModel) {
        $('.list_sites input').each(function(index) {
            $(this).prop('checked', sitesModel[index].is_checked);
        });
    },
    loadDataTypes: function(dataTypesModel) {
        $('.listDataTypes input').each(function(index) {
            $(this).prop('checked', dataTypesModel[index].is_checked);
        });
    },
    postUserProfile: function(userProfile) {
    	$.ajax({
            async: false,
            type: "POST",
            url: '/profile/' + IONUX2.Models.SessionInstance.attributes.user_id + '/',
            data: {data: userProfile},
            success: function(data) {
                console.log(data);
            },
            dataType: 'json',
            contentType: 'application/x-www-form-urlencoded'
        });
    },
    getUserProfile: function() {
    	$.ajax({
            async: false,
            type: "GET",
            url: '/profile/' + IONUX2.Models.SessionInstance.attributes.user_id + '/',
            success: function(data) {
                console.log("getting json saved search data from server");
                console.log(data);
                UINAV.loadConfiguration(data);
            },
            dataType: 'json',
            contentType: 'application/x-www-form-urlencoded'
        });
    },
    loadConfiguration: function(configuration) {
        var configurationModel = JSON.parse(configuration.data);
        var $accordion_container = $('.jspPane');
        var $bottom_accordion = $('#accordionContainerWhite');
        var sortableOrder = configurationModel.sortable_order;
        var bottom_sortable = configurationModel.bottom_sortable;
        var configurationList = configurationModel.configuration;
        var bottomConfigList = configurationModel.bottom_config;
        console.log("configuration list");
        console.log(configurationList);
        this.reorder(sortableOrder, configurationList, $accordion_container);
        this.reorder_bottom(bottom_sortable, bottomConfigList, $bottom_accordion);
    }
};