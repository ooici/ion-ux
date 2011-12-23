from flask import Flask, request, jsonify, render_template
# from restclient import GET
import requests

app = Flask(__name__)

SERVICE_GATEWAY_HOST = 'http://localhost:5000/test/bank/what'

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

@app.route('/service-bridge')
def connect_to_service():
    # test with request contexts later
    url = "http://localhost:5000/ion-service/rest/client"
    
    

# - - - - - - - -

@app.route('/new', methods=["GET"])
def new_template():
    return render_template('ux-dashboard.html')

@app.route('/fake-service')
def fake_service(methods=["GET"]):
    resp_data = requests.get('http://localhost:5000/resource/instrument_model/list')
    return resp_data.content

@app.route('/dynamic-table')
def dynamic_table(methods=["GET"]):
    return render_template('ux-dashboard-demo.html')
    
if __name__ == '__main__':
    app.run(debug=True, port=3000)
