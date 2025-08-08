-- RICS Inspection Forms DB (Metadata‑Driven, Polymorphic)
-- Postgres

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------
-- A) USERS
-- -------------------------------
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user','admin','approver')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------
-- B) DOMAIN ENTITIES
-- -------------------------------
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  physical_address TEXT,
  cac_registration_number VARCHAR(100),
  year_commencing_business INT,
  number_of_employees INT,
  membership_nagobin BOOLEAN,
  membership_leia BOOLEAN,
  membership_indt BOOLEAN,
  membership_other JSONB,
  quality_certifications JSONB, -- e.g. [{"std":"ISO 9001","year":2015}]
  competence_category TEXT,
  competence_line_no TEXT,
  incidental_line_no TEXT,
  contact_person VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  address TEXT,
  dob DATE,
  email VARCHAR(255),
  phone VARCHAR(50),
  role_title VARCHAR(120), -- Technical Manager, Approved Inspector, Applicant, etc.
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE person_education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  school_name TEXT NOT NULL,
  date_admitted DATE,
  date_completed DATE,
  qualification TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE person_qualifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  institution TEXT,
  date_issued DATE,
  expiry_date DATE,
  details JSONB,              -- optional payload
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE person_experience (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  company_name TEXT,
  date_joined DATE,
  date_exited DATE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manufacturer TEXT,
  year_of_manufacture INT,
  place_of_manufacture TEXT,
  code_of_construction TEXT,
  intended_use TEXT,          -- New/Used stored via is_new
  is_new BOOLEAN,
  inspection_agency_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  aia_authorization_no VARCHAR(100),
  hydro_test_date DATE,
  hydro_test_pressure TEXT,
  design_pressure TEXT,
  mawp_mdmt TEXT,
  equipment_type TEXT,        -- Boiler/Pressure Vessel subtypes if needed
  distinctive_no TEXT,
  operating_medium TEXT,
  equipment_category TEXT,
  equipment_sub_category TEXT,
  equipment_classification TEXT,
  equipment_line_no TEXT,
  equipment_incidental_no TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------
-- C) CATEGORIES (Line No. lookups from PDFs)
-- -------------------------------
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain VARCHAR(60) NOT NULL, -- 'authorization_bpv','authorization_lifting','cert_bpv','cert_lifting','registration_bpv'
  line_no INT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  classification TEXT,
  UNIQUE(domain, line_no)
);

CREATE TABLE incidental_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain VARCHAR(60) NOT NULL, -- 'orgs_contractors_service_providers','personnel_bpv','personnel_lifting','documents_review'
  line_no INT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  classification TEXT,
  UNIQUE(domain, line_no)
);

-- -------------------------------
-- D) DOCUMENTS / ATTACHMENTS
-- -------------------------------
CREATE TABLE attachment_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(80) UNIQUE NOT NULL,  -- e.g. 'quality_manual','cv','training_cert','iso_9001','cac_docs'
  label VARCHAR(255) NOT NULL,
  allowed_mime TEXT[],
  required_conditions JSONB,         -- rule expressions tied to categories/classes
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_type VARCHAR(20) NOT NULL CHECK (owner_type IN ('organization','person','equipment','form_instance')),
  owner_id UUID NOT NULL,            -- FK validated at app layer due to poly
  attachment_type_id UUID REFERENCES attachment_types(id),
  file_path TEXT NOT NULL,
  mime_type TEXT,
  issuer TEXT,
  issue_date DATE,
  expiry_date DATE,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- optional link table for clarity when owner_type='form_instance'
CREATE TABLE form_instance_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_instance_id UUID NOT NULL,
  attachment_id UUID NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
  UNIQUE(form_instance_id, attachment_id)
);

-- -------------------------------
-- E) METADATA ENGINE (your original, refined)
-- -------------------------------
CREATE TABLE base_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(20) DEFAULT '1.0.0',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE form_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_form_id UUID NOT NULL REFERENCES base_forms(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,          -- e.g. Authorization: AIA, Authorization: Contractor, Training Org, Certification: AI, etc.
  description TEXT,
  category VARCHAR(100),               -- 'authorization','certification','registration'
  requires_approval BOOLEAN DEFAULT FALSE,
  max_duration_days INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(base_form_id, name)
);

