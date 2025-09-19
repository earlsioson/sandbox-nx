import { ClinicalQualifications } from './clinical-qualifications';

/**
 * Determines NIV clinical qualifications based on ICD-10 diagnosis codes
 *
 * Business Rules (derived from client requirements and medical guidelines):
 * - COPD: Chronic obstructive pulmonary disease codes
 * - ARF: Acute/chronic respiratory failure + ventilator dependence
 * - NMD: Neuromuscular diseases (ALS, muscular dystrophy, cerebral palsy, etc.)
 * - TRD: Thoracic restrictive diseases (kyphoscoliosis, chest wall deformities)
 *
 * @param diagnosisCodes Array of ICD-10 diagnosis codes from PCC API
 * @returns Clinical qualification flags for each NIV program type
 */
export function determineClinicalQualifications(
  diagnosisCodes: string[]
): ClinicalQualifications {
  const qualifications: ClinicalQualifications = {
    copd: false,
    arf: false,
    nmd: false,
    trd: false,
  };

  for (const code of diagnosisCodes) {
    // Check each qualification type
    if (isCOPDQualifying(code)) {
      qualifications.copd = true;
    }

    if (isARFQualifying(code)) {
      qualifications.arf = true;
    }

    if (isNMDQualifying(code)) {
      qualifications.nmd = true;
    }

    if (isTRDQualifying(code)) {
      qualifications.trd = true;
    }
  }

  return qualifications;
}

/**
 * Determines if ICD-10 code qualifies for COPD NIV program
 */
function isCOPDQualifying(icd10Code: string): boolean {
  const copdQualifyingCodes = [
    // COPD with complications
    'J44.0', // COPD with acute lower respiratory infection
    'J44.1', // COPD with (acute) exacerbation
    'J44.9', // COPD, unspecified
    'J44.89', // Other specified COPD

    // Chronic bronchitis
    'J42', // Chronic bronchitis

    // Emphysema
    'J43.9', // Emphysema, unspecified
    'J43.8', // Other emphysema

    // Related respiratory conditions
    'J47.9', // Bronchiectasis, unspecified
    'J45.909', // Unspecified asthma, uncomplicated
    'J45.998', // Other asthma
  ];

  return copdQualifyingCodes.includes(icd10Code);
}

/**
 * Determines if ICD-10 code qualifies for ARF (Acute Respiratory Failure) NIV program
 */
function isARFQualifying(icd10Code: string): boolean {
  const arfQualifyingCodes = [
    // Respiratory Failure without Hypercapnia (RF w/o hyper)
    'J96.11', // Chronic respiratory failure with hypoxia
    'J96.20', // Acute and chronic respiratory failure, unspecified
    'J96.90', // Respiratory failure, unspecified
    'J96.10', // Chronic respiratory failure, unspecified
    'J96.21', // Acute and chronic respiratory failure with hypoxia
    'J96.92', // Respiratory failure, unspecified, not elsewhere classified

    // Respiratory Failure with Hypercapnia (RF w/ hyper)
    'J96.12', // Chronic respiratory failure with hypercapnia
    'J96.22', // Acute and chronic respiratory failure with hypercapnia

    // Acute Respiratory Failure (Acute RF)
    'J96.01', // Acute respiratory failure with hypoxia
    'J96.02', // Acute respiratory failure with hypercapnia
    'J96.00', // Acute respiratory failure, unspecified

    // Ventilator Dependence (Vent dependence)
    'Z99.11', // Dependence on ventilator

    // Respiratory conditions from Stand Alone category
    'E84.9', // Cystic fibrosis, unspecified
    'I27.0', // Primary pulmonary hypertension
    'J84.10', // Pulmonary fibrosis, unspecified
    'J84.178', // Other interstitial pulmonary diseases with fibrosis
    'J84.89', // Other interstitial pulmonary diseases (e.g., post-COVID fibrosis)
    'J84.9', // Interstitial pulmonary disease, unspecified
    'J66.8', // Airway disease due to fumes and vapors
    'J95.1', // Post-thoracotomy respiratory failure
    'J45.50', // Severe asthma with chronic respiratory failure
  ];

  return arfQualifyingCodes.includes(icd10Code);
}

