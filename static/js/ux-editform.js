/*
Form styling:
  - Sort order: alphabetically
*/


var EditResourceModel = Backbone.Model.extend({

  initialize: function(options){
    this.resource_type = options.resource_type;
    this.black_list = options.black_list || [];
    this.nest_depth_factor = options.nest_depth_factor || 50;
    Backbone.Form.helpers.keyToTitle = this.key_to_title;
    Backbone.Form.editors.List.Modal.ModalAdapter = Backbone.BootstrapModal;
  },

  url: function(){
    return "/resource_type_edit/"+this.resource_type+'/';
  },

  parse: function(resp){
    return resp.data.GatewayResponse;
  },

  schema: function(){
    var schema = this.get_resource_type_schema();
    //resource_type_schema = resource_type_schema['schema'];
    //var schema = this.make_schema(resource_type_schema);
    return schema;
  },

  make_schema: function(resource_type_schema){
    var paths = this.object_to_paths(this.attributes);
    var self = this;
    var schema_full = {};
    _.each(paths, function(key, val){
      var form_type_and_options = self.resource_type_schema_form_type(resource_type_schema, key);
      var form_type = form_type_and_options[0], options = form_type_and_options[1];
      var margin_left = self.nest_depth(key) * self.nest_depth_factor;
      var keyschema = {type: form_type, options:options,
                      fieldClass: "nestedform", 
                      fieldAttrs:{style: "margin-left:"+margin_left+"px"}};
      //TODO: only add 'options' if non-empty list?
      schema_full[key] = keyschema;
    });
    var schema = _.omit(schema_full, this.black_list); // remove black_listed
    return schema
  },

  resource_type_schema_form_type: function(resource_type_schema_obj, data_key){
    //XXX is this still needed?
    var root_type = 'resource'; //XXX make more general
    var form_type_and_options = ["Text", []];
    _.each(resource_type_schema_obj, function(key, val){
      console.log(key, val);
      var regex_str = root_type + '.' + val;
      var reg = new RegExp(regex_str);
      var match = reg.exec(data_key);
      if (!_.isNull(match)){
         form_type_and_options = key;
      }
      //console.log(regex_str, key, val, data_key, match, form_type);
    });
   return form_type_and_options; 
  },

  get_resource_type_schema: function(){
    /* NOTE: this is a blocking ajax call (async:false) */
    var url = "/resource_type_schema/"+this.resource_type; 
    var data = null;
    $.ajax({url:url, type:"GET", dataType:"json", async:false})
      .always(function(){})
      .done(function(resp){data = resp;})
      .fail(function(){})
    return data["schema"];
  },

  nest_depth: function(val){
    var wlist = val.split(".");
    wlist.shift(); //remove root name
    var intarray = _.filter(wlist, function(w){return !_.isNaN(parseInt(w))});
    return intarray.length;
  },

  key_to_title: function(val){
    var wlist = val.split(".");
    wlist = _.flatten(_.map(wlist, function(w){return w.split("_")}));
    wlist = _.flatten(_.map(wlist, function(w){return w.split(".")}));
    var capital = function(w){return w.charAt(0).toUpperCase() + w.slice(1)};
    wlist = _.map(wlist, capital); //Capitalize
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
