# 🚀 Team Task Manager

A full-stack, dynamic web application designed to help teams organize projects, assign tasks, and track progress effortlessly. Built with **Flask**, **SQLAlchemy**, and a pure **Vanilla HTML/CSS/JS** frontend, this project is lightweight, blazing fast, and production-ready.

---

## ✨ Features

- **Role-Based Access Control (RBAC):**
  - **Admins:** Full control over creating projects, assigning tasks, managing team members, and editing project descriptions.
  - **Members:** Ability to view their assigned tasks, update task statuses (e.g., Todo -> In Progress -> Done), and track their workload.
- **Dynamic Dashboard:** A beautiful, responsive, glassmorphism-inspired UI that updates instantly without page reloads.
- **Task Management:** Create, assign, update, and track tasks across different projects.
- **Secure Authentication:** JSON Web Tokens (JWT) based authentication with Bcrypt password hashing.
- **Production Ready:** Pre-configured for seamless cloud deployment on Railway using PostgreSQL and Gunicorn.

---

## 🛠️ Tech Stack

### Backend
- **Python 3.11**
- **Flask** (Web Framework)
- **Flask-SQLAlchemy** (ORM for Database)
- **Flask-JWT-Extended** (Secure Authentication)
- **Flask-Bcrypt** (Password Hashing)
- **Gunicorn** (Production Web Server)
- **PostgreSQL** (Production Database) & **SQLite** (Local Development)

### Frontend
- **HTML5 & Vanilla CSS3** (Custom design system, animations, glassmorphism)
- **Vanilla JavaScript** (State management, DOM manipulation, Fetch API)

---

## 💻 Local Development Setup

Follow these steps to run the application on your local machine.

### Prerequisites
- [Python 3.8+](https://www.python.org/downloads/) installed.

### 1. Clone the repository
If you have Git installed, clone the repo. Otherwise, download the ZIP and extract it.
```bash
git clone https://github.com/your-username/team-task-manager.git
cd "team-task-manager"
```

### 2. Create a Virtual Environment (Optional but Recommended)
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Set Environment Variables
Create a `.env` file in the root directory (optional) or just rely on the defaults.
```env
SECRET_KEY=super-secret-key-123
JWT_SECRET_KEY=super-jwt-secret-key
# Defaults to local SQLite if DATABASE_URL is not set
```

### 5. Run the Application
```bash
python app.py
```
The app will be running at `http://127.0.0.1:5000`.

---

## 🚂 Deployment to Railway

This project is perfectly configured to be deployed on [Railway.app](https://railway.app/).

1. **Upload to GitHub:** Push this entire repository (including the `static` folder, `requirements.txt`, and `Procfile`) to a GitHub repository.
2. **Connect Railway:** Create a new project on Railway and select "Deploy from GitHub repo".
3. **Add Database:** Add a **PostgreSQL** database service to your Railway project.
4. **Set Variables:** In your Railway Web Service, go to the **Variables** tab and add:
   - `DATABASE_URL` (Copy this from your Railway Postgres service)
   - `PORT` = `8000`
   - `SECRET_KEY` = `<your-random-secret-password>`
   - `JWT_SECRET_KEY` = `<your-random-jwt-password>`
5. **Generate Domain:** Go to Settings -> Networking and generate a public domain. Your app is now live!

---

## 📁 Project Structure

```text
team-task-manager/
│
├── app.py                 # Main Flask application and server entry point
├── config.py              # Configuration handling (Env vars & Database URI)
├── models.py              # SQLAlchemy Database Models (User, Project, Task)
├── routes.py              # API Endpoints (Auth, Users, Projects, Tasks, Stats)
├── requirements.txt       # Python dependencies
├── Procfile               # Railway/Heroku deployment start command
├── runtime.txt            # Python version for cloud deployment
│
└── static/                # Frontend Assets
    ├── index.html         # Main Single-Page Application HTML
    ├── css/
    │   └── style.css      # UI styling, glassmorphism, animations
    └── js/
        └── app.js         # Frontend state management and API integration
```

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-username/team-task-manager/issues).

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).
