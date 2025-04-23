import os
import re
import json
import time
from flask import Flask, request, jsonify, render_template, url_for, session, redirect
from markupsafe import Markup
from datetime import datetime, timezone

app = Flask(__name__)
app.secret_key = 'secret'

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

def store_user_event(user_id, lesson_id, step_num, duration):
    log = {
        'user_id': user_id,
        'lesson_id': lesson_id,
        'step_num': step_num,
        'duration_sec': duration,
        'timestamp': datetime.now(timezone.utc).isoformat()
    }
    with open('user_timelog.json', 'a') as f:
        f.write(json.dumps(log) + '\n')

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

@app.route('/quiz/home')
def quiz_home():
    quiz_data = load_data(QUIZ_FILE)
    reset_quiz(quiz_data)
    return render_template('quiz_home.html')

@app.route('/learn/<id>/step/<int:step_num>')
def learn(id, step_num):
    learn_data = load_data(LEARN_FILE)
    if id not in learn_data:
        return "Lesson not found.", 404
    
    session['entry_time'] = time.time()
    session['current_lesson'] = id
    session['current_step'] = step_num
    
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
    is_last_step = (step_num == total_steps and lesson_idx == len(all_lessons) - 1)
    return render_template(
        'learn.html', 
        step=step_data,
        id=id,
        step_num=step_num,
        total_steps=total_steps,
        prev_step_url=prev_url,
        next_step_url=next_url,
        is_last_step=is_last_step,
        lesson_name=learn_data[id].get('name', ''),
        ingredient_media=learn_data[id].get("ingredient_media", []),
        background=learn_data[id].get('background', '')
    )


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

        # Render current question
        score = sum(1 for q in quiz_data.values() if q.get("is_correct"))

        background_map = {
            "slider": "mixing-bg.png",
            "selection": "mixing-bg.png",
        }

        background = background_map.get(question.get("type"), "order-bg.png")
        disable_auto_append = question.get("disable_auto_append", False)

        return render_template(
            "quiz.html", 
            question=quiz_data[id], 
            question_id=id,
            total_questions=len(quiz_data), 
            score=score, 
            answered=num_answered,
            background=background,
            disable_auto_append=disable_auto_append
        )

    elif request.method == "POST":
        # Update data
        user_answer = request.form.get("answer")
        is_correct = True if user_answer == question.get("correct_answer") else False
        quiz_data[id]['user_answer'] = user_answer
        quiz_data[id]['is_correct'] = is_correct
        save_data(QUIZ_FILE, quiz_data)

        # Feedback for slider
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
                "feedback": feedback,
            })

# Quiz result page
@app.route("/result")
def result():
    quiz_data = load_data(QUIZ_FILE)
    score = sum(1 for q in quiz_data.values() if q.get('is_correct', False))
    total_questions = len(quiz_data)
    reset_quiz(quiz_data)
    return render_template(
        "result.html", 
        score=score, 
        total_questions=total_questions
    )

# Reset quiz data
def reset_quiz(quiz_data):
    for q in quiz_data.values():
        q["user_answer"] = None
        q["is_correct"] = False
    save_data(QUIZ_FILE, quiz_data)

#Highlight function
@app.template_filter('highlight_text')
def highlight_text(text, keywords):
    if not keywords:
        return text

    # If keywords is a string, convert it to a list
    if isinstance(keywords, str):
        keywords = [keywords]

    # Escape keywords to prevent regex issues
    pattern = r"(" + "|".join(re.escape(word) for word in keywords) + r")"
    
    def replace(match):
        return f'<span class="highlight">{match.group(0)}</span>'

    highlighted = re.sub(pattern, replace, text, flags=re.IGNORECASE)
    return Markup(highlighted)

# update time data
@app.route('/log_exit', methods=['POST'])
def log_exit():
    exit_time = time.time()
    entry_time = session.get('entry_time')
    lesson_id = session.get('current_lesson')
    step_num = session.get('current_step')
    user_id = session.get('user_id', 'anonymous')

    if entry_time and lesson_id is not None:
        duration = exit_time - entry_time
        store_user_event(user_id, lesson_id, step_num, duration)
        print(f"[LOG] Lesson: {lesson_id}, Step: {step_num}, Time Spent: {duration:.2f} seconds")

    session.pop('entry_time', None)
    session.pop('current_lesson', None)
    session.pop('current_step', None)
    return '', 204

if __name__ == '__main__':
    app.run(debug=True, port=5001)