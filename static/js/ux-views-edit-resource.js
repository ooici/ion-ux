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
  },
  render: function(){
    view_elmt = $('.viewcontainer').children('.row-fluid');
    view_elmt.empty().html(this.$el.html(this.template));
    $('#form-container').html(this.form.el);
    return this;
  },
  submit_form: function(){
    this.model.set(this.form.getValue());
    this.model.save()
      .done(function(resp){IONUX.ROUTER.navigate(window.location.pathname.replace(/edit$/, ''),{trigger:true})})
      .fail(function(resp){console.log(resp)});
  },
  cancel: function(){
    window.history.back();
  },
});