import sys
import os
import types

# Ensure backend root is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

parent_dir = os.path.dirname(backend_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Ensure 'backend' module is recognized when running directly from backend root
if "backend" not in sys.modules:
    try:
        import backend.app.main
    except ModuleNotFoundError:
        import app
        backend_mod = types.ModuleType("backend")
        backend_mod.app = app
        backend_mod.__path__ = [backend_dir]
        sys.modules["backend"] = backend_mod
        sys.modules["backend.app"] = app

from backend.app.main import app
