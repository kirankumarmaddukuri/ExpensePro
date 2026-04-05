-- liquibase formatted sql

-- changeset expensetracker:1 splitStatements:false
-- Create custom ENUM types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE transaction_type AS ENUM ('EXPENSE', 'INCOME');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'OTHER');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'frequency_type') THEN
        CREATE TYPE frequency_type AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budget_status') THEN
        CREATE TYPE budget_status AS ENUM ('WITHIN', 'WARNING', 'EXCEEDED');
    END IF;
END $$;

-- changeset expensetracker:2 splitStatements:false
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'USD',
    profile_image TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- changeset expensetracker:3 splitStatements:false
-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type transaction_type NOT NULL,
    icon VARCHAR(50), 
    color VARCHAR(7) DEFAULT '#6B7280',
    is_default BOOLEAN DEFAULT FALSE,
    user_id BIGINT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT default_category_check CHECK (
        (is_default = TRUE AND user_id IS NULL) OR 
        (is_default = FALSE AND user_id IS NOT NULL)
    ),
    CONSTRAINT unique_user_category UNIQUE (user_id, name, type)
);

CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_categories_default ON categories(is_default) WHERE is_default = TRUE;

-- changeset expensetracker:4 splitStatements:false
-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    type transaction_type NOT NULL,
    transaction_date DATE NOT NULL,
    description VARCHAR(200),
    payment_method payment_method,
    attachment TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT valid_transaction_date CHECK (transaction_date <= CURRENT_DATE),
    CONSTRAINT deleted_timestamp CHECK (
        (is_deleted = FALSE AND deleted_at IS NULL) OR 
        (is_deleted = TRUE AND deleted_at IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_not_deleted ON transactions(user_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_transactions_date_range ON transactions(transaction_date) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_transactions_user_month ON transactions(
    user_id, 
    EXTRACT(YEAR FROM transaction_date), 
    EXTRACT(MONTH FROM transaction_date)
) WHERE is_deleted = FALSE;

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- changeset expensetracker:5 splitStatements:false
-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    month SMALLINT NOT NULL,
    year SMALLINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    CONSTRAINT positive_budget CHECK (amount > 0),
    CONSTRAINT valid_month CHECK (month >= 1 AND month <= 12),
    CONSTRAINT valid_year CHECK (year >= 2000 AND year <= 2100),
    CONSTRAINT unique_budget UNIQUE (user_id, category_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON budgets(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);

DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- changeset expensetracker:6 splitStatements:false
-- Recurring Transactions table
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    type transaction_type NOT NULL,
    description VARCHAR(200),
    payment_method payment_method,
    frequency frequency_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    next_occurrence DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT positive_recurring_amount CHECK (amount > 0),
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT valid_next_occurrence CHECK (next_occurrence >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_recurring_user_active ON recurring_transactions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_next_occurrence ON recurring_transactions(next_occurrence) WHERE is_active = TRUE;

DROP TRIGGER IF EXISTS update_recurring_transactions_updated_at ON recurring_transactions;
CREATE TRIGGER update_recurring_transactions_updated_at
    BEFORE UPDATE ON recurring_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- changeset expensetracker:7 splitStatements:false
-- Refresh Tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(500) UNIQUE NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expiry ON refresh_tokens(expiry_date);

-- changeset expensetracker:8 splitStatements:false
-- Default EXPENSE Categories
INSERT INTO categories (name, type, icon, color, is_default, display_order) VALUES
('Food & Dining', 'EXPENSE', '🍽️', '#FF6B6B', TRUE, 1),
('Transportation', 'EXPENSE', '🚗', '#4ECDC4', TRUE, 2),
('Shopping', 'EXPENSE', '🛍️', '#45B7D1', TRUE, 3),
('Entertainment', 'EXPENSE', '🎬', '#FFA07A', TRUE, 4),
('Healthcare', 'EXPENSE', '🏥', '#98D8C8', TRUE, 5),
('Bills & Utilities', 'EXPENSE', '💡', '#F7DC6F', TRUE, 6),
('Education', 'EXPENSE', '📚', '#BB8FCE', TRUE, 7),
('Housing', 'EXPENSE', '🏠', '#85C1E2', TRUE, 8),
('Personal Care', 'EXPENSE', '💅', '#F8B4D9', TRUE, 9),
('Travel', 'EXPENSE', '✈️', '#76D7C4', TRUE, 10),
('Insurance', 'EXPENSE', '🛡️', '#AED6F1', TRUE, 11),
('Gifts & Donations', 'EXPENSE', '🎁', '#FADBD8', TRUE, 12),
('Investments', 'EXPENSE', '📊', '#D5F4E6', TRUE, 13),
('Other', 'EXPENSE', '📦', '#D5D8DC', TRUE, 99)
ON CONFLICT (user_id, name, type) DO NOTHING;

-- Default INCOME Categories
INSERT INTO categories (name, type, icon, color, is_default, display_order) VALUES
('Salary', 'INCOME', '💰', '#52C41A', TRUE, 1),
('Freelance', 'INCOME', '💼', '#13C2C2', TRUE, 2),
('Investment Returns', 'INCOME', '📈', '#1890FF', TRUE, 3),
('Business Income', 'INCOME', '🏢', '#722ED1', TRUE, 4),
('Rental Income', 'INCOME', '🏘️', '#FA8C16', TRUE, 5),
('Gifts', 'INCOME', '🎁', '#EB2F96', TRUE, 6),
('Refunds', 'INCOME', '↩️', '#52C41A', TRUE, 7),
('Other', 'INCOME', '💵', '#8C8C8C', TRUE, 99)
ON CONFLICT (user_id, name, type) DO NOTHING;