/**
 * Determines if ICD-10 code qualifies for NMD (Neuromuscular Disease) NIV program
 */
function isNMDQualifying(icd10Code: string): boolean {
  const nmdQualifyingCodes = [
    // Cerebral Palsy
    'G80.0', // Spastic quadriplegic cerebral palsy
    'G80.1', // Cerebral palsy
    'G80.9', // Cerebral palsy with respiratory compromise

    // Paralytic Syndromes
    'G82.22', // Paraplegia
    'I69.964', // Other paralytic syndrome following cerebrovascular disease

    // Motor Neuron Diseases
    'G12.0', // Infantile spinal muscular atrophy (Werdnig-Hoffmann disease)
    'G12.21', // Amyotrophic lateral sclerosis (ALS)
    'G12.9', // Spinal muscular atrophy, unspecified
    'G14', // Post-polio syndrome with respiratory decline

    // Other Neuromuscular Conditions
    'G23.1', // Multiple system atrophy (MSA) with respiratory failure
    'G35', // Multiple sclerosis with respiratory involvement
    'G61.0', // Guillain-Barré syndrome (severe cases with respiratory failure)
    'G90.9', // Autonomic neuropathy with respiratory involvement

    // Myoneural Disorders
    'G70.00', // Myasthenia gravis without (acute) exacerbation
    'G70.01', // Myasthenia gravis with (acute) exacerbation
    'G70.2', // Disorders of neuromuscular transmission with respiratory involvement
    'G70.80', // Lambert-Eaton syndrome, unspecified

    // Muscular Dystrophies
    'G71.0', // Muscular dystrophy (includes Duchenne and Becker)
    'G71.01', // Duchenne or Becker muscular dystrophy
    'G71.02', // Other muscular dystrophies
    'G71.021', // Autosomal dominant muscular dystrophy
    'G71.032', // Autosomal recessive muscular dystrophy due to calpain-3 dysfunction
    'G71.033', // Autosomal recessive muscular dystrophy due to dysferlin dysfunction
    'G71.034', // Autosomal recessive muscular dystrophy due to sarcoglycan dysfunction
    'G71.11', // Myotonic dystrophy
    'G71.2', // Congenital myopathies

    // Other Myopathies
    'G73.1', // Lambert-Eaton syndrome in neoplastic disease
    'G73.7', // Myopathy in endocrine diseases (e.g., hypothyroid myopathy)
    'G73.81', // Critical illness myopathy
    'G73.89', // Other specified myopathies

    // Central Sleep Disorders with Neurological Basis
    'G47.31', // Central sleep apnea with hypercapnia
    'G47.34', // Primary alveolar hypoventilation syndrome
    'G47.35', // Congenital central hypoventilation syndrome
  ];

  return nmdQualifyingCodes.includes(icd10Code);
}

/**
 * Determines if ICD-10 code qualifies for TRD (Thoracic Restrictive Disease) NIV program
 */
function isTRDQualifying(icd10Code: string): boolean {
  const trdQualifyingCodes = [
    // Kyphosis (abnormal forward curvature of spine)
    'M40.00', // Kyphosis, site unspecified
    'M40.204', // Kyphosis, thoracic region
    'M40.294', // Kyphosis, cervicothoracic region
    'M40.209', // Unspecified kyphosis, site unspecified
    'M40.299', // Other kyphosis, site unspecified

    // Scoliosis (abnormal lateral curvature of spine)
    'M41.34', // Thoracogenic scoliosis
    'M41.46', // Neuromuscular scoliosis
    'M41.9', // Scoliosis, unspecified

    // Other Spinal Deformities
    'M45.9', // Ankylosing spondylitis

    // Congenital Chest Wall Deformities
    'Q67.6', // Pectus excavatum
    'Q76.49', // Other congenital musculoskeletal deformities of rib cage

    // Traumatic/Other Restrictive Conditions
    'S06.9X9A', // Traumatic brain injury, sequela
    'S14.109A', // Unspecified injury of cervical spinal cord at C3–C5 level
    'S22.49XA', // Multiple rib fractures (restrictive chest wall injury)
  ];

  return trdQualifyingCodes.includes(icd10Code);
}
