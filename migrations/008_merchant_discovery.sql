-- Discovery candidates are acquisition intelligence, never active merchants.
CREATE TABLE IF NOT EXISTS discovered_business (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'DISCOVERED' CHECK (status IN ('DISCOVERED','ENRICHING','READY_FOR_REVIEW','POSSIBLE_MATCH','CLAIMED','VERIFIED','REJECTED','STALE')),
  display_name text NOT NULL,
  normalized_name text NOT NULL,
  legal_name text,
  dba text,
  phone text,
  website text,
  address jsonb NOT NULL DEFAULT '{}',
  latitude numeric(9,6), longitude numeric(9,6), category text,
  operator_status text NOT NULL DEFAULT 'UNVERIFIED' CHECK (operator_status IN ('UNVERIFIED','POSSIBLE','VERIFIED')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS discovered_business_name_idx ON discovered_business(normalized_name);
CREATE INDEX IF NOT EXISTS discovered_business_status_idx ON discovered_business(status, updated_at DESC);
CREATE TABLE IF NOT EXISTS discovery_source (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), discovered_business_id uuid NOT NULL REFERENCES discovered_business(id),
  source_type text NOT NULL, provider text NOT NULL, source_record_id text NOT NULL, source_url text,
  payload jsonb NOT NULL DEFAULT '{}', confidence numeric(5,4),
  verification_status text NOT NULL DEFAULT 'DISCOVERED' CHECK (verification_status IN ('DISCOVERED','PLATFORM_VERIFIED','MERCHANT_VERIFIED','INFERENCE')),
  retrieved_at timestamptz NOT NULL DEFAULT now(), UNIQUE(provider, source_record_id)
);
CREATE INDEX IF NOT EXISTS discovery_source_business_idx ON discovery_source(discovered_business_id, retrieved_at DESC);
CREATE TABLE IF NOT EXISTS discovery_observation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), discovered_business_id uuid NOT NULL REFERENCES discovered_business(id),
  field_name text NOT NULL, value jsonb NOT NULL, source_id uuid REFERENCES discovery_source(id),
  authority text NOT NULL DEFAULT 'OTHER_DISCOVERY_DATA', confidence numeric(5,4),
  verification_state text NOT NULL DEFAULT 'DISCOVERED' CHECK (verification_state IN ('DISCOVERED','PLATFORM_VERIFIED','MERCHANT_VERIFIED','INFERENCE')),
  observed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS discovery_observation_field_idx ON discovery_observation(discovered_business_id, field_name, observed_at DESC);
CREATE TABLE IF NOT EXISTS merchant_claim (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), applicant_user_id uuid NOT NULL REFERENCES app_user(id), tenant_id uuid NOT NULL REFERENCES tenant(id),
  status text NOT NULL DEFAULT 'CLAIMED' CHECK (status IN ('CLAIMED','UNDER_REVIEW','VERIFIED','REJECTED')), verification_notes text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS merchant_claim_location (
  claim_id uuid NOT NULL REFERENCES merchant_claim(id), discovered_business_id uuid NOT NULL REFERENCES discovered_business(id),
  relationship text NOT NULL DEFAULT 'POSSIBLE_RELATED_LOCATION' CHECK (relationship IN ('POSSIBLE_RELATED_LOCATION','CLAIMED_LOCATION','VERIFIED_LOCATION')),
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(claim_id, discovered_business_id)
);
CREATE TABLE IF NOT EXISTS discovery_import_batch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source_type text NOT NULL, source_name text NOT NULL, source_identifier text,
  status text NOT NULL DEFAULT 'UPLOADED' CHECK (status IN ('UPLOADED','VALIDATED','IMPORTED','FAILED')),
  rows_received integer NOT NULL DEFAULT 0, rows_valid integer NOT NULL DEFAULT 0, rows_invalid integer NOT NULL DEFAULT 0,
  summary jsonb NOT NULL DEFAULT '{}', created_by uuid REFERENCES app_user(id), created_at timestamptz NOT NULL DEFAULT now()
);
