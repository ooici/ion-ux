from flask import Flask, request, jsonify, render_template

app = Flask(__name__)


PRODUCTION = False #more configurable in the future.
if PRODUCTION:
    from service_api import ServiceApi
else:
    from dummy_service_api import ServiceApi


@app.route('/')
def index():
    return render_template("index.html")

@app.route('/dashboard')
def dashboard():
    return render_template("dashboard.html")

@app.route('/dataResource', methods=["GET", "POST"])
def data_resource():
    resp_data = ServiceApi.data_resource(request.args)
    return jsonify(resp_data)

@app.route('/subscription', methods=["GET", "POST"])
def subscription():
    resp_data = ServiceApi.subscription(request.args)
    return jsonify(resp_data)

# - - - - - - - -

@app.route('/new', methods=["GET"])
def new_template():
    return render_template('ux-dashboard.html')

@app.route('/services/<service_name>/<service_action>')
def service_router(service_name, service_action):
    userid = "returned from cookie."
    repl = ServiceApi.parse_request(service_name=service_name, service_action=service_action)
    return repl

if __name__ == '__main__':
    app.run(debug=True)
