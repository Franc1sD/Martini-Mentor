let answered = false;  // Global flag

$(document).ready(function () {
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

  // Update feedback
  $("#feedback-area").text("Your answer is " + (response.is_correct ? "correct!" : "incorrect."));

  // ✅ Live update score display
  $(".score-display").text("Score: " + response.score + " / " + response.answered);

  // Update NEXT button → CONTINUE
  $("#submit-answer")
    .prop("disabled", false)
    .text("CONTINUE")
    .data("next-url", response.next_question);
}

function handleAnswerError(error) {
  console.error("Error submitting answer:", error);
  $("#feedback-area").text("An error occurred. Please try again.");
}