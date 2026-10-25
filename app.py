
# Import Flask tools for serving website files.
# Imports the named module or symbols so this file can use their functionality.
# This makes the referenced tools available to the code below.
from flask import Flask, send_from_directory
# Imports the named module or symbols so this file can use their functionality.
# This makes the referenced tools available to the code below.
from pathlib import Path

# Find the folder containing app.py.
# Assigns a value to `BASE_DIR` for later use.
# Other statements can read this value to make decisions or perform work.
BASE_DIR = Path(__file__).resolve().parent

# Create the Flask application.
# Assigns a value to `app` for later use.
# Other statements can read this value to make decisions or perform work.
app = Flask(__name__)

# Display the existing homepage.
# Connects application behavior to an event, route, browser feature, or response.
# This line helps link the current operation to the rest of the application.
@app.route("/")
# Defines the function home.
# This groups related behavior under a name that other code can use.
def home():
    # Ends this path by returning a value or raising an error.
    # The caller or surrounding error handler can then respond appropriately.
    return send_from_directory(str(BASE_DIR), "index.html")

# Serve other files, including CSS and JavaScript.
# Connects application behavior to an event, route, browser feature, or response.
# This line helps link the current operation to the rest of the application.
@app.route("/<path:filename>")
# Defines the function website_files.
# This groups related behavior under a name that other code can use.
def website_files(filename):
    # Ends this path by returning a value or raising an error.
    # The caller or surrounding error handler can then respond appropriately.
    return send_from_directory(str(BASE_DIR), filename)

# Start the development server.
# Checks a condition or selects a branch of the program.
# The following block runs only when this branch's rule applies.
if __name__ == "__main__":
    # Connects application behavior to an event, route, browser feature, or response.
    # This line helps link the current operation to the rest of the application.
    app.run(debug=True)
