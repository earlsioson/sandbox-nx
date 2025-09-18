# NIV Application Implementation Context

## **Project Overview**

**Repository:** NIV (Noninvasive Ventilator) application in NX monorepo  
**Architecture:** Domain-Driven Design + Hexagonal Architecture (ports/adapters)  
**Reference Implementation:** `apps/backend/reference` - Nest.js course example showing proper DDD/Hexagonal patterns  
**All React components:** Function declarations only

## **Current Implementation Status**

### **Partially Implemented: Onboarding Bounded Context**

**Location:** `apps/backend/niv/src/app/onboarding/`
**Current Use Case:** "User sees a list of patients and for each patient show if they have clinical qualifications for COPD, ARF, NMD, and TRD"
**Status:** Foundation + PCC Integration implemented - **Workflow features still needed**

**API Endpoint:**

```
GET /api/onboarding/patients-with-qualifications?facilityId={id}
```

**Response Format:**

```json
{
  "patients": [
    {
      "patient": { "id": "...", "firstName": "...", "lastName": "...", "age": 74, ... },
      "onboarding": { "id": "...", "status": "NEW", ... } | null,
      "qualifications": {
        "copd": true, "arf": false, "nmd": false, "trd": false,
        "hasAnyQualification": true, "qualificationTypes": ["COPD"]
      }
    }
  ],
  "totalCount": 1,
  "facilityId": "facility-1"
}
```

## **Architectural Principles (MUST MAINTAIN)**

### **Reference App Alignment**

**Critical:** All new code must follow `apps/backend/reference` patterns exactly:

- ✅ **Single Repository Port per Bounded Context** (not multiple ports)
- ✅ **Rich Domain Entities** with business behavior (never anemic models)
- ✅ **Value Objects for Business Concepts** (immutable, with `equals()` methods)
- ✅ **Factory Pattern** for consistent domain object creation
- ✅ **Mapper Pattern** for domain ↔ persistence transformation
- ✅ **Dynamic Infrastructure Selection** (`'orm' | 'in-memory'` for testing)
- ✅ **Port/Adapter Dependency Injection** (application depends on abstractions)

### **Domain-Driven Design Rules**

1. **Aggregates:** `NIVOnboarding` is the aggregate root - all workflow changes go through it
2. **Invariants:** Domain entities enforce business rules (e.g., valid status transitions)
3. **Domain Services:** Complex multi-object business logic (clinical qualification assessment)
4. **Domain Events:** Publish for workflow state changes to enable cross-context communication
5. **Ubiquitous Language:** Use exact terms from `docs/workflow.d2` and healthcare domain

### **Integration Patterns**

1. **PCC Integration:** Repository pattern treats external API as another data source
2. **Reference Data:** Database-driven configuration (not hard-coded business rules)
3. **Workflow State:** Local database ownership, not PCC dependency
4. **Cross-Context:** Domain events + shared kernel concepts only

## **Critical Reference Documentation**

### **Architecture Guidelines (MUST READ)**

- `docs/ddd.md` - Domain-Driven Design principles
- `docs/hexagonal.md` - Hexagonal architecture implementation
- `apps/backend/reference/` - Reference implementation patterns (course example)

### **Working PCC Integration (IMPLEMENTED)**

- `apps/backend/niv/src/app/pcc-test/` - Working PCC test endpoints (preserved for debugging)
- `apps/backend/niv/src/app/shared/infrastructure/pcc/` - Production PCC integration
- `apps/backend/niv/src/app/onboarding/infrastructure/pcc/` - Onboarding PCC repository

### **Business Requirements**

- `docs/workflow.d2` - Complete NIV onboarding workflow (state machine)
- `docs/ux.d2` - UI workflows and user interactions
- `docs/pcc-openapi.json` - PointClickCare API integration specification
- `NIVDiagnosiscodes_9825.csv` - Client diagnosis code mapping (78 codes)

### **Architecture Documentation**

- `docs/01-hexagonal-architecture.d2` through `docs/07-integration-architecture.d2` - System design
- `docs/niv-architecture.md` - Implementation examples (**ignore - superseded by actual code**)

