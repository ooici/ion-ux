// For development use only
window.layoutModel = new IONUX.Models.Layout();
window.layoutModel.fetch();

/* rename and put in seperate file: */
// function dyn_do_layout(){
//     console.log('dyn_do_layout');
//     var _id = "b62348314_2250001";
//     var uirefid = _id.split("_")[1];
//     var instr_facepage_data = LAYOUT_OBJECT[_id]; 
//     _.each(instr_facepage_data, function(group){
//         _.each(group.blocks, function(block){
//             if (block.ui_representation == "Table"){
//                 var tmpl = _.template($("#dyn-table-tmpl").html());
//                 console.log("'Table' BLOCK: ", block);
//                 var tmpl_res = tmpl({"block":block, "uirefid":uirefid});
//                 $("#main-container").append(tmpl_res);
//                 console.log("'Table' BLOCK  tmpl: ", tmpl_res);
//                 /* _.each(block.attributes, function(attr){
//                     console.log("attr: ", attr);
//                 });*/
//             }
//         });
//     });
//     //console.log(tmpl.render({}));
// }

function dyn_do_init(){
    // Temporary hack to set background
    $('body').css('background-color', '#000');
    $('.container').css('opacity', 0);
    $('.loader').show();

    IONUX.set_roles("{{ roles }}");
    // Handle conditionally displaying login, user profile and logout links
    if ("{{ logged_in }}" == "True") {
        $("#login").hide();
    } else {
        $("#logout").hide();
        $("#userprofile").hide();
    };

    var ionux_router = IONUX.init();

    // dyn_do_layout();
    $(".container").css("opacity", 1);
    $(".loader").hide();
};