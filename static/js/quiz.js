let answered = false;  // Global flag

$(document).ready(function () {
  window.addEventListener("pageshow", function (event) {
    if (event.persisted || performance.navigation.type === 1) {
      if (window.location.pathname.startsWith("/quiz/")) {
        window.location.href = "/quiz/1";
      }
    }
  });
  
  $("#submit-answer").on("click", function () {
    if (!answered) {
      submitAnswer();
    } else {
      // Second click → go to next question or result
      window.location.href = $("#submit-answer").data("next-url");
    }
    if ($("#oz-slider").length) {
      const options = JSON.parse($("#oz-slider").attr("data-options"));
      $("#oz-slider").data("options", options);
    }
  });

  $("input[name='answer']").on("change", function () {
    $(".quiz-option").removeClass("selected");
    $(this).closest(".quiz-option").addClass("selected");
  
    // Enable the next button
    $("#submit-answer").prop("disabled", false);
  });

  $("#pour-button").on("click", function () {
    const slider = $("#oz-slider");
    const index = parseInt(slider.val());
    const options = slider.data("options");
    const flippedIndex = options.length - 1 - index;  // 👈 reverse the direction
    const selectedValue = options[flippedIndex];
    const questionId = $("#question-id").val();
  
    $.ajax({
      url: "/quiz/" + questionId,
      type: "POST",
      data: { answer: selectedValue },
      dataType: "json",
      success: handleAnswerResponse,
      error: handleAnswerError
    });
  });

  $(".image-option").on("click", function () {
    $(".image-option").removeClass("selected");
    $(this).addClass("selected");
  
    const selectedValue = $(this).data("value");
    const questionId = $("#question-id").val();
  
    $.ajax({
      url: "/quiz/" + questionId,
      type: "POST",
      data: { answer: selectedValue },
      dataType: "json",
      success: handleAnswerResponse,
      error: handleAnswerError
    });
  });

});

function submitAnswer() {
  const userAnswer = $("input[name='answer']:checked").val();
  const questionId = $("#question-id").val();

  if (!userAnswer) {
    $("#feedback-area").text("Please select an answer.");
    return;
  }

  $.ajax({
    url: "/quiz/" + questionId,
    type: "POST",
    data: { answer: userAnswer },
    dataType: "json",
    success: handleAnswerResponse,
    error: handleAnswerError
  });
}

function handleAnswerResponse(response) {
  answered = true;

  // Show feedback
  // $("#feedback-area").text("Your answer is " + (response.is_correct ? "correct!" : "incorrect."));
  $(".score-display").text("Score: " + response.score + " / " + response.answered);

  // Lock all answer options
  $("input[name='answer']").prop("disabled", true);
  $(".quiz-option").addClass("disabled");

  $("#oz-slider").prop("disabled", true);
  $("#pour-button").prop("disabled", true);

  $(".image-option").css("pointer-events", "none");
  $(".image-option").not(".selected").css("opacity", 0.5);

  $("input[name='answer']").each(function () {
    const input = $(this);
    const value = input.val();
    const label = input.closest(".quiz-option");
    const bubble = label.find(".bubble-label");
  
    if (value === response.correct_answer) {
      bubble.addClass("correct");
    } else if (input.is(":checked") && value !== response.correct_answer) {
      bubble.addClass("incorrect");
    }
  });

  $(".image-option").each(function () {
    const value = $(this).data("value");
    if (value === response.correct_answer) {
      $(this).addClass("correct");
    } else if ($(this).hasClass("selected") && value !== response.correct_answer) {
      $(this).addClass("incorrect");
    }
  });

  if (response.feedback) {
    $("#custom-feedback").text(response.feedback);
  }

  // Update next button
  $("#submit-answer")
    .prop("disabled", false)
    .text("CONTINUE")
    .data("next-url", response.next_question);
}

function handleAnswerError(error) {
  console.error("Error submitting answer:", error);
  $("#feedback-area").text("An error occurred. Please try again.");
}