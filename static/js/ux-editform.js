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
                       'addl', 'availability', 'message_controllable', 'monitorable', 'alt_resource_type','asset_attrs'];
    this.gray_list = ['persisted_version','type_version'];
    this.nest_depth_factor = options.nest_depth_factor || 50;
    Backbone.Form.helpers.keyToTitle = this.key_to_title;
    Backbone.Form.editors.List.Modal.ModalAdapter = Backbone.BootstrapModal;
  },

  url: function(){
    return "/resource_type_edit/"+this.resource_type+'/'+this.resource_id+'/';
  },

  parse: function(resp) {
    var data = resp.data;
    if (data == null) return data;

    if (data.hasOwnProperty('type_') && data.type_.indexOf('Prepare') != -1) {
      this.prepare = data;
      data = data.resource;
    }
    
    // ----------------------------------------------
    // Workaround to a hard-to-track down issue with the way
    // underscore iterates some objects.
    
    var parsed = {};
    for (var k in data) {
      var v = data[k];
      // turn objects (dicts) that don't have a type_ field into a string
      if (_.isObject(v) && !_.isArray(v) && !v.hasOwnProperty('type_')) {
        parsed[k] = JSON.stringify(v);
      }
      // turn lists of objects that don't have a type_ field into strings, skipping 'variables'
      else if (_.isArray(v) && _.every(v, function(vv) { return _.isObject(vv) && !vv.hasOwnProperty('type_') }) && k != 'variables') {
        parsed[k] = _.map(v, JSON.stringify);
      } else {
        parsed[k] = v; 
      };
      
      
      // Change user variable booleans to strings for editing
      if (k == 'variables') {
        _.each(data[k], function(v, k) {
          if (v['value'] === false) v['value'] = 'false';
          if (v['value'] === true) v['value'] = 'true';
        });
      };
      
    };
    
    // Original implementation left for reference
    // in place transformations of data
    // var parsed = _.object(_.map(data, function(v, k) {
    //   console.log('k, v', k, v);
    //   // turn objects (dicts) that don't have a type_ field into a string
    //   if (_.isObject(v) && !_.isArray(v) && !v.hasOwnProperty('type_')) {
    //     return [k, JSON.stringify(v)];
    //   }
    //   
    //   // turn lists of objects that don't have a type_ field into strings, skipping 'variables'
    //   else if (_.isArray(v) && _.every(v, function(vv) { return _.isObject(vv) && !vv.hasOwnProperty('type_') }) && k != 'variables') {
    //     return [k, _.map(v, JSON.stringify)];
    //   }
    // 
    //   return [k, v];
    // }));

    // ----------------------------------------------

    // add values for any existing associations
    if (this.prepare && !_.isEmpty(this.prepare.associations)) {
      _.each(this.prepare.associations, function(v, k) {
        if (v.associated_resources.length > 0) {
          // figure out which side is the correct side for the value here
          // @TODO clunky
          var assocval = _.map(v.associated_resources, function(ar) {
            if (ar.s == parsed._id) {
              return ar.o;
            }
            return ar.s;
          });
          
          if (!v.multiple_associations) {
            assocval = assocval[0];
          }
          
          parsed[k] = assocval;
        }
      });
    }
    return parsed;
  },

  toJSON: function() {
    
    var attrs = _.clone(this.attributes);

    // scrape out any associations
    var keys     = _.keys(this.prepare.associations);
    var resource = _.omit(attrs, keys);
    var assocs   = _.pick(attrs, keys);
    
    // ----------------------------------------------
    // Workaround to a hard-to-track down issue with the way
    // underscore iterates some objects.
    
    // reverse in-place transformation of data (from parse stage)
    var resource_trans = {};
    for (k in resource) {
      var v = resource[k];
      
      if (_.isString(v) && v.substring(0) == "{") {
        try {
          resource_trans[k] = JSON.parse(v);
        } catch(err) { } // silent continue and let old value fall through
      }
      // turn list of stringified objects back into objects
      else if (_.isArray(v) && _.every(v, function(vv) { return _.isString(vv) && vv.charAt(0) == "{" })) {
        try {
          resource_trans[k] = _.map(v, JSON.parse);
        } catch(err) { } // silent continue and let old value fall through
      } else {
        resource_trans[k] = v;
      }
      
      if (k == 'variables') {
        console.log('variables', resource);
        _.each(resource[k], function(v, k) {
          if (v['value'] == 'false') v['value'] = false;
          if (v['value'] == 'true') v['value'] = true;
        });
      };
      
    };
    
    // Original implementation left for reference
    // resource = _.object(_.map(resource, function(v, k) {
    //   // turn stringified single object back into json object
    //   if (_.isString(v) && v.substring(0) == "{") {
    //     try {
    //       return [k, JSON.parse(v)];
    //     } catch(err) { } // silent continue and let old value fall through
    //   }
    //   // turn list of stringified objects back into objects
    //   else if (_.isArray(v) && _.every(v, function(vv) { return _.isString(vv) && vv.substring(0) == "{" })) {
    //     try {
    //       return [k, _.map(v, JSON.parse)];
    //     } catch(err) { } // silent continue and let old value fall through
    //   }
    // 
    //   return [k, v];
    // }));
    
    // ----------------------------------------------
    
    var self = this;
    var omit_keys = _.filter(keys, function(k) {
      var v = self.prepare.associations[k];
      return _.isEmpty(v.unassign_request) && v.associated_resources.length > 0;
    });

    assocs = _.omit(assocs, omit_keys);

    retval = {'resource':resource_trans,
              'assocs':assocs}
    //
    return retval;
  },

  schema: function(){
    var self = this;
    var schema = this.get_resource_type_schema();
    _.each(schema, function(v, k) {
      if (v.type == "List" && v.itemType == "IonObject") {
        v.itemToString = _.partial(self.item_to_string, v);
        schema[k] = v;
      } else if (v.type == "IonObject" && !v.help) {
        v.help = 'Click the value to edit';
        v.itemToString = _.partial(self.item_to_string, v);
        schema[k] = v;
      }
    });
    schema = _.omit(schema, this.black_list)

    // pull out name/description first, then sort by alphabetical order
    var sorted_schema = {}
    if (schema.hasOwnProperty('name')) {
      sorted_schema['name'] = schema['name'];
      delete schema['name']
    }
    if (schema.hasOwnProperty('description')) {
      sorted_schema['description'] = schema['description'];
      delete schema['description']
    }

    var sorted = _.sortBy(_.pairs(schema), function(s) {
      return s[0];
    });
    
    _.each(sorted, function(a) {
      sorted_schema[a[0]] = a[1];
    });
    
    // add on any associations
    if (this.prepare && !_.isEmpty(this.prepare.associations)) {
      _.each(this.prepare.associations, function(v, k) {
        var additional_options = {}
        var resources = _.map(v.resources, function(r) { return {val:r._id, label:r.name} });
        if (v.hasOwnProperty('group')) {
          // restrict the choices based on the value of the group_by association
          var get_related_resources = function(curkey) {
            var resource_ids = v.group.resources[curkey];

            var opts = _.map(_.filter(v.resources, function(r) {
              return _.contains(resource_ids, r._id);
            }), function(r) { return {val:r._id, label:r.name } });

            // add the blank option if appropriate
            if (!v.multiple_associations) {
              opts = [{val:null, label:'-'}].concat(opts);
            }

            return opts;
          }

          // set up refresh ability: give a function that will yield the 'options' portion of
          // this schema
          var rel_assoc = v.group.group_by;
          resources = get_related_resources(self.attributes[rel_assoc]);

          additional_options = {refresh: {attr: rel_assoc,
                                          src: k,
                                          func: get_related_resources},
                                help: "The list of values here will change when " + rel_assoc + " is updated."};
        } else {
          if (!v.multiple_associations) {
            resources = [{val:null, label:'-'}].concat(resources);
          }
        }
        var item_schema = {title: k,
                           type: 'Select',
                           options: resources}
        item_schema = _.extend(item_schema, additional_options);

        if (v.multiple_associations) {
          item_schema.type = 'MultiSelect';
        }

        // don't allow editing of items with no unassign and a value already
        if (_.isEmpty(v.unassign_request) && v.associated_resources.length > 0) {
          item_schema.editorAttrs = {'disabled':'disabled'}
          item_schema.help = "This association is already set and may not be edited.";
        }
        sorted_schema[k] = item_schema;
      });
    }

    // Make anything on the gray_list uneditable.
    _.each(_.intersection(this.gray_list,_.keys(sorted_schema)),function(k) {
      sorted_schema[k].editorAttrs = {'disabled':'disabled'};
    });

    return sorted_schema;
  },

  item_to_string: function(schema, v) {
    v = v || {};

    if (schema.hasOwnProperty('multi')) {
      schema = schema.multi[v.type_];
    } else {
      schema = schema.subSchema;
    }

    var parts =[];
    _.each(schema, function(s, k) {
      var desc = Backbone.Form.helpers.keyToTitle(k),
          val = v[k];
        if (s.type != 'Hidden') {
          if (_.isUndefined(val) || _.isNull(val)) val = '';
          if (_.isArray(val)) val = "(" + val.length + " item" + (val.length != 1 ? "s" : "") + ")";

          parts.push(desc + ': ' + val);
        }
    });

    return parts.join('<br />');
  },

  get_resource_type_schema: function(){
    return this.prepare.resource_backbone_schema;
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

Backbone.Form.editors.MultiSelect = Backbone.Form.editors.Select.extend({
  render: function() {
    Backbone.Form.editors.Select.prototype.render.call(this);
    this.$el.attr('multiple', 'multiple');

    // call setValue again because it didn't know we were doing multiple when it was called
    this.setValue(this.value);

    return this;
  },
  setValue: function(value) {
    this.value = value;
    Backbone.Form.editors.Select.prototype.setValue.call(this, value);
  }
});

IONUX.Views.EditResource = Backbone.View.extend({
  tagName: 'div',
  template: _.template($('#edit-resource-tmpl').html()),
  events: {
    'click #save-resource': 'submit_form',
    'click #cancel-edit': 'cancel'
  },
  initialize: function() {
    this.init_time = new Date().getTime();
    _.bindAll(this);
    this.form = new Backbone.Form({model: this.model}).render();
    this.base_url = window.location.pathname.replace(/edit$/,'');
    this.render();

    // find any (top-level) schema items that need dynamic event changing
    var self = this;
    _.each(this.form.schema, function(v, k) {
      if (v.hasOwnProperty('refresh')) {
        self.form.on(v.refresh.attr + ':change', function(f, ed) {
          var opts = v.refresh.func(ed.$el.val());

          // update the other editor's options with our new options
          var othered = self.form.fields[v.refresh.src].editor;
          othered.schema.options = opts;
          othered.setOptions(opts);
        });
      }
    });
  },
  render: function(){
    // Insert form but leave page header
    $('#dynamic-container > .row-fluid').html(this.$el.html(this.template));
    $('#form-container').html(this.form.el);

    // HACK HACK to fix up embedded object spacing
    this.$('.bbf-object').parent().prev('label').css({float:'none'});

    if (/Asset|EventDuration/.test(this.model.resource_type)) {
      $('#save-resource').text('Continue');
    }
  },
  submit_form: function(e){
    var target = $(e.target);
    target.prop("disabled", true);
    target.text(" Saving... ");
    var self = this;
    
    this.form.commit();
    
    // This should possible go in the model, but leaving here for now.
    if (this.model.get('type_') == 'UserInfo') {
      var ui_theme = _.findWhere(this.model.get('variables'), {name: 'ui_theme_dark'});
      if (ui_theme && ui_theme.value == 'true') {
        IONUX.SESSION_MODEL.set('ui_theme_dark', true);
      } else {
        IONUX.SESSION_MODEL.set('ui_theme_dark', false);
      };
      IONUX.set_ui_theme();

      // set some defaults variables if necessary
      var v = this.model.get('variables') ? this.model.get('variables') : [];
      if (!_.findWhere(v,{name : 'notifications_disabled'})) {
        v.push({name : 'notifications_disabled',value : 'false'});
      }
      if (!_.findWhere(v,{name : 'notifications_daily_digest'})) {
        v.push({name : 'notifications_daily_digest',value : 'false'});
      }
      if (!_.findWhere(v,{name : 'ui_theme_dark'})) {
        v.push({name : 'ui_theme_dark',value : 'false'});
      }
      if (v) {
        this.model.set('variables',v);
      }
    };

    // unset values used by IONUX.Models.EditResourceModel
    // to dynmically create schema and retrieve resource values.
    this.model.unset('resource_id');
    this.model.unset('resource_type');

    if (/Asset|EventDuration/.test(this.model.resource_type)) {
      this.model.save().done(function(){
        IONUX.ROUTER.navigate(self.base_url + 'page_to_edit', {trigger:true});
        window.scrollTo(0,0); // scroll to top
        target.prop('disabled', false);
        target.text("Continue");
      });
    }
    else {
      this.model.save().done(function(){
        IONUX.ROUTER.navigate(self.base_url, {trigger:true});
        window.scrollTo(0,0); // scroll to top
        target.prop('disabled', false);
        target.text("Save");
      });
    }
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
                                               // {legend:'Notification Preferences',
                                               //  fields:['variables']}
                                                ]}).render();

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
    this.$el.append(this.numel);
    this.$el.append(this.typel);

    this.$el.addClass('form-inline');

    this.setValue(this.value);

    return this;
  },
  getValue: function() {
    var retval = { 'phone_number' : this.numel.val(),
                   'phone_type'   : this.typel.val(),
                   'type_'        : 'Phone' };
    return retval;
  },

  setValue: function(value) {
    if (value && value.hasOwnProperty('phone_number'))
      this.numel.val(value.phone_number);
    if (value && value.hasOwnProperty('phone_type'))
      this.typel.val(value.phone_type);
  },
});

