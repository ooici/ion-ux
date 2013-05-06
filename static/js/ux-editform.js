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

  parse: function(resp) {
    var data = resp.data;
    if (data == null) return data;

    if (data.hasOwnProperty('type_') && data.type_.indexOf('Prepare') != -1) {
      this.prepare = data;
      data = data.resource;
    }

    // in place transformations of data
    var parsed = _.object(_.map(data, function(v, k) {
      if (_.isObject(v) && !_.isArray(v) && !v.hasOwnProperty('type_')) {
        return [k, JSON.stringify(v)];
      } else if (_.isArray(v) && !_.every(v, function(vv) { return vv.hasOwnProperty('type_') })) {
        return [k, _.map(v, JSON.stringify)];
      }
      return [k, v];
    }));

    console.log(this.prepare);
    
    // add values for any existing associations
    if (this.prepare && !_.isEmpty(this.prepare.associations)) {
      _.each(this.prepare.associations, function(v, k) {
        if (v.associated_resources.length > 0)
          // figure out which side is the correct side for the value here
          // @TODO clunky
          if (v.associated_resources[0].s == parsed._id)
            parsed[k] = v.associated_resources[0].o;
          else
            parsed[k] = v.associated_resources[0].s;
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

    retval = {'resource':resource,
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
        sorted_schema[k] = {title: k,
                            type: 'Select',
                            options: [{val:null, label:'-'}].concat(_.map(v.resources, function(r) { return {val:r._id, label:r.name} }))};
      });
    }

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
        if (_.isUndefined(val) || _.isNull(val)) val = '';
        if (_.isArray(val)) val = "(" + val.length + " item" + (val.length != 1 ? "s" : "") + ")";

        parts.push(desc + ': ' + val);
    });

    return parts.join('<br />');
  },

  get_resource_type_schema: function(){
    /* NOTE: this is a blocking ajax call (async:false) */
    var url = "/resource_type_schema/"+this.resource_type + "/"; 
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

    // HACK HACK to fix up embedded object spacing
    this.$('.bbf-object').parent().prev('label').css({float:'none'});
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

Backbone.Form.editors.IonObject = Backbone.Form.editors.Object.extend({
  initialize: function(options) {
    Backbone.Form.editors.Object.prototype.initialize.call(this, options);
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


