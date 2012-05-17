

/* Table test data with 4 columns and 2 rows of data */
//NOTE: must 'preprocess data for form corrent 'content' (based on 'type') and 'classes' string.
TABLE_TEST_DATA = {
    "uirefid": "12345",
    "headers":["Alpha", "Beta", "Cat", "Delta"],
    "contents":[
        [{'content':'A1 A1', 'classes':'a b'}, 
         {'content':"<img src='/B1.png'>", 'classes':'c'}, 
         {'content':'C1 C1 C1', 'classes':'a'}, 
         {'content':"<a href='/'>D1</a>", 'classes':'l'}
        ],
        [{'content':'A2 A2', 'classes':'a b'}, 
         {'content':"<img src='/B2B2.png'>", 'classes':'c'}, 
         {'content':'C2 C2 C2', 'classes':'a'}, 
         {'content':"<a href='/'>D2 D2</a>", 'classes':'l'}
        ]
    ]
}



$(function(){

    template = _.template($('#test-table-tmpl').html());
    result = template(TABLE_TEST_DATA);
    console.log(result)
    $("#container").css("opacity", "1").append(result);

});