Backbone.Form.editors.List.IonObject = Backbone.Form.editors.List.Object.extend({
  initialize: function(options) {
    Backbone.Form.editors.List.Object.prototype.initialize.call(this, options);

    // fixup: base looks for Object string literal to assign nestedSchema,
    // so we have to manually do it here
    this.nestedSchema = this.schema.subSchema;

    // register for when the form opens
    this.on('open', this.fill_default);
  },
  fill_default: function() {
    // this.modal.options.content is the reference to the backbone form on the modal

    if (!this.modal.options.content.fields.type_.getValue())
      this.modal.options.content.fields.type_.setValue(this.nestedSchema.type_['default']);
  },
  openEditor: function() {
    this.switchSchema(this.value);
    if (this.schema.hasOwnProperty('multi')) {
      this.once('open', this.makeTypeDropdown);
    }
    Backbone.Form.editors.List.Object.prototype.openEditor.call(this);
  },
  switchSchema: function(value) {
    /**
     * Switches this.nestedSchema out based on the value. Used for heterogenous lists.
     * Only has any effect if this.schema has a multi property set.
     */
    if (this.schema.hasOwnProperty('multi')) {
      if (value) {
        this.nestedSchema = this.schema.multi[value.type_];
      } else {
        this.nestedSchema = this.schema.multi[_.first(_.keys(this.schema.multi))];
      }
    }
  },
  makeTypeDropdown: function() {
    var self = this,
          el = this.modal.$el.find('.modal-body'),
        mhel = $("<div class='modal-header' style='text-align:right'></div>").insertBefore(el),
         sel = $("<select name='typeselect'></select>").appendTo(mhel);

    _.each(this.schema.multi, function(v, k) {
      sel.append("<option value='" + k + "'>" + k + "</option>");
    });

    if (!this.value) {
      sel.change(function() {
        var val = $(this).val();
        var newschema = self.schema.multi[val];

        var newform = new Backbone.Form({
          schema: newschema,
          data: {type_: val}
        });

        self.modal.options.content = newform;
        newform.render();
        el.html(newform.$el);
      });
    } else {
      sel.val(this.value.type_);
      sel.attr('disabled', 'disabled');
    }
  },
  onModalSubmitted: function(form, modal) {
    /**
     * Fixup override - form here is bound to the old form. Call base and use the current one.
     */
    Backbone.Form.editors.List.Object.prototype.onModalSubmitted.call(this, modal.options.content, modal);
  },
});

Backbone.Form.editors.IonObject = Backbone.Form.editors.List.IonObject.extend({
  initialize: function(options) {
    Backbone.Form.editors.List.IonObject.prototype.initialize.call(this, options);
    if (!(this.schema.subSchema.hasOwnProperty('type_') && this.schema.subSchema.type_['default'])) {
      throw new Error("Missing required 'schema.subSchema.type_.default' property");
    }

    // provide default if new object
    if (_.isEmpty(this.value)) {
      if (!this.value) this.value = {};
      this.value.type_ = this.schema.subSchema.type_['default'];
    }
  }
});
