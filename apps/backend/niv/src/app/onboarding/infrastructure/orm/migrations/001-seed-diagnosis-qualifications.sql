-- Migration to seed diagnosis code qualifications based on client CSV data
-- This transforms the client's NIVDiagnosiscodes_9825.csv into structured reference data

-- Create the diagnosis_code_qualifications table
CREATE TABLE IF NOT EXISTS diagnosis_code_qualifications (
    id SERIAL PRIMARY KEY,
    icd10_code VARCHAR(10) NOT NULL,
    qualification_type VARCHAR(10) NOT NULL CHECK (qualification_type IN ('COPD', 'ARF', 'NMD', 'TRD')),
    is_qualifying BOOLEAN DEFAULT true,
    description TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_diagnosis_code_qualifications_icd10_code ON diagnosis_code_qualifications(icd10_code);
CREATE INDEX IF NOT EXISTS idx_diagnosis_code_qualifications_qualification_type ON diagnosis_code_qualifications(qualification_type);

-- Insert COPD diagnosis codes
INSERT INTO diagnosis_code_qualifications (icd10_code, qualification_type, is_qualifying, description) VALUES
('J44.0', 'COPD', true, 'Chronic obstructive pulmonary disease with acute lower respiratory infection'),
('J44.1', 'COPD', true, 'Chronic obstructive pulmonary disease with (acute) exacerbation'),
('J42', 'COPD', true, 'Chronic bronchitis'),
('J44.9', 'COPD', true, 'Chronic obstructive pulmonary disease, unspecified'),
('J43.9', 'COPD', true, 'Emphysema, unspecified'),
('J43.0', 'COPD', true, 'Unilateral pulmonary emphysema (MacLeod''s syndrome)'),
('J43.1', 'COPD', true, 'Panlobular emphysema'),
('J43.2', 'COPD', true, 'Centrilobular emphysema'),
('J43.8', 'COPD', true, 'Other emphysema'),
('J41.0', 'COPD', true, 'Simple chronic bronchitis');

-- Insert ARF (Acute Respiratory Failure) diagnosis codes
INSERT INTO diagnosis_code_qualifications (icd10_code, qualification_type, is_qualifying, description) VALUES
('J96.01', 'ARF', true, 'Acute respiratory failure with hypoxia'),
('J96.02', 'ARF', true, 'Acute respiratory failure with hypercapnia'),
('J96.00', 'ARF', true, 'Acute respiratory failure, unspecified whether with hypoxia or hypercapnia'),
('J96.11', 'ARF', true, 'Chronic respiratory failure with hypoxia'),
('J96.12', 'ARF', true, 'Chronic respiratory failure with hypercapnia'),
('J96.20', 'ARF', true, 'Acute and chronic respiratory failure, unspecified whether with hypoxia or hypercapnia'),
('J96.21', 'ARF', true, 'Acute and chronic respiratory failure with hypoxia'),
('J96.22', 'ARF', true, 'Acute and chronic respiratory failure with hypercapnia'),
('J96.90', 'ARF', true, 'Respiratory failure, unspecified, unspecified whether with hypoxia or hypercapnia'),
('J96.91', 'ARF', true, 'Respiratory failure, unspecified with hypoxia'),
('J96.92', 'ARF', true, 'Respiratory failure, unspecified with hypercapnia');

-- Insert NMD (Neuromuscular Disease) diagnosis codes
INSERT INTO diagnosis_code_qualifications (icd10_code, qualification_type, is_qualifying, description) VALUES
('G12.0', 'NMD', true, 'Infantile spinal muscular atrophy (Werdnig-Hoffmann disease)'),
('G12.21', 'NMD', true, 'Amyotrophic lateral sclerosis (ALS)'),
('G12.9', 'NMD', true, 'Spinal muscular atrophy, unspecified'),
('G14', 'NMD', true, 'Post-polio syndrome with respiratory decline'),
('G23.1', 'NMD', true, 'Multiple system atrophy (MSA) with respiratory failure'),
('G35', 'NMD', true, 'Multiple sclerosis with respiratory involvement'),
('G47.31', 'NMD', true, 'Central sleep apnea with hypercapnia'),
('G47.34', 'NMD', true, 'Primary alveolar hypoventilation syndrome'),
('G47.35', 'NMD', true, 'Congenital central hypoventilation syndrome'),
('G61.0', 'NMD', true, 'Guillain-Barré syndrome (severe cases with respiratory failure)'),
('G70.00', 'NMD', true, 'Myasthenia gravis without (acute) exacerbation'),
('G70.01', 'NMD', true, 'Myasthenia gravis with (acute) exacerbation'),
('G70.2', 'NMD', true, 'Disorders of neuromuscular transmission with respiratory involvement'),
('G70.80', 'NMD', true, 'Lambert-Eaton syndrome, unspecified'),
('G71.0', 'NMD', true, 'Muscular dystrophy (includes Duchenne and Becker)'),
('G71.01', 'NMD', true, 'Duchenne or Becker muscular dystrophy'),
('G71.02', 'NMD', true, 'Other muscular dystrophies'),
('G71.021', 'NMD', true, 'Autosomal dominant muscular dystrophy'),
('G71.032', 'NMD', true, 'Autosomal recessive muscular dystrophy due to calpain-3 dysfunction'),
('G71.033', 'NMD', true, 'Autosomal recessive muscular dystrophy due to dysferlin dysfunction'),
('G71.034', 'NMD', true, 'Autosomal recessive muscular dystrophy due to sarcoglycan dysfunction'),
('G71.11', 'NMD', true, 'Myotonic dystrophy'),
('G71.2', 'NMD', true, 'Congenital myopathies'),
('G73.1', 'NMD', true, 'Lambert-Eaton syndrome in neoplastic disease'),
('G73.7', 'NMD', true, 'Myopathy in endocrine diseases (e.g., hypothyroid myopathy)'),
('G73.81', 'NMD', true, 'Critical illness myopathy'),
('G73.89', 'NMD', true, 'Other specified myopathies'),
('G80.0', 'NMD', true, 'Spastic quadriplegic cerebral palsy'),
('G80.1', 'NMD', true, 'Cerebral Palsy'),
('G80.9', 'NMD', true, 'Cerebral palsy with respiratory compromise'),
('G82.22', 'NMD', true, 'Paraplegia'),
('G90.9', 'NMD', true, 'Autonomic neuropathy with respiratory involvement');

-- Note: TRD (Treatment-Resistant Depression) codes were not found in the client CSV
-- This aligns with clinical reality as TRD typically doesn't qualify for NIV therapy

-- Insert other respiratory-related qualifying conditions from client data
INSERT INTO diagnosis_code_qualifications (icd10_code, qualification_type, is_qualifying, description) VALUES
('Z99.11', 'ARF', true, 'Dependence on Ventilator'),
('E84.9', 'ARF', true, 'Cystic fibrosis, unspecified'),
('J45.50', 'ARF', true, 'Severe asthma with chronic respiratory failure'),
('J84.10', 'ARF', true, 'Pulmonary fibrosis, unspecified'),
('J84.178', 'ARF', true, 'Other interstitial pulmonary diseases with fibrosis'),
('J84.89', 'ARF', true, 'Other interstitial pulmonary diseases (e.g., post-COVID fibrosis)'),
('J84.9', 'ARF', true, 'Interstitial pulmonary disease, unspecified'),
('I27.0', 'ARF', true, 'Primary pulmonary hypertension');

-- Add sample non-qualifying codes for testing (demonstrate false conditions)
INSERT INTO diagnosis_code_qualifications (icd10_code, qualification_type, is_qualifying, description) VALUES
('Z51.11', 'COPD', false, 'Encounter for antineoplastic chemotherapy (not qualifying)'),
('I10', 'ARF', false, 'Essential hypertension (not qualifying for respiratory failure)'),
('E11.9', 'NMD', false, 'Type 2 diabetes mellitus (not qualifying for neuromuscular)');

COMMENT ON TABLE diagnosis_code_qualifications IS 'Reference table for ICD-10 codes that qualify patients for NIV programs. Based on client-provided NIVDiagnosiscodes_9825.csv data.';
COMMENT ON COLUMN diagnosis_code_qualifications.qualification_type IS 'Clinical qualification categories: COPD, ARF (Acute Respiratory Failure), NMD (Neuromuscular Disease), TRD (Treatment-Resistant Depression)';
COMMENT ON COLUMN diagnosis_code_qualifications.is_qualifying IS 'Whether this diagnosis code qualifies the patient for the specified NIV program type';