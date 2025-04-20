function indexToLetter(i) {
    return String.fromCharCode(65 + i); // 0 → A
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".quiz-option").forEach((labelEl) => {
      const index = parseInt(labelEl.dataset.index);
      const letter = indexToLetter(index);
      const span = labelEl.querySelector(".js-letter");
      if (span) span.textContent = letter;
    });
  });