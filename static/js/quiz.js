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

  const leftBubbleWrapper = $(".dialogue-bubble-left");
  const leftBubble = leftBubbleWrapper.find("p");

  if (
    leftBubble.length &&
    leftBubbleWrapper.data("disable-append") !== true &&
    !leftBubble.text().trim().endsWith("...")
  ) {
    leftBubble.text(leftBubble.text().trim() + "...");
  }

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

  $(document).on("keydown", function (e) {
    // Handle A, B, C, D keys for answer selection
    const key = e.key.toLowerCase();
    if (["a", "b", "c", "d"].includes(key)) {
      const index = key.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1...
      const option = $("input[name='answer']").get(index);
      if (option && !option.disabled) {
        $(option).prop("checked", true).trigger("change");
      }
    }

    // Handle right arrow key for continue
    if (e.key === "ArrowRight") {
      const $submit = $("#submit-answer");
      if (!$submit.prop("disabled")) {
        $submit.click();
      }
    }
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
  $(".score-display").text("Score: " + response.score + " / " + response.answered);

  const $answerFeedback = $('#answer-feedback');
  if (response.is_correct) {
    $answerFeedback.text("Correct!");
  } else {
    $answerFeedback.text("NOT Correct!");
  }

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

  const correctAnswer = response.correct_answer;
  const leftBubbleWrapper = $(".dialogue-bubble-left");
  const leftBubble = leftBubbleWrapper.find("p");

  if (
    leftBubble.length &&
    leftBubbleWrapper.data("disable-append") !== true &&
    correctAnswer
  ) {
    let originalText = leftBubble.text().trim();

    if (originalText.endsWith("...")) {
      originalText = originalText.slice(0, -3).trim();
    }

    leftBubble.text(`${originalText} ${correctAnswer}`);
  }

  if (response.feedback) {
    const feedbackElement = $("#custom-feedback");
    feedbackElement
      .removeClass("correct incorrect")
      .addClass(response.is_correct ? "correct" : "incorrect")
      .text(response.feedback);
  }

  if (response.image_after) {
    $(".question-image").attr("src", response.image_after);
  }

  // Update next button
  $("#submit-answer")
    .prop("disabled", false)
    .text("NEXT")
    .data("next-url", response.next_question);
}

function handleAnswerError(error) {
  console.error("Error submitting answer:", error);
  $("#feedback-area").text("An error occurred. Please try again.");
}