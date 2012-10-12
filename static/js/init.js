// For development use only
// window.UI_OBJECT = new IONUX.Models.Layout();
// window.UI_OBJECT.fetch();

function dyn_do_init(){
    // Temporary hack to set background
    // $('body').css('background-color', '#000');
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