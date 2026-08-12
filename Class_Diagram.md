# 🏗️ Backend Architecture — Class & File Diagrams

> **Doctor Appointment System** — Express.js + Sequelize + PostgreSQL

---

## 1. 📦 Full File Dependency Map

```mermaid
graph TD
    ENV[".env\n📄 Environment Variables"]
    IDX["index.js\n🚪 Entry Point"]
    DB["config/db.js\n🗄️ Sequelize Connection"]

    %% Routes
    AR["routes/auth.js\n🛣️ /api/auth"]
    BR["routes/booking.js\n🛣️ /api/appointments"]
    DR["routes/doctor.js\n🛣️ /api/doctors"]

    %% Controllers
    AC["controllers/authController.js\n🧠 Auth Logic"]
    BC["controllers/bookingController.js\n🧠 Booking Logic"]
    DC["controllers/doctorController.js\n🧠 Doctor Logic"]

    %% Middleware
    MA["middleware/auth.js\n🔐 verifyToken + authorize"]
    ME["middleware/error.js\n❌ errorHandler + notFound"]
    ML["middleware/rateLimiter.js\n🚦 apiLimiter"]

    %% Services
    BS["services/bookingService.js\n⚙️ checkAvailability + checkConflict"]

    %% Models
    MI["models/index.js\n🔗 Associations"]
    MU["models/User.js\n👤 User Model"]
    MD["models/Doctor.js\n🩺 Doctor Model"]
    MAP["models/Appointment.js\n📅 Appointment Model"]

    %% Entry point wires everything
    ENV --> IDX
    IDX --> DB
    IDX --> AR
    IDX --> BR
    IDX --> DR
    IDX --> ML
    IDX --> MI

    %% Routes → Controllers
    AR --> AC
    BR --> BC
    BR --> MA
    DR --> DC
    DR --> MA

    %% Controllers → Services
    BC --> BS

    %% Controllers → Models
    AC --> MU
    AC --> MD
    BC --> MAP
    BC --> MU
    BC --> MD
    DC --> MD
    DC --> MU

    %% Services → Models
    BS --> MAP
    BS --> MD

    %% Models index → individual models
    MI --> MU
    MI --> MD
    MI --> MAP

    %% Models → DB
    MU --> DB
    MD --> DB
    MAP --> DB

    %% Error middleware
    ME --> IDX

    style IDX fill:#6c63ff,color:#fff
    style DB fill:#2196f3,color:#fff
    style MA fill:#ff9800,color:#fff
    style ML fill:#ff9800,color:#fff
    style ME fill:#f44336,color:#fff
    style MU fill:#4caf50,color:#fff
    style MD fill:#4caf50,color:#fff
    style MAP fill:#4caf50,color:#fff
    style BS fill:#9c27b0,color:#fff
```

---

## 2. 🗂️ Class Diagram — Models & Their Relationships

```mermaid
classDiagram
    class User {
        +UUID id PK
        +STRING name
        +STRING email UNIQUE
        +STRING password_hash
        +ENUM role [Admin|Doctor|User]
        +STRING status
        --
        Hook: beforeCreate()
        bcrypt.hash(password, 10)
    }

    class Doctor {
        +UUID id PK
        +UUID userId FK
        +STRING specialization
        +TEXT availability JSON
        +STRING status
        --
        get availability() → Object
        set availability(val)
    }

    class Appointment {
        +UUID id PK
        +UUID userId FK
        +UUID doctorId FK
        +DATE appointmentDate
        +STRING status [Scheduled|Completed|Cancelled]
        +TEXT history JSON
        --
        get history() → Array
        set history(val)
    }

    User "1" --> "0..1" Doctor : hasOne [doctorProfile]
    User "1" --> "0..*" Appointment : hasMany [appointments]
    Doctor "1" --> "0..*" Appointment : hasMany [doctorAppointments]
    Appointment "0..*" --> "1" User : belongsTo [patient]
    Appointment "0..*" --> "1" Doctor : belongsTo [doctor]
```

---


## 3. 🔐 Middleware Class Diagram

```mermaid
classDiagram
    class AuthMiddleware {
        <<middleware/auth.js>>
        +verifyToken(req, res, next)
        +authorize(roles[]) middleware
        --
        Reads: Authorization header
        Verifies: JWT_SECRET
        Sets: req.user ← {id, role}
    }

    class ErrorMiddleware {
        <<middleware/error.js>>
        +errorHandler(err, req, res, next)
        +notFound(req, res, next)
        --
        Uses: config/logger
        Returns: JSON error + stack
    }

    class RateLimiter {
        <<middleware/rateLimiter.js>>
        +apiLimiter middleware
        --
        windowMs: 15 min
        max: 100 requests/IP
        Status: 429 on exceed
    }

    AuthMiddleware ..> "routes/booking.js" : guards
    AuthMiddleware ..> "routes/doctor.js" : guards
    RateLimiter ..> "index.js" : applied to /api/*
    ErrorMiddleware ..> "index.js" : global handler
```

---
## 4. 🛣️ Routes → Controllers → Services Flow

