function chart_title(args) {
    //is chart title different than existing, if so, clear the fine 
    //gentleman, otherwise, move along
    'use strict';
    var currentTitle = $(args.target).find('h2.chart_title');
    if(args.title && args.title !== currentTitle.text())
        currentTitle.remove();
    else
        return;

    if (args.target && args.title) {
        var newTitle;
        //only show question mark if there's a description
        var optional_question_mark = (args.description)
            ? '<i class="fa fa-question-circle fa-inverse"></i>'
            : '';
    
        $(args.target).prepend('<h2 class="chart_title">' 
            + args.title + optional_question_mark + '</h2>');
            
        //activate the question mark if we have a description
        if (args.description){
            newTitle = $(args.target).find('h2.chart_title');
                newTitle.popover({
                    html: true,
                    animation: false,
                    content: args.description,
                    trigger: 'hover',
                    placement: 'top',
                    container: newTitle
                });
        }   
    }
    
    if(args.error) {
        error(args);
    }
}

// function apply_popover_to(args){
//     'use strict';
//     //is chart title different than existing, if so, clear the fine 
//     //gentleman, otherwise, move along
//     // var currentTitle = $(args.target);
//     // if(args.title && args.title !== currentTitle.text())
//     //     currentTitle.remove();
//     // else
//     //     return;
//     console.log('sdfoin');

//     if (args.target && args.title) {
//         var newTitle;

//         //only show question mark if there's a description
//         // var optional_question_mark = (args.description)
//         //     ? '<i class="fa fa-question-circle fa-inverse"></i>'
//         //     : '';

//         newTitle = d3.select(args.target)
//             .append(args.dom_element)
//             .text(args.title);
//         newTitle.append('i')
//                 .classed('fa', true)
//                 .classed('fa-question-circle', true)
//                 .classed('fa-inverse', true)
//         console.log(newTitle);
//         // $(args.target).prepend('<'+ args.dom_element +' class="'+args.class+'">' 
//         //     + args.title + optional_question_mark + '</'+args.dom_element+'>');
//         // console.log('wtf')
//         //activate the question mark if we have a description

//         if (args.description){
//             newTitle = $(newTitle[0]);
//             //newTitle = $(args.target).find(args.dom_element + '.' + args.class);
//                 newTitle.popover({
//                     html: true,
//                     animation: false,
//                     content: args.description,
//                     trigger: 'hover',
//                     placement: 'top',
//                     container: newTitle
//                 });
//         }   
//     }
    
//     if(error) {
//         error(args);
//     }
// }