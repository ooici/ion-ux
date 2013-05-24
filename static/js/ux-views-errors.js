// Called from IONUX.setup_ajax_error (ion-ux.js)

IONUX.Views.Error = Backbone.View.extend({
  el: '#action-modal',
  modal_template: '<div id="action-modal" class="modal modal-ooi"></div>',
  template: _.template($('#error-tmpl').html()),
  events: {
    'click #back': 'back',
    'click #dashboard': 'dashboard',
    'click #relogin': 'relogin',
    'click #cancel_relogin': 'cancel_relogin'
  },
  initialize: function(){
    _.bindAll(this);
  },
  render: function(){
    var   self = this,
      headline = "Error";

    _.each(this.options.error_objs, function(eo) {
        eo.is_html = eo.Message.indexOf("<") == 0;
        if (eo.is_html) {
          // http://stackoverflow.com/questions/7839889/trying-to-select-a-body-tag-from-html-that-is-returned-by-get-request
          eo.Message = eo.Message.replace(/^[\S\s]*<body[^>]*?>/i, "")
                                 .replace(/<\/body[\S\s]*$/i, "");
        }
    });

    if (this.options.error_objs.length > 1) {
      headline = "Error (" + this.options.error_objs.length + " total)";
    }

    $(this.modal_template).html(this.template({headline: headline,
                                               error_objs: this.options.error_objs,
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
    window.location.href = "/login/" + window.location.pathname.substring(1);  // remove preceding slash
    return;
  },
  cancel_relogin: function() {
    window.location.reload();
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
