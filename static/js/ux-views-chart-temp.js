IONUX.Views.Chart = IONUX.Views.Base.extend({
    tagName: 'div',
    events: {},
    template: '<div id="chart_ui_div" class="chart_ui_div" style=""></div><div id="chart_div" style="width:500px;height:250px;"></div>', 
    initialize: function() {
        this.resource_id = this.options.resource_id;
    },

    render: function() {
        var self = this;
        this.$el.html(this.template);
        google.load('visualization', '1', {'packages': ['annotatedtimeline'], "callback":function(){self.draw_chart(self)}});
        return this;
    },
    
    draw_chart: function(self){
        self.datatable_ready_flag = false;

        // Grab data product id from Backbone model
        var data_product_id = MODEL_DATA['_id'];

        // Figure out scoping with handle_query_response late
        window.chart = new google.visualization.AnnotatedTimeLine(document.getElementById('chart_div'));
        
        // set callback for ready event before calling draw on the chart
        google.visualization.events.addListener(chart, 'ready', self.on_ready);
        self.query = new google.visualization.Query('http://localhost:3000/viz/overview/' + data_product_id + '/');
        self.query.send(self.handle_query_response);
    },
    
    handle_query_response: function(response) {
        
        if (response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
		    return;
		}

		this.data = response.getDataTable();
		window.chart.draw(this.data);
		
		},
	
	on_ready: function() {
        //set callbacks for events here. Why ? no idea !
		google.visualization.events.addListener(chart, 'select', onSelect);
		google.visualization.events.addListener(chart, 'rangechange', onRangechange);
		
		// get the number of columns
		var numOfCols = data.getNumberOfColumns();
		var i;

		// Populate UI components
		var chartUiDiv = document.getElementById("chart_ui_div");
		var chkBox, columnIdx;
		for (i=1; i<numOfCols; i++) {

			columnIdx = i - 1;
			// create a checkBox and add to the charts' UI div
			chkBox = document.createElement('input');
			chkBox.type = 'checkBox';
			
			chkBox.setAttribute("name", "columnSelect");
			chkBox.setAttribute("value", columnIdx);
			chkBox.setAttribute("checked","checked");
			chkBox.setAttribute("onClick","toggleColumnVisibility(this," + columnIdx + ")");
			

			chartUiDiv.appendChild(chkBox);
			chartUiDiv.appendChild(document.createTextNode('    ' + data.getColumnLabel(i)));
			
			chartUiDiv.appendChild(document.createElement('br'));

		};
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        // //set callbacks for events here. Why ? no idea !
        // google.visualization.events.addListener(this.chart, 'select', this.on_select);
        // google.visualization.events.addListener(this.chart, 'rangechange', this.on_range_change);
        // 
        //         if(firstTimeFlag) {
        //             // get the number of columns
        //             var numOfCols = this.data_table.getNumberOfColumns();
        //             var i;
        // 
        //             // Populate UI components
        //             var chartUiDiv = document.getElementById("chart_ui_div");
        //             var chkBox, columnIdx;
        //             for (i=1; i<numOfCols; i++) {
        // 
        //                 columnIdx = i - 1;
        //                 // create a checkBox and add to the charts' UI div
        //                 chkBox = document.createElement('input');
        //                 chkBox.type = 'checkBox';
        // 
        //                 chkBox.setAttribute("name", "columnSelect");
        //                 chkBox.setAttribute("value", columnIdx);
        //                 chkBox.setAttribute("checked","checked");
        //                 chkBox.setAttribute("onClick","toggleColumnVisibility(this," + columnIdx + ")");
        // 
        // 
        //                 chartUiDiv.appendChild(chkBox);
        //                 chartUiDiv.appendChild(document.createTextNode('    ' + this.data_table.getColumnLabel(i)));
        // 
        //                 chartUiDiv.appendChild(document.createElement('br'));
        // 
        //             }
        // 
        //             firstTimeFlag = false;
        //         }
	},

	on_select: function() {
		// Selection only supported for annotations. Not useful exactly
		alert('onSelect()');
	
	},

	on_range_change: function() {
		var dateRange = chart.getVisibleChartRange();
		startDate = dateRange.start;
		endDate = dateRange.end;
	},

	toggle_column_visibility: function(chkBox, idx) {
		
		// detect state of the checkbox that caused this event and behave accordingly. 
		if(chkBox.checked) this.chart.showDataColumns(idx);
		else
			this.chart.hideDataColumns(idx);

		//chart.redraw();
	}
});
