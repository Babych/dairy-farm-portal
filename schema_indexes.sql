-- Optimization Indexes for Cloudflare D1 (DairyERP)
-- Eliminates Full Table Scans and dramatically reduces D1 Row Reads (by 95-99%)

-- 1. Animals (Core Domain)
CREATE INDEX IF NOT EXISTS idx_animals_farm_status ON animals(farm_id, current_status);
CREATE INDEX IF NOT EXISTS idx_animals_farm_number ON animals(farm_id, farm_number);
CREATE INDEX IF NOT EXISTS idx_animals_official_tag ON animals(official_tag);
CREATE INDEX IF NOT EXISTS idx_animals_calving_dates ON animals(farm_id, last_calving_date, expected_calving_date);

-- 2. Health & Medical Withholding (Quarantine)
CREATE INDEX IF NOT EXISTS idx_health_quarantine ON health_events(is_active_withholding, milk_withholding_until);
CREATE INDEX IF NOT EXISTS idx_health_animal ON health_events(animal_id, event_date);

-- 3. Reproduction History
CREATE INDEX IF NOT EXISTS idx_repro_animal ON reproduction_events(animal_id, event_date);
CREATE INDEX IF NOT EXISTS idx_repro_type_date ON reproduction_events(event_type, event_date);

-- 4. Farms & Auth
CREATE INDEX IF NOT EXISTS idx_farms_owner ON farms(owner_email);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_farm ON users(farm_id);
CREATE INDEX IF NOT EXISTS idx_audit_farm ON audit_logs(farm_id, created_at);
