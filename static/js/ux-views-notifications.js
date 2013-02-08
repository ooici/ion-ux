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
  },
  render: function() {
    this.$el.html(this.template);
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
    this.$el.html(this.template({notification: this.model.toJSON()}));
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
        console.log('---------------------');
        console.log('subscribe success', resp.data)
        console.log('subscribe success model:before', self.model.toJSON())
        self.model.set({_id: resp.data});
        console.log('subscribe success model:after', self.model.toJSON())
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
        console.log('---------------------');
        console.log('unsubscribe success', resp.data)
        console.log('unsubscribe success model:before', self.model.toJSON())
        self.model.unset('_id');
        console.log('unsubscribe success model:after', self.model.toJSON())
      }
    });
  }
})