-- Add entity binding hint to fields so UI knows where values should persist besides the instance
CREATE TABLE form_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,          -- machine key
  label VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL CHECK (
    field_type IN ('text','email','phone','number','date','datetime','textarea','select','radio','checkbox','file','address')
  ),
  entity_binding JSONB,                -- {"entity":"organization|person|equipment|instance", "path":"contact.email"}
  is_required BOOLEAN DEFAULT FALSE,
  validation_rules JSONB,
  default_value TEXT,
  placeholder TEXT,
  help_text TEXT,
  options JSONB,                       -- for selects etc.
  field_order INTEGER DEFAULT 0,
  is_shared BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE form_field_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_type_id UUID NOT NULL REFERENCES form_types(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT FALSE,
  field_order INTEGER DEFAULT 0,
  conditional_logic JSONB,
  validation_override JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(form_type_id, field_id)
);

CREATE TABLE form_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_type_id UUID NOT NULL REFERENCES form_types(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  step_order INTEGER NOT NULL,
  is_conditional BOOLEAN DEFAULT FALSE,
  conditional_logic JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(form_type_id, step_order)
);

CREATE TABLE step_field_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  step_id UUID NOT NULL REFERENCES form_steps(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
  field_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(step_id, field_id)
);

-- Optional rules table for show/require/calc without shipping code
CREATE TABLE form_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_type_id UUID NOT NULL REFERENCES form_types(id) ON DELETE CASCADE,
  rule_name VARCHAR(255) NOT NULL,
  trigger JSONB,           -- e.g. {"when":{"field":"service_class","op":"in","value":["Class I","Class II"]}}
  effects JSONB,           -- e.g. {"require":["quality_manual"],"show":["approved_inspector_panel"],"calc":[...]}
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------
-- F) FEES
-- -------------------------------
CREATE TABLE fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  fee_type VARCHAR(50) NOT NULL CHECK (fee_type IN ('fixed','percentage','tiered','conditional')),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  calculation_logic JSONB,
  conditions JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE form_type_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_type_id UUID NOT NULL REFERENCES form_types(id) ON DELETE CASCADE,
  fee_id UUID NOT NULL REFERENCES fees(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT TRUE,
  fee_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(form_type_id, fee_id)
);

-- -------------------------------
-- G) FORM INSTANCES + SUBTYPES
-- -------------------------------
CREATE TABLE form_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_type_id UUID NOT NULL REFERENCES form_types(id),
  reference_number VARCHAR(120) UNIQUE, -- will hold NGAN/NGACN/NGTAN/NGRN when approved
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft','submitted','under_review','approved','rejected','completed')),
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  total_fees DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- tie an instance to its primary entity (polymorphic pointer)
CREATE TABLE form_instance_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_instance_id UUID NOT NULL REFERENCES form_instances(id) ON DELETE CASCADE,
  subject_type VARCHAR(20) NOT NULL CHECK (subject_type IN ('organization','person','equipment')),
  subject_id UUID NOT NULL,
  UNIQUE(form_instance_id)  -- one primary subject per instance
);

-- subtype: Authorization (AIA / Contractor / Training)
CREATE TABLE authorization_apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_instance_id UUID UNIQUE NOT NULL REFERENCES form_instances(id) ON DELETE CASCADE,
  type_of_service VARCHAR(20), -- 'nuclear','non_nuclear' (nullable for lifting-only)
  service_classes JSONB,       -- array of {domain, line_no, label}
  exemption_requested BOOLEAN,
  is_reapplication BOOLEAN,
  meta JSONB
);

-- subtype: Certification (AI, Approved/Technical/Appointed Person, Operators, Pressure Welder)
CREATE TABLE certification_apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_instance_id UUID UNIQUE NOT NULL REFERENCES form_instances(id) ON DELETE CASCADE,
  type_of_certification TEXT,  -- e.g. 'Authorized Inspector','Approved Person','Rigger','Power Engineer','Pressure Welder'
  certification_class TEXT,    -- e.g. 'Class 1','Class MW','Below 50 tons'
  endorsements JSONB,          -- e.g. ["R","N"]
  training_start_date DATE,
  training_end_date DATE,
  training_org_id UUID REFERENCES organizations(id),
  training_method VARCHAR(20) CHECK (training_method IN ('online','classroom','field')),
  employer_id UUID REFERENCES organizations(id),
  exemption_requested BOOLEAN,
  is_reapplication BOOLEAN,
  meta JSONB
);

