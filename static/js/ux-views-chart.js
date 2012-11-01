IONUX.Views.Chart = IONUX.Views.Base.extend({
    tagName: 'div',
    events: {},
    template: '<div id="chart_ui_div" class="chart_ui_div" style=""></div><div id="chart_div" style="width:500px;height:250px;"></div>', 
    initialize: function() {
        // this.render().el;
        this.resource_id = this.options.resource_id;
    },

    render: function() {
        $('#dynamic-container').append(this.$el.html(this.template));
        this.draw_chart();
        return this;
    },
    
    draw_chart: function(){
        
        this.data_table = new google.visualization.DataTable();
        console.log(this.data_table);
        console.log(this.$el.find('.chart_ui_div')[0]);
        this.chart = new google.visualization.AnnotatedTimeLine(document.getElementById('chart_div'));
        console.log('this.chart', this.chart)
        
        // set callback for ready event before calling draw on the chart
        google.visualization.events.addListener(this.chart, 'ready', this.on_ready);

        var self = this;
        $.ajax ({
            // TODO 
            url: "http://localhost:3000/viz/initiate_realtime_visualization/" + this.resource_id + "/",
            dataType: 'jsonp',
            jsonpCallback: 'init_realtime_visualization_cb'  // Has to correspond with the server side response
        });
    },
    
    init_realtime_visualization_cb: function(query_token) {
        alert("QUERY_TOKEN : " + query_token);
        var query = new google.visualization.Query("http://localhost:3000/viz/get_realtime_visualization_data/" + query_token +"/");

        // Send the query with a callback function.
        query.setRefreshInterval(3);
        query.send(this.handle_query_response);
    },
    
    handle_query_response: function(response) {
		if (response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
	        return;
		};

        this.data_table = response.getDataTable();
        console.log('data_table', this.data_table);
        this.chart = new google.visualization.AnnotatedTimeLine(document.getElementById('chart_div'));
        this.chart.draw(this.data_table, {'allowRedraw': true, 'displayAnnotations' : false, 'allowHtml':true, 'displayRangeSelector': false});
	},
	
	on_ready: function() {

		//set callbacks for events here. Why ? no idea !
		google.visualization.events.addListener(this.chart, 'select', this.on_select);
		google.visualization.events.addListener(this.chart, 'rangechange', this.on_range_change);

        if(firstTimeFlag) {
            // get the number of columns
            var numOfCols = this.data_table.getNumberOfColumns();
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
                chartUiDiv.appendChild(document.createTextNode('    ' + this.data_table.getColumnLabel(i)));

                chartUiDiv.appendChild(document.createElement('br'));

            }

            firstTimeFlag = false;
        }
	},

	on_select: function() {
		// Selection only supported for annotations. Not useful exactly
		alert('onSelect()');
	
	},

	on_range_change: function() {
		var dateRange = this.chart.getVisibleChartRange();
		var startDate = dateRange.start;
		var endDate = dateRange.end;
	},

	toggle_column_visibility: function(chkBox, idx) {
		
		// detect state of the checkbox that caused this event and behave accordingly. 
		if(chkBox.checked) this.chart.showDataColumns(idx);
		else
			this.chart.hideDataColumns(idx);

		//chart.redraw();
	}
});
