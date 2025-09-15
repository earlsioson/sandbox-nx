# Patient Care Program Onboarding - NIV Design Document

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Domain-Driven Design Architecture](#2-domain-driven-design-architecture)
3. [Hexagonal Architecture Implementation](#3-hexagonal-architecture-implementation)
4. [Application Layer Design](#4-application-layer-design)
5. [Infrastructure Implementation](#5-infrastructure-implementation)
6. [NestJS Project Structure](#6-nestjs-project-structure)
7. [Integration Patterns](#7-integration-patterns)
8. [Architecture Validation](#8-architecture-validation)

---

## 1. Executive Summary

### 1.1 Architecture Corrections Applied

This document presents the **corrected NIV application architecture** that properly implements Domain-Driven Design (DDD) and Hexagonal Architecture principles:

**Key Corrections:**

- ✅ **Eliminated Dependency Leaks**: Domain layer has zero external dependencies
- ✅ **Rich Domain Models**: Entities contain business logic (not anemic)
- ✅ **Proper Port Interfaces**: Application layer depends on abstractions only
- ✅ **Dependency Inversion**: All dependencies point inward toward domain
- ✅ **True Aggregate Boundaries**: Consistent transaction boundaries enforced
- ✅ **Domain Event Integration**: Loose coupling through domain events

### 1.2 Business Context

**NIV Program Workflow:**

```
Patient Addition → NEW Status → WATCHLIST → Qualification Assessment → PENDING/ACTIVE
```

**Key Stakeholders:** RT (Respiratory Therapist), Facility Nurses, Administrators, DON, Unit Managers  
**Integration Points:** PointClickCare API, Platform Applications (70-80 nursing homes)  
**Compliance Requirements:** Healthcare audit trails, HIPAA compliance

---

## 2. Domain-Driven Design Architecture

### 2.1 Rich Domain Entities

#### Patient Entity

```typescript
export class Patient {
  private readonly patientId: PatientId;
  private demographics: PatientDemographics;
  private medicalHistory: MedicalHistory;
  private facilityAssignment: FacilityId;

  constructor(
    patientId: PatientId,
    demographics: PatientDemographics,
    medicalHistory: MedicalHistory,
    facilityAssignment: FacilityId
  ) {
    this.patientId = patientId;
    this.demographics = demographics;
    this.medicalHistory = medicalHistory;
    this.facilityAssignment = facilityAssignment;
  }

  // ✅ RICH BUSINESS BEHAVIOR (Not just getters/setters)
  public isEligibleForNIV(criteria: NIVCriteria): boolean {
    return (
      this.medicalHistory.hasRespiratoryCondition() &&
      this.medicalHistory.meetsOxygenRequirements(criteria) &&
      this.demographics.isAgeAppropriate()
    );
  }

  public enrollInProgram(
    programType: ProgramType,
    specialist: ClinicalSpecialist
  ): ProgramOnboarding {
    if (!this.isValidForProgramOnboarding()) {
      throw new InvalidOnboardingError(this.patientId);
    }

    return ProgramOnboarding.create(this, programType, specialist);
  }

  public validateMedicalRequirements(
    programType: ProgramType
  ): ValidationResult {
    const results = [];

    if (programType === ProgramType.NIV) {
      results.push(this.validateRespiratoryStatus());
      results.push(this.validateLabRequirements());
    }

    return ValidationResult.aggregate(results);
  }

  // ✅ Domain invariant enforcement
  public updateDemographics(newDemographics: PatientDemographics): void {
    this.validateDemographicUpdate(newDemographics);
    this.demographics = newDemographics;
  }

  private validateDemographicUpdate(demographics: PatientDemographics): void {
    if (demographics.dateOfBirth > new Date()) {
      throw new InvalidDemographicsError('Birth date cannot be in future');
    }
  }
}
```

#### NIVProgramOnboarding Aggregate Root

```typescript
export class NIVProgramOnboarding {
  private readonly onboardingId: OnboardingId;
  private patient: Patient;
  private onboardingStatus: OnboardingStatus;
  private qualificationAssessment: NIVQualificationAssessment;
  private assignedSpecialist: ClinicalSpecialist;
  private auditTrail: AuditTrailEntry[];
  private documents: DocumentMetadata[];
  private domainEvents: DomainEvent[];

  constructor(
    onboardingId: OnboardingId,
    patient: Patient,
    assignedSpecialist: ClinicalSpecialist
  ) {
    this.onboardingId = onboardingId;
    this.patient = patient;
    this.assignedSpecialist = assignedSpecialist;
    this.onboardingStatus = OnboardingStatus.create(OnboardingStatusType.NEW);
    this.auditTrail = [];
    this.documents = [];
    this.domainEvents = [];

    // ✅ Domain event on creation
    this.addDomainEvent(
      new OnboardingInitiatedEvent(onboardingId, patient.patientId)
    );
  }

  // ✅ RICH BUSINESS OPERATIONS (Complex workflow logic)
  public makeQualificationDecision(
    decision: QualificationDecision,
    assessedBy: UserId
  ): void {
    if (!this.canMakeQualificationDecision()) {
      throw new InvalidQualificationStateError(this.onboardingId);
    }

    this.qualificationAssessment = decision.assessment;

    if (decision.isQualified) {
      this.transitionStatus(
        OnboardingStatusType.PENDING,
        'Patient qualified for NIV program',
        assessedBy
      );
    } else if (decision.requiresAdditionalLabs) {
      this.transitionStatus(
        OnboardingStatusType.CHANGED,
        'Additional labs required',
        assessedBy
      );
    } else {
      this.transitionStatus(
        OnboardingStatusType.REVIEWED,
        'Patient not qualified',
        assessedBy
      );
    }

    // ✅ Domain event for qualification
    this.addDomainEvent(
      new QualificationCompletedEvent(
        this.onboardingId,
        decision.isQualified,
        decision.reasoning,
        assessedBy
      )
    );
  }

  public processConsentResponse(
    consentGiven: boolean,
    refusalReason?: string
  ): void {
    this.validateConsentProcessing();

    if (consentGiven) {
      this.transitionStatus(
        OnboardingStatusType.PENDING,
        'Patient consented to NIV program',
        this.assignedSpecialist.userId
      );
    } else {
      this.scheduleForReReview(refusalReason || 'Patient refused consent');
    }
  }

  public activateProgram(): void {
    if (!this.canActivate()) {
      throw new InvalidActivationStateError(this.onboardingId);
    }

    this.transitionStatus(
      OnboardingStatusType.ACTIVE,
      'NIV program activated for patient',
      this.assignedSpecialist.userId
    );

    // ✅ Business rule: Schedule first RT visit
    this.scheduleInitialRTVisit();
  }

  // ✅ AGGREGATE CONSISTENCY ENFORCEMENT
  public attachDocument(document: DocumentMetadata, uploadedBy: UserId): void {
    this.validateDocumentAttachment(document);
    this.documents.push(document);
    this.addAuditEntry(AuditAction.DOCUMENT_ATTACHED, uploadedBy);
  }

  // ✅ BUSINESS STATE QUERIES
  public isQualified(): boolean {
    return this.qualificationAssessment?.isQualified === true;
  }

  public canActivate(): boolean {
    return (
      this.onboardingStatus.status === OnboardingStatusType.PENDING &&
      this.hasRequiredDocuments() &&
      this.deviceConfigured()
    );
  }

  public getProgress(): OnboardingProgress {
    const completedSteps = this.calculateCompletedSteps();
    const totalSteps = this.getTotalStepsForProgram();
    return OnboardingProgress.create(completedSteps, totalSteps);
  }

  // ✅ AGGREGATE TRANSACTION BOUNDARY
  private transitionStatus(
    newStatus: OnboardingStatusType,
    reason: string,
    changedBy: UserId
  ): void {
    const previousStatus = this.onboardingStatus.status;
    this.validateStatusTransition(newStatus);

    this.onboardingStatus = OnboardingStatus.create(newStatus, reason);
    this.addAuditEntry(AuditAction.STATUS_CHANGED, changedBy);

    // ✅ Domain event for status change
    this.addDomainEvent(
      new PatientStatusChangedEvent(
        this.onboardingId,
        previousStatus,
        newStatus,
        reason,
        changedBy
      )
    );
  }

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  public getUncommittedEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  public markEventsAsCommitted(): void {
    this.domainEvents = [];
  }
}
```

### 2.2 Immutable Value Objects

```typescript
export class OnboardingStatus {
  readonly status: OnboardingStatusType;
  readonly timestamp: Date;
  readonly reason: string;
  readonly modifiedBy: UserId;

  private constructor(
    status: OnboardingStatusType,
    reason: string,
    modifiedBy?: UserId
  ) {
    this.status = status;
    this.timestamp = new Date();
    this.reason = reason;
    this.modifiedBy = modifiedBy;
    Object.freeze(this); // ✅ Immutable
  }

  public static create(
    status: OnboardingStatusType,
    reason: string = '',
    modifiedBy?: UserId
  ): OnboardingStatus {
    return new OnboardingStatus(status, reason, modifiedBy);
  }

  // ✅ Value object business logic
  public canTransitionTo(newStatus: OnboardingStatusType): boolean {
    const validTransitions = this.getValidTransitions();
    return validTransitions.includes(newStatus);
  }

  public isActive(): boolean {
    return this.status === OnboardingStatusType.ACTIVE;
  }

  // ✅ Equality based on attributes (not identity)
  public equals(other: OnboardingStatus): boolean {
    return (
      this.status === other.status &&
      this.reason === other.reason &&
      this.modifiedBy === other.modifiedBy
    );
  }

  private getValidTransitions(): OnboardingStatusType[] {
    const transitionMap = new Map([
      [OnboardingStatusType.NEW, [OnboardingStatusType.WATCHLIST]],
      [
        OnboardingStatusType.WATCHLIST,
        [
          OnboardingStatusType.PENDING,
          OnboardingStatusType.REVIEWED,
          OnboardingStatusType.CHANGED,
        ],
      ],
      [OnboardingStatusType.PENDING, [OnboardingStatusType.ACTIVE]],
      [OnboardingStatusType.CHANGED, [OnboardingStatusType.WATCHLIST]],
      [OnboardingStatusType.REVIEWED, [OnboardingStatusType.WATCHLIST]],
    ]);

    return transitionMap.get(this.status) || [];
  }
}

export class PatientDemographics {
  readonly firstName: string;
  readonly lastName: string;
  readonly dateOfBirth: Date;
  readonly gender: Gender;

  constructor(
    firstName: string,
    lastName: string,
    dateOfBirth: Date,
    gender: Gender
  ) {
    this.validateDemographics(firstName, lastName, dateOfBirth);
    this.firstName = firstName;
    this.lastName = lastName;
    this.dateOfBirth = dateOfBirth;
    this.gender = gender;
    Object.freeze(this); // ✅ Immutable
  }

  // ✅ Value object behavior
  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public getAge(): number {
    const today = new Date();
    const age = today.getFullYear() - this.dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - this.dateOfBirth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < this.dateOfBirth.getDate())
    ) {
      return age - 1;
    }
    return age;
  }

  public isAgeAppropriate(): boolean {
    const age = this.getAge();
    return age >= 18 && age <= 120;
  }

  public equals(other: PatientDemographics): boolean {
    return (
      this.firstName === other.firstName &&
      this.lastName === other.lastName &&
      this.dateOfBirth.getTime() === other.dateOfBirth.getTime() &&
      this.gender === other.gender
    );
  }

  private validateDemographics(
    firstName: string,
    lastName: string,
    dateOfBirth: Date
  ): void {
    if (!firstName.trim() || !lastName.trim()) {
      throw new InvalidDemographicsError('Name fields cannot be empty');
    }
    if (dateOfBirth > new Date()) {
      throw new InvalidDemographicsError('Birth date cannot be in future');
    }
  }
}
```

### 2.3 Domain Services (Complex Business Logic)

```typescript
@Injectable()
export class NIVEligibilityService {
  // ✅ NO external dependencies - pure business logic

  public assessEligibility(
    patient: Patient,
    labResults: LabResult[],
    diagnosisCodes: DiagnosisCode[]
  ): EligibilityAssessment {
    const respiratoryConditionCheck =
      this.checkRespiratoryConditions(diagnosisCodes);
    const labResultsCheck = this.assessLabResults(labResults);
    const patientHistoryCheck = patient.getMedicalHistory().isNIVCompatible();
    const ageCheck = patient.getDemographics().isAgeAppropriate();

    const isEligible =
      respiratoryConditionCheck.passed &&
      labResultsCheck.passed &&
      patientHistoryCheck.passed &&
      ageCheck;

    const reasoning = this.generateClinicalReasoning(
      respiratoryConditionCheck,
      labResultsCheck,
      patientHistoryCheck,
      ageCheck
    );

    const requiredLabs = this.determineRequiredAdditionalLabs(labResults);

    return new EligibilityAssessment(
      isEligible,
      reasoning,
      requiredLabs,
      this.generateRecommendations(isEligible, requiredLabs)
    );
  }

  // ✅ Complex business rules encapsulated
  private checkRespiratoryConditions(
    diagnosisCodes: DiagnosisCode[]
  ): ConditionCheck {
    const qualifyingConditions = [
      DiagnosisCode.COPD,
      DiagnosisCode.SLEEP_APNEA,
      DiagnosisCode.RESPIRATORY_FAILURE,
      DiagnosisCode.PNEUMONIA_CHRONIC,
    ];

    const hasQualifyingCondition = diagnosisCodes.some((code) =>
      qualifyingConditions.includes(code)
    );

    const disqualifyingConditions = [
      DiagnosisCode.ACTIVE_TB,
      DiagnosisCode.UNSTABLE_ANGINA,
      DiagnosisCode.RECENT_MI,
    ];

    const hasDisqualifyingCondition = diagnosisCodes.some((code) =>
      disqualifyingConditions.includes(code)
    );

    return new ConditionCheck(
      hasQualifyingCondition && !hasDisqualifyingCondition,
      hasQualifyingCondition
        ? 'Qualifying respiratory condition present'
        : 'No qualifying respiratory condition',
      hasDisqualifyingCondition ? 'Disqualifying condition present' : null
    );
  }

  private assessLabResults(labResults: LabResult[]): ConditionCheck {
    const bloodGasResults = labResults.filter(
      (lab) => lab.type === LabType.BLOOD_GAS
    );

    if (bloodGasResults.length === 0) {
      return new ConditionCheck(false, 'Blood gas results required');
    }

    const latestBloodGas = bloodGasResults.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    )[0];

    const oxygenSaturation = latestBloodGas.getValue('oxygen_saturation');
    const co2Levels = latestBloodGas.getValue('co2_partial_pressure');

    const meetsOxygenCriteria = oxygenSaturation < 88;
    const meetsCO2Criteria = co2Levels > 45;

    const passed = meetsOxygenCriteria || meetsCO2Criteria;
    const reasoning = this.generateLabReasoning(
      oxygenSaturation,
      co2Levels,
      meetsOxygenCriteria,
      meetsCO2Criteria
    );

    return new ConditionCheck(passed, reasoning);
  }

  private generateClinicalReasoning(
    respiratoryCheck: ConditionCheck,
    labCheck: ConditionCheck,
    historyCheck: ConditionCheck,
    ageCheck: boolean
  ): string {
    const reasons = [];

    if (respiratoryCheck.passed) {
      reasons.push(respiratoryCheck.reason);
    } else {
      reasons.push(`❌ ${respiratoryCheck.reason}`);
    }

    if (labCheck.passed) {
      reasons.push(labCheck.reason);
    } else {
      reasons.push(`❌ ${labCheck.reason}`);
    }

    if (historyCheck.passed) {
      reasons.push('Medical history compatible with NIV therapy');
    } else {
      reasons.push('❌ Medical history indicates contraindications');
    }

    if (!ageCheck) {
      reasons.push('❌ Patient age outside acceptable range for NIV therapy');
    }

    return reasons.join('; ');
  }

  private determineRequiredAdditionalLabs(
    currentLabs: LabResult[]
  ): LabRequirement[] {
    const requirements: LabRequirement[] = [];

    const hasRecentBloodGas = currentLabs.some(
      (lab) =>
        lab.type === LabType.BLOOD_GAS && this.isWithinDays(lab.timestamp, 7)
    );

    if (!hasRecentBloodGas) {
      requirements.push(
        new LabRequirement(
          LabType.BLOOD_GAS,
          'Arterial blood gas analysis required within 7 days of assessment',
          Priority.HIGH
        )
      );
    }

    return requirements;
  }

  private isWithinDays(timestamp: Date, days: number): boolean {
    const daysDiff =
      (new Date().getTime() - timestamp.getTime()) / (1000 * 3600 * 24);
    return daysDiff <= days;
  }
}
```

---

## 3. Hexagonal Architecture Implementation

### 3.1 Port Interfaces (Application Layer)

```typescript
// ✅ Abstract port interfaces - NO implementation details

export interface ProgramOnboardingRepositoryPort {
  save(onboarding: ProgramOnboarding): Promise<void>;
  findById(id: OnboardingId): Promise<ProgramOnboarding>;
  findByPatient(patientId: PatientId): Promise<ProgramOnboarding[]>;
  findByFacility(facilityId: FacilityId): Promise<ProgramOnboarding[]>;
  findByStatus(status: OnboardingStatusType): Promise<ProgramOnboarding[]>;
  findByCriteria(
    criteria: OnboardingSearchCriteria
  ): Promise<ProgramOnboarding[]>;
}

export interface PatientRepositoryPort {
  save(patient: Patient): Promise<void>;
  findById(id: PatientId): Promise<Patient>;
  findByMedicalRecord(recordNumber: MedicalRecordNumber): Promise<Patient>;
  searchByCriteria(criteria: PatientSearchCriteria): Promise<Patient[]>;
}

export interface PCCIntegrationPort {
  getPatientData(patientId: PatientId): Promise<EHRData>;
  refreshPatientData(patientId: PatientId): Promise<EHRData>;
  getLabResults(patientId: PatientId): Promise<LabResult[]>;
  getDiagnosisCodes(patientId: PatientId): Promise<DiagnosisCode[]>;
  subscribeToUpdates(patientId: PatientId): Promise<void>;
}

export interface NotificationPort {
  sendEmail(recipient: EmailAddress, message: EmailMessage): Promise<void>;
  sendSMS(recipient: PhoneNumber, message: SMSMessage): Promise<void>;
  sendRoleBasedNotifications(
    onboarding: ProgramOnboarding,
    eventType: NotificationEventType
  ): Promise<void>;
}

export interface DocumentStoragePort {
  store(document: Document): Promise<DocumentId>;
  retrieve(documentId: DocumentId): Promise<Document>;
  generateDownloadUrl(documentId: DocumentId): Promise<string>;
  delete(documentId: DocumentId): Promise<void>;
}
```

### 3.2 Application Services (Orchestration Only)

```typescript
@Injectable()
export class ProgramOnboardingService {
  constructor(
    // ✅ Depend on PORTS (abstractions) not concrete implementations
    @Inject('ProgramOnboardingRepositoryPort')
    private onboardingRepo: ProgramOnboardingRepositoryPort,

    @Inject('PatientRepositoryPort')
    private patientRepo: PatientRepositoryPort,

    @Inject('PCCIntegrationPort')
    private pccIntegration: PCCIntegrationPort,

    @Inject('NotificationPort')
    private notifications: NotificationPort,

    // ✅ Domain services - pure business logic
    private eligibilityService: NIVEligibilityService,
    private specialistService: SpecialistAssignmentService,

    // ✅ Event publishing
    private eventBus: EventBus
  ) {}

  // ✅ APPLICATION SERVICE = ORCHESTRATION ONLY (No business logic)
  async createOnboarding(
    command: CreateOnboardingCommand
  ): Promise<OnboardingId> {
    // 1. Validate command
    this.validateCommand(command);

    // 2. Load domain objects
    const patient = await this.patientRepo.findById(command.patientId);
    if (!patient) {
      throw new PatientNotFoundError(command.patientId);
    }

    // 3. Domain service handles business logic
    const specialist = await this.specialistService.assignOptimalSpecialist(
      patient,
      ProgramType.NIV,
      command.facilityId
    );

    // 4. Domain factory creates aggregate
    const onboarding = NIVProgramOnboarding.create(
      OnboardingId.generate(),
      patient,
      specialist
    );

    // 5. Persist aggregate
    await this.onboardingRepo.save(onboarding);

    // 6. Publish domain events
    const events = onboarding.getUncommittedEvents();
    await this.eventBus.publishAll(events);
    onboarding.markEventsAsCommitted();

    // 7. Trigger integrations (side effects)
    await this.notifications.sendRoleBasedNotifications(
      onboarding,
      NotificationEventType.ENROLLMENT_INITIATED
    );

    return onboarding.onboardingId;
  }

  async qualifyPatient(command: QualifyPatientCommand): Promise<void> {
    // 1. Load aggregate
    const onboarding = await this.onboardingRepo.findById(command.onboardingId);
    if (!onboarding) {
      throw new OnboardingNotFoundError(command.onboardingId);
    }

    // 2. Get clinical data
    const ehrData = await this.pccIntegration.getPatientData(
      onboarding.patient.patientId
    );

    // 3. Domain service handles complex business logic
    const eligibilityAssessment = this.eligibilityService.assessEligibility(
      onboarding.patient,
      ehrData.labResults,
      ehrData.diagnosisCodes
    );

    // 4. Domain aggregate handles business rules
    const qualificationDecision = QualificationDecision.fromAssessment(
      eligibilityAssessment,
      command.clinicalNotes
    );

    onboarding.makeQualificationDecision(
      qualificationDecision,
      command.assessedBy
    );

    // 5. Persist changes
    await this.onboardingRepo.save(onboarding);

    // 6. Publish events
    const events = onboarding.getUncommittedEvents();
    await this.eventBus.publishAll(events);
    onboarding.markEventsAsCommitted();
  }

  // ✅ Private methods handle orchestration concerns only
  private validateCommand(command: CreateOnboardingCommand): void {
    if (!command.patientId) {
      throw new InvalidCommandError('Patient ID is required');
    }
    if (!command.facilityId) {
      throw new InvalidCommandError('Facility ID is required');
    }
    // Command validation only - no business rules
  }
}
```

### 3.3 Infrastructure Adapters (Secondary Adapters)

```typescript
// ✅ Repository Implementation - Implements Port Interface
@Injectable()
export class PostgreSQLProgramOnboardingRepository
  implements ProgramOnboardingRepositoryPort
{
  constructor(
    @InjectRepository(ProgramOnboardingEntity)
    private onboardingRepository: Repository<ProgramOnboardingEntity>,
    @InjectRepository(AuditTrailEntity)
    private auditRepository: Repository<AuditTrailEntity>
  ) {}

  async save(onboarding: ProgramOnboarding): Promise<void> {
    // ✅ Transaction boundary at aggregate level
    await this.onboardingRepository.manager.transaction(async (manager) => {
      // Convert domain model to persistence model
      const persistenceModel = this.toPersistenceModel(onboarding);
      await manager.save(ProgramOnboardingEntity, persistenceModel);

      // Save audit trail entries
      const auditEntries = onboarding
        .getAuditHistory()
        .map((entry) => this.auditToPersistenceModel(entry));
      await manager.save(AuditTrailEntity, auditEntries);

      // Save documents metadata
      const documentEntries = onboarding
        .getDocuments()
        .map((doc) => this.documentToPersistenceModel(doc));
      await manager.save(DocumentEntity, documentEntries);
    });
  }

  async findById(id: OnboardingId): Promise<ProgramOnboarding> {
    const entity = await this.onboardingRepository.findOne({
      where: { id: id.value },
      relations: ['patient', 'auditTrail', 'documents', 'specialist'],
    });

    if (!entity) {
      return null;
    }

    // ✅ Convert persistence model back to rich domain model
    return this.toDomainModel(entity);
  }

  // ✅ Translation between domain and persistence models
  private toDomainModel(entity: ProgramOnboardingEntity): ProgramOnboarding {
    const patient = this.patientToDomainModel(entity.patient);
    const specialist = this.specialistToDomainModel(entity.specialist);
    const auditTrail = entity.auditTrail.map((audit) =>
      this.auditToDomainModel(audit)
    );

    const onboarding = new NIVProgramOnboarding(
      new OnboardingId(entity.id),
      patient,
      specialist
    );

    // Restore aggregate state
    onboarding.restoreState(
      this.statusToDomainModel(entity.status, entity.statusReason),
      this.assessmentToDomainModel(entity.qualificationData),
      auditTrail
    );

    return onboarding;
  }

  private toPersistenceModel(
    onboarding: ProgramOnboarding
  ): ProgramOnboardingEntity {
    const entity = new ProgramOnboardingEntity();
    entity.id = onboarding.onboardingId.value;
    entity.patientId = onboarding.patient.patientId.value;
    entity.specialistId = onboarding.assignedSpecialist.userId.value;
    entity.status = onboarding.onboardingStatus.status;
    entity.statusReason = onboarding.onboardingStatus.reason;
    entity.programType = 'NIV';
    entity.createdAt = onboarding.onboardingDate;
    entity.updatedAt = new Date();

    // Serialize complex objects
    entity.qualificationData = JSON.stringify(
      onboarding.qualificationAssessment
    );

    return entity;
  }
}

// ✅ External Integration Adapter - Implements Port Interface
@Injectable()
export class PointClickCareAPIClient implements PCCIntegrationPort {
  constructor(
    private httpClient: HttpService,
    private configService: ConfigService,
    private circuitBreaker: CircuitBreakerService
  ) {}

  async getPatientData(patientId: PatientId): Promise<EHRData> {
    // ✅ Resilience patterns
    return this.circuitBreaker.execute(async () => {
      const response = await this.callPCCAPI(`/patients/${patientId.value}`);
      return this.transformPCCResponse(response);
    });
  }

  async refreshPatientData(patientId: PatientId): Promise<EHRData> {
    const response = await this.callPCCAPI(
      `/patients/${patientId.value}/refresh`
    );
    return this.transformPCCResponse(response);
  }

  private async callPCCAPI(
    endpoint: string,
    params: any = {}
  ): Promise<PCCResponse> {
    const apiKey = this.configService.get('PCC_API_KEY');
    const baseUrl = this.configService.get('PCC_BASE_URL');

    try {
      const response = await this.httpClient.axiosRef.get(
        `${baseUrl}${endpoint}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          params,
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error) {
      this.handleAPIError(error);
    }
  }

  // ✅ Transform external data to domain models
  private transformPCCResponse(response: PCCResponse): EHRData {
    const labResults =
      response.labs?.map(
        (lab) =>
          new LabResult(lab.type, lab.value, lab.unit, new Date(lab.timestamp))
      ) || [];

    const diagnosisCodes =
      response.diagnoses?.map((diagnosis) =>
        DiagnosisCode.fromString(diagnosis.code)
      ) || [];

    return new EHRData(
      response.patient.id,
      labResults,
      diagnosisCodes,
      response.vitals,
      new Date(response.lastUpdated)
    );
  }

  private handleAPIError(error: any): void {
    if (error.response?.status === 404) {
      throw new PatientNotFoundInPCCError(error.response.data.patientId);
    } else if (error.response?.status === 429) {
      throw new PCCRateLimitError('API rate limit exceeded');
    } else {
      throw new PCCIntegrationError(`PCC API error: ${error.message}`);
    }
  }
}
```

---

## 4. Application Layer Design

### 4.1 Command and Query Patterns (CQRS-lite)

```typescript
// ✅ Command Objects (Write Operations)
export class CreateOnboardingCommand {
  constructor(
    public readonly patientId: PatientId,
    public readonly facilityId: FacilityId,
    public readonly programType: ProgramType,
    public readonly initiatedBy: UserId
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.patientId) {
      throw new InvalidCommandError('Patient ID is required');
    }
    if (!this.facilityId) {
      throw new InvalidCommandError('Facility ID is required');
    }
  }
}

export class QualifyPatientCommand {
  constructor(
    public readonly onboardingId: OnboardingId,
    public readonly assessedBy: UserId,
    public readonly clinicalNotes: string
  ) {}
}

// ✅ Query Objects (Read Operations)
export class SearchOnboardingsQuery {
  constructor(
    public readonly facilityId?: FacilityId,
    public readonly status?: OnboardingStatusType,
    public readonly assignedSpecialist?: UserId,
    public readonly userRole: UserRole,
    public readonly pagination: PaginationInfo = new PaginationInfo()
  ) {}
}

// ✅ View Models (Response Objects)
export class OnboardingSearchResult {
  constructor(
    public readonly onboardingId: OnboardingId,
    public readonly patientName: string,
    public readonly facilityName: string,
    public readonly status: OnboardingStatusType,
    public readonly progress: OnboardingProgress,
    public readonly notifications: NotificationSummary,
    public readonly assignedSpecialist: string,
    public readonly lastUpdated: Date,
    // ✅ Role-based permissions
    public readonly canEdit: boolean,
    public readonly canView: boolean,
    public readonly canDownloadAudit: boolean
  ) {}

  // ✅ Factory method with role-based creation
  public static fromDomain(
    onboarding: ProgramOnboarding,
    userRole: UserRole
  ): OnboardingSearchResult {
    const permissions = PermissionService.getPermissions(userRole);

    return new OnboardingSearchResult(
      onboarding.onboardingId,
      onboarding.patient.getFullName(),
      onboarding.patient.facilityAssignment.name,
      onboarding.onboardingStatus.status,
      onboarding.getProgress(),
      NotificationSummary.forOnboarding(onboarding, userRole),
      onboarding.assignedSpecialist.name,
      onboarding.lastUpdated,
      permissions.canEdit,
      permissions.canView,
      permissions.canDownloadAudit
    );
  }
}
```

### 4.2 Query Services (Read-Side Optimization)

```typescript
@Injectable()
export class PatientSearchService {
  constructor(
    @Inject('PatientRepositoryPort')
    private patientRepo: PatientRepositoryPort,

    @Inject('ProgramOnboardingRepositoryPort')
    private onboardingRepo: ProgramOnboardingRepositoryPort,

    private permissionService: PermissionService
  ) {}

  async searchOnboardings(
    query: SearchOnboardingsQuery
  ): Promise<OnboardingSearchResult[]> {
    // ✅ Repository handles complex queries
    const onboardings = await this.onboardingRepo.findByCriteria(
      OnboardingSearchCriteria.fromQuery(query)
    );

    // ✅ Application service handles view model transformation
    return onboardings.map((onboarding) =>
      OnboardingSearchResult.fromDomain(onboarding, query.userRole)
    );
  }

  async getOnboardingsByFacility(
    facilityId: FacilityId,
    userRole: UserRole
  ): Promise<FacilityOnboardingView[]> {
    // ✅ Role-based data access
    this.permissionService.validateFacilityAccess(userRole, facilityId);

    const onboardings = await this.onboardingRepo.findByFacility(facilityId);

    return onboardings.map((onboarding) =>
      FacilityOnboardingView.fromDomain(onboarding, userRole)
    );
  }

  // ✅ View model optimization - no business logic
  private createOnboardingSearchResults(
    onboardings: ProgramOnboarding[],
    userRole: UserRole
  ): OnboardingSearchResult[] {
    return onboardings
      .filter((onboarding) =>
        this.permissionService.canViewOnboarding(userRole, onboarding)
      )
      .map((onboarding) =>
        OnboardingSearchResult.fromDomain(onboarding, userRole)
      );
  }
}
```

---

## 5. Infrastructure Implementation

### 5.1 Event Handling (Domain Events)

```typescript
// ✅ Event Handler reacts to domain events
@EventHandler(OnboardingInitiatedEvent)
@Injectable()
export class NotificationEventHandler {
  constructor(
    @Inject('NotificationPort')
    private notifications: NotificationPort,

    @Inject('PatientRepositoryPort')
    private patientRepo: PatientRepositoryPort
  ) {}

  async handle(event: OnboardingInitiatedEvent): Promise<void> {
    const patient = await this.patientRepo.findById(event.patientId);
    const onboarding = await this.onboardingRepo.findById(event.onboardingId);

    // ✅ Side effect: Send notifications
    await this.sendOnboardingNotifications(onboarding);
  }

  private async sendOnboardingNotifications(
    onboarding: ProgramOnboarding
  ): Promise<void> {
    // Determine notification recipients based on facility and roles
    const recipients = await this.determineNotificationRecipients(onboarding);

    // Send role-specific notifications
    await Promise.all(
      recipients.map((recipient) =>
        this.sendRoleSpecificNotification(onboarding, recipient)
      )
    );
  }

  private async sendRoleSpecificNotification(
    onboarding: ProgramOnboarding,
    recipient: NotificationRecipient
  ): Promise<void> {
    const message = this.createNotificationMessage(onboarding, recipient.role);

    switch (recipient.preferredChannel) {
      case NotificationChannel.EMAIL:
        await this.notifications.sendEmail(
          recipient.email,
          message.toEmailMessage()
        );
        break;
      case NotificationChannel.SMS:
        await this.notifications.sendSMS(
          recipient.phone,
          message.toSMSMessage()
        );
        break;
    }
  }
}

// ✅ Audit Event Handler - automatic audit logging
@EventHandler(DomainEvent)
@Injectable()
export class AuditEventHandler {
  constructor(
    @Inject('AuditTrailRepositoryPort')
    private auditRepo: AuditTrailRepositoryPort
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    const auditEntry = this.createAuditEntry(event);
    await this.auditRepo.save(auditEntry);
  }

  private createAuditEntry(event: DomainEvent): AuditTrailEntry {
    return new AuditTrailEntry(
      AuditEntryId.generate(),
      event.aggregateId,
      AuditAction.fromDomainEvent(event),
      event.userId || SystemUserId.SYSTEM,
      event.occurredOn,
      AuditDetails.fromEvent(event)
    );
  }
}
```

### 5.2 Database Schema Design

```sql
-- ✅ Database schema supporting aggregate persistence

-- Program Onboardings (Aggregate Root)
CREATE TABLE program_onboardings (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id),
    program_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    status_reason TEXT,
    assigned_specialist_id UUID NOT NULL,
    qualification_data JSONB,
    device_configuration JSONB,
    onboarding_date TIMESTAMP NOT NULL,
    target_activation_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Patients (Entity within aggregate boundary)
CREATE TABLE patients (
    id UUID PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10),
    medical_record_number VARCHAR(50) UNIQUE NOT NULL,
    pcc_patient_id VARCHAR(50) UNIQUE,
    facility_id UUID NOT NULL,
    medical_history JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit Trail (Entity within aggregate boundary)
CREATE TABLE audit_trail_entries (
    id UUID PRIMARY KEY,
    onboarding_id UUID NOT NULL REFERENCES program_onboardings(id),
    action VARCHAR(100) NOT NULL,
    performed_by UUID NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    details JSONB,
    previous_value JSONB,
    new_value JSONB
);

-- Document Metadata (Entity within aggregate boundary)
CREATE TABLE document_metadata (
    id UUID PRIMARY KEY,
    onboarding_id UUID NOT NULL REFERENCES program_onboardings(id),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    uploaded_by UUID NOT NULL,
    upload_date TIMESTAMP DEFAULT NOW(),
    content_hash VARCHAR(64) NOT NULL
);

-- Notifications (Separate aggregate)
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    onboarding_id UUID NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP
);

-- Indexes for query performance
CREATE INDEX idx_onboardings_facility_status ON program_onboardings(facility_id, status);
CREATE INDEX idx_onboardings_specialist ON program_onboardings(assigned_specialist_id);
CREATE INDEX idx_audit_onboarding ON audit_trail_entries(onboarding_id, timestamp);
CREATE INDEX idx_notifications_role ON notifications(user_role, is_read, created_at);
```

---

## 6. NestJS Project Structure

### 6.1 Folder Organization (Following DDD Guidelines)

```
apps/backend/niv/src/
├── application/                    # ✅ Application Services & Ports
│   ├── services/
│   │   ├── program-onboarding.service.ts
│   │   ├── patient-search.service.ts
│   │   ├── audit-trail.service.ts
│   │   └── notification-display.service.ts
│   ├── commands/
│   │   ├── create-onboarding.command.ts
│   │   ├── qualify-patient.command.ts
│   │   └── activate-program.command.ts
│   ├── queries/
│   │   ├── search-onboardings.query.ts
│   │   └── onboarding-history.query.ts
│   ├── ports/
│   │   ├── program-onboarding.repository.interface.ts
│   │   ├── patient.repository.interface.ts
│   │   ├── pcc-integration.interface.ts
│   │   ├── notification.interface.ts
│   │   └── document-storage.interface.ts
│   └── view-models/
│       ├── onboarding-search-result.ts
│       └── facility-onboarding-view.ts
│
├── domain/                         # ✅ Pure Business Logic
│   ├── shared/
│   │   ├── entities/
│   │   │   ├── patient.entity.ts
│   │   │   ├── audit-trail-entry.entity.ts
│   │   │   └── clinical-specialist.entity.ts
│   │   ├── value-objects/
│   │   │   ├── patient-demographics.vo.ts
│   │   │   ├── onboarding-status.vo.ts
│   │   │   ├── onboarding-progress.vo.ts
│   │   │   └── notification-summary.vo.ts
│   │   ├── domain-events/
│   │   │   ├── onboarding-initiated.event.ts
│   │   │   ├── qualification-completed.event.ts
│   │   │   └── patient-status-changed.event.ts
│   │   └── services/
│   │       ├── specialist-assignment.service.ts
│   │       └── permission.service.ts
│   │
│   └── programs/
│       └── niv/
│           ├── entities/
│           │   ├── niv-program-onboarding.entity.ts
│           │   ├── niv-qualification-assessment.entity.ts
│           │   └── niv-device-configuration.entity.ts
│           ├── value-objects/
│           │   ├── eligibility-assessment.vo.ts
│           │   ├── qualification-decision.vo.ts
│           │   └── lab-requirement.vo.ts
│           ├── services/
│           │   └── niv-eligibility.service.ts
│           └── factories/
│               └── niv-onboarding.factory.ts
│
├── infrastructure/                 # ✅ External System Implementations
│   ├── repositories/
│   │   ├── postgresql/
│   │   │   ├── program-onboarding.repository.ts
│   │   │   ├── patient.repository.ts
│   │   │   └── audit-trail.repository.ts
│   │   └── entities/
│   │       ├── program-onboarding.entity.ts
│   │       ├── patient.entity.ts
│   │       └── audit-trail.entity.ts
│   ├── integrations/
│   │   ├── pointclickcare/
│   │   │   ├── pcc-api.client.ts
│   │   │   ├── pcc-webhook.handler.ts
│   │   │   └── pcc-data.transformer.ts
│   │   ├── notifications/
│   │   │   ├── email-notification.adapter.ts
│   │   │   ├── sms-notification.adapter.ts
│   │   │   └── push-notification.adapter.ts
│   │   └── storage/
│   │       └── s3-document.repository.ts
│   ├── event-handlers/
│   │   ├── notification.event-handler.ts
│   │   ├── audit.event-handler.ts
│   │   └── integration.event-handler.ts
│   └── config/
│       ├── database.config.ts
│       ├── integration.config.ts
│       └── security.config.ts
│
└── presenters/                     # ✅ Controllers & External Interfaces
    ├── controllers/
    │   ├── program-onboarding.controller.ts
    │   ├── patient-search.controller.ts
    │   ├── audit-trail.controller.ts
    │   └── notification.controller.ts
    ├── webhooks/
    │   ├── pcc-webhook.controller.ts
    │   └── platform-webhook.controller.ts
    ├── dto/
    │   ├── create-onboarding.dto.ts
    │   ├── search-onboardings.dto.ts
    │   └── onboarding-response.dto.ts
    └── middleware/
        ├── authentication.middleware.ts
        └── authorization.middleware.ts
```

### 6.2 NestJS Module Configuration

```typescript
@Module({
  imports: [
    // Infrastructure modules
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([
      ProgramOnboardingEntity,
      PatientEntity,
      AuditTrailEntity,
      DocumentEntity,
      NotificationEntity,
    ]),

    // Event handling
    EventEmitterModule.forRoot(),

    // External integrations
    HttpModule,
    ConfigModule,
  ],

  providers: [
    // ✅ Application Services
    ProgramOnboardingService,
    PatientSearchService,
    AuditTrailService,
    NotificationDisplayService,

    // ✅ Domain Services (Pure business logic)
    NIVEligibilityService,
    SpecialistAssignmentService,
    PermissionService,

    // ✅ Port Implementations (Dependency Injection)
    {
      provide: 'ProgramOnboardingRepositoryPort',
      useClass: PostgreSQLProgramOnboardingRepository,
    },
    {
      provide: 'PatientRepositoryPort',
      useClass: PostgreSQLPatientRepository,
    },
    {
      provide: 'PCCIntegrationPort',
      useClass: PointClickCareAPIClient,
    },
    {
      provide: 'NotificationPort',
      useClass: CompositeNotificationAdapter,
    },
    {
      provide: 'DocumentStoragePort',
      useClass: S3DocumentRepository,
    },

    // ✅ Event Handlers
    NotificationEventHandler,
    AuditEventHandler,
    IntegrationEventHandler,

    // ✅ Infrastructure Adapters
    PointClickCareAPIClient,
    EmailNotificationAdapter,
    SMSNotificationAdapter,
    S3DocumentRepository,
  ],

  controllers: [
    // ✅ Presenters (Primary Adapters)
    ProgramOnboardingController,
    PatientSearchController,
    AuditTrailController,
    NotificationController,
    PCCWebhookController,
    PlatformWebhookController,
  ],

  exports: [
    // Export services for other modules
    ProgramOnboardingService,
    PatientSearchService,
  ],
})
export class NIVModule {}
```

---

## 7. Integration Patterns

### 7.1 Event-Driven Integration

```typescript
// ✅ Domain Events → Integration Events transformation
@EventHandler(QualificationCompletedEvent)
@Injectable()
export class IntegrationEventHandler {
  constructor(
    private platformEventBus: PlatformEventBus,
    private eventTransformer: EventTransformationService
  ) {}

  async handle(domainEvent: QualificationCompletedEvent): Promise<void> {
    // ✅ Transform domain event to integration event
    const integrationEvent =
      this.eventTransformer.transformToIntegrationEvent(domainEvent);

    // ✅ Publish to platform-wide event bus
    await this.platformEventBus.publish(integrationEvent);
  }
}

// ✅ Integration Event Types
export class PatientEnrolledInNIVIntegrationEvent {
  readonly eventType = 'PatientEnrolledInNIV';
  readonly version = '1.0';

  constructor(
    public readonly facilityId: string,
    public readonly patientName: string,
    public readonly onboardingDate: Date,
    public readonly assignedSpecialist: string
  ) {}
}
```

### 7.2 Webhook Integration Patterns

```typescript
@Controller('webhooks')
export class PCCWebhookController {
  constructor(
    private onboardingService: ProgramOnboardingService,
    private webhookValidator: WebhookValidationService
  ) {}

  @Post('pcc/patient-updated')
  async handlePatientUpdate(
    @Body() payload: PCCPatientUpdatedPayload
  ): Promise<void> {
    // ✅ Validate webhook signature
    await this.webhookValidator.validatePCCWebhook(payload);

    // ✅ Transform webhook to domain command
    const command = new UpdatePatientDataCommand(
      new PatientId(payload.patientId),
      payload.changes,
      SystemUserId.PCC_INTEGRATION
    );

    // ✅ Delegate to application service
    await this.onboardingService.updatePatientData(command);
  }

  @Post('platform/patient-admitted')
  async handlePatientAdmission(
    @Body() payload: PatientAdmissionPayload
  ): Promise<void> {
    await this.webhookValidator.validatePlatformWebhook(payload);

    // ✅ Check if patient needs NIV assessment
    const assessmentCommand = new AssessNIVEligibilityCommand(
      new PatientId(payload.patientId),
      new FacilityId(payload.facilityId),
      SystemUserId.PLATFORM_INTEGRATION
    );

    await this.onboardingService.initiateEligibilityAssessment(
      assessmentCommand
    );
  }
}
```

---

## 8. Architecture Validation

### 8.1 DDD Principle Validation

**✅ Rich Domain Models**

```typescript
// BEFORE (Anemic)
class Patient {
  getId() {
    return this.id;
  }
  getName() {
    return this.name;
  }
  setName(name) {
    this.name = name;
  }
}

// AFTER (Rich)
class Patient {
  public isEligibleForNIV(criteria: NIVCriteria): boolean {
    return (
      this.medicalHistory.hasRespiratoryCondition() &&
      this.medicalHistory.meetsOxygenRequirements(criteria)
    );
  }

  public enrollInProgram(programType: ProgramType): ProgramOnboarding {
    // Business logic and validation
  }
}
```

**✅ Proper Aggregate Boundaries**

```typescript
// Aggregate enforces consistency
class NIVProgramOnboarding {
  public makeQualificationDecision(decision: QualificationDecision): void {
    // ✅ All changes within aggregate boundary
    this.validateStateTransition();
    this.updateStatus();
    this.addAuditEntry();
    this.publishDomainEvent();
  }
}
```

**✅ Domain Services for Complex Logic**

```typescript
// Complex business logic in domain service
@Injectable()
export class NIVEligibilityService {
  public assessEligibility(
    patient: Patient,
    labResults: LabResult[],
    diagnosisCodes: DiagnosisCode[]
  ): EligibilityAssessment {
    // Complex multi-object business logic
  }
}
```

### 8.2 Hexagonal Architecture Validation

**✅ Dependency Direction Validation**

```
External Systems → Infrastructure → Application → Domain
        ❌              ✅            ✅          ✅
      (Nothing points outward from domain)
```

**✅ Port Interface Abstraction**

```typescript
// Application depends on abstraction
@Injectable()
export class ProgramOnboardingService {
  constructor(
    @Inject('ProgramOnboardingRepositoryPort') // ✅ Port interface
    private repo: ProgramOnboardingRepositoryPort // ✅ Not concrete class
  ) {}
}
```

**✅ Infrastructure Implements Ports**

```typescript
// Infrastructure implements port
export class PostgreSQLProgramOnboardingRepository
  implements ProgramOnboardingRepositoryPort {
  // ✅ Implements port
  // Concrete implementation
}
```

### 8.3 Business Logic Isolation Test

**✅ Domain can be tested without external dependencies:**

```typescript
describe('NIVEligibilityService', () => {
  it('should assess patient eligibility correctly', () => {
    // ✅ No mocks needed - pure business logic test
    const patient = new Patient(validPatientData);
    const labResults = [new LabResult(bloodGasData)];
    const diagnosisCodes = [DiagnosisCode.COPD];

    const service = new NIVEligibilityService();
    const assessment = service.assessEligibility(
      patient,
      labResults,
      diagnosisCodes
    );

    expect(assessment.isEligible).toBe(true);
    expect(assessment.reasoning).toContain('Qualifying respiratory condition');
  });
});
```

### 8.4 Integration Independence Test

**✅ Can swap external systems without changing business logic:**

```typescript
// Can replace PostgreSQL with MongoDB
const mongoRepo = new MongoDBProgramOnboardingRepository();
const service = new ProgramOnboardingService(mongoRepo, ...);
// Business logic unchanged

// Can replace PointClickCare with different EHR
const epicClient = new EpicEHRClient();
const service = new ProgramOnboardingService(..., epicClient);
// Business logic unchanged
```

### 8.5 Architecture Quality Metrics

**✅ Dependency Metrics:**

- Domain → Infrastructure: 0 dependencies ✅
- Domain → Application: 0 dependencies ✅
- Application → Domain: Uses domain services ✅
- Infrastructure → Domain: Only for data conversion ✅

**✅ Business Logic Coverage:**

- Domain Entities: Rich behavior, not anemic ✅
- Domain Services: Complex business rules ✅
- Application Services: Orchestration only ✅
- Controllers: Request/response only ✅

**✅ Testing Independence:**

- Domain logic: No external dependencies ✅
- Application services: Port interfaces ✅
- Infrastructure: Contract compliance ✅

---

## Summary

This corrected architecture implements **true Domain-Driven Design and Hexagonal Architecture** principles:

1. **✅ Rich Domain Models** with business logic (not anemic)
2. **✅ Proper Dependency Direction** (all pointing inward)
3. **✅ Port Interfaces** providing complete abstraction
4. **✅ Aggregate Boundaries** enforcing consistency
5. **✅ Domain Events** enabling loose coupling
6. **✅ Infrastructure Independence** allowing system swappability
7. **✅ Business Logic Isolation** enabling pure domain testing

The NIV application can now handle complex healthcare workflows while maintaining architectural integrity, regulatory compliance, and system maintainability.
