function chart_title(args) {
    'use strict';

    //is the chart title different than existing one? If so, clear the fine 
    //gentleman. Otherwise, move along.
    var currentTitle = $(args.target).find('h2.mg-chart-title');
    if (args.title && args.title !== currentTitle.text()) {
        currentTitle.remove();
    //if title hasn't been specified or if it's blank, remove the title
    } else if (!args.title || args.title === '') {
        currentTitle.remove();
    } else
        return;

    if (args.target && args.title) {
        var newTitle;
        //only show question mark if there's a description
        var optional_question_mark = (args.description)
            ? '<i class="fa fa-question-circle fa-inverse description"></i>'
            : '';
    
        $(args.target).prepend('<h2 class="mg-chart-title">' 
            + args.title + optional_question_mark + '</h2>');

        //activate the question mark if we have a description
        if (args.description) {
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

    if (args.error) {
        error(args);
    }
}
