/* below is in-progress datatable widget functions, 
*without* correct (upcoming) backbone-ified structure */


OPERATORS = ['CONTAINS', 'NEWER THAN', 'OLDER THAN', 'GREATER THAN', 'LESS THAN'];

function add_filter_item(evt){
    var filter_item_tmpl = [
      '<div class="filter-item">',
        '<select class="column"><% _.each(columns, function(e){%> <option value="<%= e.replace(/ /g, "_") %>"><%= e %></option><%});%></select>',
        '<select class="operator"><% _.each(operators, function(e){%> <option value="<%= e.replace(/ /g, "_") %>"><%= e %></option><%});%></select>',
        '<input class="argument" type="text" value="">',
        '<span class="filter-add">+</span><span class="filter-remove">-</span>',
      '</div>'].join('');
    var columns = _.reject(_.map(TABLE_DATA.headers, function(e){return e['sTitle']}), function(e){return e==""});
    var data = {"columns":columns, "operators":OPERATORS};
    var filter_item = _.template(filter_item_tmpl)(data);
    $(this).parent().after(filter_item);
}

function remove_filter_item(evt){
    var this_filter_item = $(this).parent();
    var filter_items = $(this).parents(".datatable-filters").find(".filter-item");
    if (filter_items.length > 0) {
        this_filter_item.remove();
        return;
    }
}


function dt_init(table_data){

    var template = _.template($('#datatable-tmpl').html());
    $("#dynamic-container").html(template());

    $("#dynamic-container .datatable-container table").dataTable({
        "aaData": table_data.data,
        "aoColumns":table_data.headers
    });

    $(".table tr.odd td").css("background-color", "#1E1E1E"); //wtf css?

    $(".datatable-filters").on("click", ".filter-add", add_filter_item);
    $(".datatable-filters").on("click", ".filter-remove", remove_filter_item);

}
