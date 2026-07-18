# Database ERD

## Application Tables

```mermaid
erDiagram
    suppliers {
        integer id PK
        text name UK
        text notes
        boolean is_active
        text created_by FK
        timestamp created_at
        text updated_by FK
        timestamp updated_at
    }

    branches {
        integer id PK
        text name UK
        text notes
        boolean is_active
        text created_by FK
        timestamp created_at
        text updated_by FK
        timestamp updated_at
    }

    locations {
        integer id PK
        text name UK
        text notes
        integer branch_id FK
        boolean is_active
        text created_by FK
        timestamp created_at
        text updated_by FK
        timestamp updated_at
    }

    services {
        integer id PK
        text name UK
        text notes
        boolean is_active
        text created_by FK
        timestamp created_at
        text updated_by FK
        timestamp updated_at
    }

    cost_types {
        integer id PK
        text name UK
        text notes
        boolean is_fixed
        boolean is_capex
        boolean is_active
        text created_by FK
        timestamp created_at
        text updated_by FK
        timestamp updated_at
    }

    categories {
        integer id PK
        text name UK
        text notes
        boolean is_active
        text created_by FK
        timestamp created_at
        text updated_by FK
        timestamp updated_at
    }

    invoices {
        integer id PK
        integer supplier_id FK
        integer branch_id FK
        timestamp invoice_date
        text invoice_number UK
        text created_by FK
        timestamp created_at
        text updated_by FK
        timestamp updated_at
    }

    tags {
        integer id PK
        text name UK
        text notes
        boolean is_active
        text created_by FK
        timestamp created_at
        text updated_by FK
        timestamp updated_at
    }

    invoice_lines {
        integer id PK
        integer invoice_id FK
        text description
        integer unit_price
        integer number_of_units
        integer total_amount
        timestamp start_date
        timestamp end_date
        integer service_id FK
        integer category_id FK
        integer cost_type_id FK
        integer location_id FK
        text created_by FK
        timestamp created_at
        text updated_by FK
        timestamp updated_at
    }

    invoice_line_tags {
        integer invoice_line_id FK
        integer tag_id FK
    }

    branches ||--o{ locations : "has"
    suppliers ||--o{ invoices : "supplied by"
    branches ||--o{ invoices : "branch"
    invoices ||--o{ invoice_lines : "contains"
    services ||--o{ invoice_lines : "service"
    categories ||--o{ invoice_lines : "category"
    cost_types ||--o{ invoice_lines : "cost type"
    locations ||--o{ invoice_lines : "location"
    invoice_lines ||--o{ invoice_line_tags : "has"
    tags ||--o{ invoice_line_tags : "has"
```

> **Note:** All tables have `created_by` and `updated_by` foreign keys referencing the `user` table (see [BetterAuth Tables](#betterauth-tables)). These relationships are omitted from the diagram above for clarity.

## BetterAuth Tables

```mermaid
erDiagram
    user {
        text id PK
        text name
        text email UK
        boolean email_verified
        text image
        timestamp created_at
        timestamp updated_at
    }

    session {
        text id PK
        timestamp expires_at
        text token UK
        timestamp created_at
        timestamp updated_at
        text ip_address
        text user_agent
        text user_id FK
    }

    account {
        text id PK
        text account_id
        text provider_id
        text user_id FK
        text access_token
        text refresh_token
        text id_token
        timestamp access_token_expires_at
        timestamp refresh_token_expires_at
        text scope
        text password
        timestamp created_at
        timestamp updated_at
    }

    verification {
        text id PK
        text identifier
        text value
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    user ||--o{ session : "has"
    user ||--o{ account : "has"
```
