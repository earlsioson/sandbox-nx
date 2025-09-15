# NIV Onboarding Application

## Requirements Clarification Document

## Executive Summary

This document contains **5 key areas** where your input will help us deliver a solution that perfectly matches your operational workflows and user expectations.

---

## Section 1: User Roles and Permissions

### Context

UX design shows different notification columns for various roles (RT, Nurse, Admin, DON, Manager). To implement proper access controls and functionality, we need to understand what each role can and cannot do within the NIV application.

### Questions

#### 1.1 Respiratory Therapist (RT) Capabilities

**What actions can Respiratory Therapists perform in the NIV application?**

- [ ] View all patients across multiple facilities
- [ ] View only patients assigned to them
- [ ] View only patients in their facility
- [ ] Edit patient qualification status
- [ ] Edit NIV device configuration
- [ ] Upload documents
- [ ] Download audit reports
- [ ] Manually refresh EHR data
- [ ] Create new patient onboardings

**Additional RT permissions:**

```
[YOUR RESPONSE HERE]
```

#### 1.2 Facility Nurse Capabilities

**What actions can Facility Nurses perform in the NIV application?**

- [ ] View all patients in their facility
- [ ] View only specific patients assigned to them
- [ ] View patients across multiple facilities
- [ ] Edit patient information
- [ ] View qualification assessments (read-only)
- [ ] Upload documents
- [ ] Receive notifications only
- [ ] Mark notifications as read

**Additional Nurse permissions:**

```
[YOUR RESPONSE HERE]
```

#### 1.3 Facility Administrator Capabilities

**What actions can Facility Administrators perform in the NIV application?**

- [ ] View all patients in their facility
- [ ] View patients across multiple facilities (if managing multiple)
- [ ] Create new patient onboardings
- [ ] Edit patient information
- [ ] Assign RTs to patients
- [ ] Download audit reports
- [ ] View all notifications for their facility
- [ ] Manage user access for their facility

**Additional Administrator permissions:**

```
[YOUR RESPONSE HERE]
```

#### 1.4 Director of Nursing (DON) Capabilities

**What actions can DONs perform in the NIV application?**

- [ ] Same permissions as Facility Administrator
- [ ] Additional oversight permissions
- [ ] Cross-facility visibility (if applicable)
- [ ] Advanced reporting capabilities

**Specific DON permissions:**

```
[YOUR RESPONSE HERE]
```

#### 1.5 Facility Unit Manager Capabilities

**What actions can Facility Unit Managers perform in the NIV application?**

- [ ] View patients in their unit only
- [ ] View all patients in facility
- [ ] Read-only access to patient information
- [ ] Receive notifications only
- [ ] Limited administrative functions

**Specific Manager permissions:**

```
[YOUR RESPONSE HERE]
```

### Additional Notes - User Roles

```
[YOUR RESPONSE HERE - Any additional role-related requirements or special considerations]
```

---

## Section 2: Notification Requirements

### Context

Your workflow shows that 5 different stakeholder types get notified at various stages. We need to understand what information each notification should contain and how users interact with them.

### Questions

#### 2.1 Notification Content by Role

**When a new patient is added to NIV onboarding, what information should each role receive?**

**RT Notification should include:**

- [ ] Patient name and facility
- [ ] Medical record number
- [ ] Assigned due date for review
- [ ] Primary diagnosis
- [ ] Priority level
- [ ] Direct link to patient details

**Additional RT notification content:**

```
[YOUR RESPONSE HERE]
```

**Facility Nurse Notification should include:**

- [ ] Patient name
- [ ] Room number
- [ ] Status change only
- [ ] Care instructions
- [ ] RT contact information

**Additional Nurse notification content:**

```
[YOUR RESPONSE HERE]
```

**Administrator/DON/Manager Notifications should include:**

- [ ] Patient name and summary
- [ ] Current status
- [ ] Assigned RT
- [ ] Expected timeline
- [ ] Any issues requiring attention

**Additional Admin notification content:**

```
[YOUR RESPONSE HERE]
```

#### 2.2 Notification Behavior

**How should notifications work in the application?**

- [ ] Email notifications only
- [ ] In-app notifications only
- [ ] Both email and in-app
- [ ] SMS notifications for urgent items
- [ ] Users can customize notification preferences

**Notification timing:**

- [ ] Immediate notifications
- [ ] Daily digest emails
- [ ] Real-time for status changes only
- [ ] Weekly summary reports

**When do notifications clear or expire?**

```
[YOUR RESPONSE HERE]
```

**Can users mark notifications as read? What happens then?**

```
[YOUR RESPONSE HERE]
```

### Additional Notes - Notifications

```
[YOUR RESPONSE HERE - Any additional notification requirements or special rules]
```

---

## Section 3: Document Management and Audit Trail

### Context

Your UX design shows "View Files", "Download Audit", and "Documents Uploaded" functionality. We need to understand what documents are managed and what the audit trail should contain.

### Questions

#### 3.1 Document Types

**What types of documents will be stored and viewable in the NIV application?**

- [ ] Medical records from PointClickCare
- [ ] RT assessment notes and forms
- [ ] Device configuration documentation
- [ ] Patient consent forms
- [ ] Lab results and blood gas reports
- [ ] Physician orders
- [ ] Insurance authorization documents
- [ ] Progress photos/videos

**Other document types:**

```
[YOUR RESPONSE HERE]
```

**Who can upload each type of document?**

```
[YOUR RESPONSE HERE]
```

#### 3.2 Audit Trail Content

**What information should be included in the audit trail/history?**

- [ ] All status changes with timestamps
- [ ] User actions (who did what, when)
- [ ] System actions (automatic notifications, data syncs)
- [ ] Document upload/download history
- [ ] EHR data refresh history
- [ ] Login/access history
- [ ] Changes to patient information
- [ ] RT assignment changes

