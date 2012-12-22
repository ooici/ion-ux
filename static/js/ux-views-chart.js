IONUX.Views.Chart = IONUX.Views.Base.extend({
    template: '<div id="chart_ui_div" style=""></div><div id="chart_div"></div>',
    template_checkbox: '<div class="checkbox-input"> \
                        <input id="<%= checkbox_label %>" class="chart_checkbox" type="checkbox" name="columnSelect" value="<%= checkbox_index %>" checked /> \
                        <label for="<%= checkbox_label %>"><%= checkbox_label %></label></div>',
    events: {
        'click .chart_checkbox': 'toggle_column_visibility',
    },
    
    initialize: function(){
        _.bindAll(this);
        this.resource_id = this.options.resource_id;
    },
    
    render: function() {
        this.$el.html(this.template).addClass('chart-google');
        this.draw_chart();
        return this;
    },
    
    draw_chart: function(){
        this.datatable_ready_flag = false;
        this.chart = new google.visualization.AnnotatedTimeLine(document.getElementById('chart_div'));
        google.visualization.events.addListener(this.chart, 'ready', this.on_ready);
        var query = new google.visualization.Query('http://'+window.location.host+'/viz/overview/'+this.resource_id+'/');
        query.send(this.handle_query_response);
    },
    
    handle_query_response: function(response) {
        if (response.isError()) {
            alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
            return;
        };
        this.chart_data = response.getDataTable();
        this.chart.draw(this.chart_data);
    },
	
	on_ready: function(){
        google.visualization.events.addListener(this.chart, 'select', this.on_select);
        google.visualization.events.addListener(this.chart, 'rangechange', this.on_range_change);
        
        var number_of_columns = this.chart_data.getNumberOfColumns();

        var chart_div_elmt = $('#chart_ui_div');
        var self = this;
        _.each(_.range(1, number_of_columns), function(index){
            checkbox_index = index -1;
            var checkbox_label = self.chart_data.getColumnLabel(index);
            chart_div_elmt.append(_.template(self.template_checkbox, {checkbox_label: checkbox_label, checkbox_index: checkbox_index}));
        });
        
        // Kept from vis demo: remove soon.
        // // Populate UI components
        // var chartUiDiv = document.getElementById("chart_ui_div");
        // var chkBox, columnIdx, i;
        // for (i=1; i<number_of_columns; i++) {
        //     columnIdx = i - 1;
        //     // create a checkBox and add to the charts' UI div
        //     chkBox = document.createElement('input');
        //     chkBox.type = 'checkBox';
        //     chkBox.setAttribute("name", "columnSelect");
        //     chkBox.setAttribute("value", columnIdx);
        //     chkBox.setAttribute("checked","checked");
        //     // chkBox.setAttribute("onClick","this.toggle_column_visibility(this," + columnIdx + ")");
        //     chartUiDiv.appendChild(chkBox);
        //     chartUiDiv.appendChild(document.createTextNode('    ' + this.chart_data.getColumnLabel(i)));
        //     chartUiDiv.appendChild(document.createElement('br'));
        // };
    },
    
    on_select: function(){
        console.log('on_select');
        // Kept from vis demo: is this needed?
        // Selection only supported for annotations. Not useful exactly
        // alert('onSelect()');
    },

    on_range_change: function(){
        console.log('on_range_change');
        // Kept from vis demo: why are these globals?
        // var dateRange = chart.getVisibleChartRange();
        // startDate = dateRange.start;
        // endDate = dateRange.end;
    },

    toggle_column_visibility: function(e){
        var checkbox_elmt = $(e.target);
        var checkbox_value = checkbox_elmt.attr('value');
        
        if (checkbox_elmt.is(':checked')) {
            this.chart.showDataColumns(checkbox_value);
        } else {
            this.chart.hideDataColumns(checkbox_value);
        };
    }
});