-- subtype: Registration (Boiler / Pressure Vessel)
CREATE TABLE registration_apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_instance_id UUID UNIQUE NOT NULL REFERENCES form_instances(id) ON DELETE CASCADE,
  type_of_installation VARCHAR(30) CHECK (type_of_installation IN ('boiler','pressure_vessel')),
  type_of_facility TEXT,
  object_use VARCHAR(20) CHECK (object_use IN ('power','process','heating','other')),
  object_use_other TEXT,
  installation_start_date DATE,
  installation_completion_date DATE,
  installer_id UUID REFERENCES organizations(id),
  owner_id UUID REFERENCES organizations(id),
  equipment_id UUID REFERENCES equipment(id),
  variance_requested BOOLEAN,
  meta JSONB
);

-- RICS reference numbers with explicit typed channels
CREATE TABLE reference_identifiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_instance_id UUID NOT NULL REFERENCES form_instances(id) ON DELETE CASCADE,
  ref_type VARCHAR(20) NOT NULL CHECK (ref_type IN ('NGAN','NGACN','NGTAN','NGRN','EXAM_REG_NO')),
  value VARCHAR(120) NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ref_type, value)
);

-- values captured by the metadata engine (non-file)
CREATE TABLE form_field_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_instance_id UUID NOT NULL REFERENCES form_instances(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES form_fields(id),
  field_value TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(form_instance_id, field_id)
);

CREATE TABLE form_instance_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_instance_id UUID NOT NULL REFERENCES form_instances(id) ON DELETE CASCADE,
  fee_id UUID NOT NULL REFERENCES fees(id),
  calculated_amount DECIMAL(12,2) NOT NULL,
  calculation_details JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(form_instance_id, fee_id)
);

CREATE TABLE form_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_instance_id UUID NOT NULL REFERENCES form_instances(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  performed_by UUID REFERENCES users(id),
  performed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  details JSONB,
  previous_values JSONB,
  new_values JSONB
);

-- -------------------------------
-- H) INDEXES
-- -------------------------------
CREATE INDEX idx_form_types_base_form_id ON form_types(base_form_id);
CREATE INDEX idx_form_field_mappings_form_type_id ON form_field_mappings(form_type_id);
CREATE INDEX idx_form_field_mappings_field_id ON form_field_mappings(field_id);
CREATE INDEX idx_form_steps_form_type_id ON form_steps(form_type_id);
CREATE INDEX idx_step_field_mappings_step_id ON step_field_mappings(step_id);

CREATE INDEX idx_form_instances_form_type_id ON form_instances(form_type_id);
CREATE INDEX idx_form_instances_status ON form_instances(status);
CREATE INDEX idx_form_instances_submitted_by ON form_instances(submitted_by);

CREATE INDEX idx_form_field_values_form_instance_id ON form_field_values(form_instance_id);
CREATE INDEX idx_form_field_values_field_id ON form_field_values(field_id);

CREATE INDEX idx_form_instance_fees_form_instance_id ON form_instance_fees(form_instance_id);

CREATE INDEX idx_form_history_form_instance_id ON form_history(form_instance_id);

CREATE INDEX idx_categories_domain_line ON categories(domain, line_no);
CREATE INDEX idx_incidental_domain_line ON incidental_categories(domain, line_no);

-- -------------------------------
-- I) TRIGGERS
-- -------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_orgs_updated BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_people_updated BEFORE UPDATE ON people FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_equipment_updated BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_base_forms_updated BEFORE UPDATE ON base_forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_form_types_updated BEFORE UPDATE ON form_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_form_fields_updated BEFORE UPDATE ON form_fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_fees_updated BEFORE UPDATE ON fees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_form_instances_updated BEFORE UPDATE ON form_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_field_values_updated BEFORE UPDATE ON form_field_values FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();