**Additional audit trail requirements:**

```
[YOUR RESPONSE HERE]
```

#### 3.3 Document Access and Security

**Who can download documents and audit reports?**

**Audit Reports:**

- [ ] RTs can download for their assigned patients
- [ ] Facility staff can download for their facility patients only
- [ ] Administrators can download for all patients in their facilities
- [ ] System administrators can download any audit report

**Medical Documents:**

- [ ] Same as audit reports
- [ ] More restrictive access
- [ ] Requires additional approval

**Document access rules:**

```
[YOUR RESPONSE HERE]
```

### Additional Notes - Documents/Audit

```
[YOUR RESPONSE HERE - Any additional document or audit requirements]
```

---

## Section 4: Search and Filtering Behavior

### Context

Your UX design shows filtering by facility, RT qualified status, and RT status. We need to understand how these filters should work together and what the search experience should be.

### Questions

#### 4.1 Filter Combination Logic

**When multiple filters are selected, how should they combine?**

- [ ] AND logic (must match ALL selected filters)
- [ ] OR logic (must match ANY selected filter)
- [ ] Mixed logic (please specify which combinations)

**Example: If user selects "Facility A" AND "RT Qualified = Yes" AND "RT Status = Review Needed"**

```
[YOUR RESPONSE HERE - Should show patients that match all three criteria, or explain the logic]
```

#### 4.2 Search Behavior

**How should the search functionality work?**

- [ ] Search as you type (real-time results)
- [ ] Search on button click/enter
- [ ] Minimum number of characters before search activates
- [ ] Search includes patient name, MRN, facility name

**Search should look in these fields:**

- [ ] Patient first name
- [ ] Patient last name
- [ ] Medical record number
- [ ] Facility name
- [ ] RT name
- [ ] Diagnosis codes

**Additional search fields:**

```
[YOUR RESPONSE HERE]
```

#### 4.3 Results Display

**How should search results be sorted by default?**

- [ ] Most recently added patients first
- [ ] Alphabetical by patient name
- [ ] By facility name
- [ ] By RT assignment
- [ ] By status (prioritize those needing attention)

**Default sort order:**

```
[YOUR RESPONSE HERE]
```

**How many results should be shown per page?**

```
[YOUR RESPONSE HERE]
```

### Additional Notes - Search/Filtering

```
[YOUR RESPONSE HERE - Any additional search or filtering requirements]
```

---

## Section 5: EHR Integration and Data Refresh

### Context

Your UX design shows "Refresh EHR" functionality and displays patient data from PointClickCare. We need to understand what data gets refreshed and how often.

### Questions

#### 5.1 EHR Refresh Scope

**When a user clicks "Refresh EHR", what data should be updated?**

- [ ] Complete patient demographics
- [ ] Recent lab results only
- [ ] Recent vital signs only
- [ ] Medication changes
- [ ] New diagnosis codes
- [ ] Recent physician orders
- [ ] Insurance/billing information
- [ ] All available patient data

**Specific data to refresh:**

```
[YOUR RESPONSE HERE]
```

#### 5.2 Refresh Frequency and Timing

**How often should EHR data be automatically refreshed?**

- [ ] Real-time (whenever PointClickCare updates)
- [ ] Every hour
- [ ] Every 4 hours
- [ ] Daily
- [ ] Only when manually requested
- [ ] Different frequency for different data types

**Automatic refresh schedule:**

```
[YOUR RESPONSE HERE]
```

**Should users be notified when EHR data is refreshed?**

- [ ] Yes, always
- [ ] Only if changes are detected
- [ ] Only for significant changes
- [ ] No, refresh silently

#### 5.3 Data Change Handling

**What should happen when refreshed EHR data shows changes that might affect NIV qualification?**

- [ ] Automatically notify the assigned RT
- [ ] Flag the patient for re-review
- [ ] Send notifications to all stakeholders
- [ ] Log the change but take no automatic action
- [ ] Require manual review before accepting changes

**Change handling process:**

```
[YOUR RESPONSE HERE]
```

### Additional Notes - EHR Integration

```
[YOUR RESPONSE HERE - Any additional EHR or data refresh requirements]
```

---

## Section 6: Additional Requirements and Considerations

### 6.1 Business Rules Not Yet Covered

**Are there any additional business rules or requirements that haven't been addressed in the above sections?**

```
[YOUR RESPONSE HERE]
```

### 6.2 Integration with Other Applications

**How should the NIV application integrate with your other applications (Reporting Compliance, Risk Legal Tool, Transport and Signage, AXI Admit Application)?**

- [ ] Shared patient database
- [ ] Single sign-on (SSO)
- [ ] Cross-application notifications
- [ ] Shared audit trail
- [ ] Common user management

**Specific integration requirements:**

```
[YOUR RESPONSE HERE]
```

### 6.3 Reporting Requirements

**What reports should the NIV application generate?**

- [ ] Patient status summary by facility
- [ ] RT workload reports
- [ ] Compliance reports for regulatory requirements
- [ ] Timeline reports (how long patients spend in each status)
- [ ] Outcome reports (successful activations vs. disqualifications)

**Additional reporting needs:**

```
[YOUR RESPONSE HERE]
```

### 6.4 Performance and Scale Expectations

**What are your expectations for the application performance and scale?**

**Expected number of concurrent users:**

```
[YOUR RESPONSE HERE]
```

**Expected number of patients in the system:**

```
[YOUR RESPONSE HERE]
```

**Expected response time for searches:**

```
[YOUR RESPONSE HERE]
```

### 6.5 Future Considerations

**Are there any future features or expansions planned that we should consider in the architecture?**

```
[YOUR RESPONSE HERE]
```
