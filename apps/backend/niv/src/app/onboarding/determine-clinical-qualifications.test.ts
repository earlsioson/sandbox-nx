import { describe, expect, it } from 'vitest';
import { ClinicalQualifications } from '../interfaces/clinical-qualifications.interface';
import { determineClinicalQualifications } from './determine-clinical-qualifications.function';

describe('determineClinicalQualifications', () => {
  describe('COPD Qualifications', () => {
    it('should qualify for COPD with chronic obstructive pulmonary disease codes', () => {
      const copdCodes = ['J44.0', 'J44.1', 'J44.9', 'J44.89'];

      copdCodes.forEach((code) => {
        const result = determineClinicalQualifications([code]);
        expect(result.copd).toBe(true);
        expect(result.arf).toBe(false);
        expect(result.nmd).toBe(false);
        expect(result.trd).toBe(false);
      });
    });

    it('should qualify for COPD with chronic bronchitis', () => {
      const result = determineClinicalQualifications(['J42']);
      expect(result).toEqual({
        copd: true,
        arf: false,
        nmd: false,
        trd: false,
      });
    });

    it('should qualify for COPD with emphysema codes', () => {
      const emphysemaCodes = ['J43.9', 'J43.8'];

      emphysemaCodes.forEach((code) => {
        const result = determineClinicalQualifications([code]);
        expect(result.copd).toBe(true);
      });
    });

    it('should qualify for COPD with related respiratory conditions', () => {
      const relatedCodes = ['J47.9', 'J45.909', 'J45.998'];

      relatedCodes.forEach((code) => {
        const result = determineClinicalQualifications([code]);
        expect(result.copd).toBe(true);
      });
    });
  });

  describe('ARF (Acute Respiratory Failure) Qualifications', () => {
    it('should qualify for ARF with respiratory failure without hypercapnia', () => {
      const rfWithoutHypercapniaCodes = [
        'J96.11',
        'J96.20',
        'J96.90',
        'J96.10',
        'J96.21',
        'J96.92',
      ];

      rfWithoutHypercapniaCodes.forEach((code) => {
        const result = determineClinicalQualifications([code]);
        expect(result.arf).toBe(true);
        expect(result.copd).toBe(false);
        expect(result.nmd).toBe(false);
        expect(result.trd).toBe(false);
      });
    });

    it('should qualify for ARF with respiratory failure with hypercapnia', () => {
      const rfWithHypercapniaCodes = ['J96.12', 'J96.22'];

      rfWithHypercapniaCodes.forEach((code) => {
        const result = determineClinicalQualifications([code]);
        expect(result.arf).toBe(true);
      });
    });

    it('should qualify for ARF with acute respiratory failure codes', () => {
      const acuteRfCodes = ['J96.01', 'J96.02', 'J96.00'];

      acuteRfCodes.forEach((code) => {
        const result = determineClinicalQualifications([code]);
        expect(result.arf).toBe(true);
      });
    });

    it('should qualify for ARF with ventilator dependence', () => {
      const result = determineClinicalQualifications(['Z99.11']);
      expect(result).toEqual({
        copd: false,
        arf: true,
        nmd: false,
        trd: false,
      });
    });

    it('should qualify for ARF with respiratory conditions from Stand Alone category', () => {
      const respiratoryCodes = [
        'E84.9',
        'I27.0',
        'J84.10',
        'J84.178',
        'J84.89',
        'J84.9',
      ];

      respiratoryCodes.forEach((code) => {
        const result = determineClinicalQualifications([code]);
        expect(result.arf).toBe(true);
      });
    });
  });

  describe('NMD (Neuromuscular Disease) Qualifications', () => {
    it('should qualify for NMD with cerebral palsy codes', () => {
      const cerebralPalsyCodes = ['G80.0', 'G80.1', 'G80.9'];

      cerebralPalsyCodes.forEach((code) => {
        const result = determineClinicalQualifications([code]);
        expect(result.nmd).toBe(true);
        expect(result.copd).toBe(false);
        expect(result.arf).toBe(false);
        expect(result.trd).toBe(false);
      });
    });

    it('should qualify for NMD with motor neuron diseases', () => {
      const motorNeuronCodes = ['G12.0', 'G12.21', 'G12.9', 'G14'];

      motorNeuronCodes.forEach((code) => {
        const result = determineClinicalQualifications([code]);
        expect(result.nmd).toBe(true);
      });
    });

    it('should qualify for NMD with ALS specifically', () => {
      const result = determineClinicalQualifications(['G12.21']);
      expect(result).toEqual({
        copd: false,
        arf: false,
        nmd: true,
        trd: false,
      });
    });

    it('should qualify for NMD with myasthenia gravis', () => {
      const myastheniaGravisCodes = ['G70.00', 'G70.01', 'G70.2', 'G70.80'];

      myastheniaGravisCodes.forEach((code) => {
        const result = determineClinicalQualifications([code]);
        expect(result.nmd).toBe(true);
      });
    });

    it('should qualify for NMD with muscular dystrophies', () => {
      const muscularDystrophyCodes = [
        'G71.0',
        'G71.01',
        'G71.02',
        'G71.021',
        'G71.11',
      ];

      muscularDystrophyCodes.forEach((code) => {
        const result = determineClinicalQualifications([code]);
        expect(result.nmd).toBe(true);
      });
    });

    it('should qualify for NMD with paralytic syndromes', () => {
      const paralyticCodes = ['G82.22', 'I69.964'];

      paralyticCodes.forEach((code) => {
        const result = determineClinicalQualifications([code]);
        expect(result.nmd).toBe(true);
      });
    });

    it('should qualify for NMD with central sleep disorders', () => {
      const centralSleepCodes = ['G47.31', 'G47.34', 'G47.35'];

      centralSleepCodes.forEach((code) => {
        const result = determineClinicalQualifications([code]);
        expect(result.nmd).toBe(true);
      });
    });
  });

  describe('TRD (Thoracic Restrictive Disease) Qualifications', () => {
    it('should qualify for TRD with kyphosis codes', () => {
      const kyphosisCodes = [
        'M40.00',
        'M40.204',
        'M40.294',
        'M40.209',
        'M40.299',
      ];

      kyphosisCodes.forEach((code) => {
        const result = determineClinicalQualifications([code]);
        expect(result.trd).toBe(true);
        expect(result.copd).toBe(false);
        expect(result.arf).toBe(false);
        expect(result.nmd).toBe(false);
      });
    });

    it('should qualify for TRD with scoliosis codes', () => {
      const scoliosisCodes = ['M41.34', 'M41.46', 'M41.9'];

      scoliosisCodes.forEach((code) => {
        const result = determineClinicalQualifications([code]);
        expect(result.trd).toBe(true);
      });
    });

    it('should qualify for TRD with congenital chest wall deformities', () => {
      const chestWallCodes = ['Q67.6', 'Q76.49'];

      chestWallCodes.forEach((code) => {
        const result = determineClinicalQualifications([code]);
        expect(result.trd).toBe(true);
      });
    });

    it('should qualify for TRD with spinal deformities', () => {
      const result = determineClinicalQualifications(['M45.9']);
      expect(result).toEqual({
        copd: false,
        arf: false,
        nmd: false,
        trd: true,
      });
    });
  });

  describe('Multiple Qualifications', () => {
    it('should qualify for both COPD and ARF', () => {
      const result = determineClinicalQualifications(['J44.0', 'J96.01']);
      expect(result).toEqual({
        copd: true,
        arf: true,
        nmd: false,
        trd: false,
      });
    });

    it('should qualify for NMD and TRD', () => {
      const result = determineClinicalQualifications(['G12.21', 'M40.204']);
      expect(result).toEqual({
        copd: false,
        arf: false,
        nmd: true,
        trd: true,
      });
    });

    it('should qualify for all four categories', () => {
      const result = determineClinicalQualifications([
        'J44.0',
        'J96.01',
        'G12.21',
        'M40.204',
      ]);
      expect(result).toEqual({
        copd: true,
        arf: true,
        nmd: true,
        trd: true,
      });
    });

    it('should handle duplicate codes without affecting results', () => {
      const result = determineClinicalQualifications([
        'J44.0',
        'J44.0',
        'J44.1',
      ]);
      expect(result).toEqual({
        copd: true,
        arf: false,
        nmd: false,
        trd: false,
      });
    });
  });

  describe('No Qualifications', () => {
    it('should not qualify with non-NIV diagnosis codes', () => {
      const nonQualifyingCodes = ['Z51.11', 'I10', 'E11.9', 'K35.9', 'M79.3'];

      nonQualifyingCodes.forEach((code) => {
        const result = determineClinicalQualifications([code]);
        expect(result).toEqual({
          copd: false,
          arf: false,
          nmd: false,
          trd: false,
        });
      });
    });

    it('should return all false for empty diagnosis codes array', () => {
      const result = determineClinicalQualifications([]);
      expect(result).toEqual({
        copd: false,
        arf: false,
        nmd: false,
        trd: false,
      });
    });

    it('should return all false for undefined/invalid codes', () => {
      const result = determineClinicalQualifications(['INVALID', '', 'Z99.99']);
      expect(result).toEqual({
        copd: false,
        arf: false,
        nmd: false,
        trd: false,
      });
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle typical COPD patient with multiple related conditions', () => {
      const result = determineClinicalQualifications([
        'J44.1',
        'J96.12',
        'I27.0',
      ]);
      expect(result).toEqual({
        copd: true,
        arf: true, // Both J96.12 and I27.0 qualify for ARF
        nmd: false,
        trd: false,
      });
    });

    it('should handle ALS patient with respiratory failure', () => {
      const result = determineClinicalQualifications([
        'G12.21',
        'J96.01',
        'Z99.11',
      ]);
      expect(result).toEqual({
        copd: false,
        arf: true, // Both respiratory failure and ventilator dependence
        nmd: true, // ALS
        trd: false,
      });
    });

    it('should handle complex neuromuscular patient with chest deformity', () => {
      const result = determineClinicalQualifications([
        'G71.01',
        'M41.46',
        'J96.22',
      ]);
      expect(result).toEqual({
        copd: false,
        arf: true, // Respiratory failure with hypercapnia
        nmd: true, // Muscular dystrophy
        trd: true, // Neuromuscular scoliosis
      });
    });

    it('should handle patient with cystic fibrosis and complications', () => {
      const result = determineClinicalQualifications([
        'E84.9',
        'J96.11',
        'J84.10',
      ]);
      expect(result).toEqual({
        copd: false,
        arf: true, // All three codes qualify for ARF
        nmd: false,
        trd: false,
      });
    });
  });

  describe('Type Safety', () => {
    it('should return proper ClinicalQualifications interface', () => {
      const result: ClinicalQualifications = determineClinicalQualifications([
        'J44.0',
      ]);

      // Verify interface structure
      expect(typeof result.copd).toBe('boolean');
      expect(typeof result.arf).toBe('boolean');
      expect(typeof result.nmd).toBe('boolean');
      expect(typeof result.trd).toBe('boolean');

      // Verify only expected properties
      expect(Object.keys(result)).toEqual(['copd', 'arf', 'nmd', 'trd']);
    });
  });
});
