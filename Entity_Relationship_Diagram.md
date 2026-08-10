# 🏥 Doctor Appointment System — Flow Diagrams

---

## 1. 👤 User Flow: Login → Book Appointment

```mermaid
flowchart TD
    A([🟢 User Opens App]) --> B[POST /api/auth/register\nor /api/auth/login]

    subgraph AUTH ["🔐 Authentication Layer"]
        B --> C{Already has account?}
        C -- No --> D["POST /api/auth/register\n{ name, email, password, role: 'User' }"]
        D --> D1[(Users table\npassword_hash saved\nrole = 'User')]
        D1 --> E[✅ 201: Registered Successfully]
        E --> F["POST /api/auth/login\n{ email, password }"]
        C -- Yes --> F
        F --> G{DB: email found\n& password matches?}
        G -- ❌ No --> H[401: Email or Password Incorrect]
        G -- ✅ Yes --> I["🎟️ JWT Token Generated\n{ id, role, expiresIn: '1h' }"]
        I --> J[Token returned to client]
    end

    subgraph BROWSE ["🔍 Browse Doctors (Public)"]
        J --> K["GET /api/doctors\n?specialization=Cardiology (optional)"]
        K --> L["No Auth Required\nDB: SELECT active doctors\n+ JOIN Users for name/email"]
        L --> M[📋 List of Doctors returned]
    end

    subgraph BOOK ["📅 Book Appointment (Protected)"]
        M --> N["User picks doctor + date/time\nPOST /api/appointments/\n{ doctorId, appointmentDate }"]
        N --> O["🔒 verifyToken Middleware\nReads: Authorization: Bearer <token>"]
        O --> P{Token valid?}
        P -- ❌ No --> Q[401: Access Denied]
        P -- ✅ Yes --> R["authorize(['User'])\nCheck role == 'User'"]
        R --> S{Role = 'User'?}
        S -- ❌ No --> T[403: Forbidden]
        S -- ✅ Yes --> U["bookingService.checkInAvailability()\nIs doctor working that day/time?"]
        U --> V{Available?}
        V -- ❌ No --> W[400: Doctor not available]
        V -- ✅ Yes --> X["bookingService.checkConflict()\nIs that slot already booked?"]
        X --> Y{Slot free?}
        Y -- ❌ No --> Z[409: Time Conflict: Already Booked]
        Y -- ✅ Yes --> AA["Appointment.create()\n{ doctorId, userId, appointmentDate,\nstatus: 'Scheduled' }"]
        AA --> AB[(Appointments table\nRecord created)]
        AB --> AC[✅ 201: Appointment Scheduled]
    end

    subgraph MANAGE ["🗂️ Manage Appointments"]
        AC --> AD["GET /api/appointments/\n→ User sees THEIR OWN appointments\n  + Doctor name JOIN"]
        AD --> AE{User wants to cancel?}
        AE -- Yes --> AF["PATCH /api/appointments/:id/status\n{ status: 'Cancelled' }"]
        AF --> AG{User owns it?}
        AG -- ❌ No --> AH[403: Unauthorized]
        AG -- ✅ Yes --> AI["appointment.status = 'Cancelled'\nappointment.save()"]
        AI --> AJ[✅ Appointment Cancelled]
    end
```

---

## 2. 🩺 Doctor Flow: Create Account → Manage Profile & Slots

```mermaid
flowchart TD
    A([🟢 Doctor Opens App]) --> B

    subgraph REGISTER ["📝 Doctor Registration"]
        B["POST /api/auth/register\n{ name, email, password,\n  role: 'Doctor',\n  specialization: 'Cardiology' }"]
        B --> C["User.create()\nrole = 'Doctor'\npassword_hash auto-hashed\nvia beforeCreate hook"]
        C --> C1[(Users table\nNew row created)]
        C1 --> D{role == 'Doctor'?}
        D -- ✅ Yes --> E["Doctor.create()\n{ userId: user.id,\n  specialization: 'Cardiology',\n  availability: default 9-5 all days }"]
        E --> E1[(Doctors table\nNew row created\nuserId = FK → Users.id)]
        E1 --> F[✅ 201: User Registered Successfully]
    end

    subgraph LOGIN ["🔐 Doctor Login"]
        F --> G["POST /api/auth/login\n{ email, password }"]
        G --> H["DB: Find user by email\nbcrypt.compare(password, hash)"]
        H --> I["🎟️ JWT Token Generated\n{ id: user.id, role: 'Doctor' }"]
        I --> J[Token stored client-side]
    end

    subgraph PROFILE ["✏️ Update Doctor Profile"]
        J --> K["PUT /api/doctors/profile\nAuthorization: Bearer <token>\n{ specialization, availability }"]
        K --> L["🔒 verifyToken Middleware\nDecodes JWT → req.user.id, req.user.role"]
        L --> M["Doctor.findOne({ userId: req.user.id })"]
        M --> N{Doctor profile exists?}
        N -- ❌ No --> O[404: Doctor profile not found]
        N -- ✅ Yes --> P["Update fields:\ndoctor.specialization = new value\ndoctor.availability = new schedule JSON"]
        P --> Q["doctor.save()\nAvailability stored as JSON string in DB"]
        Q --> R[✅ Doctor profile updated]
    end

    subgraph SLOTS ["📆 Availability Slots Format"]
        R --> S["availability JSON structure:\n{\n  Monday: ['09:00-17:00'],\n  Tuesday: ['09:00-17:00'],\n  Wednesday: ['09:00-17:00'],\n  Thursday: ['09:00-17:00'],\n  Friday: ['09:00-17:00'],\n  Saturday: ['09:00-17:00'],\n  Sunday: []\n}"]
    end

    subgraph APPOINTMENTS ["📋 View Doctor's Appointments"]
        S --> T["GET /api/appointments/\nAuthorization: Bearer <token>"]
        T --> U["verifyToken → role = 'Doctor'"]
        U --> V["Doctor.findOne({ userId: req.user.id })\n→ get doctorProfile.id"]
        V --> W["Appointment.findAll({ doctorId: doctorProfile.id })\n+ JOIN Users table → patient name & email"]
        W --> X[📋 All appointments for this doctor]
        X --> Y{Update appointment status?}
        Y -- Yes --> Z["PATCH /api/appointments/:id/status\n{ status: 'Completed' or 'Cancelled' }"]
        Z --> AA{This doctor owns appointment?}
        AA -- ❌ No --> AB[403: Unauthorized]
        AA -- ✅ Yes --> AC["appointment.status = new status\nappointment.save()"]
        AC --> AD[✅ Status Updated]
    end
```

