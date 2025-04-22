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


@app.route('/learn/<id>/step/<int:step_num>')
def learn(id, step_num):
    learn_data = load_data(LEARN_FILE)
    if id not in learn_data:
        return "Lesson not found.", 404
    
    steps = learn_data[id].get('steps')
    step_data = steps[step_num - 1]
    total_steps = len(steps)
    all_lessons = sorted(learn_data.keys(), key=int)
    lesson_idx = all_lessons.index(id)

    # Previous step URL
    prev_url = None
    if step_num > 1:
        prev_url = url_for('learn', id=id, step_num=step_num - 1)
    elif lesson_idx > 0:
        prev_id = all_lessons[lesson_idx - 1]
        prev_lesson = learn_data[prev_id]
        prev_total_steps = len(prev_lesson['steps'])
        prev_url = url_for('learn', id=prev_id, step_num=prev_total_steps)

    # Next step URL
    next_url = None
    if step_num < total_steps:
        next_url = url_for('learn', id=id, step_num=step_num + 1)
    elif step_num == total_steps:
        if lesson_idx < len(all_lessons) - 1:
            next_id = all_lessons[lesson_idx + 1]
            next_url = url_for('learn', id=next_id, step_num=1)
        else:
            next_url = url_for('quiz', id='1')
    return render_template('learn.html', 
                           step=step_data,
                           id=id,
                           step_num=step_num,
                           total_steps=total_steps,
                           prev_step_url=prev_url,
                           next_step_url=next_url,
                           lesson_name=learn_data[id].get('name', ''),
                           background=learn_data[id].get('background', ''))


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

        total = len(quiz_data)

        # User is only allowed to access the next question
        expected_id = str(num_answered + 1)

        if num_answered >= total:
            return redirect(url_for("result"))

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