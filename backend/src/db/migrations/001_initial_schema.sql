CREATE TABLE raw_batches(
    id SERIAL PRIMARY KEY,
    batch_no VARCHAR(50) UNIQUE NOT NULL,
    supplier VARCHAR(100) NOT NULL,
    invoice_no VARCHAR(50),
    inward_date DATE NOT NULL,
    makhana_type VARCHAR(20) NOT NULL,
    total_quantity_kg DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE raw_stock(
    id SERIAL PRIMARY KEY,
    batch_no VARCHAR(50) REFERENCES raw_batches(batch_no) ON DELETE CASCADE,
    grade VARCHAR(10) NOT NULL,
    original_quantity_kg DECIMAL(10,2) NOT NULL,
    current_quantity_kg DECIMAL(10,2) NOT NULL,
    cost_per_kg DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(batch_no, grade)
);

