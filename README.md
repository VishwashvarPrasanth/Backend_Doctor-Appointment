# DocCare | Modern Doctor Appointment System

A complete end-to-end backend system built with **Express**, **PostgreSQL**, **Sequelize**, **BullMQ (Redis)**, and **Docker**.

## 🚀 Key Features

*   **Premium Authentication**: Secure login and registration for Patients, Doctors, and Admins.
*   **Appointment Booking**: Real-time availability checking and conflict management.
*   **Background Jobs**: Automated system tracking and simulated email notifications.
*   **Dockerized Stack**: Fully configured for production-like deployment.
*   **Modern UI**: Sleek, responsive frontend included for instant demonstration.

## 🛠 Tech Stack

*   **Runtime**: Node.js (v20+)
*   **Database**: PostgreSQL 15
*   **Cache/Queue**: Redis 7 (BullMQ)
*   **ORM**: Sequelize
*   **Deployment**: Docker & Docker Compose

## 📦 Deployment Guide

### 1. Requirements
*   **Docker** and **Docker Compose** installed on your machine.

### 2. Environment Setup
Create a `.env` file in the root directory and copy the contents from `.env.example`:
```bash
cp .env.example .env
```

### 3. Build & Launch
Use Docker Compose to build and start the entire stack (API, PostgreSQL, Redis) in one command:
```bash
docker-compose up --build -d
```

### 4. Seed Initial Data
Once the containers are running, populate the database with sample doctors and an admin:
```bash
docker exec -it express_api node seed.js
```

### 5. Access the Project
*   **Frontend**: Open [http://localhost:3000](http://localhost:3000) in your browser.
*   **API Docs**: Check [http://localhost:3000/api/doctors](http://localhost:3000/api/doctors) to see the system in action.

## 📁 Project Structure

*   `/controllers`: Request handling logic.
*   `/models`: Sequelize database schemas.
*   `/routes`: API route definitions.
*   `/workers`: Background task processing.
*   `/public`: Modern Glassmorphism Frontend.
*   `/jobs`: Automated cron job schedules.
