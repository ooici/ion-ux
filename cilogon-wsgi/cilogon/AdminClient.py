__author__ = 'ncsa'

# Top-level class for managing stores.
class AdminClient(object):
    # Completely remove this store. At the end of this call no persistent structures
    # should exist, e.g., for a database all tables and indices should be dropped
    # All calls against the store should fail after calling.
    # Returns True if the store existed before this call.
    def destroy(self):
        raise NotImplementedError()
    # Put the store in its initial state. This might mean clearing out old entries
    # The store is always usable after this call, but might not be before.

    def initialize(self):
        raise NotImplementedError()

    # Create the persistent structures for the store. Fails if the store already exists.
    def create(self):
        raise NotImplementedError()

    # (Optional) boolean to test if the store does or does not exist
    # Should throw an exception is that cannot be determined.
    def exists(self):
        raise NotImplementedError()

    # (Optional) Returns True if the store is in its initial state.
    # Should throw an exception is that cannot be determined.
    def isInitialized(self):
        raise NotImplementedError()

