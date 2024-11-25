CREATE TYPE field_type AS ENUM (
    'string',
    'integer',
    'float',
    'boolean',
    'list',
    'dict',
    'date'
);

CREATE TABLE schema_definitions (
    name VARCHAR(255) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE schema_fields (
    id SERIAL PRIMARY KEY,
    schema_definition_name VARCHAR(255) REFERENCES schema_definitions(name) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    field_type field_type NOT NULL,
    description TEXT,
    required BOOLEAN DEFAULT TRUE,
    list_item_type field_type,
    default_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE reports (
    name VARCHAR(255) PRIMARY KEY,
    schema_name VARCHAR(255) REFERENCES schema_definitions(name),
    content JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_schema_fields_schema_definition_name ON schema_fields(schema_definition_name);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_schema_definitions_updated_at
    BEFORE UPDATE ON schema_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schema_fields_updated_at
    BEFORE UPDATE ON schema_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE VIEW schema_definitions_with_fields AS
SELECT 
    sd.name as schema_name,
    json_agg(
        json_build_object(
            'name', sf.name,
            'field_type', sf.field_type,
            'description', sf.description,
            'required', sf.required,
            'list_item_type', sf.list_item_type,
            'default_value', sf.default_value
        )
    ) as fields
FROM schema_definitions sd
LEFT JOIN schema_fields sf ON sd.name = sf.schema_definition_name
GROUP BY sd.name;