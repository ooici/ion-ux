// INTERACTIONS_OBJECT = {};
INTERACTIONS_OBJECT.help_interactions = ["Help Contents", "Version Info"]

IONUX.Views.HelpMenu = Backbone.View.extend({
  el: "#topbar #help",
  events: {
    "click #helpmenu-version": "version_clicked"
  },
  modal_template: '<div id="version-overlay" class="modal-ooi modal hide"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button><h1>Version Information</h1></div><div class="modal-body"><dl><% _.each(version, function(v) { %><dt><%= v.lib %></dt><dd><%= v.version %></dd><% }) %></dl></div><div class="modal-footer"><button class="btn-blue" style="float:right;"data-dismiss="modal">OK</button></div>',
  initialize: function(){
    _.bindAll(this);
    
    // Quick fix to show version modal when user is signed in.
    // Todo: investigate ion-ux.js timing issues.
    var self = this;
    this.model.on('change', function() {
      self.setElement('#topbar #help');
    });
  },
  version_clicked: function() {
    var modal_html = _.template(this.modal_template)(this.model.attributes);
    $(modal_html).modal()
      .on('hidden', function() {
        $('#version-overlay').remove();
      });
    return false;
  }
});