## **Development Workflow**

### **For New Use Cases (Same Bounded Context):**

1. **Domain First:** Add business logic to existing entities/services
2. **Test Domain Logic:** Pure business logic tests (no external dependencies)
3. **Application Service:** Add orchestration method to existing service
4. **Repository Extensions:** Add required data access methods to port
5. **Infrastructure:** Implement in both ORM and in-memory repositories
6. **PCC Integration:** Use existing shared PCC services for external data needs
7. **Presentation:** Add controller endpoint and DTOs
8. **Integration Test:** End-to-end with both persistence implementations

**PCC Integration Patterns:**

```typescript
// Use shared PCC client for new integrations
constructor(private pccApiClient: PCCAPIClient) {}

// Implement caching strategy for performance
const data = await this.findInCache(id) || await this.fetchFromPCC(id);

// Handle PCC failures gracefully
try {
  return await this.pccApiClient.get(`/endpoint`);
} catch (error) {
  this.logger.warn('PCC unavailable, using cached data');
  return this.getCachedData();
}
```

### **For New Bounded Contexts:**

1. **Domain Modeling:** Define aggregates, entities, value objects first
2. **Context Mapping:** Define integration points with existing contexts
3. **Infrastructure Setup:** Follow onboarding directory structure exactly
4. **Shared Kernel:** Add common concepts to `shared/` if truly cross-cutting

## **Architecture Implementation**

### **Architectural Patterns Used**

1. **Domain-Driven Design:** Rich entities with business logic (not anemic models)
2. **Hexagonal Architecture:** Port/adapter pattern, dependency inversion
3. **Repository Pattern:** Abstract data access with swappable implementations
4. **Value Objects:** Immutable objects (ClinicalQualifications, OnboardingStatus)
5. **Factory Pattern:** Consistent domain object creation
6. **Mapper Pattern:** Bidirectional domain ↔ persistence transformation
7. **Dynamic Module Composition:** Runtime persistence selection (`'orm' | 'in-memory'`)

### **Directory Structure (Mirrors Reference App)**

```
shared/
└── infrastructure/
    └── pcc/                                     # Shared PCC integration
        ├── pcc-config.service.ts                # Environment configuration
        ├── pcc-auth.service.ts                  # OAuth + mTLS authentication
        ├── pcc-api.client.ts                    # HTTP client with retry logic
        └── pcc-integration.module.ts            # Shared module

onboarding/
├── application/
│   ├── ports/onboarding.repository.ts           # Abstract interface
│   ├── onboarding.service.ts                    # Orchestration logic
│   └── onboarding.module.ts                     # Module composition
├── domain/
│   ├── niv-onboarding.ts                        # Rich aggregate root
│   ├── patient.ts                               # Rich entity
│   ├── onboarding-state.interface.ts            # Persistence contract
│   ├── value-objects/                           # Immutable business concepts
│   ├── services/clinical-qualification.service.ts  # Complex business logic
│   └── factories/niv-onboarding.factory.ts      # Domain creation
├── infrastructure/
│   ├── orm/                                     # Database implementation
│   │   ├── repositories/onboarding.repository.ts   # Now integrates with PCC
│   │   └── orm-persistence.module.ts            # Imports PCC integration
│   ├── in-memory/                               # Testing implementation
│   │   ├── repositories/
│   │   │   ├── onboarding.repository.ts         # Uses mock PCC
│   │   │   └── mock-pcc-patient-clinical-data.repository.ts
│   │   └── in-memory-persistence.module.ts     # Provides mock PCC
│   ├── pcc/                                     # PCC integration layer
│   │   ├── entities/pcc-patient-response.entity.ts
│   │   ├── mappers/pcc-patient-clinical-data.mapper.ts
│   │   ├── repositories/pcc-patient-clinical-data.repository.ts
│   │   └── pcc-integration.module.ts
│   └── onboarding-infrastructure.module.ts      # Dynamic selector
└── presenters/http/                             # Controllers & DTOs
```

### **Data Architecture (IMPLEMENTED)**

