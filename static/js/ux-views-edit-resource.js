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
                                                fields: ['contact']},
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

    el.modal({show:true, keyboard:false, backdrop:'static'})
      .on('hidden', function() {
        self.$el.remove();
      })
  },

  submit_form: function() {

    var vo = this.form.validate();
    if (vo != null) {
      var parentel = $('#user-profile-overlay .modal-body');

      parentel.animate({
        scrollTop: parentel.scrollTop() + $('#' + _.keys(vo)[0]).position().top - 5
      }, 200);

      return;
    }

    var formval = this.form.getValue();

    this.model.set(_.omit(formval, 'contact', 'variables'));
    this.model.merge('variables', formval.variables);
    this.model.merge('contact', formval.contact);

    var self = this;
    this.model.save()
      .done(function(resp) {
        // MODAL CLOSE
        $('#user-profile-overlay').modal('hide');

        // refresh session model and affected areas of the UI (topbar so far)
        IONUX.SESSION_MODEL.fetch().complete(function(resp) {
          new IONUX.Views.Topbar({model: IONUX.SESSION_MODEL}).render().el
        });
    });
  },

});

Backbone.Form.editors.List.Phone = Backbone.Form.editors.Base.extend({

  tagName: 'form',
  render: function() {
    this.numel = $("<input type='text' name='phone_number' />")
    this.typel = $("<select name='phone_type'><option value='work'>Work</option><option value='mobile'>Mobile</option><option value='home'>Home</option><option value='other'>Other</option></select>")
    this.smsel = $("<input type='checkbox' name='sms' />");
    this.$el.append(this.numel);
    this.$el.append(this.typel);
    this.$el.append("<label>SMS</label>")
    this.$el.append(this.smsel);

    this.$el.addClass('form-inline');

    this.setValue(this.value);

    return this;
  },
  getValue: function() {
    var retval = { 'phone_number' : this.numel.val(),
                   'phone_type'   : this.typel.val(),
                   'sms'          : this.smsel.is(':checked') };
    return retval;
  },

  setValue: function(value) {
    if (value && value.hasOwnProperty('phone_number'))
      this.numel.val(value.phone_number);
    if (value && value.hasOwnProperty('phone_type'))
      this.typel.val(value.phone_type);
    if (value && value.hasOwnProperty('sms'))
      this.smsel.attr('checked', value.sms);
  },
  
});
