// Called from IONUX.setup_ajax_error (ion-ux.js)

IONUX.Views.Error = Backbone.View.extend({
  el: '#action-modal',
  modal_template: '<div id="action-modal" class="modal modal-ooi"></div>',
  template: _.template($('#error-tmpl').html()),
  events: {
    'click #back': 'back',
    'click #dashboard': 'dashboard',
    'click #relogin': 'relogin'
  },
  initialize: function(){
    _.bindAll(this);
  },
  render: function(){
    var self = this;
    $(this.modal_template).html(this.template({error_obj: this.options.error_obj,
                                               open_modal: this.options.open_modal,
                                               force_logout: this.options.force_logout}))
      .modal({keyboard:!this.options_force_logout,
              backdrop:(this.options.force_logout) ? 'static' : true})
      .on('hidden', function() {
        $('#action-modal').remove();
      });
    
    // Ensure bindings, back and dashboard functions won't work without this.
    this.setElement('#action-modal'); 
    
    return this;
  },
  back: function(){
    window.history.back();
    return;
  },
  dashboard: function(){
    console.log('dashboard clicked.');
    IONUX.ROUTER.navigate('/', {trigger:true});
    return;
  },
  relogin: function() {
    window.location.href = "/login/";
    return;
  }
});

IONUX.Views.InlineError = Backbone.View.extend({
  template: _.template('<div><%= error_obj %></div>'),
  render: function(){
    $('.modal-body').prepend(this.template({error_obj: this.options.error_obj}));
    return this;
  }
});
