from extensions import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # Admin, NGO, Citizen
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"

class SensorData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sensor_type = db.Column(db.String(50))
    value = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)

class DisasterAlert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    alert_type = db.Column(db.String(50))
    severity = db.Column(db.String(20))
    description = db.Column(db.Text)
    issued_at = db.Column(db.DateTime, default=datetime.utcnow)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)

class Resource(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    resource_type = db.Column(db.String(50), nullable=False)  # food, water, medical
    quantity = db.Column(db.Integer, nullable=False)
    location = db.Column(db.String(100), nullable=False)
    assigned = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Volunteer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    contact = db.Column(db.String(20))
    location = db.Column(db.String(100))
    available = db.Column(db.Boolean, default=True)
    assigned_zone = db.Column(db.String(100), nullable=True)
    assistance_type = db.Column(db.String(255), nullable=True) # <--- THIS IS THE NEW FIELD

class Assignment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    zone = db.Column(db.String(100))  # Assigned location
    resource_id = db.Column(db.Integer, db.ForeignKey('resource.id'))
    volunteer_id = db.Column(db.Integer, db.ForeignKey('volunteer.id'))
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)

    resource = db.relationship('Resource')
    volunteer = db.relationship('Volunteer')

class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=True)
    endpoint = db.Column(db.String(200))
    method = db.Column(db.String(10))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    details = db.Column(db.Text) # Good that this is Text, consider nullable=True if not always present
