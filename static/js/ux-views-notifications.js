// Temporary hard-coding based on user input
IONUX.Notifications = [
  {
    label: 'Communication Lost/Restored', 
    event_type: 'ResourceAgentConnectionLostErrorEvent',
    desc: 'Communications have failed to a device or communication has been restored.'
  },
  {
    label: 'Device Error', 
    event_type: 'ResourceAgentErrorEvent',
    desc: 'A problem associated with a device has been detected.'
  },
  {
    label: 'Issue reported', 
    event_type: 'ResourceIssueReportedEvent',
    desc: 'An issue has been reported by a user.'
  },
  {
    label: 'Lifecycle state change', 
    event_type: 'ResourceLifecycleEvent',
    desc: 'Lifecycle state has been changed.'
  },
  {
    label: 'Agent operational state change', 
    event_type: 'Agent operational state change',
    desc: 'Agent operational state change'
  },
  {
    label: 'Device operational state change', 
    event_type: 'ResourceAgentResourceStateEvent',
    desc: 'The agent\'s managed resource state has changed'
  },
  {
    label: 'Operator event on device', 
    event_type: 'DeviceOperatorEvent',
    desc: 'An operator has logged an event manually on a device.'
  },
  {
    label: 'Operator event on device',
    event_type: 'DeviceOperatorEvent',
    desc: 'An operator has logged an event manually on a device',
    only: ['InstrumentDevice', 'PlatformDevice']
  },
  {
    label: 'Operator event on resource', 
    event_type: 'ResourceOperatorEvent',
    desc: 'An operator has logged an event manually on a non-device resource.',
    restrict: ['InstrumentDevice', 'PlatformDevice']
  },
  {
    label: 'QC alert', 
    event_type: 'ParameterQCEvent',
    desc: 'QC processing has detected an error.'
  },
  {
    label: 'Request received', 
    event_type: 'OrgNegotiationInitiatedEvent',
    desc: 'A role, enrollment, or access request has been submitted to the Facility.'
  },
  {
    label: 'Resource modified', 
    event_type: 'ResourceModifiedEvent',
    desc: 'The resource has been modified.'
  },
  {
    label: 'Status alert/change', 
    event_type: 'DeviceStatusEvent',
    desc: 'A status alert has been issued or status has recovered.'
  },
  {
    label: 'Aggregate Status alert/change', 
    event_type: 'DeviceAggregateStatusEvent',
    desc: 'An aggregated Status alert has been issued or the aggregated status has recovered.'
  },
]


IONUX.Models.Notification = Backbone.Model.extend({
  idAttribute: '_id'
});

IONUX.Collections.Notifications = Backbone.Collection.extend({
  model: IONUX.Models.Notification,
  url: '/event_types/',
  parse: function(resp) {
    var notifications = []
    _.each(resp.data, function(event_name) {
      notifications.push({event_type: event_name})
    });
    return notifications;
  }
});

IONUX.Views.Notifications = Backbone.View.extend({
  el: '.modal-body',
  template: _.template($('#notifications-tmpl').html()),
  initialize: function() {
    _.bindAll(this);
    this.collection.on('reset', this.render);
    this.user_notifications = window.MODEL_DATA['computed']['user_notification_requests']['value'];
    console.log('user_notifications', this.user_notifications);
  },
  render: function() {
    this.$el.html(this.template);
    this.$el.find('table thead').hide();
    var table_body = this.$el.find('table tbody');
    var self = this;
    _.each(this.collection.models, function(notification) {
      var subscribed = _.findWhere(self.user_notifications, {event_type: notification.get('event_type')});
      if (subscribed) notification.set({_id: subscribed['_id']});
      table_body.append(new IONUX.Views.NotificationItem({model: notification}).render().el);
    });
    return this;
  }
});

IONUX.Views.NotificationItem = Backbone.View.extend({
  tagName: 'tr',
  className: 'notification-item',
  template: _.template($('#notification-item-tmpl').html()),
  events: {
    'click .btn-subscribe': 'subscribe',
    'click .btn-unsubscribe': 'unsubscribe'
  },
  initialize: function(){
    _.bindAll(this);
    this.model.on('change', this.render);
  },
  render: function(){
    // console.log('NotificationItem', this.model.toJSON());
    this.$el.html(this.template({notification: this.model.toJSON()}));
    this.$el.find('span:first').tooltip({placement: 'right'});
    return this;
  },
  subscribe: function(){
    var resource_name = window.MODEL_DATA['resource']['name'];
    var event_type = this.model.get('event_type');
    var self = this;
    $.ajax({
      url: 'subscribe/?event_type='+event_type+'&resource_name='+resource_name,
      dataType: 'json',
      success: function(resp){
        self.model.set({_id: resp.data});
      }
    });
  },
  unsubscribe: function(){
    var notification_id = this.model.get('_id');
    var self = this;
    $.ajax({
      url: 'unsubscribe/?notification_id='+this.model.get('_id'),
      dataType: 'json',
      success: function(resp){
        self.model.unset('_id');
      }
    });
  }
});
