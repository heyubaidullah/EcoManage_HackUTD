import os
import random
import math
from datetime import date, timedelta
from flask import Flask, jsonify, request, render_template, send_from_directory, redirect
from flask_cors import CORS
from models import db, Building, DailyData

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://ecouser:admin@localhost/ecomanage')
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

BENCHMARKS = {
    'energy': {'excellent': 80, 'poor': 220},
    'hvac': {'excellent': 40, 'poor': 90},
    'temperature': {'ideal': 22, 'tolerance': 3},
    'waste': {'excellent': 4, 'poor': 16},
}

ALERT_THRESHOLDS = {
    'energy': 180,
    'hvac': 78,
    'temp_low': 19,
    'temp_high': 25,
    'waste': 12,
}

BUILDING_IMAGES = {
    'CBRE Downtown': 'images/CBRE_Downtown.jpg',
    'CBRE Tech Hub': 'images/CBRE_Tech_Space.jpg',
    'CBRE Innovation Center': 'images/CBRE_One.jpg',
    'CBRE Plaza Tower': 'images/CBRE_Downtown.jpg',
    'CBRE Commerce Park': 'images/CBRE_Tech_Space.jpg',
}

DEMO_BUILDINGS = [
    {'name': 'CBRE Downtown', 'address': '500 Main Street, Dallas, TX 75201'},
    {'name': 'CBRE Tech Hub', 'address': '1200 Innovation Drive, Austin, TX 78701'},
    {'name': 'CBRE Innovation Center', 'address': '900 Commerce Blvd, Houston, TX 77002'},
    {'name': 'CBRE Plaza Tower', 'address': '300 Travis Street, Houston, TX 77002'},
    {'name': 'CBRE Commerce Park', 'address': '8080 Park Lane, Dallas, TX 75231'},
]

def calculate_ecoscore(energy, hvac, temperature, waste):
    b = BENCHMARKS
    energy_range = b['energy']['poor'] - b['energy']['excellent']
    energy_score = max(0, min(100, (b['energy']['poor'] - energy) / energy_range * 100))

    hvac_range = b['hvac']['poor'] - b['hvac']['excellent']
    hvac_score = max(0, min(100, (b['hvac']['poor'] - hvac) / hvac_range * 100))

    temp_deviation = abs(temperature - b['temperature']['ideal'])
    temp_score = max(0, 100 - (temp_deviation / b['temperature']['tolerance']) * 50)

    waste_range = b['waste']['poor'] - b['waste']['excellent']
    waste_score = max(0, min(100, (b['waste']['poor'] - waste) / waste_range * 100))

    score = 0.30 * energy_score + 0.30 * hvac_score + 0.20 * temp_score + 0.20 * waste_score
    return round(score, 1)

def get_grade(score):
    if score >= 80: return 'A'
    elif score >= 65: return 'B'
    elif score >= 50: return 'C'
    elif score >= 35: return 'D'
    else: return 'F'

def get_grade_color(grade):
    colors = {'A': '#22c55e', 'B': '#3CA358', 'C': '#f59e0b', 'D': '#f97316', 'F': '#ef4444'}
    return colors.get(grade, '#6b7280')

def calculate_carbon(energy, waste):
    return round(energy * 0.233 + waste * 0.5, 2)

def generate_alerts(energy, hvac, temperature, waste):
    alerts = []
    t = ALERT_THRESHOLDS
    if energy > t['energy']:
        alerts.append({'type': 'warning', 'metric': 'Energy', 'message': f'Energy consumption at {energy:.0f} kWh exceeds target of {t["energy"]} kWh'})
    if hvac > t['hvac']:
        alerts.append({'type': 'warning', 'metric': 'HVAC', 'message': f'HVAC running at {hvac:.0f}% — consider scheduling maintenance'})
    if temperature < t['temp_low']:
        alerts.append({'type': 'info', 'metric': 'Temperature', 'message': f'Temperature at {temperature:.1f}°C is below comfort range (19–25°C)'})
    if temperature > t['temp_high']:
        alerts.append({'type': 'warning', 'metric': 'Temperature', 'message': f'Temperature at {temperature:.1f}°C exceeds comfort range (19–25°C)'})
    if waste > t['waste']:
        alerts.append({'type': 'warning', 'metric': 'Waste', 'message': f'Waste generation at {waste:.1f} kg exceeds daily target of {t["waste"]} kg'})
    return alerts

