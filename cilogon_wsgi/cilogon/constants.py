OAUTH_TOKEN = 'oauth_token'
OAUTH_TOKEN_SECRET = 'oauth_token_secret'
OAUTH_VERIFIER = 'oauth_verifier'
OAUTH_CALLBACK = 'oauth_callback'
OAUTH_CONSUMER_KEY = 'oauth_consumer_key'
OAUTH_TIMESTAMP = 'oauth_timestamp'
OAUTH_NONCE = 'oauth_nonce'
OAUTH_VERSION = 'oauth_version'
OAUTH_SIGNATURE_METHOD = 'oauth_signature_method'
OAUTH_SIGNATURE_PLAINTEXT = 'PLAINTEXT'


UID_PARAMETER = "cilogon_uid"
LOA_PARAMETER = "cilogon_loa"
LIFETIME_PARAMETER = "cilogon_lifetime"
STATUS_PARAMETER = "cilogon_status"
CERT_PARAMETER = "cilogon_cert"
CERT_REQUEST_ID = "cilogon_cert_req_id" # This is used to name the cookie
CERT_REQUEST_PARAMETER = "cilogon_cert_request" # This is used to identifiy the cert request

CILOGON_SUCCESS_URI = "cilogon_success"
CILOGON_FAILURE_URI = "cilogon_failure"
CILOGON_PORTAL_NAME = "cilogon_portal_name"
CONSUMER_KEY = 'anonymous'
CONSUMER_SECRET = 'anonymous'
SERVICE_SCHEME = 'https'
SERVICE_ADDRESS = 'cilogon.org'
SERVICE_PORT = 443
SERVICE_INITIALIZATION_REQUEST_URL= '/delegation/initialize'
SERVICE_ACCESSS_REQUEST_URL='/delegation/getAccess'
SERVICE_CREDENTIAL_REQUEST_URL='/delegation/getCredential'
SERVICE_AUTHORIZATION_REQUEST_URL='/delegate'

# These are constants for the web-based configuration
STORE_TYPE = 'storeType'
CONFIG_STATUS='configStatus'
BASIC=1
FILE_STORE_SETUP=1001
POSTGRES_STORE_SETUP = 1000
ADMINISTER = 2000
ADMIN_ACTION = "adminAction"
ADMIN_DESTROY = "adminDestroy"
ADMIN_CREATE = "adminCreate"
ADMIN_INITIALIZE = "adminInitialize"


PORTAL_CONFIG_FILE = 'PORTAL_CONFIG_FILE'
