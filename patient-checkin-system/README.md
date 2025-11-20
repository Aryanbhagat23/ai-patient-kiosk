# AI-Powered Patient Check-In System

## 🚀 Quick Start

This project consists of a React frontend and a Python (FastAPI) backend. You must run both.

### 1. Backend Setup
Open a terminal in the `backend` folder:
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the server
# (This will also download AI models on first run)
uvicorn main:app --reload --port 8000

Let's get this on GitHub! Here is the complete, step-by-step process.

This guide will make sure you do not upload your node_modules folder (which is huge) or your local database/images (which is bad practice and a privacy risk).

Step 1: Create the .gitignore File
This is the most important step. In your main project folder (the one that contains src and backend), create a new file named .gitignore (yes, it starts with a dot).

Paste this code into it:

Code snippet

# React
/node_modules
/build
.env

# Python
/backend/venv/
/backend/.venv/
__pycache__/
*.pyc

# Local Data (IMPORTANT - Do not upload!)
/backend/hospital.db
/backend/images/

# System files
.DS_Store
Thumbs.db
Step 2: Create the README.md File
This is the instruction manual for your team. Create a file named README.md in your main project folder.

Paste this into it:

Markdown

# AI-Powered Patient Check-In System

## 🚀 Quick Start

This project consists of a React frontend and a Python (FastAPI) backend. You must run both.

### 1. Backend Setup
Open a terminal in the `backend` folder:
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the server
# (This will also download AI models on first run)
uvicorn main:app --reload --port 8000
Wait for "Application startup complete".

2. Frontend Setup
Open a new, separate terminal in the main project folder:

Bash

# 1. Install dependencies
npm install

# 2. Run the app
npm start
The app will open at http://localhost:3000.

🔑 Default Staff Login
Username: admin

Password: password123


### Step 3: Create the GitHub Repository

1.  Go to [GitHub.com](https://github.com) and log in.
2.  Click the **+** icon in the top right and select **New repository**. 
3.  Name your repository (e.g., `ai-patient-kiosk`).
4.  Choose **Private**. This is critical for a health-related project, even a school one. You can invite your team members manually.
5.  **DO NOT** check "Add a README" or "Add .gitignore". We already created these.
6.  Click **Create repository**.

### Step 4: Upload Your Code

On the next page, GitHub shows you the commands. Copy them into your terminal from your **main project folder**.

```bash
# 1. Initialize Git (if you haven't already)
git init

# 2. Add ALL your files (it will skip files in .gitignore)
git add .

# 3. Save your files in a "commit"
git commit -m "Initial project commit"

# 4. Set the main branch name
git branch -M main

# 5. Link your local folder to GitHub (COPY THIS URL FROM GITHUB)
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git

# 6. Push (upload) your code
git push -u origin main