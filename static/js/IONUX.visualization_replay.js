// Global variables
var chart_replay, data_replay, dp_id_replay, dp_id_token_replay, query_replay;
var container_server_replay = "http://67.58.49.200:5000";
var datatable_ready_flag_relay;
google.load("visualization", "1", {packages: ['annotatedtimeline']});
// google.setOnLoadCallback(drawChart);

function drawChartReplay(data_product_id) {
      var datatable_ready_flag_replay = false;
      // dp_id=prompt("Please enter Data Product Id","");
	    dp_id_replay = data_product_id
	
      chart_replay = new google.visualization.AnnotatedTimeLine(document.getElementById('chart_replay_replay_div'));

      // set callback for ready event before calling draw on the chart_replay
      google.visualization.events.addListener(chart_replay, 'ready', onReady);

      // First ask viz service to start the transform process and get a token for the query
      jQuery.ajax({
          url: container_server_replay + "/ion-service/visualization_service/start_google_dt_transform?data_product_id=" + dp_id_replay + "&return_format=raw_json",
          dataType: 'jsonp',
          jsonpCallback: 'google_dt_transform_cb'
      });

}

  function google_dt_transform_cb(data, status) {
      //alert(data);

      // The data contains a token. Note it as it will be needed by the query
      dp_id_token_replay = data;

      // Check to see if the container has the data table ready
      checkIfDtIsReady();

  }

  function checkIfDtIsReady() {
      jQuery.ajax ({
          url: container_server_replay + "/ion-service/visualization_service/is_google_dt_ready?data_product_id_token=" + dp_id_token_replay + "&return_format=raw_json",
          dataType: 'jsonp',
          jsonpCallback: 'google_dt_status_cb'  // Has to correspond with the server side response
      });
  }

  function google_dt_status_cb(data, status) {

      //alert(data);

      if (data == "True") {
          datatable_ready_flag_replay = true;
          // alert(container_server_replay + "/ion-service/visualization_service/get_google_dt?data_product_id_token=" + dp_id_token_replay +"&return_format=raw_json");
          query_replay = new google.visualization.Query(container_server_replay + "/ion-service/visualization_service/get_google_dt?data_product_id_token=" + dp_id_token_replay +"&return_format=raw_json");

          // Send the query with a callback function.
          query_replay.send(handleQueryResponse);
          return;
      }
      else {
          // Make the query again .. preferably after a timeout of some seconds
          setTimeout(checkIfDtIsReady(), 2000);
      }


  }

function handleQueryResponse(response) {
	if (response.isError()) {
		alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
	return;
	}

	data_replay = response.getDataTable();
	chart_replay.draw(data_replay);

}


// Callback for when the chart_replay is ready
function onReady() {
	//set callbacks for events here. Why ? no idea !
	
	// get the number of columns
	var numOfCols = data_replay.getNumberOfColumns();
	var i;

	// Populate UI components
	var chart_replayUiDiv = document.getElementById("chart_replay_replay_ui_div");
	var chkBox, columnIdx;
	for (i=1; i<numOfCols; i++) {

		columnIdx = i - 1;
		// create a checkBox and add to the chart_replays' UI div
		chkBox = document.createElement('input');
		chkBox.type = 'checkBox';
		
		chkBox.setAttribute("name", "columnSelect");
		chkBox.setAttribute("value", columnIdx);
		chkBox.setAttribute("checked","checked");
		chkBox.setAttribute("onClick","toggleColumnVisibility(this," + columnIdx + ")");
		

		chart_replayUiDiv.appendChild(chkBox);
		chart_replayUiDiv.appendChild(document.createTextNode('    ' + data_replay.getColumnLabel(i)));
		
		chart_replayUiDiv.appendChild(document.createElement('br'));

	}
}



function toggleColumnVisibility(chkBox, idx) {
	
	// detect state of the checkbox that caused this event and behave accordingly. 
	if(chkBox.checked) chart_replay.showDataColumns(idx);
	else
		chart_replay.hideDataColumns(idx);

	chart_replay.redraw();

}



