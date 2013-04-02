// Experimental for string templates that don't need to be referenced 
// in the DOM, i.e. modal templates, backbone-forms templates, etc.

IONUX.Templates = {
  modal_template: '<div id="action-modal" class="modal modal-ooi"></div>',
  full_modal_template: '<div id="action-modal" class="modal modal-ooi">' +
                          '<div class="modal-header"><h1><%= header_text %></h1></div>' +
                          '<div class="modal-body"><%= body %></div>' +
                          '<div class="modal-footer"><%= buttons %></div>' +
                       '</div>',
}