def generate_recommendations(avg_energy, avg_hvac, avg_temp, avg_waste):
    recs = []
    if avg_energy > 160:
        recs.append({'icon': '⚡', 'title': 'Optimize Energy Scheduling', 'body': 'Average energy consumption is above target. Consider implementing automated lighting controls and reviewing equipment standby schedules.'})
    elif avg_energy < 100:
        recs.append({'icon': '⚡', 'title': 'Excellent Energy Performance', 'body': 'Energy usage is well within benchmarks. Consider sharing this building\'s practices across your portfolio.'})

    if avg_hvac > 72:
        recs.append({'icon': '❄️', 'title': 'HVAC Efficiency Review', 'body': 'HVAC is running at high capacity. A preventative maintenance check and filter inspection could reduce usage by up to 15%.'})
    elif avg_hvac < 50:
        recs.append({'icon': '❄️', 'title': 'HVAC Performing Well', 'body': 'HVAC usage is highly efficient. Ensure regular filter changes to maintain this level of performance.'})

    if avg_temp < 20:
        recs.append({'icon': '🌡️', 'title': 'Heating Adjustment Needed', 'body': 'Temperature is below the recommended comfort range. Review heating set-points to improve occupant comfort and productivity.'})
    elif avg_temp > 24:
        recs.append({'icon': '🌡️', 'title': 'Cooling Review Recommended', 'body': 'Temperature is trending above comfort range. Inspect cooling systems and check building insulation for potential improvements.'})

    if avg_waste > 11:
        recs.append({'icon': '♻️', 'title': 'Waste Reduction Opportunity', 'body': 'Waste output exceeds the sustainability target. Consider launching a tenant recycling initiative and reviewing supplier packaging requirements.'})
    elif avg_waste < 7:
        recs.append({'icon': '♻️', 'title': 'Waste Management Leader', 'body': 'This building is a waste reduction leader in your portfolio. Document and replicate these practices across other properties.'})

    neutral_pool = [
        {'icon': '📅', 'title': 'Schedule Quarterly Sustainability Audit', 'body': 'Regular audits help identify hidden inefficiencies. Benchmark against LEED and ENERGY STAR standards to maintain portfolio leadership.'},
        {'icon': '🏆', 'title': 'All Systems Optimal', 'body': 'This building is performing within all sustainability targets. Continue current practices and monitor for seasonal variations.'},
        {'icon': '🌱', 'title': 'Explore Renewable Energy Options', 'body': 'Consider evaluating rooftop solar or green energy purchasing agreements to reduce grid dependency and lower carbon footprint further.'},
        {'icon': '👥', 'title': 'Engage Tenants in Sustainability Goals', 'body': 'Tenant engagement programmes can drive 10–15% additional energy savings. Share this building\'s EcoScore™ with occupants to build shared accountability.'},
    ]

    while len(recs) < 2:
        candidate = neutral_pool[len(recs) % len(neutral_pool)]
        if candidate not in recs:
            recs.append(candidate)

    return recs[:3]

def seed_demo_data():
    if Building.query.count() > 0:
        return

    random.seed(42)
    today = date.today()

    for b_info in DEMO_BUILDINGS:
        building = Building(name=b_info['name'], address=b_info['address'])
        db.session.add(building)
        db.session.flush()

        base_energy = random.uniform(120, 170)
        base_hvac = random.uniform(50, 75)
        base_temp = random.uniform(20, 24)
        base_waste = random.uniform(7, 12)

        for i in range(90, 0, -1):
            day = today - timedelta(days=i)
            energy = max(100, min(200, base_energy + random.uniform(-18, 18) + math.sin(i / 7) * 8))
            hvac = max(40, min(85, base_hvac + random.uniform(-10, 10) + math.cos(i / 14) * 6))
            temp = max(18, min(26, base_temp + random.uniform(-2, 2)))
            waste = max(5, min(15, base_waste + random.uniform(-2.5, 2.5)))
            daily = DailyData(
                building_id=building.id,
                date=day,
                energy=round(energy, 1),
                hvac=round(hvac, 1),
                temperature=round(temp, 1),
                waste=round(waste, 1)
            )
            db.session.add(daily)

    db.session.commit()

@app.route('/')
def dashboard():
    return render_template('index.html')

@app.route('/add-building')
def add_building_redirect():
    return redirect('/manage')

@app.route('/manage')
def manage_page():
    return render_template('manage.html')

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

@app.route('/buildings', methods=['GET'])
def get_buildings():
    buildings = Building.query.all()
    return jsonify([
        {
            'id': b.id,
            'name': b.name,
            'address': b.address,
            'image': BUILDING_IMAGES.get(b.name, 'images/CBRE_Downtown.jpg')
        }
        for b in buildings
    ])

@app.route('/buildings', methods=['POST'])
def add_building():
    data = request.json
    building = Building(name=data['name'], address=data['address'])
    db.session.add(building)
    db.session.commit()
    return jsonify({'message': 'Building added successfully!', 'id': building.id}), 201

