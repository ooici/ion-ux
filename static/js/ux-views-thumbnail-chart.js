IONUX.Views.ThumbnailChart = Backbone.View.extend({
  el: '#chart',
  initialize: function(){
    _.bindAll(this);
    this.resource_id = this.options.resource_id;
    this.get_data();
  },
  render: function(){
    this.$el.html('CHART');
    return this;
  },
  get_data: function(attribute) {
    var url = "/visualization/get_data_product_metadata/?data_product_id="+this.resource_id+"&return_mimetype=application/json";
    var self = this;
    $.ajax({
      url: url,
      dataType: 'json',
      success: function(resp) {
        self.dp_metadata_cb(resp);
      }
    });
  },
  dp_metadata_cb: function(resp) {
    var dp_metadata = resp;
    var avg_data_rate = dp_metadata['time_steps'] / (dp_metadata['time_bounds'][1] - dp_metadata['time_bounds'][0]);
  }
})