-- sensors_data table
CREATE TABLE sensors_data (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sensor_type VARCHAR(50),
    value REAL
);

-- energy_consumption table
CREATE TABLE energy_consumption (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    consumption_kwh REAL
);

-- occupancy_data table
CREATE TABLE occupancy_data (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    area VARCHAR(100),
    occupancy_count INTEGER
);

-- tenants table
CREATE TABLE tenants (
    tenant_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    contact_info VARCHAR(150)
);

-- leases table
CREATE TABLE leases (
    lease_id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(tenant_id),
    start_date DATE,
    end_date DATE,
    terms TEXT
);

-- sustainability_initiatives table
CREATE TABLE sustainability_initiatives (
    initiative_id SERIAL PRIMARY KEY,
    title VARCHAR(150),
    description TEXT,
    start_date DATE,
    end_date DATE
);
