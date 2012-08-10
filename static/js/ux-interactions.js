
IONUX.Interactions.action_controls = function(event){
    if (event.type == 'mouseenter') {
        var btn = $(this.el).find(".btn-group");
        if (btn.length) {
            btn.show();
            return;
        }
    } 
    if (event.type == 'mouseleave') {
        $(this.el).find(".btn-group").hide();
        return;
    }

    var dropdown_button_tmpl = [
        '<div class="btn-group">',
         '<a class="btn dropdown-toggle" data-toggle="dropdown" href="#">Actions<span class="caret"></span></a>',
        '<ul class="dropdown-menu"><% _.each(dropdown_items, function(item) { %> <li><%= item %></li> <% }); %></ul>',
        '</div>'].join('');

    var dropdown_items = INTERACTIONS_OBJECT.block_interactions; 
    var html = _.template(dropdown_button_tmpl, {"dropdown_items":dropdown_items});
    $(this.el).prepend(html);
};


IONUX.Interactions.action_control_click = function(event) {
    alert('Handling ' + $(event.target).text() + ' of Block #' + $(this.el).attr('id') + '.');
}