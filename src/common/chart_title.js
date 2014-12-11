function chart_title(args) {
  //is chart title different than existing, if so, clear the fine 
  //gentleman, otherwise, move along
  'use strict';
  var currentTitle;
  
  currentTitle = document.querySelector(args.target + ' h2.chart_title');

  if(currentTitle) {
    if(args.title && args.title !== currentTitle.innerText)
      currentTitle.parentNode.removeChild(currentTitle);
    else
      return;
  }

  if (args.target && args.title) {
    var newTitle;
    //only show question mark if there's a description
    //@todo this should be customizable - everyone does not use fontawesome
    var optional_question_mark = (args.description)
      ? '<i class="fa fa-question-circle fa-inverse"></i>'
      : '';
  
    var titleElement = document.createElement('h2')
    if(titleElement.classList) {
      titleElement.classList.add('.chart_title');
    } else {
      titleElement.className += ' .chart_title';
    }

    titleElement.innerHTML = args.title + optional_question_mark;

    var container = document.querySelector(args.target);
    container.insertBefore(titleElement, container.firstChild);
      
    //activate the question mark if we have a description
    if(args.description) {
      currentTitle = document.querySelector(args.target + ' h2.chart_title');

      console.log(currentTitle, 'popover chart_title');
      // newTitle.popover({
      //   html: true,
      //   animation: false,
      //   content: args.description,
      //   trigger: 'hover',
      //   placement: 'top',
      //   container: newTitle
      // });
    }   
  }
  
  if(args.error) {
    error(args);
  }
}
