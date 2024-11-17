from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Building(db.Model):
    __tablename__ = 'buildings'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    address = db.Column(db.String(255), nullable=False)

class DailyData(db.Model):
    __tablename__ = 'daily_data'
    id = db.Column(db.Integer, primary_key=True)
    building_id = db.Column(db.Integer, db.ForeignKey('buildings.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    energy = db.Column(db.Float, nullable=False)
    hvac = db.Column(db.Float, nullable=False)
    temperature = db.Column(db.Float, nullable=False)
    waste = db.Column(db.Float, nullable=False)
