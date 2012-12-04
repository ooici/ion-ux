function initialize_app(){
    $('.container').css('opacity', 0);
    $('.loader').show();
    
    // IONUX.set_roles("{{ roles }}");
    // 
    // // Handle conditionally displaying login, user profile and logout links
    // if ("{{ logged_in }}" == "True"){
    //     $("#login").hide();
    // } else {
    //     $("#logout").hide();
    //     $("#userprofile").hide();
    // };
    
    var ionux_router = IONUX.init();

    $(".container").css("opacity", 1);
    $(".loader").hide();
};