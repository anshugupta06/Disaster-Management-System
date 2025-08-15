from functools import wraps
from flask_jwt_extended import get_jwt_identity
from flask import jsonify

def role_required(allowed_roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = get_jwt_identity()
            if user['role'] not in allowed_roles:
                return jsonify({"msg": "Access forbidden: insufficient role"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