@app.route('/data/<int:building_id>', methods=['GET'])
def get_daily_data(building_id):
    days = int(request.args.get('days', 30))
    cutoff = date.today() - timedelta(days=days)
    data = DailyData.query.filter(
        DailyData.building_id == building_id,
        DailyData.date >= cutoff
    ).order_by(DailyData.date.asc()).all()

    return jsonify([
        {
            'date': d.date.strftime('%Y-%m-%d'),
            'energy': d.energy,
            'hvac': d.hvac,
            'temperature': d.temperature,
            'waste': d.waste
        }
        for d in data
    ])

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
    return jsonify({'message': 'Data added successfully!'}), 201

@app.route('/api/summary/<int:building_id>')
def get_summary(building_id):
    today_rec = DailyData.query.filter_by(building_id=building_id).order_by(DailyData.date.desc()).first()
    if not today_rec:
        return jsonify({'error': 'No data available'}), 404

    cutoff_7 = date.today() - timedelta(days=7)
    recent = DailyData.query.filter(
        DailyData.building_id == building_id,
        DailyData.date >= cutoff_7
    ).all()

    avg_energy = sum(r.energy for r in recent) / len(recent) if recent else today_rec.energy
    avg_hvac = sum(r.hvac for r in recent) / len(recent) if recent else today_rec.hvac
    avg_temp = sum(r.temperature for r in recent) / len(recent) if recent else today_rec.temperature
    avg_waste = sum(r.waste for r in recent) / len(recent) if recent else today_rec.waste

    score = calculate_ecoscore(avg_energy, avg_hvac, avg_temp, avg_waste)
    grade = get_grade(score)
    carbon = calculate_carbon(today_rec.energy, today_rec.waste)
    alerts = generate_alerts(today_rec.energy, today_rec.hvac, today_rec.temperature, today_rec.waste)
    recommendations = generate_recommendations(avg_energy, avg_hvac, avg_temp, avg_waste)

    return jsonify({
        'ecoscore': score,
        'grade': grade,
        'grade_color': get_grade_color(grade),
        'carbon_footprint': carbon,
        'alerts': alerts,
        'alert_count': len(alerts),
        'recommendations': recommendations,
        'latest': {
            'date': today_rec.date.strftime('%Y-%m-%d'),
            'energy': today_rec.energy,
            'hvac': today_rec.hvac,
            'temperature': today_rec.temperature,
            'waste': today_rec.waste
        },
        'averages': {
            'energy': round(avg_energy, 1),
            'hvac': round(avg_hvac, 1),
            'temperature': round(avg_temp, 1),
            'waste': round(avg_waste, 1)
        }
    })

@app.route('/api/portfolio')
def get_portfolio():
    buildings = Building.query.all()
    portfolio = []
    for b in buildings:
        last = DailyData.query.filter_by(building_id=b.id).order_by(DailyData.date.desc()).first()
        if last:
            cutoff_7 = date.today() - timedelta(days=7)
            recent = DailyData.query.filter(
                DailyData.building_id == b.id,
                DailyData.date >= cutoff_7
            ).all()
            avg_e = sum(r.energy for r in recent) / len(recent) if recent else last.energy
            avg_h = sum(r.hvac for r in recent) / len(recent) if recent else last.hvac
            avg_t = sum(r.temperature for r in recent) / len(recent) if recent else last.temperature
            avg_w = sum(r.waste for r in recent) / len(recent) if recent else last.waste
            score = calculate_ecoscore(avg_e, avg_h, avg_t, avg_w)
            grade = get_grade(score)
            alerts = generate_alerts(last.energy, last.hvac, last.temperature, last.waste)
            portfolio.append({
                'id': b.id,
                'name': b.name,
                'address': b.address,
                'image': BUILDING_IMAGES.get(b.name, 'images/CBRE_Downtown.jpg'),
                'ecoscore': score,
                'grade': grade,
                'grade_color': get_grade_color(grade),
                'alert_count': len(alerts),
                'carbon': calculate_carbon(last.energy, last.waste),
                'energy': round(avg_e, 1),
                'hvac': round(avg_h, 1),
            })
        else:
            portfolio.append({
                'id': b.id,
                'name': b.name,
                'address': b.address,
                'image': BUILDING_IMAGES.get(b.name, 'images/CBRE_Downtown.jpg'),
                'ecoscore': None,
                'grade': 'N/A',
                'grade_color': '#6b7280',
                'alert_count': 0,
                'carbon': 0,
                'energy': 0,
                'hvac': 0,
            })
    return jsonify(portfolio)

@app.route('/api/alerts/<int:building_id>')
def get_alerts(building_id):
    last = DailyData.query.filter_by(building_id=building_id).order_by(DailyData.date.desc()).first()
    if not last:
        return jsonify([])
    alerts = generate_alerts(last.energy, last.hvac, last.temperature, last.waste)
    return jsonify(alerts)

def initialize_app():
    with app.app_context():
        db.create_all()
        seed_demo_data()

initialize_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
