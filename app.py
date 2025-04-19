from flask import Flask, request, jsonify, render_template
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
@app.route('/quiz', methods=['GET', 'POST'])
def quiz():
    quiz_data = load_data(QUIZ_FILE)
    if not quiz_data:
        return "Quiz data not found or is empty.", 404
    if request.method == 'GET':
        return render_template('quiz.html', quiz_data=quiz_data)
    elif request.method == 'POST':
        answers = request.json.get('answers', {})
        score = calculate_score(answers, quiz_data)
        return render_template('result.html', score=score, total_questions=len(quiz_data["questions"]) + len(quiz_data["slider_questions"]) + 1)
    
# Calculate score based on answers
def calculate_score(answers, quiz_data):
    score = 0
    question_num = 1
    for i, question in enumerate(quiz_data["questions"]):
        user_answer = answers.get(f"question{question_num}")
        if user_answer == question["correct_answer"]:
            score += 1
        question_num += 1

    for i, slider_question in enumerate(quiz_data["slider_questions"]):
        user_answer = answers.get(f"slider{i+1}") # slider1, slider2
        if user_answer == slider_question["correct_answer"]:
          score+=1
        question_num += 1

    user_tool = answers.get("tool_selection")
    if user_tool == quiz_data["selection_question"]["correct_answer"]:
      score += 1

    return score




if __name__ == '__main__':
    app.run(debug=True, port=5001)