**PCC (PointClickCare) = Source of Truth:** Patient demographics, diagnoses, lab results (external API)
**Local Database = Source of Truth:** NIV workflow state, onboarding status, assignments, decisions

**Hybrid Data Strategy (Production Ready):**

1. **Local ORM Database:** Workflow state (`niv_onboardings`, `patients` cache)
2. **Reference Database:** Clinical qualification criteria (`diagnosis_code_qualifications`)
3. **PCC Integration:** Real-time clinical data via mTLS + OAuth authentication
   - Smart caching: Local cache + PCC API calls
   - Fallback mechanisms when PCC unavailable
   - Token management with automatic refresh

**PCC Integration Architecture:**

```typescript
// Production (ORM): Real PCC API calls
const patients = await pccRepository.findPatientsByFacility(facilityId);

// Testing (In-Memory): Mock PCC with realistic data
const mockPatients = await mockPccRepository.findPatientsByFacility(facilityId);

// Intelligent caching strategy
const patient =
  (await localCache.get(patientId)) || (await pccApi.fetch(patientId));
```

### **Business Logic Implementation**

**Clinical Qualifications Assessment:**

- **Domain Service:** `ClinicalQualificationService` contains business rules
- **Reference Data:** Client's CSV → database table (`diagnosis_code_qualifications`)
- **Assessment Logic:** Matches patient diagnosis codes against qualification criteria
- **Result:** `ClinicalQualifications` value object (COPD, ARF, NMD, TRD flags)

### **Testing Strategy (Enhanced with PCC Integration)**

**Domain Logic Testing:** Pure business logic, no external dependencies

```typescript
describe('ClinicalQualificationService', () => {
  it('should assess COPD qualification correctly', () => {
    const service = new ClinicalQualificationService();
    const diagnosisCodes = [new DiagnosisCode('J44.1', 'ICD-10-CM')];
    const criteria = [
      { icd10Code: 'J44.1', qualificationType: 'COPD', isQualifying: true },
    ];

    const result = service.assessQualifications(diagnosisCodes, criteria);

    expect(result.copd).toBe(true);
    expect(result.hasAnyQualification()).toBe(true);
  });
});
```

**Integration Testing:** Both persistence implementations with PCC integration

```typescript
// Test with ORM + Real PCC
const ormModule = OnboardingModule.withInfrastructure(
  OnboardingInfrastructureModule.use('orm') // Uses real PCC API calls
);

// Test with in-memory + Mock PCC (includes realistic patient data)
const memoryModule = OnboardingModule.withInfrastructure(
  OnboardingInfrastructureModule.use('in-memory') // Uses mock PCC with test data
);
```

**PCC Integration Testing:**

```typescript
// Mock PCC provides realistic test scenarios
const mockPatients = [
  { id: 'mock-1', diagnoses: ['J44.1'], qualifications: { copd: true } },
  { id: 'mock-2', diagnoses: ['G12.21'], qualifications: { nmd: true } },
  {
    id: 'mock-3',
    diagnoses: ['J96.01', 'G70.00'],
    qualifications: { arf: true, nmd: true },
  },
];

// Development/debugging endpoints (preserved from original test code)
GET / api / pcc - test / full; // Complete PCC integration test
GET / api / pcc - test / certs; // Certificate validation
GET / api / pcc - test / auth; // OAuth authentication test
GET / api / pcc - test / api; // API connectivity test
```

---

## **Future Development Enablement**

This prompt provides context for:

1. **✅ Extending existing onboarding use cases** while maintaining architectural consistency
2. **✅ Implementing full NIV workflow** (RT reviews, patient consent, device fitting, etc.)
3. **✅ Adding new bounded contexts** (tracking, analytics, etc.) with proper integration patterns
4. **✅ Understanding business domain** and clinical qualification rules
5. **✅ Following established patterns** from reference implementation
6. **✅ Maintaining DDD/Hexagonal architecture** principles throughout development

**Key Success Factors:** Always reference the existing code patterns, maintain rich domain models, follow the repository/factory/mapper patterns exactly, leverage the implemented PCC integration for external data needs, and implement comprehensive test coverage for both business logic and integration scenarios.

### **Key Domain Entities**

