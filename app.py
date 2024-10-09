import io
from flask import Flask, render_template, request, redirect, url_for, make_response, jsonify, send_file, session, flash
from pymongo import MongoClient
from gridfs import GridFS
from bson import ObjectId
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
import urllib.parse
import re
import os
import cv2
# import dlib
import numpy as np
# from imutils import face_utils
# from rembg import remove
import random
import string
from functools import wraps
import tempfile
import shutil

app = Flask(__name__)
app.secret_key = 'Metanexi_key'

# MongoDB connection
username = urllib.parse.quote_plus('Fasi')
password = urllib.parse.quote_plus('Met@nexidb#123')
client = MongoClient(f'mongodb+srv://{username}:{password}@metanexicluster.vgmrq4d.mongodb.net/?retryWrites=true&w=majority&appName=MetanexiCluster')
db = client['3d_marketplace']
products_collection = db.products
contact_collection = db.contact
feedback_collection = db.feedback
users_collection = db['users']
fs = GridFS(db)

# Define common stop words
stop_words = set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'have', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the', 'to', 'was', 'were', 'with'])

class Product:
    def __init__(self, title, description, category, file_type, tags, preview_image_id, source_file_id):
        self.title = title
        self.description = description
        self.category = category
        self.file_type = file_type
        self.tags = tags
        self.preview_image_id = preview_image_id
        self.source_file_id = source_file_id

class Contact: 
    def __init__(self, name, email_address, country, message):
        self.name = name
        self.email_address = email_address
        self.country = country
        self.message = message

class Feedback:
    def __init__(self, email_address, message, rating):
        self.email_address = email_address
        self.message = message
        self.rating = rating

# Function to preprocess text for search
def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    text = ' '.join(word for word in text.split() if word not in stop_words)
    return text

# Main keywords list
main_keywords = [
    "3d", "model", "texture", "animation", "rigging", "rig", "rigged", "rendering", 
    "character", "environment", "vehicle", "architecture", "asset", "game", "object", 
    "scene", "material", "mesh", "lighting", "motion", "design", "simulation", "render", 
    "texturing", "character design", "vehicle model", "architectural design", "game asset", 
    "object modeling", "scene creation", "material design", "mesh manipulation", "light setup", 
    "motion graphics", "designing assets", "simulated environments"
]

# Paths
SHAPE_PREDICTOR_PATH = 'shape_predictor_68_face_landmarks.dat'

# Load face detector and shape predictor
# detector = dlib.get_frontal_face_detector()
# predictor = dlib.shape_predictor(SHAPE_PREDICTOR_PATH)

# Define the 3D model points of facial landmarks
model_points = np.array([
    (0.0, 0.0, 0.0),           # Nose tip
    (0.0, -330.0, -65.0),      # Chin
    (-225.0, 170.0, -135.0),   # Left eye left corner
    (225.0, 170.0, -135.0),    # Right eye right corner
    (-150.0, -150.0, -125.0),  # Left Mouth corner
    (150.0, -150.0, -125.0)    # Right mouth corner
])

def get_head_pose(shape):
    image_points = np.array([
        shape[30],  # Nose tip
        shape[8],   # Chin
        shape[36],  # Left eye left corner
        shape[45],  # Right eye right corner
        shape[48],  # Left mouth corner
        shape[54]   # Right mouth corner
    ], dtype='double')

    camera_matrix = np.array([[1000, 0, 320],
                              [0, 1000, 240],
                              [0, 0, 1]], dtype="double")
    dist_coeffs = np.zeros((4, 1))  # Assuming no lens distortion

    _, rotation_vector, translation_vector = cv2.solvePnP(model_points, image_points, camera_matrix, dist_coeffs)
    rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
    angles = cv2.decomposeProjectionMatrix(np.hstack((rotation_matrix, translation_vector)))[6]
    pitch = angles[0]
    yaw = angles[1]
    roll = angles[2]

    return pitch, yaw, roll

def calculate_face_alignment_score(shape):
    pitch, yaw, roll = get_head_pose(shape)
    alignment_score = abs(yaw) + abs(pitch)
    return alignment_score

# def find_best_frame(frames_folder):
#     best_frame = None
#     best_score = float('inf')

#     for filename in sorted(os.listdir(frames_folder)):
#         frame_path = os.path.join(frames_folder, filename)
#         frame = cv2.imread(frame_path)
#         gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

