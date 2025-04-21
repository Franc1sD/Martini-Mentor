from flask import Flask, request, jsonify, render_template, url_for, redirect
import json
import os

app = Flask(__name__)

LEARN_FILE = os.path.join(os.path.dirname(__file__), 'data', 'learn.json')
QUIZ_FILE = os.path.join(os.path.dirname(__file__), 'data', 'quiz.json')

# Helper functions to load and save data
def load_data(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"File {file_path} not found. Please ensure the file exists.")
        return {}
    except json.JSONDecodeError:
        print(f"Error decoding JSON from {file_path}. Please check the file format.")
        return {}

def save_data(file_path, data):
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"Error saving data to {file_path}: {e}")




# Homepage
@app.route('/')
def home_page():
    return render_template('homepage.html')   

@app.route('/learn/1')
def ingredients():
    return render_template('ingredients.html')

@app.route('/learn/2')
def ordering():
    return render_template('ordering.html')

# Quiz page
@app.route("/quiz/<id>", methods=["GET", "POST"])
def quiz(id):
    quiz_data = load_data(QUIZ_FILE)
    if id not in quiz_data:
        return "Question not found.", 404

    question = quiz_data[id]

    if request.method == "GET":
        # Fetch answered questions id
        answered_ids = [qid for qid, q in quiz_data.items() if q.get("user_answer") is not None]
        num_answered = len(answered_ids)

        # User is only allowed to access the next question
        expected_id = str(num_answered + 1)

        if id != expected_id:
            return redirect(url_for("quiz", id=expected_id))

        # If it's the first question and we're restarting, clear everything
        if id == "1":
            reset_quiz(quiz_data)

        # Render current question
        score = sum(1 for q in quiz_data.values() if q.get("is_correct"))

        return render_template("quiz.html", 
                            question=quiz_data[id], 
                            question_id=id,
                            total_questions=len(quiz_data), 
                            score=score, 
                            answered=num_answered)

    elif request.method == "POST":
        # Update data
        user_answer = request.form.get("answer")
        is_correct = True if user_answer == question.get("correct_answer") else False
        quiz_data[id]['user_answer'] = user_answer
        quiz_data[id]['is_correct'] = is_correct
        save_data(QUIZ_FILE, quiz_data)

        feedback = ""
        if "feedback" in question:
            feedback = question["feedback"]["correct"] if is_correct else question["feedback"]["incorrect"]

        # Send next question or result
        next_id = str(int(id) + 1)
        if next_id in quiz_data:
            updated_score = sum(1 for q in quiz_data.values() if q.get("user_answer") is not None and q.get("is_correct"))
            answered = sum(1 for q in quiz_data.values() if q.get("user_answer") is not None)

            return jsonify({
                "next_question": url_for("quiz", id=next_id),
                "is_correct": is_correct,
                "score": updated_score,
                "answered": answered,
                "correct_answer": question.get("correct_answer"),
                "feedback": feedback
            })
        else:
            updated_score = sum(1 for q in quiz_data.values() if q.get("user_answer") is not None and q.get("is_correct"))
            answered = sum(1 for q in quiz_data.values() if q.get("user_answer") is not None)

            return jsonify({
                "next_question": url_for("result"),
                "is_correct": is_correct,
                "score": updated_score,
                "answered": answered,
                "correct_answer": question.get("correct_answer"),
                "feedback": feedback
            })

# Quiz result page
@app.route("/result")
def result():
    quiz_data = load_data(QUIZ_FILE)
    score = sum(1 for q in quiz_data.values() if q.get('is_correct', False))
    total_questions = len(quiz_data)
    reset_quiz(quiz_data)
    return render_template("result.html", 
                           score=score, 
                           total_questions=total_questions)

# Reset quiz data
def reset_quiz(quiz_data):
    for q in quiz_data.values():
        q["user_answer"] = None
        q["is_correct"] = False
    save_data(QUIZ_FILE, quiz_data)







if __name__ == '__main__':
    app.run(debug=True, port=5001)