from flask import Flask, request, jsonify, render_template
import json
import re
import os

app = Flask(__name__)

LEARN_FILE = os.path.join(os.path.dirname(__file__), 'data', 'learn.json')
QUIZ_FILE = os.path.join(os.path.dirname(__file__), 'data', 'quiz.json')

def load_data(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"File {LEARN_FILE} not found. Please ensure the file exists.")
        return {}
    except json.JSONDecodeError:
        print(f"Error decoding JSON from {LEARN_FILE}. Please check the file format.")
        return {}

def save_data(file_path, data):
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"Error saving data to {file_path}: {e}")





if __name__ == '__main__':
    app.run(debug=True, port=5001)