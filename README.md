# CampusCare — College & Hostel Complaint Management System

CampusCare is a portfolio-ready starter project for managing college and hostel complaints.

## Technology
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Authentication: JWT + bcrypt password hashing

## Features
- Student registration and login
- Submit complaints with category, location, description, and priority
- Students can view their own complaints and status
- Admin can view all complaints and update status
- Basic role-based API protection
- Responsive UI starter

## Requirements
Install Node.js LTS and MongoDB Community Server, or use a MongoDB Atlas connection string.

## Setup

### 1. Backend
Open a terminal in `CampusCare/server`:
cd server
npm install
copy .env.example .env
npm run seed
npm run dev

### 2. Frontend
Open another terminal in `CampusCare/client`:

```bash
cd client
npm install
npm run dev -- --host 0.0.0.0 
```

Open the Vite URL printed in the terminal, usually `http://localhost:5174`.

## Suggested demo flow
1. Register a student account.
2. Sign in and submit a complaint.
3. Sign out and sign in with the configured admin account.
4. Update the complaint status from the admin dashboard.
5. Sign back in as the student to see the updated status.