```typescript
// Rich domain entities with business behavior
NIVOnboarding {
  - updateStatus(newStatus: OnboardingStatus): void
  - updateQualifications(qualifications: ClinicalQualifications): void
  - isEligibleForNIV(): boolean
  - canAssignSpecialist(): boolean
  - requiresRTReview(): boolean
}

Patient {
  - hasDiagnosisCode(code: string): boolean
  - getCOPDDiagnosisCodes(): DiagnosisCode[]
  - getRespiratoryFailureDiagnosisCodes(): DiagnosisCode[]
  - getNeuromuscularDiagnosisCodes(): DiagnosisCode[]
}
```

## **Integration Points**

### **PCC (PointClickCare) Integration (IMPLEMENTED)**

**API Specification:** `docs/pcc-openapi.json` analyzed
**Working Implementation:** Extracted from `apps/backend/niv/src/app/pcc-test/` into production architecture

**Technical Implementation:**

```typescript
// mTLS Authentication (Production Ready)
const httpsAgent = new https.Agent({
  cert: fs.readFileSync(process.env.PCC_CERT_PATH),
  key: fs.readFileSync(process.env.PCC_KEY_PATH),
  rejectUnauthorized: true,
});

// OAuth with Token Caching
const token = await pccAuthService.getAccessToken(); // Handles refresh automatically

// API Calls with Retry Logic
const patients = await pccApiClient.get('/api/public/preview1/patients/123');
```

**Key Data Structures:**

```json
"medicalDiagnosis": [
  { "code": "J44.1", "codeLibrary": "ICD-10-CM", "onsetDate": "2024-11-25" }
],
"treatmentDiagnosis": [
  { "code": "R26.2", "codeLibrary": "ICD-10-CM", "onsetDate": "2024-11-25" }
]
```

**Environment Configuration:**

```bash
PCC_CLIENT_ID=fryGX6DhU4FAspJSEQxtSAiSaVT8IF5I
PCC_CLIENT_SECRET=ooWGA7Mm5rOAqt9X
PCC_CERT_PATH=~/dev/certs/dev.ancientfire.tech/fullchain.pem
PCC_KEY_PATH=~/dev/certs/dev.ancientfire.tech/privkey.pem
```

**Clinical Qualification Mapping (from client CSV):**

