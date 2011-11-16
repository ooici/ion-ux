from flask import Flask, request, jsonify, render_template

app = Flask(__name__)


@app.route('/')
def index():
    return render_template("index.html")

@app.route('/profile/<name>', methods=["GET", "POST"])
def userprofile(name):
    if request.method == "POST":
        return jsonify({'msg':'Created new profile for %s' % name})
    else:
        return "Profile for : %s" % name


if __name__ == '__main__':
    app.run(debug=True)
