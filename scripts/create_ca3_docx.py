import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_report():
    doc = docx.Document()

    # Page Margins: 1 inch
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    PRIMARY_COLOR = RGBColor(0x1E, 0x38, 0x31) # Deep Forest / Sage #1e3831
    ACCENT_COLOR = RGBColor(0x65, 0x92, 0x87)  # Primary Sage #659287
    DARK_TEXT = RGBColor(0x22, 0x22, 0x22)
    GRAY_TEXT = RGBColor(0x55, 0x55, 0x55)

    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(22)
        run.font.bold = True
        run.font.color.rgb = PRIMARY_COLOR
        p.paragraph_format.space_after = Pt(12)
        return p

    def add_subtitle(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(15)
        run.font.bold = True
        run.font.color.rgb = ACCENT_COLOR
        p.paragraph_format.space_after = Pt(18)
        return p

    def add_heading1(text):
        p = doc.add_paragraph()
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(16)
        run.font.bold = True
        run.font.color.rgb = PRIMARY_COLOR
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        return p

    def add_heading2(text):
        p = doc.add_paragraph()
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = ACCENT_COLOR
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        return p

    def add_heading3(text):
        p = doc.add_paragraph()
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = PRIMARY_COLOR
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        return p

    def add_paragraph(text, space_after=6):
        p = doc.add_paragraph()
        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(11)
        run.font.color.rgb = DARK_TEXT
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_after = Pt(space_after)
        return p

    def add_bullet(bold_prefix, text):
        p = doc.add_paragraph(style='List Bullet')
        r_bold = p.add_run(bold_prefix)
        r_bold.font.name = 'Calibri'
        r_bold.font.size = Pt(11)
        r_bold.font.bold = True
        r_bold.font.color.rgb = PRIMARY_COLOR
        
        r_text = p.add_run(text)
        r_text.font.name = 'Calibri'
        r_text.font.size = Pt(11)
        r_text.font.color.rgb = DARK_TEXT
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        return p

    # ==========================
    # TITLE COVER PAGE
    # ==========================
    p_top_space = doc.add_paragraph()
    p_top_space.paragraph_format.space_before = Pt(40)

    add_title("Policy-Driven Hostel Allocation Engine with Roommate Compatibility Matching")
    add_subtitle("Software Requirements Specification (SRS)")

    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.line_spacing = 1.3
    
    runs_data = [
        ("Course Code: ", True), ("CSE316\n", False),
        ("Course Name: ", True), ("Software Engineering & System Architecture\n\n", False),
        ("Student Name: ", True), ("Prem Singh\n", False),
        ("Registration Number: ", True), ("12406329\n\n", False),
        ("Prepared for: ", True), ("Continuous Assessment 3 (CA3)\n", False),
        ("Academic Term: ", True), ("Autumn 2026\n", False),
        ("Submission Date: ", True), ("November 27, 2026", False)
    ]
    for text, bold in runs_data:
        r = p_meta.add_run(text)
        r.font.name = 'Arial'
        r.font.size = Pt(11)
        r.font.bold = bold
        r.font.color.rgb = PRIMARY_COLOR if bold else DARK_TEXT

    doc.add_page_break()

    # ==========================
    # REVISION HISTORY TABLE
    # ==========================
    add_heading1("Revision History")
    rev_table = doc.add_table(rows=4, cols=4)
    rev_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Version", "Date", "Description", "Author"]
    for i, h in enumerate(headers):
        cell = rev_table.cell(0, i)
        cell.text = h
        set_cell_background(cell, "659287")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in p.runs:
            run.font.name = 'Arial'
            run.font.bold = True
            run.font.size = Pt(10)
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    rev_data = [
        ("1.0.0", "29-Oct-2026", "Initial architectural baseline & encryption specs", "Prem Singh"),
        ("1.1.0", "15-Nov-2026", "Deterministic seeded algorithm & vector matching", "Prem Singh"),
        ("1.2.0", "27-Nov-2026", "Full cloud deployment, RBAC enforcements & live UAT", "Prem Singh")
    ]
    for row_idx, data in enumerate(rev_data, start=1):
        for col_idx, text in enumerate(data):
            cell = rev_table.cell(row_idx, col_idx)
            cell.text = text
            set_cell_background(cell, "F7FAF8" if row_idx % 2 == 1 else "FFFFFF")
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if col_idx < 2 else WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.name = 'Calibri'
                run.font.size = Pt(10)

    # TABLE OF CONTENTS SUMMARY
    add_heading1("Table of Contents")
    toc_items = [
        "1. Introduction (Purpose, Scope, Definitions, References, Overview)",
        "2. General Description (Perspective, Functions, Users, Constraints, Dependencies)",
        "3. Specific Requirements (External Interfaces, Functional 3.2.1 - 3.2.9, Non-Functional 3.5.1 - 3.5.6)",
        "4. Analysis Models (Data Flow Diagrams Level 0, Level 1, Level 2)",
        "5. GitHub Link (Complete Version Controlled Source Code Repository)",
        "6. Deployed Links (Live Production Client Web Application & Backend API Service)"
    ]
    for item in toc_items:
        add_paragraph(item, space_after=3)

    doc.add_page_break()

    # ==========================
    # SECTION 1: INTRODUCTION
    # ==========================
    add_heading1("1. Introduction")
    add_paragraph("This Software Requirements Specification (SRS) establishes the complete functional, behavioural, performance, and security requirements for the Policy-Driven Hostel Allocation Engine with Roommate Compatibility Matching (Project P03). It serves as the authoritative technical contract between student users, housing administrators, wardens, and software engineers.")

    add_heading2("1.1 Purpose")
    add_paragraph("The purpose of this document is to specify the detailed software requirements for engineering an automated, policy-enforced, and mathematically verifiable campus hostel allocation system. It is written for software architects, full-stack engineers, university housing directors, student welfare committees, and IT compliance auditors responsible for ensuring fairness, transparency, and data protection in university accommodation procedures.")

    add_heading2("1.2 Scope")
    add_paragraph("The software product under specification is the 'Campus Residence Portal' (Backend API: hostel-allocation-api, Frontend SPA: hostel-allocation-client). The platform automates the end-to-end student accommodation lifecycle:")
    add_bullet("What the Product Will Do: ", "Maintain hierarchical physical inventory (Hostel -> Wing/Block -> Room -> Bed); manage academic allotment windows; enforce academic GPA and disciplinary gatekeeping; collect student ranked preferences; capture encrypted lifestyle compatibility profiles; execute deterministic Gale-Shapley stable allocation matching; offer interactive floor maps for warden desk inspection; enforce atomic publication via two-phase commit transactions; and issue digitally signed, tamper-evident PDF allotment letters.")
    add_bullet("What the Product Will Not Do: ", "The platform will not process physical cash payments (it validates payment clearing status from external university fee ERPs); it will not expose raw student questionnaire responses to peers or staff; and it will not permit unapproved allocation drafts to mutate live bed inventory.")
    add_bullet("Objectives and Benefits: ", "100% elimination of discretionary allotment corruption; sub-3 second allocation processing for 10,000 applicants; zero double-booking invariant; zero gender-segregation violation; and zero-knowledge privacy protection for personal lifestyle traits.")

    add_heading2("1.3 Definitions, Acronyms, and Abbreviations")
    add_bullet("SRS: ", "Software Requirements Specification (IEEE Std 830-1998 standard).")
    add_bullet("RBAC: ", "Role-Based Access Control (System Administrator, Hostel Administrator, Chief Warden, Warden, Student).")
    add_bullet("AES-256-GCM: ", "Advanced Encryption Standard with 256-bit key in Galois/Counter Mode providing authenticated symmetric encryption.")
    add_bullet("BullMQ: ", "High-performance distributed Redis-based message queue for asynchronous job execution.")
    add_bullet("CGPA: ", "Cumulative Grade Point Average (scale of 0.0 to 10.0).")
    add_bullet("DFD: ", "Data Flow Diagram representing processes, data stores, external entities, and data flows.")
    add_bullet("SPA: ", "Single Page Application built using React / Next.js.")
    add_bullet("JWT: ", "JSON Web Token (RFC 7519) utilizing cryptographically signed bearer tokens.")
    add_bullet("MTBF: ", "Mean Time Between Failures.")

    add_heading2("1.4 References")
    add_bullet("IEEE Std 830-1998: ", "IEEE Recommended Practice for Software Requirements Specifications.")
    add_bullet("Gale & Shapley (1962): ", "College Admissions and the Stability of Marriage, American Mathematical Monthly, 69(1), 9-15.")
    add_bullet("NIST SP 800-38D: ", "Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM).")
    add_bullet("RFC 7519: ", "JSON Web Token (JWT) Architecture and Validation Standards.")

    add_heading2("1.5 Overview")
    add_paragraph("The remainder of this SRS is organized into five major sections: Section 2 provides a general high-level description of user personas, product functions, constraints, and dependencies. Section 3 defines specific functional and non-functional requirements. Section 4 provides formal Data Flow Diagrams (Level 0, Level 1, Level 2). Section 5 provides the public version-controlled GitHub repository URL. Section 6 provides the live deployed production URLs.")

    doc.add_page_break()

    # ==========================
    # SECTION 2: GENERAL DESCRIPTION
    # ==========================
    add_heading1("2. General Description")
    add_paragraph("This section outlines the context, user personas, operational environment, and foundational constraints governing the system.")

    add_heading2("2.1 Product Perspective")
    add_paragraph("The system is an autonomous, self-contained cloud application that serves as the central digital hub for residential accommodation. It interfaces upstream with student academic directories and finance databases, and downstream with physical hostel facilities, turnstiles, and security personnel.")

    add_heading2("2.2 Product Functions")
    add_paragraph("The system encapsulates nine mission-critical functional modules:")
    add_bullet("M1 - Physical Hierarchy & Inventory: ", "Registration and tracking of Hostels, Blocks, Rooms (Single, Double, Triple, Dormitory), and Beds with real-time status flags (VACANT, OCCUPIED, MAINTENANCE).")
    add_bullet("M2 - Allotment Window Management: ", "Scheduling academic allotment cycles (DRAFT, OPEN, CLOSED, PROCESSING, REVIEW, PUBLISHED) with automated intake cut-offs.")
    add_bullet("M3 - Automated Eligibility Gatekeeper: ", "Policy evaluation checking minimum CGPA, fee dues clearance, absence of disciplinary holds, and distance priority scores.")
    add_bullet("M4 - Ranked Preference Submission: ", "Student selection and prioritized ranking of top 3 preferred campus hostels and room sharing categories.")
    add_bullet("M5 - Lifestyle Compatibility Profiling: ", "Consent-based capture of 5 dimensional vectors (sleep habits, study location, cleanliness, noise tolerance, smoking) protected by AES-256-GCM.")
    add_bullet("M6 - Seeded Stable Matching Engine: ", "Deterministic deferred-acceptance allocation algorithm ensuring mathematical reproducibility via auditable random seed.")
    add_bullet("M7 - Warden Desk Floor Map: ", "Interactive visual block-and-room diagram allowing wardens to inspect bed states and draft assignments before release.")
    add_bullet("M8 - Controlled Manual Overrides: ", "Audited waitlist promotion and special medical disability accommodations with mandatory justification logging.")
    add_bullet("M9 - Atomic Two-Phase Publication: ", "Multi-document transactional state mutation committing live occupancy and generating tamper-evident signed PDF allotment letters.")

    add_heading2("2.3 User Characteristics")
    add_bullet("Student: ", "Undergraduate and postgraduate campus residents. Authenticate via registration number, submit applications, rank choices, take lifestyle surveys, and download official allotment letters.")
    add_bullet("Warden: ", "Hostel-specific residential officers. Monitor floor occupancy, inspect draft allocations on visual floor maps, verify medical accommodations, and approve allocation drafts.")
    add_bullet("Chief Warden / Hostel Admin: ", "Institutional administrators. Configure allocation windows, set eligibility threshold policies, seed inventory, trigger allocation jobs, and execute publication.")
    add_bullet("System Administrator (SysAdmin): ", "IT operations personnel. Monitor database performance, inspect audit logs, manage user roles, and ensure high availability.")

    add_heading2("2.4 General Constraints")
    add_bullet("Zero Discretionary Mutability: ", "No staff member can directly reassign an occupied bed without generating an immutable audit trail entry.")
    add_bullet("Zero-Knowledge Lifestyle Vector: ", "Raw student lifestyle answers must never be decrypted or shown to wardens, administrators, or prospective roommates.")
    add_bullet("Deterministic Repeatability: ", "Running the engine with identical input data and seed must produce a byte-for-byte identical allocation output.")

    add_heading2("2.5 Assumptions and Dependencies")
    add_bullet("Runtime Environment: ", "Node.js v20+ LTS runtime with TypeScript 5.8 on Linux/Windows host.")
    add_bullet("Database Architecture: ", "MongoDB v7+ Atlas replica set supporting distributed multi-document ACID transactions.")
    add_bullet("Caching & Message Broker: ", "Redis v7+ (Upstash TLS) backing BullMQ job queues.")

    doc.add_page_break()

    # ==========================
    # SECTION 3: SPECIFIC REQUIREMENTS
    # ==========================
    add_heading1("3. Specific Requirements")
    add_paragraph("This section specifies the detailed functional, external interface, and non-functional requirements necessary to verify, implement, and audit the software product.")

    add_heading2("3.1 External Interface Requirements")
    add_heading3("3.1.1 User Interfaces")
    add_paragraph("The user interface is implemented as a responsive Next.js 14 Single Page Application styled with Tailwind CSS and animated via Framer Motion. The UI adheres to an academic sage palette (Primary: #659287 deep sage, Secondary: #88BDA4 sea green, Accent: #B1D3B9 mint tint, Background: #E6F2DD honeydew, Text: #1e3831 forest dark). Forms feature instant client-side validation, error banners, and ARIA accessibility labels.")

    add_heading3("3.1.2 Hardware Interfaces")
    add_paragraph("The server operates on standard x86-64 / ARM64 virtual machines or container instances (Render Standard instance, 512MB RAM minimum, 0.5 CPU minimum). The client interfaces with any standard desktop, tablet, or smartphone browser with viewport width >= 320px.")

    add_heading3("3.1.3 Software Interfaces")
    add_bullet("Database Management System: ", "MongoDB Atlas cloud replica set connected via Mongoose 8.12 ORM using TLS connection strings with automatic connection pooling (maxPoolSize: 50).")
    add_bullet("In-Memory Store & Worker Queue: ", "Upstash Redis backing BullMQ message queues for asynchronous background processing of allocation jobs.")
    add_bullet("Hosting Infrastructure: ", "Backend containerized on Render cloud platform (auto-scaling web service); Frontend hosted on Vercel Edge CDN.")

    add_heading3("3.1.4 Communications Interfaces")
    add_paragraph("Client-to-server communications strictly utilize HTTPS over TLS 1.3. Payloads use standard application/json format. HTTP status codes follow REST semantics (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 500 Server Error).")

    add_heading2("3.2 Functional Requirements")

    features = [
        ("3.2.1 User Authentication & Role-Based Access Control",
         "Provides secure credential management, role verification, and JWT issuance.",
         "Registration number, institutional email, password (min 8 chars, mixed case, digit, special char), and account role.",
         "Bcrypt hashing with 10 salt rounds; email collision check; JWT token generation signed with HS256 secret key containing 7-day expiration.",
         "HTTP 200/201 with bearer token and sanitized user profile payload.",
         "HTTP 400 on schema invalidation; HTTP 401 on incorrect credentials; HTTP 409 on duplicate email/registration."),

        ("3.2.2 Residential Physical Hierarchy Management",
         "Maintains structural campus inventory across Hostels, Blocks, Rooms, and Beds.",
         "Hostel name, code, gender policy (MALE, FEMALE, COED), block name, room number, floor, room type (SINGLE, DOUBLE, TRIPLE, DORMITORY), and bed label.",
         "Validation of hierarchical foreign keys; verification of room capacity invariants; insertion of child bed documents.",
         "Live campus inventory metrics reflecting total beds, capacity, and vacant counts.",
         "HTTP 400 on duplicate room numbers within the same block; HTTP 403 for non-admin accounts."),

        ("3.2.3 Allotment Cycle & Application Intake Lifecycle",
         "Controls the official application intake window and status state machine.",
         "Academic year, semester, window start date, window end date, random seed.",
         "Time validation ensuring windowEnd > windowStart; automatic status transitions (DRAFT -> OPEN -> CLOSED -> REVIEW -> PUBLISHED).",
         "Active allotment round broadcast on student dashboards.",
         "HTTP 400 when attempting to apply outside active window dates; HTTP 409 on duplicate applications."),

        ("3.2.4 Policy-Driven Eligibility Evaluation",
         "Evaluates candidate eligibility based on university rules without human bias.",
         "Application CGPA, fee clearance status, disciplinary hold flag, home distance.",
         "Automated rule execution: CGPA >= policy minimum; feeCleared === true; disciplinaryHold === false. Sets status to ELIGIBLE or INELIGIBLE.",
         "Updated application records with detailed ineligibility justification tags.",
         "HTTP 404 on invalid cycle ID; HTTP 403 for unauthorized non-staff roles."),

        ("3.2.5 Ranked Preference & Lifestyle Vector Profiling",
         "Captures student hostel priorities and encrypted lifestyle questionnaires.",
         "Ranked array of 1 to 3 hostel IDs, preferred room types, roommate reg number, 5 trait scores (0.0 to 1.0), and explicit consent boolean.",
         "Rejection if consentGiven !== true; encryption of questionnaire using AES-256-GCM with distinct IV; storage of normalized trait vector.",
         "Encrypted lifestyle record and preference acknowledgement.",
         "HTTP 400 if consent is denied; HTTP 400 on out-of-range slider values."),

        ("3.2.6 Deterministic Seeded Stable Allocation Engine",
         "Executes deferred-acceptance allocation matching students to vacant beds.",
         "Cycle ID, auditable random seed (default: 42), candidate applications, and vacant inventory.",
         "Deterministic candidate sorting by CGPA and distance; hard constraint enforcement (gender isolation, wheelchair accessibility, bed uniqueness); soft constraint scoring via cosine vector compatibility; insertion into AllocationDraft, DraftAssignment, and WaitlistEntry.",
         "Generated draft with assigned count, waitlisted count, and zero hard constraint violations.",
         "HTTP 400 if cycle is not in valid status; HTTP 404 if inventory is missing."),

        ("3.2.7 Warden Desk Visual Floor Map & Overrides",
         "Allows residential wardens to visually audit room assignments prior to publication.",
         "Draft ID, floor level, target room number.",
         "Querying draft assignments mapped onto physical room layout; waitlist promotion logic with automatic audit logging.",
         "Color-coded interactive room cards (Occupied, Available, Medical Priority).",
         "HTTP 403 if accessed by student accounts; HTTP 404 on invalid room ID."),

        ("3.2.8 Atomic Two-Phase Commit Draft Publication",
         "Commits approved draft assignments into live bed inventory inside an ACID transaction.",
         "Approved draft ID, publishing warden user ID, institutional notes.",
         "MongoDB multi-document transaction: verifies draft status === 'APPROVED'; updates Bed.status to 'OCCUPIED' and sets currentStudentId; marks draft and cycle as 'PUBLISHED'; creates AuditEntry record; generates in-app notifications.",
         "Confirmed published allocation cycle and updated live campus metrics.",
         "HTTP 403 if draft is not in 'APPROVED' state; automatic rollback on transaction failure."),

        ("3.2.9 Digitally Signed PDF Allotment Letters & Analytics",
         "Generates official verifiable PDF allotment letters and campus occupancy heatmaps.",
         "Cycle ID, student ID.",
         "Streaming PDF document generation using PDFKit: embeds institution watermark, student registration details, allocated hostel/room/bed, SHA-256 digital verification hash, and barcode reference.",
         "Binary application/pdf stream with Content-Disposition attachment header.",
         "HTTP 404 if student has no published bed assignment.")
    ]

    for title, intro, inputs, proc, outputs, err in features:
        add_heading2(title)
        add_paragraph(f"Introduction: {intro}")
        add_bullet("Inputs: ", inputs)
        add_bullet("Processing: ", proc)
        add_bullet("Outputs: ", outputs)
        add_bullet("Error Handling: ", err)

    add_heading2("3.5 Non-Functional Requirements")
    add_heading3("3.5.1 Performance")
    add_bullet("API Response Latency: ", "95% of all read queries (inventory stats, hostel list, student result) shall complete in less than 50ms.")
    add_bullet("Engine Throughput: ", "The allocation algorithm shall process 10,000 student applications against 5,000 beds in under 3.0 seconds.")
    add_bullet("PDF Letter Generation: ", "Dynamic PDF allotment letters shall be rendered and streamed in less than 150ms per request.")

    add_heading3("3.5.2 Reliability")
    add_bullet("Data Integrity: ", "No partial bed allocations shall occur; all state mutations during publication must execute within atomic multi-document MongoDB transactions.")
    add_bullet("Message Queue Retries: ", "Failed BullMQ worker jobs shall utilize exponential backoff with a 5000ms base delay and 2 automatic retry attempts.")
    add_bullet("MTBF: ", "Mean Time Between Failures shall exceed 720 operating hours (> 30 days).")

    add_heading3("3.5.3 Availability")
    add_paragraph("The cloud system shall maintain a minimum of 99.9% uptime per academic semester, excluding pre-announced 30-minute scheduled maintenance windows.")

    add_heading3("3.5.4 Security")
    add_bullet("Encryption at Rest: ", "Sensitive lifestyle questionnaire responses shall be encrypted using AES-256-GCM with unique 96-bit initialization vectors and 128-bit authentication tags.")
    add_bullet("Credential Protection: ", "Passwords shall be hashed using Bcrypt with 10 salt rounds; plain text passwords must never be logged or stored.")
    add_bullet("Transport Security: ", "All network traffic shall be enforced over HTTPS with TLS 1.3.")
    add_bullet("Access Control: ", "Endpoints are secured with JWT bearer tokens containing strict RBAC role verification middleware.")

    add_heading3("3.5.5 Maintainability")
    add_paragraph("The codebase is structured as an npm monorepo with strict TypeScript type-checking across frontend and backend. Services, controllers, models, and routes are modularized for clean unit and integration testing.")

    add_heading3("3.5.6 Portability")
    add_paragraph("The backend and frontend are containerized via Docker and Docker Compose, enabling deployment to Render, AWS ECS, Google Cloud Run, Azure Kubernetes, or on-premise university Linux servers.")

    add_heading2("3.7 Design Constraints")
    add_bullet("Regulatory Standard: ", "The architecture strictly adheres to IEEE 830-1998 guidelines.")
    add_bullet("Data Privacy: ", "Complies with student data privacy frameworks; personal lifestyle vectors are unidentifiable to third parties.")
    add_bullet("Auditing Invariant: ", "Audit logs must remain immutable and traceable to the acting user ID and network IP address.")

    add_heading2("3.9 Other Requirements")
    add_paragraph("The system supports institutional branding customization, academic year rollover, and automatic database index optimization for scalable query performance.")

    doc.add_page_break()

    # ==========================
    # SECTION 4: ANALYSIS MODELS
    # ==========================
    add_heading1("4. Analysis Models")
    add_paragraph("This section presents structured Data Flow Diagrams (DFDs) illustrating the movement, transformation, and storage of data across the platform.")

    add_heading2("4.1 Data Flow Diagrams (DFD)")

    add_heading3("4.1.1 DFD Level 0 (Context Diagram)")
    add_paragraph("The Level 0 Context Diagram represents the entire Hostel Allocation System as a single centralized bubble interacting with four external entities:")
    add_bullet("Student Entity: ", "Sends registration, application, hostel choices, and encrypted lifestyle survey -> Receives application status, allocation result, and signed PDF letter.")
    add_bullet("Warden Entity: ", "Sends review decisions, draft approvals, and waitlist promotions -> Receives floor bed maps, occupancy stats, and candidate profiles.")
    add_bullet("Hostel Administrator: ", "Sends residence inventory data, cycle schedules, and publication commands -> Receives campus capacity heatmaps and discrepancy reports.")
    add_bullet("Academic / Fee ERP Entity: ", "Sends fee clearance flags and CGPA records -> Receives enrolled hostel accommodation roster.")

    # ASCII Box Diagram for DFD Level 0
    p_dfd0 = doc.add_paragraph()
    p_dfd0.paragraph_format.line_spacing = 1.0
    dfd0_art = (
        "+-----------------------------------------------------------------------------------+\n"
        "|                                DFD LEVEL 0: CONTEXT DIAGRAM                       |\n"
        "+-----------------------------------------------------------------------------------+\n"
        "|                                                                                   |\n"
        "|   +-------------------+                     +---------------------------------+   |\n"
        "|   |      STUDENT      |---(Application)---> |                                 |   |\n"
        "|   |                   |<--(PDF Letter)----- |                                 |   |\n"
        "|   +-------------------+                     |                                 |   |\n"
        "|                                             |                                 |   |\n"
        "|   +-------------------+                     |      POLICY-DRIVEN HOSTEL       |   |\n"
        "|   |      WARDEN       |---(Draft Review)--> |       ALLOCATION PLATFORM       |   |\n"
        "|   |                   |<--(Floor Map)------ |             (0.0)               |   |\n"
        "|   +-------------------+                     |                                 |   |\n"
        "|                                             |                                 |   |\n"
        "|   +-------------------+                     |                                 |   |\n"
        "|   |   HOSTEL ADMIN    |---(Cycle / Seed)--> |                                 |   |\n"
        "|   |                   |<--(Analytics)------ |                                 |   |\n"
        "|   +-------------------+                     +---------------------------------+   |\n"
        "+-----------------------------------------------------------------------------------+\n"
    )
    r_art = p_dfd0.add_run(dfd0_art)
    r_art.font.name = 'Consolas'
    r_art.font.size = Pt(8.5)
    r_art.font.color.rgb = PRIMARY_COLOR

    add_heading3("4.1.2 DFD Level 1 (Functional Decomposition Diagram)")
    add_paragraph("The Level 1 diagram decomposes the system into core sub-processes and underlying data stores:")
    add_bullet("Process 1.0 (Auth & Access Control): ", "Authenticates credentials against D1 (Users) and issues signed JWT bearer tokens.")
    add_bullet("Process 2.0 (Inventory & Cycle Management): ", "Records building blocks and schedules in D2 (Inventory) and D3 (Cycles).")
    add_bullet("Process 3.0 (Application & Eligibility Engine): ", "Validates student submissions, checks academic policies, and updates D4 (Applications).")
    add_bullet("Process 4.0 (Compatibility Vectorizer): ", "Encrypts lifestyle surveys via AES-256-GCM and records normalized traits in D5 (Compatibility Responses).")
    add_bullet("Process 5.0 (Seeded Deferred Matching Engine): ", "Executes stable matching algorithm with random seed; produces tentative allocations in D6 (Drafts & Assignments).")
    add_bullet("Process 6.0 (Warden Review & Overrides): ", "Renders visual floor maps; logs manual waitlist promotions in D7 (Audit Log).")
    add_bullet("Process 7.0 (Atomic Publication & PDF Generation): ", "Executes multi-document transaction mutating D2 (Beds -> OCCUPIED), finalizes cycle in D3, and streams signed PDF letters.")

    add_heading3("4.1.3 Data Stores Reference")
    add_bullet("D1: Users: ", "Stores student, warden, and admin accounts, salted password hashes, and RBAC roles.")
    add_bullet("D2: Inventory: ", "Stores Hostels, Wings, Rooms, and Bed documents with live occupancy status.")
    add_bullet("D3: Cycles: ", "Stores allocation round titles, academic year, semester, window dates, and status.")
    add_bullet("D4: Applications: ", "Stores candidate GPA, home distance, fee clearance, and eligibility states.")
    add_bullet("D5: Preferences & Vectors: ", "Stores ranked hostel preferences and encrypted questionnaire payloads.")
    add_bullet("D6: Drafts & Assignments: ", "Stores tentative draft runs, candidate-bed pairings, and waitlist queues.")
    add_bullet("D7: Audit Log: ", "Immutable historical record of warden overrides, draft approvals, and publications.")

    doc.add_page_break()

    # ==========================
    # SECTIONS 5 & 6: LINKS
    # ==========================
    add_heading1("5. GitHub Link")
    add_paragraph("The complete version-controlled source code repository containing both frontend Single Page Application and backend API service, unit tests, Docker configurations, and documentation is hosted publicly at:")
    
    p_git = doc.add_paragraph()
    r_git = p_git.add_run("https://github.com/Prem836/Hostel-Allocation-and-Roommate-Matching-System.git")
    r_git.font.name = 'Consolas'
    r_git.font.size = Pt(11)
    r_git.font.bold = True
    r_git.font.color.rgb = ACCENT_COLOR
    p_git.paragraph_format.space_after = Pt(18)

    add_heading1("6. Deployed Link")
    add_paragraph("The production software has been deployed to high-availability cloud infrastructure and is accessible via the following public endpoints:")

    add_bullet("Live Frontend Web Application (Vercel Edge): ", "https://hostel-allocation-and-roommate-matc.vercel.app/")
    add_bullet("Live Backend RESTful API Service (Render Cloud): ", "https://hostel-api-26qj.onrender.com")
    add_bullet("Backend Health Check Gateway: ", "https://hostel-api-26qj.onrender.com/health")
    add_bullet("Database Infrastructure: ", "MongoDB Atlas Multi-AZ Cluster (Replica Set: atlas-ho9hah-shard-0)")
    add_bullet("Message Queue & Caching Broker: ", "Upstash Redis (TLS 6379, primary-panther-160610.upstash.io)")

    # Output file paths
    dest1 = r"c:\Users\Asus\Downloads\Documents\CA3_Report_Hostel_Allocation_Prem_Singh.docx"
    dest2 = r"d:\Hostel_Allocation\CA3_PROJECT_REPORT_SRS.docx"

    doc.save(dest1)
    doc.save(dest2)
    print(f"Report successfully saved to:\n1. {dest1}\n2. {dest2}")

if __name__ == '__main__':
    create_report()
