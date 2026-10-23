
# Import Flask tools to create the website and render HTML pages.
from flask import Flask, render_template

# Create the Flask application.
app = Flask(__name__)

# Display the homepage when someone visits the root URL.
@app.route("/")
def home():
    return render_template("index.html")

# Start the development server when this file is run directly.
if __name__ == "__main__":
    app.run(debug=True)
