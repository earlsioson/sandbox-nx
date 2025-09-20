// PCC-specific types that might be reused across bounded contexts
export type PccClientConfig = {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly certPath: string;
  readonly keyPath: string;
  readonly baseUrl?: string;
  readonly timeout?: number;
};

export type PccTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

// PCC API response types (based on actual API response we logged)
export type PccPatientResponse = {
  patientId: number;
  firstName: string;
  lastName: string;
  birthDate: string; // PCC actually returns "birthDate" not "dateOfBirth"
  facId: number; // PCC actually returns "facId" not "facilityId"
};

export type PccConditionResponse = {
  conditionId: number;
  icd10: string;
  icd10Description: string;
  onsetDate: string;
  principalDiagnosis: boolean;
};

// PCC API list response wrapper
export type PccListResponse<T> = {
  data: T[];
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
  };
};
