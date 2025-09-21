# NIV Onboarding Architecture

## Overview

The NIV (Non-Invasive Ventilator) onboarding system implements **Hexagonal Architecture** with **Domain-Driven Design (DDD)** principles using a **functional programming style**. The system assesses patient clinical qualifications for NIV programs based on EHR data from PointClickCare.

## Architecture Principles

### 1. Hexagonal Architecture (Ports & Adapters)

- **Domain-centric design** - Business logic is isolated and framework-agnostic
- **Dependency inversion** - Domain defines contracts, infrastructure implements them
- **Primary ports** - Interfaces the domain exposes to external systems
- **Secondary ports** - Interfaces the domain needs from external systems
- **Perfect symmetry** - Primary and secondary sides follow identical patterns

### 2. Domain-Driven Design (DDD)

- **Ubiquitous language** - Healthcare terminology throughout (qualifications, EHR operations, clinical assessments)
- **Bounded context** - Onboarding workflow is clearly separated from other healthcare domains
- **Functional DDD** - Factory functions instead of classes (`createPatient`, `createQualifications`, `createOnboardingOperations`)

### 3. Error Handling Strategy

- **Infrastructure failures** → Throw domain exceptions with action classification
- **Business outcomes** → Return success responses (not eligible is not an error)
- **Action-based mapping** - `'stop'`, `'retry'`, `'user-input'` guide HTTP responses

## File Structure & Responsibilities

```
apps/backend/niv/src/app/
├── ehr/                          # EHR Integration (Technical Layer)
│   └── pcc/                      # PointClickCare HTTP client
│       ├── pcc-client.ts         # mTLS client with token caching
│       ├── types.ts              # PCC API response types
│       └── index.ts              # Clean exports
└── onboarding/                   # Onboarding Bounded Context
    ├── onboarding.controller.ts  # HTTP Adapter (NestJS wrapper)
    ├── onboarding.service.ts     # NestJS Adapter (logging & DI)
    ├── onboarding.module.ts      # DI Configuration
    ├── onboarding-operations.ts  # Primary Ports (Use Case Interfaces)
    ├── onboarding.ts             # Primary Adapter (Framework-agnostic)
    ├── qualifications.ts         # Domain Service (Business Logic)
    ├── ehr-operations.ts         # Secondary Ports (Repository Interfaces)
    ├── ehr.ts                    # Secondary Adapter (EHR Implementation)
    ├── patient.ts                # Entity
    ├── diagnosis.ts              # Value Object + Clinical Logic
    └── errors.ts                 # Domain Errors + Action Classification
```

## Architecture Layers

### 1. Primary Adapters (Inbound)

**HTTP Controller** (`onboarding.controller.ts`)

- **Role**: HTTP Infrastructure Adapter
- **Responsibilities**:
  - HTTP request/response handling
  - Input validation and sanitization
  - Domain error → HTTP status mapping
  - Healthcare audit logging
- **Dependencies**: → `onboarding.service.ts`

**NestJS Service** (`onboarding.service.ts`)

- **Role**: NestJS Framework Adapter
- **Responsibilities**:
  - NestJS dependency injection and lifecycle
  - Framework-specific logging and context
  - Thin wrapper around primary adapter
- **Dependencies**: → `onboarding.ts` (primary adapter)

**Primary Adapter** (`onboarding.ts`)

- **Role**: Primary Adapter (Hexagonal Architecture) / Application Service (DDD)
- **Responsibilities**:
  - Framework-agnostic business operation coordination
  - Implements primary port contracts
  - Delegates to domain services
  - Unit testable without framework dependencies
- **Dependencies**: → `qualifications.ts` (domain)

**Primary Ports** (`onboarding-operations.ts`)

- **Role**: Primary Ports (Hexagonal Architecture) / Use Case Interfaces (DDD)
- **Responsibilities**:
  - Define contracts for operations the domain exposes
  - Business-friendly operation signatures
  - Framework-agnostic interfaces
- **Consumed by**: HTTP adapters and other external systems

### 2. Domain Layer (Core)

**Domain Service** (`qualifications.ts`)

- **Role**: Domain Service (DDD) / Application Core (Hexagonal)
- **Responsibilities**:
  - Core NIV qualification assessment business logic
  - Clinical eligibility determination
  - Patient qualification workflows
  - Framework-agnostic and unit testable
- **Dependencies**: → `ehr-operations.ts` (contracts)

**Entities & Value Objects**

- **Patient** (`patient.ts`): Entity with identity and lifecycle
- **Diagnosis** (`diagnosis.ts`): Value Object with clinical qualification logic
- **OnboardingError** (`errors.ts`): Domain exceptions with action classification

### 3. Secondary Ports (Outbound Contracts)

**EHR Operations** (`ehr-operations.ts`)

- **Role**: Secondary Ports (Hexagonal Architecture) / Repository Interfaces (DDD)
- **Responsibilities**:
  - Define contracts for EHR data access
  - Business-friendly operation names
  - Framework-agnostic interfaces
- **Consumed by**: Domain service

### 4. Secondary Adapters (Outbound Implementation)

**EHR Adapter** (`ehr.ts`)

- **Role**: Secondary Adapter (Hexagonal Architecture) / Repository Implementation (DDD)
- **Responsibilities**:
  - Implements EHR operations using PointClickCare
  - Technical error → Domain error mapping
  - Data transformation (PCC JSON → Domain objects)
- **Dependencies**: → `../ehr/pcc` (HTTP client)

**PCC Client** (`ehr/pcc/`)

- **Role**: Technical Infrastructure
- **Responsibilities**:
  - mTLS authentication with PointClickCare
  - Token caching and refresh
  - HTTP request/response handling
  - Rate limiting and retries

