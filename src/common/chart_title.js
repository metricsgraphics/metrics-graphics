function chart_title(args) {
    //is chart title different than existing, if so, clear the fine 
    //gentleman, otherwise, move along
    if(args.title && args.title !== $(args.target + ' h2.chart_title').text())
        $(args.target + ' h2.chart_title').remove();
    else
        return;

    if (args.target && args.title) {
        //only show question mark if there's a description
        var optional_question_mark = (args.description)
            ? '<i class="fa fa-question-circle fa-inverse"></i>'
            : '';
    
        $(args.target).prepend('<h2 class="chart_title">' 
            + args.title + optional_question_mark + '</h2>');
            
        //activate the question mark if we have a description
        if (args.description){
            var $elem = $(this);

            $(args.target + ' h2.chart_title')
                .popover({html: true,
                    'animation': false,
                    'content': args.description,
                    'trigger': 'hover',
                    'placement': 'top',
                    'container': $(args.target + ' h2.chart_title')});
        }   
    }
    
    if(args.error) {
        error(args);
    }
}
