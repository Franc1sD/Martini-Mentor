from flask import Flask, request, jsonify, render_template, url_for
import json
import os

app = Flask(__name__)

LEARN_FILE = os.path.join(os.path.dirname(__file__), 'data', 'learn.json')
QUIZ_FILE = os.path.join(os.path.dirname(__file__), 'data', 'quiz.json')

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


# Quiz page
@app.route("/quiz/<id>", methods=["GET", "POST"])
def quiz(id):
    quiz_data = load_data(QUIZ_FILE)
    if id not in quiz_data:
        return "Question not found.", 404
    question = quiz_data[id]

    if request.method == "GET":
        return render_template("quiz.html", question=question, question_id=id)
    if request.method == "POST":
        answer = request.form.get("answer")
        is_correct = check_answer(answer, question)
        quiz_data[id]['user_answer'] = answer
        quiz_data[id]['is_correct'] = is_correct
        save_data(QUIZ_FILE, quiz_data)

        next_id = str(int(id) + 1)
        if next_id in quiz_data:
            return jsonify({"next_question": url_for("quiz", id=next_id), "is_correct": is_correct})
        else:
            return jsonify({"next_question": url_for("result"), "is_correct": is_correct})



def check_answer(user_answer, question):
    if "correct_answer" in question:
        return user_answer == question["correct_answer"]
    return False


# Quiz result page
@app.route("/result")
def result():
    quiz_data = load_data(QUIZ_FILE)
    score = sum(1 for question in quiz_data.values() if question.get('is_correct', False))
    total_questions = len(quiz_data)
    return render_template("result.html", score=score, total_questions=total_questions)



if __name__ == '__main__':
    app.run(debug=True, port=5001)