from flask import request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models import AuditLog
from extensions import db

def audit_log_middleware():
    try:
        verify_jwt_in_request(optional=True)
        user = get_jwt_identity()
        user_id = user.get('id') if user else None
    except:
        user_id = None

    # Only log JSON if it's a JSON request
    if request.content_type == 'application/json':
        details = str(request.get_json(silent=True))
    else:
        details = "Non-JSON request"

    log = AuditLog(
        user_id=user_id,
        endpoint=request.path,
        method=request.method,
        details=details
    )
    db.session.add(log)
    db.session.commit()
