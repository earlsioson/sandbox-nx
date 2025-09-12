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
  ): ProgramEnrollment {
    if (!this.isValidForProgramEnrollment()) {
      throw new InvalidEnrollmentError(this.patientId);
    }

    return ProgramEnrollment.create(this, programType, specialist);
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
      throw new InvalidDemographicsError("Birth date cannot be in future");
    }
  }
}
```

#### NIVProgramEnrollment Aggregate Root

```typescript
export class NIVProgramEnrollment {
  private readonly enrollmentId: EnrollmentId;
  private patient: Patient;
  private enrollmentStatus: EnrollmentStatus;
  private qualificationAssessment: NIVQualificationAssessment;
  private assignedSpecialist: ClinicalSpecialist;
  private auditTrail: AuditTrailEntry[];
  private documents: DocumentMetadata[];
  private domainEvents: DomainEvent[];

  constructor(
    enrollmentId: EnrollmentId,
    patient: Patient,
    assignedSpecialist: ClinicalSpecialist
  ) {
    this.enrollmentId = enrollmentId;
    this.patient = patient;
    this.assignedSpecialist = assignedSpecialist;
    this.enrollmentStatus = EnrollmentStatus.create(EnrollmentStatusType.NEW);
    this.auditTrail = [];
    this.documents = [];
    this.domainEvents = [];

    // ✅ Domain event on creation
    this.addDomainEvent(
      new EnrollmentInitiatedEvent(enrollmentId, patient.patientId)
    );
  }

  // ✅ RICH BUSINESS OPERATIONS (Complex workflow logic)
  public makeQualificationDecision(
    decision: QualificationDecision,
    assessedBy: UserId
  ): void {
    if (!this.canMakeQualificationDecision()) {
      throw new InvalidQualificationStateError(this.enrollmentId);
    }

    this.qualificationAssessment = decision.assessment;

    if (decision.isQualified) {
      this.transitionStatus(
        EnrollmentStatusType.PENDING,
        "Patient qualified for NIV program",
        assessedBy
      );
    } else if (decision.requiresAdditionalLabs) {
      this.transitionStatus(
        EnrollmentStatusType.CHANGED,
        "Additional labs required",
        assessedBy
      );
    } else {
      this.transitionStatus(
        EnrollmentStatusType.REVIEWED,
        "Patient not qualified",
        assessedBy
      );
    }

    // ✅ Domain event for qualification
    this.addDomainEvent(
      new QualificationCompletedEvent(
        this.enrollmentId,
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
        EnrollmentStatusType.PENDING,
        "Patient consented to NIV program",
        this.assignedSpecialist.userId
      );
    } else {
      this.scheduleForReReview(refusalReason || "Patient refused consent");
    }
  }

  public activateProgram(): void {
    if (!this.canActivate()) {
      throw new InvalidActivationStateError(this.enrollmentId);
    }

    this.transitionStatus(
      EnrollmentStatusType.ACTIVE,
      "NIV program activated for patient",
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
      this.enrollmentStatus.status === EnrollmentStatusType.PENDING &&
      this.hasRequiredDocuments() &&
      this.deviceConfigured()
    );
  }

  public getProgress(): EnrollmentProgress {
    const completedSteps = this.calculateCompletedSteps();
    const totalSteps = this.getTotalStepsForProgram();
    return EnrollmentProgress.create(completedSteps, totalSteps);
  }