## Hexagonal Symmetry

The architecture achieves **perfect symmetry** between primary and secondary sides:

**Secondary Side (Outbound):**

```
Domain → ehr-operations.ts → ehr.ts → pcc/
(Core)   (Secondary Ports)  (Adapter) (Infrastructure)
```

**Primary Side (Inbound):**

```
controller.ts → service.ts → onboarding.ts → onboarding-operations.ts ← Domain
(Infrastructure) (NestJS)   (Adapter)      (Primary Ports)         (Core)
```

## Functional DDD Pattern

The system follows a **functional DDD approach** throughout:

```typescript
// Factory functions for domain objects
const patient = createPatient(id, firstName, lastName, birthDate, facilityId);
const diagnosis = createDiagnosis(
  id,
  icd10Code,
  description,
  onsetDate,
  isPrimary
);

// Factory functions for services
const ehrAdapter = createEhrAdapter();
const qualifications = createQualifications(ehrOps, mockEhrOps);
const onboardingOps = createOnboardingOperations();

// Pure functions for business logic
const clinicalQualifications = getClinicalQualifications(diagnoses);
const isEligible = Object.values(clinicalQualifications).some(Boolean);
```

## Error Handling Architecture

### Error Classification Strategy

**Infrastructure Failures** → Domain Exceptions

- PCC API unavailable → `OnboardingError.pccUnavailable()` (action: `'retry'`)
- Authentication failure → `OnboardingError.pccUnauthorized()` (action: `'stop'`)
- Patient not found → `OnboardingError.patientNotFound()` (action: `'stop'`)

**Business Outcomes** → Success Responses

- No diagnoses found → `diagnoses: []` (not an error)
- Not NIV eligible → `isNivEligible: false` (not an error)
- Missing optional data → Success with partial data

### Error Flow

```
PCC HTTP Error → EHR Adapter → Domain Error → Primary Adapter → NestJS Service → Controller → HTTP Response
      ↓              ↓              ↓              ↓              ↓              ↓              ↓
   504 timeout → pccUnavailable → PCC_UNAVAILABLE → (bubbles) → (bubbles) → 503 + retry → Client
   404 patient → patientNotFound → PATIENT_NOT_FOUND → (bubbles) → (bubbles) → 404 + stop → Client
   404 diagnosis → return [] → success → success → success → 200 + data → Client
```

### Action-Based HTTP Mapping

- **`'stop'`** → 400/404/422 (don't retry, permanent failure)
- **`'retry'`** → 503 (temporary failure, retry with backoff)
- **`'user-input'`** → 422 (requires user action to resolve)

## Dependency Flow

The architecture achieves proper **dependency inversion**:

```
HTTP Request
    ↓
HTTP Controller (Infrastructure)
    ↓
NestJS Service (Framework Adapter)
    ↓
Primary Adapter (Framework-agnostic) ←── implements ──→ Primary Ports (Contracts)
    ↓
Domain Service (Business Logic) ←── depends on ──→ Secondary Ports (Contracts)
                                                            ↑
                                                    implemented by
                                                            ↓
                                                   Secondary Adapter (EHR)
                                                            ↓
                                                   Infrastructure (PCC Client)
```

**Key Principle**: Domain depends on abstractions, never on concrete implementations.

## Testing Strategy

### Framework-Agnostic Testing

- **Primary Adapter** (`onboarding.ts`): Pure unit tests without NestJS
- **Domain Service** (`qualifications.ts`): Pure unit tests without infrastructure
- **Business Logic**: Test clinical qualifications without framework dependencies
- **Error Handling**: Test domain error classification independently

### Integration Testing

- **Controller**: Test HTTP → Domain → HTTP flow
- **EHR Adapter**: Test PCC integration with real/mock APIs
- **End-to-End**: Test complete patient qualification workflows

### Mock Strategy

- **Mock EHR Adapter**: `createMockEhrAdapter()` for development
- **Domain Testing**: Inject mock dependencies via factory pattern
- **Integration**: Mock PCC HTTP client for predictable responses

## Benefits Achieved

### 1. Framework Independence

- **Primary adapter** can be unit tested without NestJS setup
- **Business logic** is portable to other frameworks (Express, Fastify, etc.)
- **EHR integration** can be swapped (Epic, Cerner) without domain changes

### 2. Healthcare Domain Focus

- **Ubiquitous language** throughout (qualifications, assessments, clinical data)
- **Business-friendly naming** (no technical "ports/adapters" in domain)
- **Healthcare audit trails** preserved with proper logging

### 3. Robust Error Handling

- **Infrastructure vs business** error distinction
- **Action guidance** for clients (retry/stop/user-input)
- **Structured error responses** with context for debugging

### 4. Maintainability

- **Perfect symmetry** between primary and secondary sides
- **Clear separation** of concerns across layers
- **Dependency inversion** enables easy mocking and testing
- **Functional approach** reduces complexity and side effects

## Future Extensibility

### Adding New EHR Systems

1. Implement `ehr-operations.ts` interfaces for new EHR
2. Create new adapter (e.g., `epic.ts`)
3. Update factory to choose adapter based on configuration
4. No domain logic changes required

### Adding New Clinical Rules

1. Add ICD-10 codes to `diagnosis.ts` qualification functions
2. Update business logic in `qualifications.ts`
3. No infrastructure or adapter changes required

### Adding New Workflows

1. Create new domain services following same pattern
2. Reuse existing EHR operations and adapters
3. Add new primary ports and adapters for different interfaces

This architecture provides a solid foundation for healthcare software that prioritizes patient safety, regulatory compliance, and maintainable business logic.
