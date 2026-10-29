# Policy-Driven Hostel Allocation Engine with Roommate Compatibility Matching (P03)

An end-to-end institutional hostel room allocation and roommate matching platform built with the Track J stack (Next.js, Node.js + Express, MongoDB with Replica Set, BullMQ + Redis).

## 🏛 Architecture & Modules
- **M1: Inventory Management** – Hostels, blocks, floors, rooms, and individual beds with accessibility tags.
- **M2: Application Intake** – Allocation cycles, submission windows, student applications.
- **M3: Eligibility Engine** – Policy rule validation with explainable rejection reasons.
- **M4: Preference Capture** – Ranked hostel and room type preferences.
- **M5: Compatibility Questionnaire** – Consent-based lifestyle survey; encrypted at rest; pairwise similarity scoring.
- **M6: Allocation Engine** – Deterministic, seeded background allocation worker honoring hard and soft constraints.
- **M7: Warden Review** – Interactive bed map with manual overrides requiring mandatory written justification.
- **M8: Waitlist Management** – Ordered waitlist with automated vacancy promotion.
- **M9: Publication & Records** – Transactional publication, PDF allocation letters, and immutable audit logs.

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Redis & MongoDB

### 2. Environment Setup
```bash
cp .env.example .env
```

### 3. Start Infrastructure
```bash
docker compose up -d
```

### 4. Install & Run
```bash
npm install
npm run dev
```