- **COPD:** 10 codes (J44.x series) - Chronic obstructive pulmonary disease
- **ARF (Acute Respiratory Failure):** 11 codes (J96.x series) - Respiratory failure conditions
- **NMD (Neuromuscular Disease):** 40+ codes (G-series neurological) - ALS, muscular dystrophy, etc.
- **TRD:** Not found in data (clinically appropriate - depression doesn't qualify for NIV)

**Database Schema (Reference Data):**

```sql
diagnosis_code_qualifications:
- icd10_code (J44.0, J96.01, G12.21, etc.)
- qualification_type (COPD, ARF, NMD)
- is_qualifying (boolean)
- description, notes
```

**Business Rules Implemented:**

1. **Qualification Assessment:** Patient diagnosis codes matched against reference criteria
2. **Status Transitions:** `OnboardingStatus` value object enforces valid workflow transitions
3. **Aggregate Invariants:** `NIVOnboarding` prevents invalid state changes
4. **Domain Validation:** Rich entities validate business rules (age checks, consent requirements)

### **Workflow Context (Future)**

**Reference:** `docs/workflow.d2` - Complete NIV onboarding workflow
**Status Flow:** NEW → WATCHLIST → PENDING → ACTIVE (with decision points)
**Stakeholders:** RT (Respiratory Therapist), Nurses, Administrators, DON, Unit Managers

### **Planned Bounded Contexts**

1. **🚧 Onboarding:** Patient workflow management (**PARTIALLY IMPLEMENTED**)

   - ✅ **Completed:** Clinical qualifications assessment (foundation)
   - ✅ **Completed:** PCC Integration (mTLS + OAuth + Smart Caching)
   - ⏳ **TODO:** Full NIV workflow implementation (see `docs/workflow.d2`)
     - NEW → WATCHLIST status transitions
     - RT (Respiratory Therapist) review and qualification decisions
     - Patient consent processing
     - Lab requirements and ordering
     - PENDING → ACTIVE device fitting
     - Specialist assignments and notifications
     - Status change workflows (REVIEWED, CHANGED states)
     - Audit trail and compliance tracking
   - ⏳ **TODO:** Commands for workflow actions (create-onboarding, assign-specialist, etc.)
   - ⏳ **TODO:** Integration with notification systems (RT, Nurses, DON, Unit Managers)
   - ⏳ **TODO:** PCC webhook handling for real-time patient data updates

2. **⏳ Tracking:** Device monitoring and compliance (**NOT STARTED**)
   - Daily device usage tracking
   - Patient compliance metrics
   - Usage calendar visualization
   - Progress monitoring and reporting
   - Clinical outcomes tracking

## **Extension Guidelines for Future Development**

### **Adding New Use Cases to Onboarding Context**

1. **Follow Existing Patterns:** Use the clinical qualifications implementation as a template
2. **Domain First:** Add rich business logic to existing entities (`NIVOnboarding`, `Patient`)
3. **Commands vs Queries:** Read operations go in `OnboardingService`, write operations get `Command` objects
4. **Repository Extensions:** Add new methods to `OnboardingRepository` port interface
5. **Value Objects:** Create immutable objects for complex business concepts
6. **Domain Events:** Add events for workflow state changes to enable loose coupling

### **Workflow Implementation Strategy**

**Reference:** `docs/workflow.d2` contains the complete state machine and business rules

**Suggested Implementation Order:**

1. **NEW → WATCHLIST transition:** Patient onboarding initiation
2. **RT Review process:** Complex qualification decision logic in domain service
3. **Status transitions:** Rich state machine behavior in `OnboardingStatus` value object
4. **Patient consent:** New value object and workflow logic
5. **Lab requirements:** Integration with PCC lab results
6. **Device fitting:** PENDING → ACTIVE transition with equipment assignment
7. **Notifications:** Domain events triggering stakeholder communications

### **Adding New Bounded Contexts**

**Example: Tracking Context**

```
apps/backend/niv/src/app/tracking/
├── application/
├── domain/
│   ├── device-usage.ts              # Aggregate root for daily usage
│   ├── compliance-metrics.ts        # Value object for compliance calculations
│   └── services/compliance-assessment.service.ts
├── infrastructure/
└── presenters/
```

**Integration Pattern:**

- **Shared Domain:** Use `apps/backend/niv/src/app/shared/` for cross-context concepts
- **Domain Events:** Onboarding publishes events, Tracking subscribes
- **Separate Repositories:** Each context owns its data
- **API Coordination:** Controllers can compose data from multiple contexts if needed

## **Critical Implementation Notes**

### **Current Implementation Scope**

The onboarding bounded context currently contains **ONLY the foundational architecture** and **ONE use case**. The domain models, services, and infrastructure are designed to support the full workflow but most business logic is **NOT YET IMPLEMENTED**.

**What's Currently Working:**

- ✅ Clinical qualification assessment (COPD, ARF, NMD, TRD)
- ✅ Patient and onboarding domain models (rich entities)
- ✅ Repository pattern with ORM/in-memory implementations
- ✅ Reference data management (diagnosis code qualifications)
- ✅ Basic API endpoint for patients with qualifications
- ✅ **PCC Integration (mTLS + OAuth)** - Real API calls to PointClickCare
- ✅ **Hybrid data strategy** - Local workflow state + PCC clinical data
- ✅ **Smart caching** - Local patient cache with PCC fallback
- ✅ **Testing support** - Mock PCC implementation for development

**What's Missing (Major Gaps):**

- ❌ Full workflow state transitions (NEW → WATCHLIST → PENDING → ACTIVE)
- ❌ RT review and decision-making processes
- ❌ Patient consent handling
- ❌ Lab ordering and results processing
- ❌ Device fitting and activation
- ❌ Specialist assignment algorithms
- ❌ Notification system integration
- ❌ Audit trail implementation
- ❌ PCC webhook handling for real-time updates
- ❌ Most domain events and business rules
