// Global variables
var chart, data;
var startDate, endDate;
var firstTimeFlag = true;
var startTime, stopTime;

  var firstTimeDrawFlag = true;
google.load("visualization", "1", {packages: ['annotatedtimeline']});
// google.setOnLoadCallback(drawChart);

function drawChart(data_product_id) {
	
	var dp_id = data_product_id
      // dp_id=prompt("Please enter Data Product Id","");
	//var query = new google.visualization.Query("http://localhost:5000/ion-service/viz_products/google_realtime_dt/stream1");
      var query = new google.visualization.Query("http://67.58.49.197:5000/ion-service/visualization_service/get_google_realtime_dt?data_product_id=" + dp_id +"&return_format=raw_json");
      data = new google.visualization.DataTable();

	// Send the query with a callback function.
	query.setRefreshInterval(3);
	query.send(handleQueryResponse);

	chart = new google.visualization.AnnotatedTimeLine(document.getElementById('chart_div'));

	// set callback for ready event before calling draw on the chart
		google.visualization.events.addListener(chart, 'ready', onReady);

      startTime = stopTime = new Date().getTime();
}

function handleQueryResponse(response) {
	if (response.isError()) {
		alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
        return;
	}

      // Hack but check to see if a certain tim period has expired and re create the
      // chart object since it seems to remember old data
      stopTime = new Date().getTime();
      if ((stopTime - startTime) > 10000) {
          //chart = new google.visualization.AnnotatedTimeLine(document.getElementById('chart_div'));
          // set callback for ready event before calling draw on the chart
          //google.visualization.events.addListener(chart, 'ready', onReady);
          delete chart.data
          startTime = stopTime;
      }


      data = response.getDataTable();
      chart.draw(data, {'allowRedraw': true, 'displayAnnotations' : false, 'allowHtml':true, 'displayRangeSelector': false});

}


// Callback for when the chart is ready
function onReady() {

	if(firstTimeFlag) firstTimeFlag = false;
	else
		return;

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

	}
}

function onSelect() {
	// Selection only supported for annotations. Not useful exactly
	alert('onSelect()');

}

function onRangechange() {
	var dateRange = chart.getVisibleChartRange();
	startDate = dateRange.start;
	endDate = dateRange.end;
	//alert (startDate + " to " + endDate);

}

function toggleColumnVisibility(chkBox, idx) {

	// detect state of the checkbox that caused this event and behave accordingly. 
	if(chkBox.checked) chart.showDataColumns(idx);
	else
		chart.hideDataColumns(idx);

	chart.redraw();

}