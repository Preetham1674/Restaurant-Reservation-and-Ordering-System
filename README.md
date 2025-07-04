# 🍽️ Restaurant Reservation and Ordering System

A full-stack web application for restaurant table reservation and online food ordering. This project is built using **React** (frontend), **Node.js** (backend), and **MySQL** (database). The app is **fully deployable on AWS** and leverages multiple AWS services for a scalable and production-ready environment.

## 🚀 Features

- ✅ Table Reservation System
- 🍔 Online Food Ordering with Dynamic Menu
- 🛒 Cart Management and Order Summary
- 👨‍🍳 Menu and Reservation Management
- 📦 AWS-deployable with cloud database and image storage

## 🧑‍💻 Tech Stack

### Frontend

- React.js
- Axios for API calls
- Hosted as static files in **AWS S3**

### Backend

- Node.js + Express.js
- Deployed using **AWS Elastic Beanstalk**

### Database

- MySQL
- Hosted on **Amazon RDS**

### Storage

- **Amazon S3** for storing:
  - Static frontend files
  - Uploaded images (e.g., menu items, dishes)

## 🛠️ Deployment Architecture

React Frontend (S3 Static Hosting)
|
\| (API Requests)
▼
Node.js Backend (Elastic Beanstalk)
|
\| (SQL Queries)
▼
MySQL Database (AWS RDS)

- All services are deployed and integrated within **AWS infrastructure**.
- The frontend hosted on **S3** communicates securely with the **Elastic Beanstalk** backend.
- Backend interacts with the **RDS** database to manage orders, users, and reservations.

## 🔧 Getting Started Locally

### Prerequisites

- Node.js & npm
- MySQL
- AWS CLI (optional for deployment)

### Steps

# Clone the repository

git clone https://github.com/Preetham1674/Restaurant-Reservation-and-Ordering-System.git

# Install backend dependencies

cd server
npm install

# Install frontend dependencies

cd ../client
npm install

# Start development servers

npm start # For frontend

# In another terminal

cd ../server
npm start # For backend

## 🌐 Live Deployment

This application can be deployed, using:

- **Amazon RDS** for the MySQL database
- **Amazon S3** for:

  - Image storage
  - Hosting static frontend

- **AWS Elastic Beanstalk** for backend hosting

> 📡 All components communicate seamlessly over HTTP/HTTPS within AWS.
