# Policy-Driven Hostel Allocation Engine with Roommate Compatibility Matching
## Software Requirements Specification (SRS)

**Course Code:** CSE316  
**Course Name:** Software Engineering & System Architecture  
**Student Name:** Prem Singh  
**Registration Number:** 12406329  
**Prepared for:** Continuous Assessment 3 (CA3)  
**Academic Term:** Autumn 2026  
**Submission Date:** November 27, 2026  

---

## Revision History

| Version | Date | Description | Author |
| :---: | :---: | :--- | :---: |
| **1.0.0** | 29-Oct-2026 | Initial architectural baseline, crypto specifications, and schema contracts | Prem Singh |
| **1.1.0** | 15-Nov-2026 | Deterministic seeded algorithm, compatibility vectorization & route guards | Prem Singh |
| **1.2.0** | 27-Nov-2026 | Cloud deployment, RBAC enforcements, and live end-to-end UAT verification | Prem Singh |

---

## Table of Contents

- [1. Introduction](#1-introduction)
  - [1.1 Purpose](#11-purpose)
  - [1.2 Scope](#12-scope)
  - [1.3 Definitions, Acronyms, and Abbreviations](#13-definitions-acronyms-and-abbreviations)
  - [1.4 References](#14-references)
  - [1.5 Overview](#15-overview)
- [2. General Description](#2-general-description)
  - [2.1 Product Perspective](#21-product-perspective)
  - [2.2 Product Functions](#22-product-functions)
  - [2.3 User Characteristics](#23-user-characteristics)
  - [2.4 General Constraints](#24-general-constraints)
  - [2.5 Assumptions and Dependencies](#25-assumptions-and-dependencies)
- [3. Specific Requirements](#3-specific-requirements)
  - [3.1 External Interface Requirements](#31-external-interface-requirements)
    - [3.1.1 User Interfaces](#311-user-interfaces)
    - [3.1.2 Hardware Interfaces](#312-hardware-interfaces)
    - [3.1.3 Software Interfaces](#313-software-interfaces)
    - [3.1.4 Communications Interfaces](#314-communications-interfaces)
  - [3.2 Functional Requirements](#32-functional-requirements)
    - [3.2.1 User Authentication & Role-Based Access Control (RBAC)](#321-user-authentication--role-based-access-control-rbac)
    - [3.2.2 Residential Physical Hierarchy Management](#322-residential-physical-hierarchy-management)
    - [3.2.3 Allotment Cycle & Application Intake Lifecycle](#323-allotment-cycle--application-intake-lifecycle)
    - [3.2.4 Policy-Driven Eligibility Evaluation](#324-policy-driven-eligibility-evaluation)
    - [3.2.5 Ranked Preference & Lifestyle Vector Profiling](#325-ranked-preference--lifestyle-vector-profiling)
    - [3.2.6 Deterministic Seeded Stable Allocation Engine](#326-deterministic-seeded-stable-allocation-engine)
    - [3.2.7 Warden Desk Visual Floor Map & Overrides](#327-warden-desk-visual-floor-map--overrides)
    - [3.2.8 Atomic Two-Phase Commit Draft Publication](#328-atomic-two-phase-commit-draft-publication)
    - [3.2.9 Digitally Signed PDF Allotment Letters & Analytics](#329-digitally-signed-pdf-allotment-letters--analytics)
  - [3.5 Non-Functional Requirements](#35-non-functional-requirements)
    - [3.5.1 Performance](#351-performance)
    - [3.5.2 Reliability](#352-reliability)
    - [3.5.3 Availability](#353-availability)
    - [3.5.4 Security](#354-security)
    - [3.5.5 Maintainability](#355-maintainability)
    - [3.5.6 Portability](#356-portability)
  - [3.7 Design Constraints](#37-design-constraints)
  - [3.9 Other Requirements](#39-other-requirements)
- [4. Analysis Models](#4-analysis-models)
  - [4.1 Data Flow Diagrams (DFD)](#41-data-flow-diagrams-dfd)
    - [4.1.1 DFD Level 0 (Context Diagram)](#411-dfd-level-0-context-diagram)
    - [4.1.2 DFD Level 1 (Functional Decomposition)](#412-dfd-level-1-functional-decomposition)
    - [4.1.3 Data Stores Reference](#413-data-stores-reference)
- [5. GitHub Link](#5-github-link)
- [6. Deployed Links](#6-deployed-links)

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) establishes the complete functional, behavioural, performance, and security requirements for the **Policy-Driven Hostel Allocation Engine with Roommate Compatibility Matching** (Project P03). It serves as the authoritative technical contract between student users, housing administrators, wardens, and software engineers.

### 1.2 Scope
The software product under specification is the **Campus Residence Portal** (Backend: `hostel-allocation-api`, Frontend: `hostel-allocation-client`).
- **What the Product Will Do:**
  - Maintain physical campus housing hierarchy (`Hostel` -> `Wing/Block` -> `Room` -> `Bed`).
  - Manage structured academic allotment windows with automated intake gates.
  - Evaluate academic eligibility (CGPA thresholds, fee clearance verification, disciplinary checks).
  - Collect student ranked hostel choices and pairwise roommate compatibility responses.
  - Encrypt sensitive lifestyle responses using AES-256-GCM authenticated cipher.
  - Execute deterministic, seeded Gale-Shapley stable allocation matching.
  - Provide an interactive Warden Desk visual floor map for pre-publication audits.
  - Enforce atomic multi-document transactional publication (Two-Phase Commit).
  - Issue tamper-evident, digitally signed PDF allotment letters with SHA-256 verification hashes.
- **What the Product Will Not Do:**
  - The system will not process direct financial payments (validates settlement status from external ERPs).
  - The system will never expose raw student lifestyle questionnaires to staff or peers.
  - The system will not allow unapproved drafts to mutate live bed inventory.
- **Objectives and Benefits:**
  - Complete elimination of discretionary room allotment corruption.
  - Sub-3 second allocation processing for 10,000 applicants.
  - Zero double-booking guarantee and strict gender-segregation invariant enforcement.

### 1.3 Definitions, Acronyms, and Abbreviations
- **SRS:** Software Requirements Specification (IEEE Std 830-1998 compliant).
- **RBAC:** Role-Based Access Control (`STUDENT`, `WARDEN`, `CHIEF_WARDEN`, `HOSTEL_ADMIN`, `SYSADMIN`).
- **AES-256-GCM:** Advanced Encryption Standard in Galois/Counter Mode with 256-bit key.
- **BullMQ:** Distributed message queue backed by Upstash Redis for asynchronous allocation tasks.
- **CGPA:** Cumulative Grade Point Average (0.0 to 10.0 scale).
- **DFD:** Data Flow Diagram.
- **JWT:** JSON Web Token (RFC 7519) signed via HMAC-SHA256.
- **MTBF:** Mean Time Between Failures.

### 1.4 References
1. **IEEE Std 830-1998:** IEEE Recommended Practice for Software Requirements Specifications.
2. **Gale & Shapley (1962):** *College Admissions and the Stability of Marriage*, American Mathematical Monthly.
3. **NIST SP 800-38D:** Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM).
4. **RFC 7519:** JSON Web Token (JWT) Standard.

### 1.5 Overview
This document contains Section 2 detailing general system characteristics and user roles; Section 3 outlining external interfaces, functional features (3.2.1 to 3.2.9), and non-functional guarantees (3.5.1 to 3.5.6); Section 4 presenting DFD models; Section 5 providing the GitHub source link; and Section 6 providing live production URLs.

---

## 2. General Description

### 2.1 Product Perspective
The system operates as an autonomous, cloud-hosted university accommodation infrastructure. It bridges upstream campus registry and fee systems with downstream residential facilities, turnstiles, and security desks.

### 2.2 Product Functions
1. **M1 Inventory Management:** Physical asset tracking from campus residences down to specific bed identifiers (`VACANT`, `OCCUPIED`, `MAINTENANCE`).
2. **M2 Cycle Intake Control:** Scheduling allocation windows with strict time-bracket guards.
3. **M3 Policy Gatekeeping:** Automated batch eligibility evaluation.
4. **M4 Student Preferences:** Top-3 hostel choices and room occupancy preferences.
5. **M5 Roommate Profiling:** Consent-based lifestyle survey vectorization.
6. **M6 Stable Matching Engine:** Deterministic seeded deferred-acceptance algorithm.
7. **M7 Warden Floor Map Desk:** Visual audit and room-level spatial inspection.
8. **M8 Controlled Governance Overrides:** Audited manual promotions and medical disability placements.
9. **M9 Two-Phase Publication:** Atomic state transition and signed PDF allotment letter dispatch.

### 2.3 User Characteristics
- **Student:** Undergraduate/postgraduate resident. Applies for room, ranks hostels, completes encrypted lifestyle questionnaire, views result, and downloads PDF letter.
- **Warden:** Campus residence supervisor. Inspects floor maps, verifies student special needs, reviews draft allocations, and signs off approvals.
- **Hostel Administrator / Chief Warden:** Oversees campus-wide inventory, creates allotment rounds, triggers allocation jobs, and publishes results.
- **System Administrator (SysAdmin):** Monitors cluster metrics, manages user accounts, and inspects system audit logs.

### 2.4 General Constraints
- **Zero Discretionary Mutability:** No bed assignment can bypass the deterministic engine without an immutable audit trail entry.
- **Zero-Knowledge Trait Vector:** Raw student lifestyle answers are permanently encrypted at rest.
- **Deterministic Replayability:** Running the algorithm with identical input data and seed produces byte-for-byte identical draft assignments.

### 2.5 Assumptions and Dependencies
- **Runtime:** Node.js v20+ LTS with TypeScript 5.8.
- **Database:** MongoDB Atlas replica set (`cluster0.ho9hahq.mongodb.net`) supporting multi-document ACID transactions.
- **Cache & Message Broker:** Upstash Redis (`primary-panther-160610.upstash.io`) over TLS.

---

## 3. Specific Requirements

### 3.1 External Interface Requirements

#### 3.1.1 User Interfaces
- **Architecture:** Next.js 14 Single Page Application with client-side routing, React Query caching, and Zustand authentication stores.
- **Design System:** Academic Sage Palette:
  - Deep Forest / Primary Text: `#1e3831`
  - Sage Green / Primary Action: `#659287`
  - Sea Green / Accents: `#88BDA4`
  - Mint Tint / Borders: `#B1D3B9`
  - Honeydew / Background: `#E6F2DD`
- **Responsiveness:** Full multi-device responsiveness across smartphones (320px+), tablets, and high-resolution desktops.

#### 3.1.2 Hardware Interfaces
- **Server:** Virtualized container instances (min 512MB RAM, 0.5 vCPU).
- **Client:** Modern browser with HTML5 Canvas/PDF rendering and JavaScript enabled.

#### 3.1.3 Software Interfaces
- **Database:** MongoDB Atlas cloud cluster via Mongoose ORM.
- **Worker Queue:** BullMQ integration over secure TLS Redis.
- **Hosting:** Backend deployed on Render Cloud Platform; Frontend deployed on Vercel Global Edge Network.

#### 3.1.4 Communications Interfaces
- **Protocol:** HTTPS over TLS 1.3.
- **Data Exchange:** RESTful JSON payloads with standard HTTP status conventions.

---

### 3.2 Functional Requirements

#### 3.2.1 User Authentication & Role-Based Access Control (RBAC)
- **Introduction:** Manages registration, encrypted credential validation, and JWT session issuance.
- **Inputs:** `emailOrReg`, `password`, `fullName`, `registrationNumber`, `role`, `gender`.
- **Processing:** Bcrypt password hashing (10 salt rounds); unique index enforcement; JWT creation with signed role claims.
- **Outputs:** HTTP 200/201 with bearer token and sanitized user profile.
- **Error Handling:** HTTP 400 on schema invalidation; HTTP 401 on invalid credentials; HTTP 409 on registration collision.

#### 3.2.2 Residential Physical Hierarchy Management
- **Introduction:** Registers and tracks physical campus residences, blocks, rooms, and individual beds.
- **Inputs:** Hostel `name`, `code`, `gender` (MALE, FEMALE, COED), `roomNumber`, `floor`, `roomType`, `capacity`, `bedLabel`.
- **Processing:** Foreign key validation; capacity invariant validation; bed state initialization (`VACANT`).
- **Outputs:** Real-time inventory metrics and room catalogues.
- **Error Handling:** HTTP 400 on duplicate room labels; HTTP 403 on non-administrative attempts.

#### 3.2.3 Allotment Cycle & Application Intake Lifecycle
- **Introduction:** Controls official application windows and status state transitions.
- **Inputs:** `title`, `academicYear`, `semester`, `windowStart`, `windowEnd`, `randomSeed`.
- **Processing:** Date validation (`windowEnd > windowStart`); automated status lifecycle (`DRAFT` -> `OPEN` -> `CLOSED` -> `REVIEW` -> `PUBLISHED`).
- **Outputs:** Live allotment rounds displayed on student dashboards.
- **Error Handling:** HTTP 400 if student attempts to apply outside active window dates.

#### 3.2.4 Policy-Driven Eligibility Evaluation
- **Introduction:** Evaluates student applications against university rules without human bias.
- **Inputs:** `cgpa`, `feeCleared`, `disciplinaryHold`, `distanceFromCampusKm`.
- **Processing:** Automatic rule evaluation (`cgpa >= minCgpa`, `feeCleared === true`, `disciplinaryHold === false`). Sets status to `ELIGIBLE` or `INELIGIBLE`.
- **Outputs:** Application status update with auditable reason codes.
- **Error Handling:** HTTP 404 on missing cycle; HTTP 403 for unauthorized users.

#### 3.2.5 Ranked Preference & Lifestyle Vector Profiling
- **Introduction:** Captures student hostel priorities and encrypted lifestyle questionnaires.
- **Inputs:** `rankedHostelIds` (1 to 3), `preferredRoomTypes`, 5 lifestyle trait ratings (0.0 to 1.0), and `consentGiven: true`.
- **Processing:** Mandatory consent validation; AES-256-GCM encryption of personal lifestyle survey with dynamic 96-bit IV; normalized trait vector storage.
- **Outputs:** Encrypted lifestyle record and preference acknowledgement.
- **Error Handling:** HTTP 400 if consent is denied or sliders exceed bounds.

#### 3.2.6 Deterministic Seeded Stable Allocation Engine
- **Introduction:** Executes deferred-acceptance matching of eligible students to vacant beds.
- **Inputs:** `cycleId`, `randomSeed` (default: 42), candidate applications, vacant beds.
- **Processing:** Candidate ordering by CGPA and distance; hard constraint enforcement (gender isolation, ground-floor accessibility, 1-student-per-bed uniqueness); soft constraint optimization (cosine compatibility matching); draft generation.
- **Outputs:** Tentative `AllocationDraft` with zero hard constraint violations.
- **Error Handling:** HTTP 400 if cycle is not in valid processing state.

#### 3.2.7 Warden Desk Visual Floor Map & Overrides
- **Introduction:** Enables residential wardens to visually audit floor occupancy before publication.
- **Inputs:** `draftId`, target `roomId`, waitlisted `studentId`.
- **Processing:** Floor map generation displaying room occupancy; waitlist promotion with mandatory reason logging.
- **Outputs:** Interactive visual cards and updated draft assignment rosters.
- **Error Handling:** HTTP 403 if accessed by student accounts; HTTP 404 on invalid room ID.

#### 3.2.8 Atomic Two-Phase Commit Draft Publication
- **Introduction:** Commits approved draft assignments into live bed inventory inside an ACID transaction.
- **Inputs:** Approved `draftId`, `actorUserId`, institutional notes.
- **Processing:** MongoDB multi-document transaction: validates `draft.status === 'APPROVED'`; mutates `Bed.status` to `OCCUPIED` and assigns `currentStudentId`; updates cycle to `PUBLISHED`; inserts `AuditEntry`.
- **Outputs:** Finalized campus occupancy state and in-app notifications.
- **Error Handling:** HTTP 403 if draft is unapproved; automatic rollback on transaction abort.

#### 3.2.9 Digitally Signed PDF Allotment Letters & Analytics
- **Introduction:** Generates official verifiable PDF allotment letters and campus occupancy heatmaps.
- **Inputs:** `cycleId`, `studentId`.
- **Processing:** Streaming PDF document generation via PDFKit: embeds institution seal, student registration details, allocated room/bed, SHA-256 digital signature, and verification barcode.
- **Outputs:** Binary `application/pdf` stream with download attachment headers.
- **Error Handling:** HTTP 404 if student has no published bed allocation.

---

### 3.5 Non-Functional Requirements

#### 3.5.1 Performance
- **Read Latency:** 95% of queries shall return in under 50ms.
- **Batch Matching Throughput:** 10,000 applications matched against 5,000 beds in under 3.0 seconds.
- **PDF Generation:** Allotment letters dynamically rendered in under 150ms.

#### 3.5.2 Reliability
- **Transaction Safety:** Zero partial allocations; all publication mutations execute inside MongoDB multi-document ACID transactions.
- **Queue Resiliency:** BullMQ worker jobs utilize exponential backoff retry policies.
- **MTBF:** Mean Time Between Failures shall exceed 720 hours (> 30 days).

#### 3.5.3 Availability
- Uptime shall meet or exceed **99.9%** per semester.

#### 3.5.4 Security
- **Encryption at Rest:** Sensitive lifestyle surveys encrypted with AES-256-GCM.
- **Password Protection:** Bcrypt hashing with 10 salt rounds.
- **Transport Security:** Strict HTTPS over TLS 1.3.
- **Session Tokens:** Stateless JWT bearer tokens with 7-day expiration and RBAC claims.

#### 3.5.5 Maintainability
- Clean monorepo architecture with decoupled layers (`routes`, `controllers`, `services`, `models`, `validations`).
- 100% test coverage across 6 Jest test suites (39/39 passing).

#### 3.5.6 Portability
- Fully containerized via Docker and Docker Compose for execution across any cloud or on-premise infrastructure.

---

### 3.7 Design Constraints
- Strict compliance with IEEE Std 830-1998 guidelines.
- Strict zero-knowledge privacy for personal lifestyle vectors.
- Strict determinism in allocation algorithm replayability.

### 3.9 Other Requirements
- Institutional data retention and automated database indexing for sub-second analytics.

---

## 4. Analysis Models

### 4.1 Data Flow Diagrams (DFD)

#### 4.1.1 DFD Level 0 (Context Diagram)

```
+-----------------------------------------------------------------------------------+
|                                DFD LEVEL 0: CONTEXT DIAGRAM                       |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|   +-------------------+                     +---------------------------------+   |
|   |      STUDENT      |---(Application)---> |                                 |   |
|   |                   |<--(PDF Letter)----- |                                 |   |
|   +-------------------+                     |                                 |   |
|                                             |                                 |   |
|   +-------------------+                     |      POLICY-DRIVEN HOSTEL       |   |
|   |      WARDEN       |---(Draft Review)--> |       ALLOCATION PLATFORM       |   |
|   |                   |<--(Floor Map)------ |             (0.0)               |   |
|   +-------------------+                     |                                 |   |
|                                             |                                 |   |
|   +-------------------+                     |                                 |   |
|   |   HOSTEL ADMIN    |---(Cycle / Seed)--> |                                 |   |
|   |                   |<--(Analytics)------ |                                 |   |
|   +-------------------+                     +---------------------------------+   |
+-----------------------------------------------------------------------------------+
```

#### 4.1.2 DFD Level 1 (Functional Decomposition)

```
                       [Student / Admin / Warden]
                                   |
                                   v
                      +--------------------------+
                      | 1.0 Auth & Access Control| <=======> [D1: Users]
                      +--------------------------+
                                   |
         +-------------------------+-------------------------+
         |                         |                         |
         v                         v                         v
+------------------+      +------------------+      +------------------+
| 2.0 Inventory &  |      | 3.0 Application  |      | 4.0 Lifestyle    |
| Cycle Management |      | & Eligibility    |      | Vector Profiler  |
+------------------+      +------------------+      +------------------+
         |                         |                         |
         v                         v                         v
   [D2: Inventory]           [D4: Applications]       [D5: Encrypted Vectors]
   [D3: Cycles]                    |                         |
         |                         |                         |
         +-------------------------+-------------------------+
                                   |
                                   v
                      +--------------------------+
                      | 5.0 Deterministic Seeded | <=======> [D6: Drafts &
                      | Stable Matching Engine   |            Assignments]
                      +--------------------------+
                                   |
                                   v
                      +--------------------------+
                      | 6.0 Warden Desk Visual   | <=======> [D7: Audit Log]
                      | Floor Map & Overrides    |
                      +--------------------------+
                                   |
                                   v
                      +--------------------------+
                      | 7.0 Atomic Multi-Doc     | ======> Updates [D2: Beds]
                      | Publication & PDF Letter | ======> [Signed PDF Stream]
                      +--------------------------+
```

#### 4.1.3 Data Stores Reference
- **D1: Users:** User credentials, password hashes, and RBAC roles.
- **D2: Inventory:** Hostels, Blocks, Rooms, and Beds with live status.
- **D3: Cycles:** Allotment window dates, academic year, and status.
- **D4: Applications:** Student GPA, distance, accessibility flags, and eligibility state.
- **D5: Preferences & Vectors:** Ranked choices and AES-256-GCM encrypted surveys.
- **D6: Drafts & Assignments:** Tentative room matches and waitlist queues.
- **D7: Audit Log:** Immutable records of warden approvals, overrides, and publications.

---

## 5. GitHub Link

The full version-controlled source code repository is available at:  
👉 **[https://github.com/Prem836/Hostel-Allocation-and-Roommate-Matching-System.git](https://github.com/Prem836/Hostel-Allocation-and-Roommate-Matching-System.git)**

---

## 6. Deployed Links

- **Live Production Frontend (Vercel Edge):**  
  👉 **[https://hostel-allocation-and-roommate-matc.vercel.app/](https://hostel-allocation-and-roommate-matc.vercel.app/)**
- **Live Production Backend API (Render Cloud):**  
  👉 **[https://hostel-api-26qj.onrender.com](https://hostel-api-26qj.onrender.com)**
- **API Health Check Gateway:**  
  👉 **[https://hostel-api-26qj.onrender.com/health](https://hostel-api-26qj.onrender.com/health)**
- **Cloud Database Cluster:** MongoDB Atlas Multi-AZ Sharded Cluster (`cluster0.ho9hahq.mongodb.net`)
- **Cloud Cache & Worker Broker:** Upstash Redis TLS Cluster (`primary-panther-160610.upstash.io:6379`)
