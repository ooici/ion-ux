IONUX.Views.EditResource = Backbone.View.extend({
  tagName: 'div',
  template: _.template($('#edit-resource-tmpl').html()),
  events: {
    'click #save-resource': 'submit_form',
    'click #cancel-edit': 'cancel'
  }, 
  initialize: function(){
    _.bindAll(this);
    this.form = new Backbone.Form({model: this.model}).render();
    this.base_url = window.location.pathname.replace(/edit$/,'');
  },
  render: function(){
    view_elmt = $('.viewcontainer').children('.row-fluid');
    view_elmt.empty().html(this.$el.html(this.template));
    $('#form-container').html(this.form.el);
    return this;
  },
  submit_form: function(){
    this.model.clear(); // clear to remove attrs not in model.schema.
    this.model.set(this.form.getValue());
    var self = this;
    this.model.save()
      .done(function(resp){
        IONUX.ROUTER.navigate(self.base_url,{trigger:true});
    });
  },
  cancel: function(){
    IONUX.ROUTER.navigate(this.base_url,{trigger:true});
  },
});

IONUX.Views.EditUserRegistration = IONUX.Views.EditResource.extend({

  template: _.template($('#user-profile-modal-tmpl').html()),
  events: {
    'click #save-resource': 'submit_form',
  }, 

  initialize: function() {
    _.bindAll(this);

    var schema = this.model.schema,
        data = _.clone(this.model.attributes);

    this.form = new Backbone.Form({schema: schema,
                                   data: data,
                                   fieldsets: [{legend:'Contact Information',
                                                fields: ['name', 'contact']},
                                               {legend:'Notification Preferences',
                                                fields:['variables']}]}).render();

    this.base_url = '';
  },

  render: function() {
    var modal_html = this.template();

    $('body').append(this.$el);
    this.$el.append(modal_html);
    var el = $('#user-profile-overlay');

    $('.form-container', el).append(this.form.el);

    var self = this;  // @TODO: i know there is a better way of doing this

    el.modal('show')
      .on('hidden', function() {
        self.$el.remove();
      })
  },

  submit_form: function() {

    var formval = this.form.getValue();

    this.model.set(_.omit(formval, 'contact', 'variables'));
    this.model.merge('variables', formval.variables);
    this.model.merge('contact', formval.contact);

    var self = this;
    this.model.save()
      .done(function(resp) {
        // MODAL CLOSE
        $('#user-profile-overlay').modal('hide');
    });
  },

});