  // ✅ AGGREGATE TRANSACTION BOUNDARY
  private transitionStatus(
    newStatus: EnrollmentStatusType,
    reason: string,
    changedBy: UserId
  ): void {
    const previousStatus = this.enrollmentStatus.status;
    this.validateStatusTransition(newStatus);

    this.enrollmentStatus = EnrollmentStatus.create(newStatus, reason);
    this.addAuditEntry(AuditAction.STATUS_CHANGED, changedBy);

    // ✅ Domain event for status change
    this.addDomainEvent(
      new PatientStatusChangedEvent(
        this.enrollmentId,
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
export class EnrollmentStatus {
  readonly status: EnrollmentStatusType;
  readonly timestamp: Date;
  readonly reason: string;
  readonly modifiedBy: UserId;

  private constructor(
    status: EnrollmentStatusType,
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
    status: EnrollmentStatusType,
    reason: string = "",
    modifiedBy?: UserId
  ): EnrollmentStatus {
    return new EnrollmentStatus(status, reason, modifiedBy);
  }

  // ✅ Value object business logic
  public canTransitionTo(newStatus: EnrollmentStatusType): boolean {
    const validTransitions = this.getValidTransitions();
    return validTransitions.includes(newStatus);
  }

  public isActive(): boolean {
    return this.status === EnrollmentStatusType.ACTIVE;
  }

  // ✅ Equality based on attributes (not identity)
  public equals(other: EnrollmentStatus): boolean {
    return (
      this.status === other.status &&
      this.reason === other.reason &&
      this.modifiedBy === other.modifiedBy
    );
  }

  private getValidTransitions(): EnrollmentStatusType[] {
    const transitionMap = new Map([
      [EnrollmentStatusType.NEW, [EnrollmentStatusType.WATCHLIST]],
      [
        EnrollmentStatusType.WATCHLIST,
        [
          EnrollmentStatusType.PENDING,
          EnrollmentStatusType.REVIEWED,
          EnrollmentStatusType.CHANGED,
        ],
      ],
      [EnrollmentStatusType.PENDING, [EnrollmentStatusType.ACTIVE]],
      [EnrollmentStatusType.CHANGED, [EnrollmentStatusType.WATCHLIST]],
      [EnrollmentStatusType.REVIEWED, [EnrollmentStatusType.WATCHLIST]],
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
      throw new InvalidDemographicsError("Name fields cannot be empty");
    }
    if (dateOfBirth > new Date()) {
      throw new InvalidDemographicsError("Birth date cannot be in future");
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
        ? "Qualifying respiratory condition present"
        : "No qualifying respiratory condition",
      hasDisqualifyingCondition ? "Disqualifying condition present" : null
    );
  }

  private assessLabResults(labResults: LabResult[]): ConditionCheck {
    const bloodGasResults = labResults.filter(
      (lab) => lab.type === LabType.BLOOD_GAS
    );

    if (bloodGasResults.length === 0) {
      return new ConditionCheck(false, "Blood gas results required");
    }

    const latestBloodGas = bloodGasResults.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    )[0];

    const oxygenSaturation = latestBloodGas.getValue("oxygen_saturation");
    const co2Levels = latestBloodGas.getValue("co2_partial_pressure");

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
      reasons.push("Medical history compatible with NIV therapy");
    } else {
      reasons.push("❌ Medical history indicates contraindications");
    }

    if (!ageCheck) {
      reasons.push("❌ Patient age outside acceptable range for NIV therapy");
    }

    return reasons.join("; ");
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
          "Arterial blood gas analysis required within 7 days of assessment",
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

export interface ProgramEnrollmentRepositoryPort {
  save(enrollment: ProgramEnrollment): Promise<void>;
  findById(id: EnrollmentId): Promise<ProgramEnrollment>;
  findByPatient(patientId: PatientId): Promise<ProgramEnrollment[]>;
  findByFacility(facilityId: FacilityId): Promise<ProgramEnrollment[]>;
  findByStatus(status: EnrollmentStatusType): Promise<ProgramEnrollment[]>;
  findByCriteria(
    criteria: EnrollmentSearchCriteria
  ): Promise<ProgramEnrollment[]>;
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
    enrollment: ProgramEnrollment,
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
export class ProgramEnrollmentService {
  constructor(
    // ✅ Depend on PORTS (abstractions) not concrete implementations
    @Inject("ProgramEnrollmentRepositoryPort")
    private enrollmentRepo: ProgramEnrollmentRepositoryPort,

    @Inject("PatientRepositoryPort")
    private patientRepo: PatientRepositoryPort,

    @Inject("PCCIntegrationPort")
    private pccIntegration: PCCIntegrationPort,

    @Inject("NotificationPort")
    private notifications: NotificationPort,

    // ✅ Domain services - pure business logic
    private eligibilityService: NIVEligibilityService,
    private specialistService: SpecialistAssignmentService,

    // ✅ Event publishing
    private eventBus: EventBus
  ) {}

  // ✅ APPLICATION SERVICE = ORCHESTRATION ONLY (No business logic)
  async createEnrollment(
    command: CreateEnrollmentCommand
  ): Promise<EnrollmentId> {
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
    const enrollment = NIVProgramEnrollment.create(
      EnrollmentId.generate(),
      patient,
      specialist
    );

    // 5. Persist aggregate
    await this.enrollmentRepo.save(enrollment);

    // 6. Publish domain events
    const events = enrollment.getUncommittedEvents();
    await this.eventBus.publishAll(events);
    enrollment.markEventsAsCommitted();

    // 7. Trigger integrations (side effects)
    await this.notifications.sendRoleBasedNotifications(
      enrollment,
      NotificationEventType.ENROLLMENT_INITIATED
    );

    return enrollment.enrollmentId;
  }

  async qualifyPatient(command: QualifyPatientCommand): Promise<void> {
    // 1. Load aggregate
    const enrollment = await this.enrollmentRepo.findById(command.enrollmentId);
    if (!enrollment) {
      throw new EnrollmentNotFoundError(command.enrollmentId);
    }

    // 2. Get clinical data
    const ehrData = await this.pccIntegration.getPatientData(
      enrollment.patient.patientId
    );

    // 3. Domain service handles complex business logic
    const eligibilityAssessment = this.eligibilityService.assessEligibility(
      enrollment.patient,
      ehrData.labResults,
      ehrData.diagnosisCodes
    );

    // 4. Domain aggregate handles business rules
    const qualificationDecision = QualificationDecision.fromAssessment(
      eligibilityAssessment,
      command.clinicalNotes
    );

    enrollment.makeQualificationDecision(
      qualificationDecision,
      command.assessedBy
    );

    // 5. Persist changes
    await this.enrollmentRepo.save(enrollment);

    // 6. Publish events
    const events = enrollment.getUncommittedEvents();
    await this.eventBus.publishAll(events);
    enrollment.markEventsAsCommitted();
  }

  // ✅ Private methods handle orchestration concerns only
  private validateCommand(command: CreateEnrollmentCommand): void {
    if (!command.patientId) {
      throw new InvalidCommandError("Patient ID is required");
    }
    if (!command.facilityId) {
      throw new InvalidCommandError("Facility ID is required");
    }
    // Command validation only - no business rules
  }
}
```

### 3.3 Infrastructure Adapters (Secondary Adapters)

```typescript
// ✅ Repository Implementation - Implements Port Interface
@Injectable()
export class PostgreSQLProgramEnrollmentRepository
  implements ProgramEnrollmentRepositoryPort
{
  constructor(
    @InjectRepository(ProgramEnrollmentEntity)
    private enrollmentRepository: Repository<ProgramEnrollmentEntity>,
    @InjectRepository(AuditTrailEntity)
    private auditRepository: Repository<AuditTrailEntity>
  ) {}

  async save(enrollment: ProgramEnrollment): Promise<void> {
    // ✅ Transaction boundary at aggregate level
    await this.enrollmentRepository.manager.transaction(async (manager) => {
      // Convert domain model to persistence model
      const persistenceModel = this.toPersistenceModel(enrollment);
      await manager.save(ProgramEnrollmentEntity, persistenceModel);

      // Save audit trail entries
      const auditEntries = enrollment
        .getAuditHistory()
        .map((entry) => this.auditToPersistenceModel(entry));
      await manager.save(AuditTrailEntity, auditEntries);

      // Save documents metadata
      const documentEntries = enrollment
        .getDocuments()
        .map((doc) => this.documentToPersistenceModel(doc));
      await manager.save(DocumentEntity, documentEntries);
    });
  }

  async findById(id: EnrollmentId): Promise<ProgramEnrollment> {
    const entity = await this.enrollmentRepository.findOne({
      where: { id: id.value },
      relations: ["patient", "auditTrail", "documents", "specialist"],
    });

    if (!entity) {
      return null;
    }

    // ✅ Convert persistence model back to rich domain model
    return this.toDomainModel(entity);
  }

  // ✅ Translation between domain and persistence models
  private toDomainModel(entity: ProgramEnrollmentEntity): ProgramEnrollment {
    const patient = this.patientToDomainModel(entity.patient);
    const specialist = this.specialistToDomainModel(entity.specialist);
    const auditTrail = entity.auditTrail.map((audit) =>
      this.auditToDomainModel(audit)
    );

    const enrollment = new NIVProgramEnrollment(
      new EnrollmentId(entity.id),
      patient,
      specialist
    );

    // Restore aggregate state
    enrollment.restoreState(
      this.statusToDomainModel(entity.status, entity.statusReason),
      this.assessmentToDomainModel(entity.qualificationData),
      auditTrail
    );

    return enrollment;
  }

  private toPersistenceModel(
    enrollment: ProgramEnrollment
  ): ProgramEnrollmentEntity {
    const entity = new ProgramEnrollmentEntity();
    entity.id = enrollment.enrollmentId.value;
    entity.patientId = enrollment.patient.patientId.value;
    entity.specialistId = enrollment.assignedSpecialist.userId.value;
    entity.status = enrollment.enrollmentStatus.status;
    entity.statusReason = enrollment.enrollmentStatus.reason;
    entity.programType = "NIV";
    entity.createdAt = enrollment.enrollmentDate;
    entity.updatedAt = new Date();

    // Serialize complex objects
    entity.qualificationData = JSON.stringify(
      enrollment.qualificationAssessment
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
    const apiKey = this.configService.get("PCC_API_KEY");
    const baseUrl = this.configService.get("PCC_BASE_URL");

    try {
      const response = await this.httpClient.axiosRef.get(
        `${baseUrl}${endpoint}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
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
      throw new PCCRateLimitError("API rate limit exceeded");
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
export class CreateEnrollmentCommand {
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
      throw new InvalidCommandError("Patient ID is required");
    }
    if (!this.facilityId) {
      throw new InvalidCommandError("Facility ID is required");
    }
  }
}

export class QualifyPatientCommand {
  constructor(
    public readonly enrollmentId: EnrollmentId,
    public readonly assessedBy: UserId,
    public readonly clinicalNotes: string
  ) {}
}

// ✅ Query Objects (Read Operations)
export class SearchEnrollmentsQuery {
  constructor(
    public readonly facilityId?: FacilityId,
    public readonly status?: EnrollmentStatusType,
    public readonly assignedSpecialist?: UserId,
    public readonly userRole: UserRole,
    public readonly pagination: PaginationInfo = new PaginationInfo()
  ) {}
}

// ✅ View Models (Response Objects)
export class EnrollmentSearchResult {
  constructor(
    public readonly enrollmentId: EnrollmentId,
    public readonly patientName: string,
    public readonly facilityName: string,
    public readonly status: EnrollmentStatusType,
    public readonly progress: EnrollmentProgress,
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
    enrollment: ProgramEnrollment,
    userRole: UserRole
  ): EnrollmentSearchResult {
    const permissions = PermissionService.getPermissions(userRole);

    return new EnrollmentSearchResult(
      enrollment.enrollmentId,
      enrollment.patient.getFullName(),
      enrollment.patient.facilityAssignment.name,
      enrollment.enrollmentStatus.status,
      enrollment.getProgress(),
      NotificationSummary.forEnrollment(enrollment, userRole),
      enrollment.assignedSpecialist.name,
      enrollment.lastUpdated,
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
    @Inject("PatientRepositoryPort")
    private patientRepo: PatientRepositoryPort,

    @Inject("ProgramEnrollmentRepositoryPort")
    private enrollmentRepo: ProgramEnrollmentRepositoryPort,

    private permissionService: PermissionService
  ) {}

  async searchEnrollments(
    query: SearchEnrollmentsQuery
  ): Promise<EnrollmentSearchResult[]> {
    // ✅ Repository handles complex queries
    const enrollments = await this.enrollmentRepo.findByCriteria(
      EnrollmentSearchCriteria.fromQuery(query)
    );

    // ✅ Application service handles view model transformation
    return enrollments.map((enrollment) =>
      EnrollmentSearchResult.fromDomain(enrollment, query.userRole)
    );
  }

  async getEnrollmentsByFacility(
    facilityId: FacilityId,
    userRole: UserRole
  ): Promise<FacilityEnrollmentView[]> {
    // ✅ Role-based data access
    this.permissionService.validateFacilityAccess(userRole, facilityId);

    const enrollments = await this.enrollmentRepo.findByFacility(facilityId);

    return enrollments.map((enrollment) =>
      FacilityEnrollmentView.fromDomain(enrollment, userRole)
    );
  }

  // ✅ View model optimization - no business logic
  private createEnrollmentSearchResults(
    enrollments: ProgramEnrollment[],
    userRole: UserRole
  ): EnrollmentSearchResult[] {
    return enrollments
      .filter((enrollment) =>
        this.permissionService.canViewEnrollment(userRole, enrollment)
      )
      .map((enrollment) =>
        EnrollmentSearchResult.fromDomain(enrollment, userRole)
      );
  }
}
```

---

## 5. Infrastructure Implementation

### 5.1 Event Handling (Domain Events)

```typescript
// ✅ Event Handler reacts to domain events
@EventHandler(EnrollmentInitiatedEvent)
@Injectable()
export class NotificationEventHandler {
  constructor(
    @Inject("NotificationPort")
    private notifications: NotificationPort,

    @Inject("PatientRepositoryPort")
    private patientRepo: PatientRepositoryPort
  ) {}

  async handle(event: EnrollmentInitiatedEvent): Promise<void> {
    const patient = await this.patientRepo.findById(event.patientId);
    const enrollment = await this.enrollmentRepo.findById(event.enrollmentId);

    // ✅ Side effect: Send notifications
    await this.sendEnrollmentNotifications(enrollment);
  }

  private async sendEnrollmentNotifications(
    enrollment: ProgramEnrollment
  ): Promise<void> {
    // Determine notification recipients based on facility and roles
    const recipients = await this.determineNotificationRecipients(enrollment);

    // Send role-specific notifications
    await Promise.all(
      recipients.map((recipient) =>
        this.sendRoleSpecificNotification(enrollment, recipient)
      )
    );
  }

  private async sendRoleSpecificNotification(
    enrollment: ProgramEnrollment,
    recipient: NotificationRecipient
  ): Promise<void> {
    const message = this.createNotificationMessage(enrollment, recipient.role);

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
    @Inject("AuditTrailRepositoryPort")
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

-- Program Enrollments (Aggregate Root)
CREATE TABLE program_enrollments (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id),
    program_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    status_reason TEXT,
    assigned_specialist_id UUID NOT NULL,
    qualification_data JSONB,
    device_configuration JSONB,
    enrollment_date TIMESTAMP NOT NULL,
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
    enrollment_id UUID NOT NULL REFERENCES program_enrollments(id),
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
    enrollment_id UUID NOT NULL REFERENCES program_enrollments(id),
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
    enrollment_id UUID NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP
);

-- Indexes for query performance
CREATE INDEX idx_enrollments_facility_status ON program_enrollments(facility_id, status);
CREATE INDEX idx_enrollments_specialist ON program_enrollments(assigned_specialist_id);
CREATE INDEX idx_audit_enrollment ON audit_trail_entries(enrollment_id, timestamp);
CREATE INDEX idx_notifications_role ON notifications(user_role, is_read, created_at);
```

---

## 6. NestJS Project Structure

### 6.1 Folder Organization (Following DDD Guidelines)

```
apps/backend/niv/src/
├── application/                    # ✅ Application Services & Ports
│   ├── services/
│   │   ├── program-enrollment.service.ts
│   │   ├── patient-search.service.ts
│   │   ├── audit-trail.service.ts
│   │   └── notification-display.service.ts
│   ├── commands/
│   │   ├── create-enrollment.command.ts
│   │   ├── qualify-patient.command.ts
│   │   └── activate-program.command.ts
│   ├── queries/
│   │   ├── search-enrollments.query.ts
│   │   └── enrollment-history.query.ts
│   ├── ports/
│   │   ├── program-enrollment.repository.interface.ts
│   │   ├── patient.repository.interface.ts
│   │   ├── pcc-integration.interface.ts
│   │   ├── notification.interface.ts
│   │   └── document-storage.interface.ts
│   └── view-models/
│       ├── enrollment-search-result.ts
│       └── facility-enrollment-view.ts
│
├── domain/                         # ✅ Pure Business Logic
│   ├── shared/
│   │   ├── entities/
│   │   │   ├── patient.entity.ts
│   │   │   ├── audit-trail-entry.entity.ts
│   │   │   └── clinical-specialist.entity.ts
│   │   ├── value-objects/
│   │   │   ├── patient-demographics.vo.ts
│   │   │   ├── enrollment-status.vo.ts
│   │   │   ├── enrollment-progress.vo.ts
│   │   │   └── notification-summary.vo.ts
│   │   ├── domain-events/
│   │   │   ├── enrollment-initiated.event.ts
│   │   │   ├── qualification-completed.event.ts
│   │   │   └── patient-status-changed.event.ts
│   │   └── services/
│   │       ├── specialist-assignment.service.ts
│   │       └── permission.service.ts
│   │
│   └── programs/
│       └── niv/
│           ├── entities/
│           │   ├── niv-program-enrollment.entity.ts
│           │   ├── niv-qualification-assessment.entity.ts
│           │   └── niv-device-configuration.entity.ts
│           ├── value-objects/
│           │   ├── eligibility-assessment.vo.ts
│           │   ├── qualification-decision.vo.ts
│           │   └── lab-requirement.vo.ts
│           ├── services/
│           │   └── niv-eligibility.service.ts
│           └── factories/
│               └── niv-enrollment.factory.ts
│
├── infrastructure/                 # ✅ External System Implementations
│   ├── repositories/
│   │   ├── postgresql/
│   │   │   ├── program-enrollment.repository.ts
│   │   │   ├── patient.repository.ts
│   │   │   └── audit-trail.repository.ts
│   │   └── entities/
│   │       ├── program-enrollment.entity.ts
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
    │   ├── program-enrollment.controller.ts
    │   ├── patient-search.controller.ts
    │   ├── audit-trail.controller.ts
    │   └── notification.controller.ts
    ├── webhooks/
    │   ├── pcc-webhook.controller.ts
    │   └── platform-webhook.controller.ts
    ├── dto/
    │   ├── create-enrollment.dto.ts
    │   ├── search-enrollments.dto.ts
    │   └── enrollment-response.dto.ts
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
      ProgramEnrollmentEntity,
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
    ProgramEnrollmentService,
    PatientSearchService,
    AuditTrailService,
    NotificationDisplayService,

    // ✅ Domain Services (Pure business logic)
    NIVEligibilityService,
    SpecialistAssignmentService,
    PermissionService,

    // ✅ Port Implementations (Dependency Injection)
    {
      provide: "ProgramEnrollmentRepositoryPort",
      useClass: PostgreSQLProgramEnrollmentRepository,
    },
    {
      provide: "PatientRepositoryPort",
      useClass: PostgreSQLPatientRepository,
    },
    {
      provide: "PCCIntegrationPort",
      useClass: PointClickCareAPIClient,
    },
    {
      provide: "NotificationPort",
      useClass: CompositeNotificationAdapter,
    },
    {
      provide: "DocumentStoragePort",
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
    ProgramEnrollmentController,
    PatientSearchController,
    AuditTrailController,
    NotificationController,
    PCCWebhookController,
    PlatformWebhookController,
  ],

  exports: [
    // Export services for other modules
    ProgramEnrollmentService,
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
  readonly eventType = "PatientEnrolledInNIV";
  readonly version = "1.0";

  constructor(
    public readonly facilityId: string,
    public readonly patientName: string,
    public readonly enrollmentDate: Date,
    public readonly assignedSpecialist: string
  ) {}
}
```

### 7.2 Webhook Integration Patterns

```typescript
@Controller("webhooks")
export class PCCWebhookController {
  constructor(
    private enrollmentService: ProgramEnrollmentService,
    private webhookValidator: WebhookValidationService
  ) {}

  @Post("pcc/patient-updated")
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
    await this.enrollmentService.updatePatientData(command);
  }

  @Post("platform/patient-admitted")
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

    await this.enrollmentService.initiateEligibilityAssessment(
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

  public enrollInProgram(programType: ProgramType): ProgramEnrollment {
    // Business logic and validation
  }
}
```

**✅ Proper Aggregate Boundaries**

```typescript
// Aggregate enforces consistency
class NIVProgramEnrollment {
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
export class ProgramEnrollmentService {
  constructor(
    @Inject("ProgramEnrollmentRepositoryPort") // ✅ Port interface
    private repo: ProgramEnrollmentRepositoryPort // ✅ Not concrete class
  ) {}
}
```

**✅ Infrastructure Implements Ports**

```typescript
// Infrastructure implements port
export class PostgreSQLProgramEnrollmentRepository
  implements ProgramEnrollmentRepositoryPort {
  // ✅ Implements port
  // Concrete implementation
}
```

### 8.3 Business Logic Isolation Test

**✅ Domain can be tested without external dependencies:**

```typescript
describe("NIVEligibilityService", () => {
  it("should assess patient eligibility correctly", () => {
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
    expect(assessment.reasoning).toContain("Qualifying respiratory condition");
  });
});
```

### 8.4 Integration Independence Test

**✅ Can swap external systems without changing business logic:**

```typescript
// Can replace PostgreSQL with MongoDB
const mongoRepo = new MongoDBProgramEnrollmentRepository();
const service = new ProgramEnrollmentService(mongoRepo, ...);
// Business logic unchanged

// Can replace PointClickCare with different EHR
const epicClient = new EpicEHRClient();
const service = new ProgramEnrollmentService(..., epicClient);
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
