let questions = [];
let currentQuestion = 0;
let selectedAnswer = null;

function loadQuestion(index) {
  const q = questions[index];

  // Reset previous selections
  selectedAnswer = null;
  document.getElementById("choices-container").innerHTML = "";

  // Dialogue fallback
  document.getElementById("dialogue-text").textContent = "What would you like to do next?";

  // Handle instruction vs question
  const questionText = q.question || q.instruction || "Choose an option:";
  document.getElementById("question").textContent = `Question ${index + 1}: ${questionText}`;

  const container = document.getElementById("choices-container");

  if (q.options) {
    // Standard MCQ or slider list
    q.options.forEach((text, i) => {
      const btn = document.createElement("button");
      btn.className = "choice";
      btn.dataset.answer = i;
      btn.textContent = text;
      btn.addEventListener("click", () => {
        document.querySelectorAll(".choice").forEach(b => b.style.backgroundColor = "");
        btn.style.backgroundColor = "#f88";
        selectedAnswer = text;
      });
      container.appendChild(btn);
    });
  } else if (q.type === "selection") {
    // Special tool selection (no options in JSON example)
    const notice = document.createElement("p");
    notice.textContent = "Please implement tool selection here.";
    container.appendChild(notice);
  }
}

document.getElementById("next-btn").addEventListener("click", () => {
  const q = questions[currentQuestion];

  if (!selectedAnswer && q.options) {
    alert("Please select an answer before continuing.");
    return;
  }

  currentQuestion++;

  if (currentQuestion < questions.length) {
    loadQuestion(currentQuestion);
  } else {
    alert("Quiz completed!");
    // Redirect or show score here
  }
});

window.addEventListener("DOMContentLoaded", () => {
  fetch("/quiz-data")
    .then(res => res.json())
    .then(data => {
      questions = data;
      loadQuestion(currentQuestion);
    })
    .catch(err => {
      console.error("Failed to load quiz data:", err);
    });
});
