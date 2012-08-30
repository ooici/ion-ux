$.fn.dataTableExt.oApi.fnFilterClear  = function(oSettings){
    /* Remove global filter */
    oSettings.oPreviousSearch.sSearch = "";
    /* Remove the text of the global filter in the input boxes */
    if ( typeof oSettings.aanFeatures.f != 'undefined' ){
        var n = oSettings.aanFeatures.f;
        for ( var i=0, iLen=n.length ; i<iLen ; i++ )
        {
            $('input', n[i]).val( '' );
        }
    }
    /* Remove the search text for the column filters - NOTE - if you have input boxes for these
     * filters, these will need to be reset*/
    for ( var i=0, iLen=oSettings.aoPreSearchCols.length ; i<iLen ; i++ ){
        oSettings.aoPreSearchCols[i].sSearch = "";
    }
    /* Redraw */
    oSettings.oApi._fnReDraw( oSettings );
};

jQuery.extend(jQuery.fn.dataTableExt.oSort, {
    "title-asc": function(a, b){
        return ((a < b) ? -1 : ((a > b) ? 1 : 0));
    },
 
    "title-desc": function(a, b) {
        return ((a < b) ? 1 : ((a > b) ? -1 : 0));
    }
});
