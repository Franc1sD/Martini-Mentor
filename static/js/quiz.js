let answered = false;  // Global flag

$(document).ready(function () {
  $("#submit-answer").on("click", function () {
    if (!answered) {
      submitAnswer();
    } else {
      // Second click → go to next question or result
      window.location.href = $("#submit-answer").data("next-url");
    }
  });

  $("input[name='answer']").on("change", function () {
    $(".quiz-option").removeClass("selected");
    $(this).closest(".quiz-option").addClass("selected");
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
  $("#feedback-area").text("Your answer is " + (response.is_correct ? "correct!" : "incorrect."));

  // Store the next URL on the button
  $("#submit-answer")
    .text("CONTINUE")
    .data("next-url", response.next_question);
}

function handleAnswerError(error) {
  console.error("Error submitting answer:", error);
  $("#feedback-area").text("An error occurred. Please try again.");
}
