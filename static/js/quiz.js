$(document).ready(function () {
  $("#submit-answer").on("click", submitAnswer);
});

function submitAnswer() {
  var userAnswer = $("#answer-input").val(); // Or get the selected radio button value
  var questionId = $("#question-id").val();
  console.log("Quiz script loaded and ready.");
  $.ajax({
    url: "/quiz/" + questionId,
    type: "POST",
    data: { answer: userAnswer },
    dataType: "json", // Expect a JSON response
    success: handleAnswerResponse,
    error: handleAnswerError
  });
}

function handleAnswerResponse(response) {
  $("#feedback-area").text("Your answer is " + (response.is_correct ? "correct!" : "incorrect."));

  // Redirect to the next question or results page
  if (response.next_question) {
    window.location.href = response.next_question;
  } else {
    $("#feedback-area").append("<p>Quiz finished. Redirecting to results...</p>");
    window.location.href = "/result"; // Assuming you have a /result route
  }
}

function handleAnswerError(error) {
  console.error("Error submitting answer:", error);
  $("#feedback-area").text("An error occurred. Please try again.");
}