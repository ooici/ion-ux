import logging
import sys

# Very simple logging. For Django, use by importing this to the settings.py file in a django project, then
# put an "import logging" statement in any file you wish to log. Typical calls are available
# e.g., logging.warn('foo'). All is written to the apache error_log (even if the application is
# running under ssl) .
logger = logging.getLogger('')
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler(sys.stderr)
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(levelname)-8s %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)