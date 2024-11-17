CREATE TABLE buildings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL
);

CREATE TABLE daily_data (
    id SERIAL PRIMARY KEY,
    building_id INTEGER REFERENCES buildings(id),
    date DATE NOT NULL,
    energy FLOAT NOT NULL,
    hvac FLOAT NOT NULL,
    temperature FLOAT NOT NULL,
    waste FLOAT NOT NULL
);
