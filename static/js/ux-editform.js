/*
Form styling:
  - Sort order: alphabetically
*/

IONUX.Models.EditResourceModel = Backbone.Model.extend({
  idAttribute: '_id',
  initialize: function(options){
    this.resource_type = options.resource_type;
    this.resource_id = options.resource_id;
    // this.black_list = options.black_list || [];
    this.black_list = ['_id', '_rev', 'ts_created', 'ts_updated', 'lcstate', /*'type_',*/ 'alt_ids', 
                       'addl', 'availability', 'message_controllable', 'monitorable'];
    this.nest_depth_factor = options.nest_depth_factor || 50;
    Backbone.Form.helpers.keyToTitle = this.key_to_title;
    Backbone.Form.editors.List.Modal.ModalAdapter = Backbone.BootstrapModal;
  },

  url: function(){
    return "/resource_type_edit/"+this.resource_type+'/'+this.resource_id+'/';
  },

  parse: function(resp){
    _.each(resp.data, function(v, k) {
      if (_.isObject(v) && !_.isArray(v) && !v.hasOwnProperty('type_')) {
        resp.data[k] = JSON.stringify(v);
      } else if (_.isArray(v) && !_.every(v, function(vv) { return vv.hasOwnProperty('type_') })) {
        resp.data[k] = _.map(v, JSON.stringify);
      }
    });
    return resp.data;
  },

  schema: function(){
    var schema = this.get_resource_type_schema();
    return _.omit(schema, this.black_list)
  },

  // make_schema: function(resource_type_schema){
  //   var paths = this.object_to_paths(this.attributes);
  //   var self = this;
  //   var schema_full = {};
  //   _.each(paths, function(key, val){
  //     var form_type_and_options = self.resource_type_schema_form_type(resource_type_schema, key);
  //     var form_type = form_type_and_options[0], options = form_type_and_options[1];
  //     var margin_left = self.nest_depth(key) * self.nest_depth_factor;
  //     var keyschema = {type: form_type, options:options,
  //                     fieldClass: "nestedform", 
  //                     fieldAttrs:{style: "margin-left:"+margin_left+"px"}};
  //     //TODO: only add 'options' if non-empty list?
  //     schema_full[key] = keyschema;
  //   });
  //   var schema = _.omit(schema_full, this.black_list); // remove black_listed
  //   return schema
  // },

  // resource_type_schema_form_type: function(resource_type_schema_obj, data_key){
  //   //XXX is this still needed?
  //   var root_type = 'resource'; //XXX make more general
  //   var form_type_and_options = ["Text", []];
  //   _.each(resource_type_schema_obj, function(key, val){
  //     var regex_str = root_type + '.' + val;
  //     var reg = new RegExp(regex_str);
  //     var match = reg.exec(data_key);
  //     if (!_.isNull(match)){
  //        form_type_and_options = key;
  //     }
  //     //console.log(regex_str, key, val, data_key, match, form_type);
  //   });
  //  return form_type_and_options; 
  // },

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

// Removed 4-11-13 as duplication in ion-ux-models.
// IONUX.Models.EditableResource = Backbone.Model.extend({
//   idAttribute: '_id',
//   schema: function(){
//     return this.make_schema();
//   },
//   initialize: function(){},
//   url: function(){
//     return window.location.pathname.replace(/edit$/,'');
//   },
//   make_schema: function(){
//     var self = this;
//     var schema = {};
//     _.each(this.attributes, function(value, key){
//       if (!_.isObject(value) && !(key=='ts_updated' || key=='ts_created')){
//         console.log(key, value, typeof value);
//         switch(typeof(value)){
//           case 'boolean':
//             schema[key] = 'Checkbox';
//             break;
//           case 'number':
//             schema[key] = 'Number';
//             break;
//           default:
//             schema[key] = 'Text'
//         };
//       };
//     });
//     return schema;
//   },
// });

Backbone.Form.editors.IntSelect = Backbone.Form.editors.Select.extend({
  getValue: function() {
    var v = this.$el.val();
    var iv = parseInt(v);
    if (iv.toString() == v) {
      return iv;
    }

    return v;
  }
});

IONUX.Views.EditResource = Backbone.View.extend({
  tagName: 'div',
  template: _.template($('#edit-resource-tmpl').html()),
  events: {
    'click #save-resource': 'submit_form',
    'click #cancel-edit': 'cancel'
  },
  initialize: function(){
    this.init_time = new Date().getTime();
    _.bindAll(this);
    this.form = new Backbone.Form({model: this.model}).render();
    this.base_url = window.location.pathname.replace(/edit$/,'');
    this.render();
  },
  render: function(){
    // Insert form but leave page header
    $('#dynamic-container > .row-fluid').html(this.$el.html(this.template));
    $('#form-container').html(this.form.el);
  },
  submit_form: function(){
    var self = this;
    this.form.commit();
    // unset values used by IONUX.Models.EditResourceModel
    // to dynmically create schema and retrieve resource values.
    this.model.unset('resource_id');
    this.model.unset('resource_type');

    this.model.save().done(function(){
      IONUX.ROUTER.navigate(self.base_url, {trigger:true});
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
                   'sms'          : this.smsel.is(':checked'),
                   'type_'        : 'Phone' };
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

