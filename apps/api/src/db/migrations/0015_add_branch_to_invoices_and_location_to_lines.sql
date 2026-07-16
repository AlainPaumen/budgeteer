-- Add branch_id to invoices (NOT NULL)
-- Existing invoices are assigned to branch_id = 1 as default

-- First add column as nullable
ALTER TABLE invoices ADD COLUMN branch_id INTEGER REFERENCES branches(id);

-- Set default branch for existing invoices
UPDATE invoices SET branch_id = 1 WHERE branch_id IS NULL;

-- Recreate table with NOT NULL constraint
CREATE TABLE invoices_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    branch_id INTEGER NOT NULL REFERENCES branches(id),
    invoice_date INTEGER NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    created_by TEXT NOT NULL REFERENCES user(id),
    created_at INTEGER NOT NULL,
    updated_by TEXT NOT NULL REFERENCES user(id),
    updated_at INTEGER NOT NULL
);

INSERT INTO invoices_new (id, supplier_id, branch_id, invoice_date, invoice_number, created_by, created_at, updated_by, updated_at)
SELECT id, supplier_id, branch_id, invoice_date, invoice_number, created_by, created_at, updated_by, updated_at
FROM invoices;

DROP TABLE invoices;

ALTER TABLE invoices_new RENAME TO invoices;

-- Add location_id to invoice_lines (nullable)
ALTER TABLE invoice_lines ADD COLUMN location_id INTEGER REFERENCES locations(id);
