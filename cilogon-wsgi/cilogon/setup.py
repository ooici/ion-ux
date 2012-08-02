from setuptools import setup

# To use this, simply invoke python setup.py install|develop (as root) depending on your needs. If you are debugging/testing
# use the develop argument and a link to the current development directory will be made so changes will be picked up
# immediately. If this is an install, use that argument.
#
# Note if you have been using this in develop mode and want to install it, run
#
# python setup.py --uninstall
#
# which will remove the link to the development directory. Then run python setup.py install
setup(
    name = "CILogon delegation",
    version = "1.0",
    #packages = find_packages(),
)
