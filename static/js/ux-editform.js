/*

NOTES:

  - EditableResource will have 'self.models' 
    (needed to handle the sub-nesting of Resource attrs)


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


IONUX.Models.EditableForm = Backbone.Model.extend({
  idAttribute: '_id',

  modelmap: {"resource":Resource, "contacts":ContactForResource,
            "phones":PhoneForContactForResource},

  initialize: function(attrs, options){
    this.black_list = options.black_list || [];
    //this.make_schema();
    this.make_models();
  },

  make_models: function(){
    var all_models = [];
    var attrs = _.omit(this.attributes, this.black_list);
    var sub_object_keys = this.find_sub_objects();
    console.log("SUB OBJECTS: ", sub_object_keys);
    var self = this;
    var sub_sub_objects = [];
    _.each(sub_object_keys, function(key){
      var sub_objects = attrs[key];
      var subobj = sub_objects[0];
      console.log("! subobj ", key);
      all_models.push(new self.modelmap[key]());
      //sub_sub_objects.push(self.find_sub_objects(subobj));
      _.each(sub_objects, function(obj){
        console.log("! sub sub obj ", self.find_sub_objects(obj));
      });
    });
    //_.each(sub_sub_objects, function(item){ });
  },

  make_schemas: function(){
    var self = this;
    var schema = {};
    var attrs = _.omit(this.attributes, this.black_list);
    console.log("black_list: ", this.black_list);
    _.each(this.attributes, function(value, key){
      console.log(key, value);
    });
    return schema;
  },

  find_sub_objects: function(attrs){
    var sub_object_keys = [];
    var attrs = attrs || _.omit(this.attributes, this.black_list);
    _.each(attrs, function(value, key){
      //console.log(key, typeof(value), value);
      if (_.isArray(value)){
        //console.log("isArray: ", key);
        if (value.length > 0){
          var item = value[0];
          if (_.isObject(item) && !_.isArray(item)){
            sub_object_keys.push(key);
          }
        }
      } else {
        if (_.isObject(value)){
          //console.log("isObject: ", key);
        } else {
          if (_.isString(value)){
            //console.log("isString ", key);
          } else {
            if (_.isBoolean(value)){
              //console.log("isBoolean ", key);
            } else {
              //console.log("is?: ", key);
            }
          }
        }
      } // _.isNumber, _.isDate
    });
    return sub_object_keys;
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
