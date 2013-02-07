/*

NOTES:

  - EditableResource will have 'self.models' (needed to handle the sub-nesting of Resource attrs)


BLACK_LIST: ['_id', '_rev', 'ts_created', 'ts_updated', 'lcstate', 'type_'];
*/

var Resource = Backbone.Model.extend({
    schema: {
      message_controllable: 'Radio', 
      addl: 'Select', 
      description: 'Text',
      name: 'Text',
      alt_ids: 'Select',
      uuid: 'Text', 
      custom_attributes: 'Select', 
      hardware_version: 'Text', 
      monitorable: 'Radio', 
      controllable: 'Radio', 
      serial_number: 'Text', 
      firmware_version: 'Text',
      reference_urls: 'Select',
      last_calibration_datetime: 'Text', 
    }
})

var ContactForResource = Backbone.Model.extend({
    schema: {
      individual_names_given: 'Text',
      city: 'Text',
      roles: {type: 'Select', options: ['primary', 'secondary', 'thirdary']}, 
      administrative_area: 'Text', 
      url: 'Text', 
      country: 'Text', 
      // variables: 'Select',
      organization_name: 'Text',
      type_: 'Text',
      postal_code: 'Text',
      street_address: 'Text'
    }
});

var PhoneForContactForResource = Backbone.Model.extend({
    schema: {
          phone_number: 'Text', 
          phone_type: {type: 'Select', options: ['home', 'office', 'cell']}, 
          type_: 'Text',
          sms: 'Radio'
    }
});



IONUX.Models.EditableResource = Backbone.Model.extend({
  idAttribute: '_id',
  schema: function(){
    return this.make_schema();
  },
  initialize: function(){},
  url: function(){
    return window.location.pathname.replace(/edit$/,'');
  },
  make_schema: function(){
    var self = this;
    var schema = {};
    _.each(this.attributes, function(value, key){
      if (!_.isObject(value) && !(key=='ts_updated' || key=='ts_created')){
        console.log(key, value, typeof value);
        switch(typeof(value)){
          case 'boolean':
            schema[key] = 'Checkbox';
            break;
          case 'number':
            schema[key] = 'Number';
            break;
          default:
            schema[key] = 'Text'
        };
      };
    });
    return schema;
  },
});


IONUX.Models.EditableForm = Backbone.Model.extend({
  idAttribute: '_id',

  initialize: function(attrs, options){
    this.black_list = options.black_list;
    this.make_schema();
  },

  make_schema: function(){
    var self = this;
    var schema = {};
    console.log("black_list: ", this.black_list);
    _.each(this.attributes, function(value, key){
      console.log(key, value);
    });
    return schema;
  },
});


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
