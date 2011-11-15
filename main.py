from flask import Flask
from flask import request
from flask import jsonify

app = Flask(__name__)


@app.route('/')
def index():
    return "Landing page test.<br>Test user profile for <a href='/profile/testuser'>testuser</a>"

@app.route('/profile/<name>', methods=["GET", "POST"])
def userprofile(name):
    if request.method == "POST":
        return jsonify({'msg':'Created new profile for %s' % name})
    else:
        return "Profile for : %s" % name


if __name__ == '__main__':
    app.run(debug=True)
