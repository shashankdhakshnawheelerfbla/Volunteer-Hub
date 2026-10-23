
# Import Flask tools for serving website files.
from flask import Flask, send_from_directory
from pathlib import Path

# Find the folder containing app.py.
BASE_DIR = Path(__file__).resolve().parent

# Create the Flask application.
app = Flask(__name__)

# Display the existing homepage.
@app.route("/")
def home():
    return send_from_directory(str(BASE_DIR), "index.html")

# Serve other files, including CSS and JavaScript.
@app.route("/<path:filename>")
def website_files(filename):
    return send_from_directory(str(BASE_DIR), filename)

# Start the development server.
if __name__ == "__main__":
    app.run(debug=True)
