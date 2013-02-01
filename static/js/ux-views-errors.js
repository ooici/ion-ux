// Called from IONUX.setup_ajax_error (ion-ux.js)

IONUX.Views.Error = Backbone.View.extend({
  el: '#action-modal',
  modal_template: '<div id="action-modal" class="modal hide fade modal-ooi"></div>',
  template: _.template($('#error-tmpl').html()),
  events: {
    'click #dashboard': 'dashboard',
    'click #retry': 'retry'
  },
  initialize: function(){
    _.bindAll(this);
  },
  render: function(){
    this.$el.html(this.template({error_obj: this.options.error_obj, open_modal: this.options.open_modal})).modal();
    return this;
  },
  dashboard: function(){
    IONUX.ROUTER.navigate('/', {trigger:true});
  },
  retry: function(){
    Backbone.history.fragment = null;
    return IONUX.ROUTER.navigate(window.location.pathname, {trigger: true});
  },
});

IONUX.Views.InlineError = Backbone.View.extend({
  template: _.template('<div><%= error_obj %></div>'),
  render: function(){
    $('.modal-body').prepend(this.template({error_obj: this.options.error_obj}));
    return this;
  }
});
