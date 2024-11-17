-- Insert sample buildings
INSERT INTO buildings (name, address)
VALUES
    ('Building 1', '123 Main Street'),
    ('Building 2', '456 Elm Street'),
    ('Building 3', '789 Oak Avenue');

-- Insert sample daily data
INSERT INTO daily_data (building_id, date, energy, hvac, temperature, waste)
VALUES
    (1, '2024-11-15', 150.5, 65, 22.1, 10.3),
    (1, '2024-11-16', 140.2, 70, 21.8, 9.8),
    (2, '2024-11-15', 120.4, 60, 23.3, 8.5),
    (3, '2024-11-16', 160.1, 75, 20.5, 12.0);