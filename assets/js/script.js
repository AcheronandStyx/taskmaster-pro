var tasks = {};

var createTask = function (taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");

  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);

  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function () {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function (list, arr) {
    console.log(list, arr);
    // then loop over sub-array
    arr.forEach(function (task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function () {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// taskEl is sent here. date info is then parsed into a moment object using moment.js.  target the span elemnt and retireve its text value and trim off white space
var auditTask = function (taskEl) {
  // get date from task element
  var date = $(taskEl).find("span").text().trim();

  // convert to moment object at 5:00pm
  var time = moment(date, "L").set("hour", 17);

  // remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  // apply new class if task is near.over due date
  // checking if the current date and time are later than the date and time we pulled from taskEl
  // if they are taskEl is in the past and is thus past due
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  }
  else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
    // use .abs to get the absolute value so we don't ahve to comapre negatives
  }

}


$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone", // tells jQuery to create a copy of the dragged element and move the copy instead of the original prevent click events from accidentally triggering on the original element
  activate: function (event) {
    console.log("activate", this);
  },
  deactivate: function (event) {
    console.log("deactivate", this);
  },
  over: function (event) {
    console.log("over", event.target);
  },
  out: function (event) {
    console.log("out", event.target);
  },
  update: function (event) {
    // array to store the task data in
    var tempArr = [];

    // loop over current set of children in sortable list
    // save each as an element in the array to be printed / sorted to screen
    $(this).children().each(function () {
      var text = $(this)
        .find("p")
        .text()
        .trim();

      var date = $(this)
        .find("span")
        .text()
        .trim();

      // add task data to the temp array as an object
      tempArr.push({
        text: text,
        date: date
      });
    });

    // trime doen list's ID to match object property
    var arrName = $(this)
      .attr("id")
      .replace("list-", "");

    // update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();
  },
  stop: function (event) {
    $(this).removeClass("dropover");
  }
});

$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function (event, ui) {
    ui.draggable.remove(); // .remove target the element and axes it
  },
  over: function (event, ui) {
    console.log("over");
  },
  out: function (event, ui) {
    console.log("out");
  }
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function () {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function () {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-primary").click(function () {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

$(".list-group").on("click", "p", function () {
  var text = $(this)
    .text() // grab text value of this object
    .trim(); // time white space before and after the text

  var textInput = $("<textarea>") // create a text input area
    .addClass("form-control")
    .val(text); // populate it with the already saved text

  $(this).replaceWith(textInput); // replace the static p element with the text input element
  textInput.trigger("focus"); // focus the element so the user can type straight into it.
});

// blur listener triggers any time the user interacts with something other than the text area
$(".list-group").on("blur", "textarea", function () {

  // get the textarea's current value/text
  var text = $(this).val().trim();

  // get the parent ul's id attribute
  var status = $(this).closest(".list-group")
    .attr("id") // get id in form of list-xxxxxx
    .replace("list-", ""); // replace list- with nothing so we get just the category name as a string

  // get the task's position in the list of other li elements
  var index = $(this).closest(".list-group-item").index(); // index works like an array with child elements indexing from 0

  tasks[status][index].text = text; // status returns an array such at the toDo list. index accesses the text propery of the object at the given index
  saveTasks();

  // recreate p element piece by piece
  var taskP = $("<p>")
    .addClass("m-1")
    .text(text);

  // replace textarea with p element
  $(this).replaceWith(taskP);
});

// due date was clciked
$(".list-group").on("click", "span", function () {
  // get current task
  var date = $(this)
    .text()
    .trim();

  // create new input element
  var dateInput = $("<input>")
    .attr("type", "text") // .atttr can both get and set types, IDs etc
    .addClass("form-control")
    .val(date);

  // swap out elements
  $(this).replaceWith(dateInput);

  // enable jquery ui datepicker
  dateInput.datepicker({
    minDate: 1
  });

  // automatically focus on new element
  dateInput.trigger("focus");
});

// value of due date was changed
$(".list-group").on("change", "input[type='text']", function () {
  // get current text
  var date = $(this)
    .val()
    .trim();

  // get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  // get the task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // update task in array and re-save to localstorage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element with bootstrap classes
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  // replace input with span element
  $(this).replaceWith(taskSpan);

  // pass tasks <li> elemnt into auditTask() to check new due date
  auditTask($(taskSpan).closest(".list-group-item"));
});

// remove all tasks
$("#remove-tasks").on("click", function () {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

$("#modalDueDate").datepicker({
  minDate: 1,
  onClose: function () {
    // when calender is closed, force a "change" event on the 'dateInput'
    $(this).trigger("change");
  }
});

// load tasks for the first time
loadTasks();


