from flask import Flask, jsonify, request, render_template, send_from_directory
from flask_cors import CORS
from models import db, Building, DailyData

# Initialize Flask app
app = Flask(__name__, static_folder="static")
CORS(app)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://ecouser:admin@localhost/ecomanage'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Serve the add-building.html file
@app.route('/add-building')
def add_building_page():
    return render_template('C:/Users/del028/Downloads/hackutd/duthie_files/templates/add-building.html')

# Serve the index.html (Dashboard)
@app.route('/')
def dashboard():
    return render_template('C:/Users/del028/Downloads/hackutd/duthie_files/templates/index.html')

# Serve static files
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

# Routes for building management
@app.route('/buildings', methods=['GET'])
def get_buildings():
    buildings = Building.query.all()
    return jsonify([
        {"id": b.id, "name": b.name, "address": b.address}
        for b in buildings
    ])

@app.route('/buildings', methods=['POST'])
def add_building():
    data = request.json
    building = Building(name=data['name'], address=data['address'])
    db.session.add(building)
    db.session.commit()
    return jsonify({"message": "Building added successfully!"}), 201

@app.route('/data/<int:building_id>', methods=['POST'])
def add_daily_data(building_id):
    data = request.json
    daily_data = DailyData(
        building_id=building_id,
        date=data['date'],
        energy=data['energy'],
        hvac=data['hvac'],
        temperature=data['temperature'],
        waste=data['waste']
    )
    db.session.add(daily_data)
    db.session.commit()
    return jsonify({"message": "Data added successfully!"}), 201

@app.route('/data/<int:building_id>', methods=['GET'])
def get_daily_data(building_id):
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')

    data = DailyData.query.filter(
        DailyData.building_id == building_id,
        DailyData.date >= from_date,
        DailyData.date <= to_date
    ).all()

    return jsonify([
        {
            "date": d.date.strftime('%Y-%m-%d'),
            "energy": d.energy,
            "hvac": d.hvac,
            "temperature": d.temperature,
            "waste": d.waste
        }
        for d in data
    ])

# Run the application
if __name__ == '__main__':
    # Ensure database tables are created
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5001)
