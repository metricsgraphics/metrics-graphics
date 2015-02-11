function chart_title(args) {
    'use strict';

    var container = d3.select(args.target);

    // remove the current title if it exists
    container.select('.mg-chart-title').remove();

    if (args.target && args.title) {
        //only show question mark if there's a description
        var optional_question_mark = (args.show_tooltips && args.description)
            ? '<i class="fa fa-question-circle fa-inverse description"></i>'
            : '';

        container.insert('h2', ':first-child')
            .attr('class', 'mg-chart-title')
            .html(args.title + optional_question_mark);

        //activate the question mark if we have a description
        if (args.show_tooltips && args.description) {
            var $newTitle = $(container.node()).find('h2.mg-chart-title');

            $newTitle.popover({
                html: true,
                animation: false,
                content: args.description,
                trigger: 'hover',
                placement: 'top',
                container: $newTitle
            });
        }
    }

    if (args.error) {
        error(args);
    }
}

MG.chart_title = chart_title;
