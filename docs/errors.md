# NIV Error Handling Strategy

## Core Decision: Exceptions vs Result Objects

After evaluating both approaches, we chose **domain exceptions with action classification** over Result<T, E> objects.

### Why Exceptions Won

**Better NestJS Integration:**

- Native exception filters for HTTP mapping
- No need to wrap every method return in Result<T, E>
- Cleaner method signatures
- Works naturally with existing stack

**Simpler for Monolith:**

- No verbose error checking at every call site
- Error bubbling happens automatically
- Less code than functional Result pattern

**Result Objects Would Have Required:**

```typescript
// Every method wrapped in Result
async getPatient(): Promise<Result<Patient, OnboardingError>>

// Manual error checking everywhere
const result = await getPatient();
if (result.isFailure) {
  return Result.failure(result.error);
}
const patient = result.value;
```

## Error Strategy: Infrastructure vs Business Logic

### Infrastructure Failures → Throw Domain Exceptions

**What counts as infrastructure failure:**

- PCC API unavailable/timeout
- Authentication failures
- Network connectivity issues
- Patient not found in external system

**Implementation:**

```typescript
// Adapter layer maps technical → domain errors
catch (error) {
  throw OnboardingError.pccUnavailable('patient_lookup', error);
}

// Service layer lets domain errors bubble up
const { patient, diagnoses } = await this.pccAdapter.getPatientWithDiagnoses(orgUuid, patientId);

// Controller maps domain errors → HTTP responses
catch (error) {
  throw this.mapDomainErrorToHttp(error, operation, context);
}
```

### Business Outcomes → Return Success Responses

**What counts as business outcome:**

- Patient not eligible for NIV
- No diagnoses found
- Missing optional clinical data

**Implementation:**

```typescript
// Normal success response, not an error
return {
  success: true,
  data: {
    patient: {...},
    diagnoses: [], // Empty is normal
    isNivEligible: false, // Not eligible is normal
    qualificationSummary: "Patient does not meet NIV criteria"
  }
};
```

## Domain Error Structure

**Error Classification:**

```typescript
type ErrorAction = 'stop' | 'retry' | 'user-input';
```

**Error with Context:**

```typescript
class OnboardingError extends Error {
  constructor(
    public readonly code: NivErrorCode,
    message: string,
    public readonly action: ErrorAction,
    context?: Record<string, unknown>
  );
}
```

**Action-Based HTTP Mapping:**

- `'stop'` → 400/404/422 (don't retry)
- `'retry'` → 503 (temporary failure)
- `'user-input'` → 422 (action needed)

## Key Architecture Decisions

1. **Adapter Layer**: Maps PCC HTTP errors → Domain errors, logs technical details
2. **Service Layer**: Bubbles domain errors up (doesn't catch them)
3. **Controller Layer**: Maps domain errors → HTTP responses
4. **Simple Context**: Preserve operation context for debugging

## What We Actually Tested

✅ **PCC conditions 404** → Empty diagnoses array (not error)  
✅ **Domain error response** → Structured JSON with action guidance  
✅ **Business outcome response** → Success with eligibility status

## What Still Needs Testing

- Auth failure scenarios
- Network timeout handling
- Frontend integration patterns
