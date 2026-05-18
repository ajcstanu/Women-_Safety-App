# Women Safety App – Python Backend

## Overview

The Women Safety App backend is a Python-based system designed to support emergency safety features such as SOS alerts, live location tracking, emergency contact management, incident reporting, and AI-assisted safety functionalities.

The backend handles:

* User authentication
* Emergency SOS services
* Real-time location support
* Incident reporting
* Emergency contact management
* Data storage and retrieval
* AI-based assistance features

This project is structured using multiple Python modules for better maintainability and scalability.

---

# Project Structure

```bash
Women-_Safety-App-main/
│
├── Auth.py                     # Authentication logic
├── Auth utils.py               # Authentication helper utilities
├── Contacts.py                 # Emergency contacts management
├── Incidents.py                # Incident reporting system
├── Location.py                 # Location handling and tracking
├── Main.py                     # Main application entry point
├── Store.py                    # Storage/database handling
├── ai.py                       # AI-based functionalities
├── sos.py                      # SOS emergency alert system
├── server.py                   # Backend server setup
├── docker-compose.yml          # Docker deployment configuration
├── shield-app.html             # Frontend UI page
├── shield_app_how_it_works.html# Documentation/guide page
└── README.md                   # Existing project readme
```

---

# Features

## 1. User Authentication

Implemented in:

* `Auth.py`
* `Auth utils.py`

Features:

* User login
* User registration
* Credential validation
* Session/token handling
* Authentication utilities

---

## 2. SOS Emergency System

Implemented in:

* `sos.py`

Features:

* Emergency SOS trigger
* Alert notifications
* Rapid emergency response workflow
* Contact notification support

---

## 3. Live Location Tracking

Implemented in:

* `Location.py`

Features:

* Real-time location updates
* GPS/location sharing
* Emergency tracking support
* Location storage

---

## 4. Emergency Contacts Management

Implemented in:

* `Contacts.py`

Features:

* Add emergency contacts
* Remove contacts
* Update contact information
* Retrieve saved contacts

---

## 5. Incident Reporting

Implemented in:

* `Incidents.py`

Features:

* Report incidents
* Store incident details
* Track reported cases
* Incident history management

---

## 6. AI Assistance

Implemented in:

* `ai.py`

Features:

* AI-powered assistance
* Smart recommendations
* Safety analysis support
* Automated responses

---

## 7. Data Storage

Implemented in:

* `Store.py`

Features:

* Data persistence
* Database/storage operations
* User information management
* Incident and location storage

---

# Technologies Used

## Backend

* Python 3.x
* Flask/FastAPI (depending on implementation)
* REST APIs

## Database

* Local storage / Database module

## Deployment

* Docker
* Docker Compose

---

# Installation Guide

## 1. Clone the Repository

```bash
git clone <repository-url>
cd Women-_Safety-App-main
```

---

## 2. Create Virtual Environment

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux/Mac

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

If `requirements.txt` is not available, manually install:

```bash
pip install flask requests pandas
```

---

# Running the Backend

## Run Main Application

```bash
python Main.py
```

OR

```bash
python server.py
```

---

# Docker Deployment

## Start Using Docker Compose

```bash
docker-compose up --build
```

## Stop Containers

```bash
docker-compose down
```

---

# API Workflow

## Authentication Flow

1. User registers/login
2. Credentials validated
3. Session/token generated
4. Access granted

---

## SOS Flow

1. User presses SOS button
2. Current location fetched
3. Emergency contacts notified
4. Incident logged
5. Authorities/guardians alerted

---

## Incident Reporting Flow

1. User submits incident details
2. Backend validates data
3. Incident stored in database
4. Admin/system can review reports

---

# Example Backend Endpoints

## Authentication

```http
POST /login
POST /register
```

## SOS

```http
POST /sos
```

## Location

```http
POST /location
GET /location/<user_id>
```

## Contacts

```http
POST /contacts
GET /contacts
DELETE /contacts/<id>
```

## Incidents

```http
POST /incident
GET /incidents
```

---

# Security Features

* Secure authentication
* Protected user data
* Emergency contact validation
* Incident data handling
* Secure API communication

---

# Future Improvements

* Real-time push notifications
* SMS integration
* Voice activation SOS
* AI threat detection
* Live map visualization
* Admin dashboard
* Cloud database integration
* Mobile app integration

---

# Testing

## Run Application

```bash
python Main.py
```

## Test APIs

Use:

* Postman
* Thunder Client
* cURL

Example:

```bash
curl -X POST http://localhost:5000/sos
```

---

# Deployment Recommendations

For production deployment:

* Use Gunicorn/Uvicorn
* Configure environment variables
* Use HTTPS
* Deploy using Docker
* Configure cloud database
* Add logging and monitoring

---

# Troubleshooting

## Module Not Found Error

```bash
pip install <module-name>
```

## Port Already in Use

Change server port in:

* `server.py`
* `Main.py`

---

# Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to your branch
5. Create a Pull Request

---

# License

This project is developed for educational and safety purposes.

---

# Conclusion

This backend system provides a strong foundation for a Women Safety Application by combining emergency response systems, live location tracking, incident management, AI assistance, and secure user handling in a modular Python architecture.