```mermaid
classDiagram
    class AuthRoutes {
        <<routes/auth.js>>
        POST /register → authController.register
        POST /login → authController.login
    }

    class BookingRoutes {
        <<routes/booking.js>>
        USE verifyToken [ALL routes]
        POST / → authorize[User] → bookAppointment
        GET / → authorize[User|Doctor|Admin] → getAppointments
        PATCH /:id/status → authorize[All] → updateAppointmentStatus
    }

    class DoctorRoutes {
        <<routes/doctor.js>>
        GET / → getDoctors [PUBLIC]
        PUT /profile → verifyToken → authorize[Doctor] → updateDoctorProfile
    }

    class AuthController {
        <<controllers/authController.js>>
        +register(req, res)
        +login(req, res)
        --
        Uses: User, Doctor models
        Uses: jwt, bcrypt
    }

    class BookingController {
        <<controllers/bookingController.js>>
        +bookAppointment(req, res)
        +getAppointments(req, res)
        +updateAppointmentStatus(req, res)
        --
        Uses: bookingService
        Uses: Appointment, User, Doctor
    }

    class DoctorController {
        <<controllers/doctorController.js>>
        +getDoctors(req, res)
        +updateDoctorProfile(req, res)
        --
        Uses: Doctor, User models
        Uses: Op.like for search
    }

    class BookingService {
        <<services/bookingService.js>>
        +checkInAvailability(doctorId, date) bool
        +checkConflict(doctorId, date) bool
        --
        Uses: Doctor, Appointment
        Uses: Op.between
    }

    AuthRoutes --> AuthController
    BookingRoutes --> BookingController
    DoctorRoutes --> DoctorController
    BookingController --> BookingService
```

---

## 5. 🌐 Request Lifecycle — How a Request Flows

```mermaid
sequenceDiagram
    participant Client
    participant index.js
    participant RateLimiter
    participant AuthMiddleware
    participant Route
    participant Controller
    participant Service
    participant Model
    participant PostgreSQL

    Client->>index.js: HTTP Request
    index.js->>RateLimiter: Check rate limit (100 req/15min)
    RateLimiter-->>index.js: Allowed ✅
    index.js->>Route: Match /api/auth | /api/appointments | /api/doctors

    alt Protected Route
        Route->>AuthMiddleware: verifyToken
        AuthMiddleware-->>Route: req.user = {id, role}
        Route->>AuthMiddleware: authorize([roles])
        AuthMiddleware-->>Route: Role OK ✅
    end

    Route->>Controller: Call handler function
    
    opt Booking routes only
        Controller->>Service: checkInAvailability()
        Service->>Model: Doctor.findByPk()
        Model->>PostgreSQL: SELECT
        PostgreSQL-->>Model: Doctor row
        Model-->>Service: doctor.availability
        Service-->>Controller: true/false

        Controller->>Service: checkConflict()
        Service->>Model: Appointment.findOne()
        Model->>PostgreSQL: SELECT WHERE BETWEEN
        PostgreSQL-->>Model: existing
        Service-->>Controller: true/false
    end

    Controller->>Model: Create / FindAll / FindByPk / Save
    Model->>PostgreSQL: SQL Query
    PostgreSQL-->>Model: Result
    Model-->>Controller: Data
    Controller-->>Client: JSON Response
```

---

## 6. 🗄️ Database Table Layout

| Table | Key Columns | Foreign Keys |
|-------|------------|--------------|
| **Users** | `id (UUID PK)`, `name`, `email (UNIQUE)`, `password_hash`, `role (Admin/Doctor/User)`, `status` | — |
| **Doctors** | `id (UUID PK)`, `userId`, `specialization`, `availability (JSON)`, `status` | `userId → Users.id` |
| **Appointments** | `id (UUID PK)`, `userId`, `doctorId`, `appointmentDate`, `status (Scheduled/Completed/Cancelled)`, `history (JSON)` | `userId → Users.id`, `doctorId → Doctors.id` |

---

## 7. 📁 File-by-File Import Map

| File | Imports From |
|------|-------------|
| [`index.js`](file:///d:/Backend/index.js) | `express`, `cors`, `dotenv`, `config/db`, `routes/auth`, `routes/booking`, `routes/doctor`, `middleware/rateLimiter`, `models/` |
| [`config/db.js`](file:///d:/Backend/config/db.js) | `sequelize`, `.env` |
| [`models/User.js`](file:///d:/Backend/models/User.js) | `sequelize`, `bcryptjs`, `config/db` |
| [`models/Doctor.js`](file:///d:/Backend/models/Doctor.js) | `sequelize`, `config/db` |
| [`models/Appointment.js`](file:///d:/Backend/models/Appointment.js) | `sequelize`, `config/db` |
| [`models/index.js`](file:///d:/Backend/models/index.js) | `models/User`, `models/Doctor`, `models/Appointment` |
| [`routes/auth.js`](file:///d:/Backend/routes/auth.js) | `express`, `controllers/authController` |
| [`routes/booking.js`](file:///d:/Backend/routes/booking.js) | `express`, `controllers/bookingController`, `middleware/auth` |
| [`routes/doctor.js`](file:///d:/Backend/routes/doctor.js) | `express`, `controllers/doctorController`, `middleware/auth` |
| [`controllers/authController.js`](file:///d:/Backend/controllers/authController.js) | `models/` (User, Doctor), `jsonwebtoken`, `bcryptjs` |
| [`controllers/bookingController.js`](file:///d:/Backend/controllers/bookingController.js) | `models/` (Appointment, User, Doctor), `services/bookingService` |
| [`controllers/doctorController.js`](file:///d:/Backend/controllers/doctorController.js) | `models/` (Doctor, User), `sequelize` (Op) |
| [`middleware/auth.js`](file:///d:/Backend/middleware/auth.js) | `jsonwebtoken` |
| [`middleware/error.js`](file:///d:/Backend/middleware/error.js) | `config/logger` |
| [`middleware/rateLimiter.js`](file:///d:/Backend/middleware/rateLimiter.js) | `express-rate-limit` |
| [`services/bookingService.js`](file:///d:/Backend/services/bookingService.js) | `models/Appointment`, `models/Doctor`, `sequelize` (Op) |
