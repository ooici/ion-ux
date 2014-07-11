var UINAV = {
    disableMapEventHandling: false,
	reorder: function(orderArray, configurationList, elementContainer) {
        // load configuration and sortable order for left accordion
        $.each(orderArray, function(key, val){
            elementContainer.append($("#"+val));
        });

        for (item in configurationList) {
            if (configurationList[item]) {
                this.disableMapEventHandling = true;
                $('#'+item + ' .leftAccordionContents').show();
                $('#'+item).find('.expandHide').removeClass('arrowRight').addClass('arrowDown');
            }
        }
    },
    reorder_bottom: function(orderArray, configurationList, elementContainer) {
        // load configuration and sortable order for bottom accordion

        $.each(orderArray, function(key, val){
            elementContainer.append($("#"+val));
        });

    },
    loadVisibility: function(visibilityList) {
        for (item in visibilityList) {
            if (visibilityList[item]) {
                $('#'+item + ' .leftAccordionContents').show();
                $('#'+item).children('.expandHide').removeClass('arrowRight').addClass('arrowDown');
            } else {
                $('#'+item + ' .leftAccordionContents').hide();
                $('#'+item).children('.expandHide').removeClass('arrowDown').addClass('arrowRight');
            }
        }
    },
    loadAccordionVisibility: function(visibilityList) {
        // load configuration for bottom accordion
        for (item in visibilityList) {
            if (visibilityList[item].is_visible) {
                $('#'+visibilityList[item].id).show();
            } else {
                $('#'+visibilityList[item].id).hide();
            }
        }
    },

    loadLeftNav: function(searchModel, index) {
        var uiState = searchModel.uiState;

        var keyword = uiState.keyword,
            spatialModel = uiState.spatial,
            temporalModel = uiState.temporal,
            facilitiesModel = uiState.facilities,
            observatoriesModel = uiState.observatories,
            instrumentTypesModel = uiState.instrumentTypes,
            sitesModel = uiState.sites,
            platformTypesModel = uiState.platformTypes,
            dataTypesModel = uiState.dataTypes,
            booleanExpressionModel = uiState.booleanExpression,
            accordionVisibility = searchModel.accordionVisibility;

        $('#keywordIn').val(keyword);
        // populate accordion modules with saved data
        this.loadSpatial(spatialModel);
        this.loadTemporal(temporalModel);
        this.loadFacilities(facilitiesModel);
        this.loadObservatories(observatoriesModel);
        this.loadInstrumentTypes(instrumentTypesModel);
        this.loadSites(sitesModel);
        this.loadPlatformTypes(platformTypesModel);
        this.loadDataTypes(dataTypesModel);
        this.loadBooleanExpression(booleanExpressionModel);
        this.loadVisibility(accordionVisibility);
    },

    loadSpatial: function(spatialModel) {
        IONUX2.Models.spatialModelInstance.updateAttributes(spatialModel);
        IONUX2.Dashboard.MapView.map.setCenter(new google.maps.LatLng(spatialModel.center["k"], spatialModel.center["A"]));
    },
    loadTemporal: function(temporalModel) {
        IONUX2.Models.temporalModelInstance.updateAttributes(temporalModel);
    },
    loadFacilities: function(facilitiesModel) {       
        $('.list_facilities input').each(function(index) {
            if(!$(this).hasClass('selectAll')){
                if(facilitiesModel[index].is_checked){
                    $(this).click();
                }
            }
        });
    },

    loadObservatories: function(observatoriesModel) {       
        $('.listObservatories input').each(function(index) {
            if(!$(this).hasClass('selectAll')){
                if(observatoriesModel[index].is_checked){
                    $(this).click();
                }
            }
        });
    },

    loadInstrumentTypes: function(instrumentTypesModel) {
        $('.listInstrumentTypes input').each(function(index) {
            if(!$(this).hasClass('selectAll')){
                if(instrumentTypesModel[index].is_checked){
                    $(this).click();
                }
            }
        });
    }, 

    loadSites: function(sitesModel) {
        $('.listSites input').each(function(index) {
            if(!$(this).hasClass('selectAll')){
                if(sitesModel[index].is_checked){
                    $(this).click();
                }
            }
        });
    },

    loadPlatformTypes: function(platformTypesModel) {
        $('.listPlatformTypes input').each(function(index) {
            if(!$(this).hasClass('selectAll')){
                if(platformTypesModel[index].is_checked){
                    $(this).click();
                }
            }
        });
    },

    loadDataTypes: function(dataTypesModel) {
        $('.listDataTypes input').each(function(index) {
            if(!$(this).hasClass('selectAll')){
                if(dataTypesModel[index].is_checked){
                    $(this).click();
                }
            }
        });
    },

    loadBooleanExpression: function(booleanExpressionCollection) {
        $('select[name="filter_arg"]').each(function(index) {
            $(this).remove();
        });
        $('.filter-item').each(function(index) {
            if (index != 0) {
                this.remove();
            }
        });
        var numFilters = (booleanExpressionCollection.length - $('.filter-item').length);
        if (numFilters > 0)  {
            for (var i=0; i<booleanExpressionCollection.length-1; i++) {
                $('.filter-add').eq(i).click();
            }
        }
        _.each(booleanExpressionCollection, function(booleanModel, key) {
            
            $('.filter-item').eq(key).find('select[name="filter_var"] option[data-name="' + booleanModel.boolean_main_filter + '"]').attr('selected', 'selected');

            if ((booleanModel.boolean_main_filter == "lcstate") || (booleanModel.boolean_main_filter == "processing_level_code") ||
             (booleanModel.boolean_main_filter == "quality_control_level") || (booleanModel.boolean_main_filter == "site") || (booleanModel.boolean_main_filter == "aggregated_status") || (booleanModel.boolean_main_filter == "type_")) {
                
                $('.filter-item').eq(key).find('select[name="filter_operator"], .booleanInput').remove();
                
                var lcstateValues= ['DRAFT','PLANNED','DEVELOPED','INTEGRATED','DEPLOYED','RETIRED'];
                var processingValues = [
                    ['L0 - Unprocessed Data', 'L0'], ['L1 - Basic Data', 'L1'], ['L2 - Derived Data', 'L2']
                ];
                var qualityControl = [
                    ['a - No QC applied', 'a'], ['b - Automatic QC applied', 'b'], ['c - Human QC applied', 'c']
                ];
                var siteValues = ['Coastal Endurance', 'Coastal Pioneer', 'Global Argentine Basin', 'Global Irminger Sea', 'Global Southern Ocean',
                                'Global Station Papa', 'Regional Axial', 'Regional Hydrate Ridge', 'Regional Mid Plate'];
                var statusValues = ['Critical', 'OK', 'None expected', 'Warning'];
                var typeValues = [
                ['Attachment','Attachment'], ['Data Agent Instance','ExternalDatasetAgentInstance'], ['Data Agent','ExternalDatasetAgent'], ['Data Process','Data Process'],
                ['Data Product','DataProduct'], ['Data Transform','DataProcessDefinition'], ['Dataset Agent Instance','ExternalDatasetAgentInstance'], ['Dataset Agent','ExternalDatasetAgent'],
                ['Deployment','Deployment'], ['Event Type','EventType'], ['Event','Event'], ['Instrument Agent Instance','InstrumentAgentInstance'],
                ['Instrument Agent','InstrumentAgent'], ['Instrument Model','InstrumentModel'], ['Instrument','InstrumentDevice'], ['Organization [Facility]','Org'],
                ['Platform Agent Instance','PlatformAgentInstance'], ['Platform Agent','PlatformAgent'], ['Platform Model','PlatformModel'],
                ['Platform Port','PlatformSite'], ['Platform','PlatformDevice'], ['Port','InstrumentSite'], ['Role','UserRole'], ['Site','Observatory'], ['Station','StationSite'],
                ['Subscription','NotificationRequest'], ['User','UserInfo']
                ];
                var elementLength = $('.filter-item').eq(key).find('select[name="filter_arg"]:visible').length;
                if (elementLength == 0) {
                    $('.filter-add').before('<select class="booleanSelectContainer" name="filter_arg"></select>');
                }
                $('.filter-item').eq(key).find('select[name="filter_arg"]').empty();
                if (booleanModel.boolean_main_filter == "lcstate") {
                    for (val in lcstateValues) {
                        $('.filter-item').eq(key).find('select[name="filter_arg"]').append('<option value="' + lcstateValues[val] + '">' + lcstateValues[val] + '</option');
                    }
                }
                if (booleanModel.boolean_main_filter == "processing_level_code") {
                    for (val in processingValues) {
                        $('.filter-item').eq(key).find('select[name="filter_arg"]').append('<option value="' + processingValues[val][1] + '">' + processingValues[val][0] + '</option');
                    }
                }
                if (booleanModel.boolean_main_filter == "quality_control_level") {
                    for (val in qualityControl) {
                        $('.filter-item').eq(key).find('select[name="filter_arg"]').append('<option value="' + qualityControl[val][1] + '">' + qualityControl[val][0] + '</option');
                    }
                }
                if (booleanModel.boolean_main_filter == "site") {
                    for (val in siteValues) {
                        $('.filter-item').eq(key).find('select[name="filter_arg"]').append('<option value="' + siteValues[val] + '">' + siteValues[val] + '</option');
                    }
                }
                if (booleanModel.boolean_main_filter == "aggregated_status") {
                    for (val in statusValues) {
                        $('.filter-item').eq(key).find('select[name="filter_arg"]').append('<option value="' + statusValues[val] + '">' + statusValues[val] + '</option');
                    }
                }
                if (booleanModel.boolean_main_filter == "type_") {
                    for (val in typeValues) {
                        $('.filter-item').eq(key).find('select[name="filter_arg"]').append('<option value="' + typeValues[val][1] + '">' + typeValues[val][0] + '</option');
                    }
                }

                $('.filter-item').eq(key).find('select[name="filter_arg"]').val(booleanModel.boolean_input);
                
            }
            else {
                var argument = $('.filter-item').eq(key).find('.argument').length;
                if (argument == 1) {
                    $('.filter-add').eq(key).before('<select class="booleanSelectContainer" name="filter_operator"><option value="contains">contains</option><option value="like">like</option><option value="matches">matches</option><option value="starts with">starts with</option><option value="ends with">ends with</option></select><input type="text" class="booleanInput" name="filter_arg" value="">');
                    $('.filter-item').eq(key).find('.argument').remove();
                }
                $('.filter-item').eq(key).find('select[name="filter_operator"]').val(booleanModel.boolean_sub_filter);
                $('.filter-item').eq(key).find('.booleanInput').val(booleanModel.boolean_input);
            }
            $('.filter-item').eq(key).find('select[name="filter_var"]').on('change', function() {
                    $('.filter-item').eq(key).find('select[name="filter_operator"], .booleanInput').show();
                });

        });
        
    },
    postSavedSearches: function(savedSearches) {
    	$.ajax({
            async: false,
            type: "POST",
            url: '/profile/' + IONUX2.Models.SessionInstance.attributes.user_id + '/',
            data: {data: savedSearches},
            success: function(data) {
                // console.log(data);
            },
            dataType: 'json',
            contentType: 'application/x-www-form-urlencoded'
        });
    },
    postUserConfiguration: function(userConfiguration) {
        $.ajax({
            async: false,
            type: "POST",
            url: '/profile/' + IONUX2.Models.SessionInstance.attributes.user_id + '_ui/',
            data: {data: userConfiguration},
            success: function(data) {
                // console.log(data);
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
            success: function(request) {
                if (request.data) {
                    UINAV.loadSavedSearches(request);
                }
            },
            dataType: 'json',
            contentType: 'application/x-www-form-urlencoded'
        });
    },
    
    getUserConfiguration: function() {
        $.ajax({
            async: false,
            type: "GET",
            url: '/profile/' + IONUX2.Models.SessionInstance.attributes.user_id + '_ui/',
            success: function(request) {
                if (request.data) {
                    UINAV.loadConfiguration(request);
                }
            },
            dataType: 'json',
            contentType: 'application/x-www-form-urlencoded'
        });
    },

    loadSavedSearches: function(savedSearch) {
        var savedSearchList = JSON.parse(savedSearch.data);

        IONUX2.Collections.userProfileInstance.set(savedSearchList);
        IONUX2.Views.loadSearchCollection = new IONUX2.Views.LoadSearchCollection({collection: IONUX2.Collections.userProfileInstance});

    },

    loadConfiguration: function(configuration) {
        var configurationModel = JSON.parse(configuration.data);
        var self = this;
        
        if(('sortableOrder' in configurationModel[0]) && ('configurationList' in configurationModel[0])){
            var sortableOrder = configurationModel[0].sortable_order;       
            var configurationList = configurationModel[0].configuration;
            // trigger saved jquery sort order
            var $accordion_container = $('.accordionContainer');
            self.reorder(sortableOrder, configurationList, $accordion_container);
        }

        if('searchResultSortables' in configurationModel[0]){
            var searchResultSortables = configurationModel[0].searchResultSortables;
            $.each(searchResultSortables, function(accordionParent, order){
                var $accordion_container = $("#" + accordionParent).find('.accordionContainerWhite');
                self.reorder_bottom(order, null, $accordion_container);
            });
        }
    },

    saveEntireSearch: function(customName) {
        $('#customSearchName').hide();
        $('#saveButtons').show();

        //var name = $('.customName').val();
        var d = new Date();
        var month = d.getMonth() + 1;
        var day = d.getDate();
        var year = d.getFullYear();
        var hour = d.getHours();
        var minute = d.getMinutes().toString();
        var seconds = d.getSeconds().toString();
        if ((minute.length) == 1) {
            minute = '0' + minute;
        }
        if ((seconds.length) == 1) {
            seconds = '0' + seconds;
        }
        var time = d.getTime();

        var keyword = $('#keywordIn').val();

        var searchName = {
                'time': time,
                'name': customName,
                'month': month,
                'day': day,
                'year': year,
                'hour': hour,
                'minute': minute,
                'seconds': seconds
            }

        var spatial = {
                'spatial_dropdown': $('.latLongMenu option:selected').attr('value'),
                'from_latitude': $('#south').val(),
                'from_ns': $('.from_ns option:selected').val(),
                'from_longitude': $('#west').val(),
                'from_ew': $('.from_ew option:selected').val(),
                'to_latitude': $('.placeholder_lat').val(),
                'to_ns': $('.north_south_menu option:selected').val(),
                'to_longitude': $('.show_hide_longitude').val(),
                'to_ew': $('.to_ew option:selected').val(),
                'radius': $('#radius').val(),
                'miles_kilos': $('.milesKilosMenu').val(),
                'vertical_from': $('[data-verticalfrom]').val(),
                'vertical_to': $('[data-verticalto]').val(),
                'feetMeters': $('.feetMeters option:selected').val(),
                'center': IONUX2.Dashboard.MapView.map.getCenter()
            }

        var temporal = {
                'temporal_dropdown': $('.temporalMenu option:selected').attr('value'),
                'from_year': $('.from_date_menu .year').val(),
                'from_month': $('.from_date_menu .month').val(),
                'from_day': $('.from_date_menu .day').val(),
                'from_hour': $('.from_date_menu .hour').val(),
                'to_year': $('.to_date_menu .year').val(),
                'to_month': $('.to_date_menu .month').val(),
                'to_day': $('.to_date_menu .day').val(),
                'to_hour': $('.to_date_menu .hour').val()
            }

        // get accordion checkbox values and add to collection
        function dynamicAccordions ($elem) {
            var resources_checked = [];
            $elem.each(function(data) {
                var resource_value = $(this).val();
                var is_checked = $(this).prop('checked');
                resources_checked.push({ 'value' : resource_value, 'is_checked' : is_checked });
            });

            return resources_checked;
        }

        var $facilityInput = $('.list_facilities input');
        var $observatoryInput = $('.listObservatories input');
        var $sitesInput = $('.listSites input');
        var $platformTypesInput = $('.listPlatformTypes input'); 
        var $instrumentTypesInput = $('.listInstrumentTypes input');
        var $dataTypesInput = $('.listDataTypes input');

        var facilities = dynamicAccordions($facilityInput); //IONUX2.Collections.saveFacilitySearch.toJSON();
        var observatories = dynamicAccordions($observatoryInput); //IONUX2.Collections.saveObservatorySearch.toJSON();
        var platformTypes = dynamicAccordions($platformTypesInput); //IONUX2.Collections.savePlatformSearch.toJSON();
        var instrumentTypes = dynamicAccordions($instrumentTypesInput); //IONUX2.Collections.saveInstrumentTypeSearch.toJSON();
        var sites = dynamicAccordions($sitesInput); //IONUX2.Collections.saveSiteSearch.toJSON();
        var dataTypes = dynamicAccordions($dataTypesInput); //IONUX2.Collections.saveDataTypeSearch.toJSON();

        var boolean_expression_list = [];
        $('#boolean_expression .filter-item').each(function(index) {
            var boolean_main_filter = $(this).find('.booleanSelectContainer[name="filter_var"] option:selected').data('name'),
              boolean_sub_filter = $(this).find('.booleanSelectContainer[name="filter_operator"] option:selected').attr('value');
              if (boolean_sub_filter == undefined) {
                boolean_sub_filter = "";
              }
              var boolean_input;
              if ((boolean_main_filter == "lcstate") || (boolean_main_filter == "processing_level_code") || (boolean_main_filter == "quality_control_level") || (boolean_main_filter == "site") || (boolean_main_filter == "aggregated_status") || (boolean_main_filter == "type_")) {
                boolean_input = $(this).find('.booleanSelectContainer[name="filter_arg"] option:selected').attr('value');
              }
              else {
                boolean_input = $(this).find('.booleanInput').val();
              }
           
            boolean_expression_list.push({ 'boolean_main_filter' : boolean_main_filter, 'boolean_sub_filter' : boolean_sub_filter, 'boolean_input': boolean_input });
        });

        var booleanExpression = boolean_expression_list; //IONUX2.Collections.saveBooleanExpression.toJSON();

        var values = {
            'searchName': searchName,
            'userId': IONUX2.Models.SessionInstance.attributes.user_id,
            'validUntil': IONUX2.Models.SessionInstance.attributes.valid_until,
            'uiState' : {
                'keyword' : keyword,
                'spatial' : spatial,
                'temporal': temporal,
                'facilities' : facilities,
                'observatories': observatories,
                'instrumentTypes': instrumentTypes,
                'sites': sites,
                'platformTypes': platformTypes,
                'dataTypes': dataTypes,
                'booleanExpression': booleanExpression,
            },
            'accordionVisibility': {
              'spatialElem': $('#spatial').is(':visible'),
              'temporalElem': $('#temporal').is(':visible'),
              'orgSelectorElem': $('#orgSelector').is(':visible'),
              'siteElem': $('#site').is(':visible'),
              'platformTypesListElem': $('#platformTypesList').is(':visible'),
              'dataTypesListElem': $('#dataTypesList').is(':visible'),
              'boolean_expressionElem': $('#boolean_expression').is(':visible'),
              'instrumentElem': $('#instrument').is(':visible')
            }
        };

        // IONUX2.Collections.saveNames.set(values);
        return values;
      
    }
};