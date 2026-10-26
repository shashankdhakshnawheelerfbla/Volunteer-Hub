from flask import Flask
app = Flask(__name__)
@app.route('/busybees')
def busybees():
    return "Hello, Busy Bees!"
    # Working name.

app.run(debug=True)