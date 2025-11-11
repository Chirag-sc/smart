# 🎓 ACAD SYNC – Academic Management System

A comprehensive **role-based School Management System** built using the **MERN Stack** (MongoDB, Express.js, React.js, Node.js).  
ACAD SYNC streamlines communication and data flow between **Students**, **Parents**, and **Teachers** through secure, real-time dashboards.

---

## 🚀 Features

### 🧑‍🎓 Student Dashboard
- View personal academic records and attendance.
- Access course materials and announcements.
- Upload and manage assignments.

### 👨‍👩‍👧 Parent Dashboard
- View real-time academic performance of children.
- Access attendance reports and teacher announcements.
- Personalized mark tables extracted from uploaded Excel sheets.

### 👩‍🏫 Teacher Dashboard
- Manage students, attendance, and grades.
- Upload Excel sheets containing marks (system extracts data by **USN keyword**).
- Post announcements for specific classes or groups.

### 🧠 Admin Features (optional)
- Manage users (Students, Teachers, Parents).
- Role-based access control using **JWT Authentication**.
- Centralized database integration.

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React.js, Tailwind CSS / Material UI |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ORM) |
| **Authentication** | JWT (JSON Web Tokens) |
| **File Uploads** | Multer |
| **Excel Processing** | XLSX / ExcelJS |
| **OCR Integration (optional)** | PaddleOCR (for Student ID recognition) |

---

## 📊 Excel-Based Marks Upload System

Teachers can upload an Excel sheet with student marks.  
The system automatically:
1. Extracts data based on **USN (Unique Student Number)** keywords.
2. Stores results in the database.
3. Displays personalized mark tables in each Parent’s dashboard.

---

## 🔐 Authentication

- Secure login using **JWT tokens**.
- Different access levels for Students, Parents, and Teachers.
- Protected routes for sensitive data.

---

## 🏗️ Folder Structure