#         rects = detector(gray, 1)

#         for rect in rects:
#             shape = predictor(gray, rect)
#             shape = face_utils.shape_to_np(shape)

#             score = calculate_face_alignment_score(shape)

#             if score < best_score:
#                 best_score = score
#                 best_frame = frame

#     return best_frame

def extract_frames(video_path, frames_folder, desired_fps=5):
    if not os.path.exists(frames_folder):
        os.makedirs(frames_folder)

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_interval = int(fps / desired_fps)

    frame_count = 0
    current_frame = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if current_frame % frame_interval == 0:
            frame_filename = os.path.join(frames_folder, f'frame_{frame_count:04d}.jpg')
            cv2.imwrite(frame_filename, frame)
            frame_count += 1

        current_frame += 1

    cap.release()
    return frame_count

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/Assets-Library', methods=['GET', 'POST'])
def assets():
    page = int(request.args.get('page', 1))
    per_page = 9
    query = {}
   
    if request.method == 'POST':
        category_filter = request.form.get('category_filter')
        if category_filter:
            query['category'] = category_filter

        tags_filter = request.form.get('tags_filter')
        if tags_filter:
            query['tags'] = {'$regex': f'.*{tags_filter}.*'}

        file_type_filter = request.form.get('file_type_filter')
        if file_type_filter:
            query['file_type'] = file_type_filter

    search_query = request.args.get('query')
    if search_query:
        query = preprocess_text(search_query)
        words = query.split()
        product_ids = set()
        for word in words:
            products = db['products'].find({'$or': [
                {'title': {'$regex': word, '$options': 'i'}},
                {'description': {'$regex': word, '$options': 'i'}},
                {'tags': {'$regex': word, '$options': 'i'}},
                {'category': {'$regex': word, '$options': 'i'}},
                {'file_type': {'$regex': word, '$options': 'i'}}
            ]})
            for product in products:
                product_ids.add(str(product['_id']))
        prioritized_products = []
        for keyword in main_keywords:
            for product_id in product_ids:
                product = products_collection.find_one({'_id': ObjectId(product_id)})
                if product['_id'] in prioritized_products:
                    continue
                if keyword in product['title'].lower() or keyword in product['description'].lower() or keyword in product['tags'].lower() or keyword in product['category'].lower() or keyword in product['file_type'].lower():
                    prioritized_products.append(product['_id'])
        query['_id'] = {'$in': prioritized_products}

    total_products = products_collection.count_documents(query)
    has_next = (page - 1) * per_page < total_products
    products = products_collection.find(query).skip((page - 1) * per_page).limit(per_page)

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        product_list = render_template('product_list.html', products=products)
        return jsonify(product_list=product_list)
    else:
        return render_template('assets.html', products=products, page=page, has_next=has_next, total_products=total_products, per_page=per_page)

@app.route('/product/<product_id>')
def product_details(product_id):
    try:
        product_data = products_collection.find_one({'_id': ObjectId(product_id)})
        if product_data is None:
            return "Product not found", 404
        product = Product(
            title=product_data['title'],
            description=product_data['description'],
            category=product_data['category'],
            file_type=product_data['file_type'],
            tags=product_data['tags'],
            preview_image_id=product_data['preview_image_id'],
            source_file_id=product_data['source_file_id']
        )
    except:
        return "Invalid product ID", 400

    category_products = list(products_collection.find({
        '_id': {'$ne': ObjectId(product_id)},
        'category': product.category
    }))

    return render_template('product_details.html', product=product, category_products=category_products)

@app.route('/upload', methods=['GET', 'POST'])
def upload():
    all_contact_data = list(contact_collection.find())
    all_feedback_data = list(feedback_collection.find())

    if request.method == 'POST':
        title = request.form['title']
        description = request.form['description']
        category = request.form['category']
        file_type = request.form['file_type']
        tags = request.form['tags'].split(',')
        preview_image = request.files['preview_image']
        source_file = request.files['source_file']
       
        preview_image_id = fs.put(preview_image, filename=secure_filename(preview_image.filename))
        source_file_id = fs.put(source_file, filename=secure_filename(source_file.filename))

        product = Product(title, description, category, file_type, tags, preview_image_id, source_file_id)
        products_collection.insert_one(product.__dict__)

        return render_template('upload.html', all_contact_data=all_contact_data)
    else:
        return render_template('upload.html', all_contact_data=all_contact_data, all_feedback_data=all_feedback_data)

