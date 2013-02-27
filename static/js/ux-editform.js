/*

NOTES:

  - EditableResource will have 'self.models' 
    (needed to handle the sub-nesting of Resource attrs)


BLACK_LIST: ['_id', '_rev', 'ts_created', 'ts_updated', 'lcstate', 'type_'];



Form styling:
  - removed top level data name (eg 'Resource')
  - Replace '_' with ' '.
  - Nested data: "(index+1)*margin_left" ...
  - Sort order: alphabetically
*/


var NestedFormModel = Backbone.DeepModel.extend({

  initialize: function(attrs, options){
    this.resource_type = options.resource_type;
    this.black_list = options.black_list || [];
    this.nest_depth_factor = options.nest_depth_factor || 50;
    Backbone.Form.helpers.keyToTitle = this.key_to_title;
    this.get_resource_type_schema();
  },

  schema: function(){
    var schema = this.make_schema();
    return schema;
  },

  make_schema: function(){
    var paths = this.object_to_paths(this.attributes);
    var self = this;
    var schema_full = {};
    _.each(paths, function(key, val){
      var margin_left = self.nest_depth(key) * self.nest_depth_factor;
      var keyschema = {type: "Text", fieldClass: "nestedform",
                   fieldAttrs:{style: "margin-left:"+margin_left+"px"}};
      schema_full[key] = keyschema;
    });
    var schema = _.omit(schema_full, this.black_list); // remove black_listed
    return schema
  },

  get_resource_type_schema: function(){
    var url = "/resource_type_schema/"+this.resource_type; 
    $.ajax({url:url, type:"GET", dataType:"json"})
      .always(function(){})
      .done(function(resp){console.log(resp);})
      .fail(function(){})
  },

  nest_depth: function(val){
    var wlist = val.split(".");
    wlist.shift(); //remove root name
    var intarray = _.filter(wlist, function(w){return !_.isNaN(parseInt(w))});
    return intarray.length;
  },

  key_to_title: function(val){
    var wlist = val.split(".");
    wlist.shift(); //remove root name
    wlist = _.flatten(_.map(wlist, function(w){return w.split("_")}));
    var intarray = _.filter(wlist, function(w){return !_.isNaN(parseInt(w))});
    var warray = _.filter(wlist, function(w){return _.isNaN(parseInt(w))});
    var nest_depth = intarray.length;
    var capital = function(w){return w.charAt(0).toUpperCase() + w.slice(1)};
    wlist = _.map(warray, capital); //Capitalize
    //wlist = wlist.slice(nest_depth, wlist.length); //last part is form title
    title = wlist.join(" ");
    return title;
  },
  
  object_to_paths: function(obj){
    var result = [];
    (function(o, r) {
      r = r || '';
      if (typeof o != 'object') {
        return true;
      }
      for (var c in o) {
        if (arguments.callee(o[c], r + "." + c)) {
          result.push(r.substring(1) + "." + c);
        }
      }
      return false;
    })(obj);
    return result;
  }

});




IONUX.Models.EditableForm = Backbone.Model.extend({
  idAttribute: '_id',

  modelmap: {},

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