---

## 3. 🗄️ Database Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS {
        UUID id PK "Auto-generated UUIDv4"
        STRING name "NOT NULL"
        STRING email UK "UNIQUE, NOT NULL"
        STRING password_hash "bcrypt hashed, NOT NULL"
        ENUM role "Admin | Doctor | User  DEFAULT='User'"
        STRING status "DEFAULT='Active'"
        DATETIME createdAt "Auto by Sequelize"
        DATETIME updatedAt "Auto by Sequelize"
    }

    DOCTORS {
        UUID id PK "Auto-generated UUIDv4"
        UUID userId FK "→ USERS.id (NOT NULL)"
        STRING specialization "NOT NULL e.g. Cardiology"
        TEXT availability "JSON string: weekly schedule"
        STRING status "DEFAULT='Active'"
        DATETIME createdAt "Auto by Sequelize"
        DATETIME updatedAt "Auto by Sequelize"
    }

    APPOINTMENTS {
        UUID id PK "Auto-generated UUIDv4"
        UUID userId FK "→ USERS.id (patient, NOT NULL)"
        UUID doctorId FK "→ DOCTORS.id (NOT NULL)"
        DATE appointmentDate "Exact date + time, NOT NULL"
        STRING status "Scheduled | Completed | Cancelled"
        TEXT history "JSON array: status change log"
        DATETIME createdAt "Auto by Sequelize"
        DATETIME updatedAt "Auto by Sequelize"
    }

    USERS ||--o| DOCTORS : "hasOne (as: doctorProfile)"
    USERS ||--o{ APPOINTMENTS : "hasMany (as: appointments) [patient]"
    DOCTORS ||--o{ APPOINTMENTS : "hasMany (as: doctorAppointments)"
```

---

## 4. 🔗 Table Relationship Summary

| Relationship | Type | Foreign Key | Description |
|---|---|---|---|
| **Users → Doctors** | One-to-One (`hasOne`) | `Doctors.userId → Users.id` | Each Doctor user has exactly **one** Doctor profile |
| **Users → Appointments** | One-to-Many (`hasMany`) | `Appointments.userId → Users.id` | One patient can have **many** appointments |
| **Doctors → Appointments** | One-to-Many (`hasMany`) | `Appointments.doctorId → Doctors.id` | One doctor can have **many** appointments |

---

## 5. 🏗️ Middleware & Security Pipeline

```mermaid
flowchart LR
    REQ([HTTP Request]) --> A

    subgraph MW ["Middleware Chain"]
        A["rateLimiter\nMax requests per IP\nPrevent abuse"] --> B
        B["verifyToken\nDecode JWT from\nAuthorization header"] --> C
        C["authorize(roles)\nCheck user role matches\nrequired permission"]
    end

    C --> D([Route Handler /\nController])
    D --> E([HTTP Response])

    style MW fill:#1a1a2e,stroke:#7c3aed,color:#fff
    style A fill:#2d1b69,stroke:#7c3aed,color:#fff
    style B fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style C fill:#1a3a1a,stroke:#22c55e,color:#fff
```

---

## 6. 📡 Complete API Endpoint Map

| Method | Endpoint | Auth? | Roles Allowed | Controller |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ Public | Anyone | `authController.register` |
| `POST` | `/api/auth/login` | ❌ Public | Anyone | `authController.login` |
| `GET` | `/api/doctors` | ❌ Public | Anyone | `doctorController.getDoctors` |
| `PUT` | `/api/doctors/profile` | ✅ JWT | Doctor only | `doctorController.updateDoctorProfile` |
| `POST` | `/api/appointments/` | ✅ JWT | User only | `bookingController.bookAppointment` |
| `GET` | `/api/appointments/` | ✅ JWT | User, Doctor, Admin | `bookingController.getAppointments` |
| `PATCH` | `/api/appointments/:id/status` | ✅ JWT | User, Doctor, Admin | `bookingController.updateAppointmentStatus` |

---

## 7. 🔑 Role-Based Access Control Matrix

| Action | User (Patient) | Doctor | Admin |
|---|---|---|---|
| Register / Login | ✅ | ✅ | ✅ |
| Browse Doctors | ✅ | ✅ | ✅ |
| Book Appointment | ✅ | ❌ | ❌ |
| View Appointments | ✅ Own only | ✅ Own patients | ✅ All |
| Cancel Appointment | ✅ Own only | ❌ | ✅ Any |
| Mark Completed/Cancelled | ❌ | ✅ Own appointments | ✅ Any |
| Update Doctor Profile | ❌ | ✅ Own profile | ❌ |
