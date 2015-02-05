function chart_title(args) {
    'use strict';

    //remove the chart title if it's different than the new one
    var currentTitle = d3.select(args.target).selectAll('.mg-chart-title');

    if (!currentTitle.empty() && args.title && args.title !== currentTitle.text()) {
        currentTitle.remove();
    
    } //if title hasn't been specified or if it's blank, remove the title
    else if(!args.title || args.title === '') {
        currentTitle.remove();
    }


    if (args.target && args.title) {
        var newTitle;
        //only show question mark if there's a description
        var optional_question_mark = (args.show_tooltips && args.description)
            ? '<i class="fa fa-question-circle fa-inverse description"></i>'
            : '';

        d3.select(args.target).insert('h2', ':first-child') 
            .attr('class', 'mg-chart-title')
            .html(args.title + optional_question_mark);

        //activate the question mark if we have a description
        if (args.show_tooltips && args.description) {
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