@app.route('/download/<file_id>')
def download(file_id):
    file_data = fs.get(ObjectId(file_id)).read()
    filename = fs.get(ObjectId(file_id)).filename
    response = make_response(file_data)
    response.headers['Content-Type'] = 'application/octet-stream'
    response.headers['Content-Disposition'] = 'attachment; filename="' + filename + '"'
    return response

@app.route('/How-it-Works')
def how_it_works():
    return render_template('How_it_works.html')

@app.route('/Help')
def help_page():
    return render_template('help.html')

@app.route('/3d-Editor')
def editor():
    return render_template('newEditor.html')

@app.route('/Contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        name = request.form['name']
        email_address = request.form['email_address']
        country = request.form['country']
        message = request.form['message']
       
        contact_data = Contact(name, email_address, country, message)
        contact_collection.insert_one(contact_data.__dict__)

        return redirect(url_for('contact'))
    else:
        return render_template('contact.html')

@app.route('/Feedback', methods=['GET', 'POST'])
def feedback():
    if request.method == 'POST':
        email_address = request.form['email_address']
        message = request.form['message']
        rating = int(request.form['rating'])
       
        feedback_data = Feedback(email_address, message, rating)
        feedback_collection.insert_one(feedback_data.__dict__)

    return render_template('feedback.html')

import time  # Import the time module for adding a delay

# @app.route('/Upload-Video', methods=['GET', 'POST'])
# def upload_video():
#     if request.method == 'POST':
#         if 'video' not in request.files:
#             print("video not in request")
#             return redirect(request.url)

#         video = request.files['video']
#         if video.filename == '':
#             print("video has no filename")
#             return redirect(request.url)
#         print("here")
#         print(video.filename)
#         if video:
#             # Define the directory for saving files
#             uploads_dir = os.path.join(app.root_path, 'uploads')
#             if not os.path.exists(uploads_dir):
#                 os.makedirs(uploads_dir)

#             # Define paths
#             video_path = os.path.join(uploads_dir, secure_filename(video.filename))
#             frames_folder = os.path.join(uploads_dir, 'frames')
#             best_frame_path = os.path.join(uploads_dir, 'best_frame.jpg')
#             output_frame_path = os.path.join(uploads_dir, 'best_frame_no_bg.png')
#             print("here2")

#             # Save the uploaded video
#             video.save(video_path)

#             # Step 1: Extract frames
#             extract_frames(video_path, frames_folder)
#             print("after extract frames")

#             # Step 2: Find the best frame
#             best_frame = find_best_frame(frames_folder)
#             print("after finding best frame")
#             if best_frame is not None:
#                 cv2.imwrite(best_frame_path, best_frame)
#                 print("removing background")
#                 # Step 3: Remove background from the best frame
#                 input_image = cv2.imread(best_frame_path)
#                 input_image = cv2.cvtColor(input_image, cv2.COLOR_BGR2RGB)
#                 output_image = remove(input_image)
#                 cv2.imwrite(output_frame_path, cv2.cvtColor(output_image, cv2.COLOR_RGB2BGRA))

#                 # Add a short delay to ensure the file is released
#                 time.sleep(1)
#                 print("after time sleep")
#                 print(output_frame_path)

#                 with open(output_frame_path, 'rb') as f:
#                     return send_file(
#                         io.BytesIO(f.read()), 
#                         mimetype='image/png',
#                         as_attachment=True,
#                         download_name='best_frame_no_bg.png'
#                     )

#             return jsonify({"message": "No suitable frame found."}), 404

#     return render_template('upload_video.html')

# @app.route('/Upload-Video', methods=['GET', 'POST'])
# def upload_video():
#     try:
#         result = client_pifuhd.predict(
#             {"image": "https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png"},  # Input image
#             {"video": "https://github.com/gradio-app/gradio/raw/main/demo/video_component/files/world.mp4"},
            
#             api_name="/predict"
#         )
#         print("result: ", result)
#         return jsonify({"result": result})
#     except Exception as e:
#         print("Error during prediction:", str(e))
#         return jsonify({"message": str(e)}), 500

@app.route('/404')
def page_not_found():
    return render_template('404.html')

@app.route('/Help')
def help():
    return render_template('help.html')

@app.route('/Team')
def team():
    return render_template('team.html')

if __name__ == '__main__':
    app.run(debug=True)
