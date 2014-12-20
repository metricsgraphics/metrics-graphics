function chart_title(args) {
    //is chart title different than existing, if so, clear the fine 
    //gentleman, otherwise, move along
    'use strict';
    var currentTitle = $(args.target).find('h2.mg-chart-title');
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
    
        $(args.target).prepend('<h2 class="mg-chart-title">' 
            + args.title + optional_question_mark + '</h2>');
            
        //activate the question mark if we have a description
        if (args.description){
            newTitle = $(args.target).find('h2.mg-chart-title');
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