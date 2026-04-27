# GeoTrade — Complete GitHub Upload & Free Hosting Guide
# Written for Windows users (works on Mac too with small differences noted)

---

## OVERVIEW — What You're Doing

You will:
1. Install Git (tool that uploads code)
2. Create a free GitHub account (stores your code online)
3. Upload all your GeoTrade files to GitHub
4. Deploy the backend (Python) to Render.com — FREE
5. Deploy the frontend (React) to Vercel.com — FREE
6. Connect them so your app works on the internet

Total time: 30–45 minutes
Total cost: $0

---

## ══════════════════════════════════════════════
## PART 1: INSTALL GIT
## ══════════════════════════════════════════════

Git is the tool that sends your files to GitHub.

### Windows:
1. Go to: https://git-scm.com/download/win
2. Click the big download button (it auto-detects Windows)
3. Run the downloaded file (Git-2.x.x-64-bit.exe)
4. Click NEXT through every screen — keep all default settings
5. On the screen "Choosing the default editor" → select "Use Visual Studio Code" if shown
6. Keep clicking NEXT → click INSTALL → click FINISH

### Verify Git is installed:
1. Open VS Code
2. Press Ctrl+` (backtick key, top-left of keyboard) to open terminal
3. Type this and press Enter:
   git --version
4. You should see something like: git version 2.43.0.windows.1
   ✅ If you see a version number — Git is installed correctly
   ❌ If you see "git is not recognized" — restart VS Code and try again

---

## ══════════════════════════════════════════════
## PART 2: CREATE A GITHUB ACCOUNT
## ══════════════════════════════════════════════

1. Go to: https://github.com
2. Click "Sign up" in the top right
3. Enter your email address → Continue
4. Create a password → Continue
5. Enter a username (e.g. "yourname-dev") → Continue
6. Solve the puzzle verification
7. Check your email and enter the verification code
8. On "What kind of student or teacher are you?" → click "Skip personalization"
9. You now have a free GitHub account ✅

---

## ══════════════════════════════════════════════
## PART 3: CREATE A GITHUB REPOSITORY
## ══════════════════════════════════════════════

A repository (repo) is like a folder on GitHub that stores your project.

1. Make sure you're logged into github.com
2. Click the "+" icon in the top-right corner
3. Click "New repository"
4. Fill in:
   - Repository name: geotrade
   - Description: Geopolitical Trading Intelligence Platform
   - Select: Private (recommended — keeps your code private)
   - ⚠️ DO NOT check "Add a README file"
   - ⚠️ DO NOT check "Add .gitignore"
   - ⚠️ DO NOT check "Choose a license"
5. Click the green "Create repository" button
6. You'll see a page with setup instructions — KEEP THIS PAGE OPEN
   You'll need the URL shown (looks like: https://github.com/yourusername/geotrade.git)

---

## ══════════════════════════════════════════════
## PART 4: PREPARE YOUR FILES
## ══════════════════════════════════════════════

Before uploading, you need to add two important files.

### Step 4a — Add .gitignore file

This file tells Git which folders to SKIP (like node_modules which is huge).

1. Open VS Code
2. Open your geotrade folder: File → Open Folder → select the geotrade folder on your Desktop
3. In the Explorer panel (left side), click the "New File" icon next to the geotrade folder
4. Name it exactly: .gitignore (with the dot at the start)
5. Paste this content into it:

```
node_modules/
__pycache__/
*.pyc
.env
venv/
.venv/
backend/venv/
dist/
.DS_Store
*.log
```

6. Press Ctrl+S to save

### Step 4b — Update requirements.txt for hosting

The hosting server needs gunicorn to run your Python app.

1. Open the file: backend/requirements.txt
2. Replace all its contents with:

```
flask==3.0.3
flask-cors==4.0.1
gunicorn==21.2.0
```

3. Press Ctrl+S to save

### Step 4c — Create a Procfile for Render

1. Inside the backend folder, create a new file called: Procfile (no extension)
2. Add this single line:

```
web: gunicorn app:app
```

3. Press Ctrl+S to save

---

## ══════════════════════════════════════════════
## PART 5: UPLOAD TO GITHUB
## ══════════════════════════════════════════════

### Step 5a — Configure Git with your identity (one time only)

In the VS Code terminal, run these two commands (replace with your actual details):

```bash
git config --global user.email "you@example.com"
git config --global user.name "Your Name"
```

### Step 5b — Navigate to your geotrade folder

In the VS Code terminal:

Windows:
```bash
cd C:\Users\calim\OneDrive\Desktop\geotrade
```

(Replace "calim" with your actual Windows username)

Or if you're already in the folder, just check with:
```bash
pwd
```
It should show your geotrade path.

### Step 5c — Initialize Git and upload

Run these commands ONE BY ONE. Wait for each one to finish before typing the next:

```bash
git init
```
You should see: "Initialized empty Git repository in ..."

```bash
git add .
```
(No output is normal — it's staging all files)

```bash
git commit -m "Initial commit - GeoTrade v10"
```
You should see a list of files being committed.

```bash
git branch -M main
```
(No output is normal)

```bash
git remote add origin https://github.com/YOURUSERNAME/geotrade.git
```
⚠️ Replace YOURUSERNAME with your actual GitHub username
(No output is normal)

```bash
git push -u origin main
```
This uploads everything to GitHub.

### What happens when you push:

Option A — It asks for username and password:
- Username: your GitHub username
- Password: DO NOT use your GitHub password. Use a Personal Access Token (see below)

### How to create a Personal Access Token (PAT):
1. Go to: github.com → click your profile photo (top right) → Settings
2. Scroll all the way down the left sidebar → click "Developer settings"
3. Click "Personal access tokens" → "Tokens (classic)"
4. Click "Generate new token" → "Generate new token (classic)"
5. Note (description): GeoTrade Upload
6. Expiration: 90 days
7. Check the box next to "repo" (this gives access to your repositories)
8. Scroll down → click "Generate token"
9. COPY THE TOKEN NOW — you won't see it again!
   It looks like: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxx
10. Use this token as your "password" when Git asks

Option B — It opens a browser window asking you to log in:
- Just log in with your GitHub account in the browser
- Come back to VS Code — the push will complete automatically

### Verify the upload worked:
1. Go to: https://github.com/YOURUSERNAME/geotrade
2. You should see all your folders: backend/, frontend/, README.md etc.
3. ✅ Upload complete!

---

## ══════════════════════════════════════════════
## PART 6: DEPLOY BACKEND TO RENDER (FREE)
## ══════════════════════════════════════════════

Render will run your Python Flask server on the internet 24/7.

### Step 6a — Sign up for Render

1. Go to: https://render.com
2. Click "Get Started for Free"
3. Click "Continue with GitHub"
4. Authorize Render to access your GitHub account
5. You're now logged into Render ✅

### Step 6b — Create a new Web Service

1. Click the purple "New +" button in the top right
2. Click "Web Service"
3. Under "Connect a repository", find your "geotrade" repo and click "Connect"

### Step 6c — Configure the service

Fill in these settings EXACTLY:

- **Name**: geotrade-backend
- **Region**: Oregon (US West) — or closest to you
- **Branch**: main
- **Root Directory**: backend
  ⚠️ This is critical — click the field and type "backend"
- **Runtime**: Python 3
- **Build Command**: pip install -r requirements.txt
- **Start Command**: gunicorn app:app
- **Instance Type**: Free

### Step 6d — Add Environment Variable

Scroll down to "Environment Variables" section:
- Click "Add Environment Variable"
- Key: PYTHON_VERSION
- Value: 3.11.0

### Step 6e — Deploy

1. Click "Create Web Service"
2. Watch the logs — it will install packages and start your server
3. This takes 3–7 minutes the first time
4. When you see "==> Your service is live 🎉" — it's done!
5. Copy your backend URL — it looks like:
   https://geotrade-backend.onrender.com
   ⚠️ Save this URL — you need it for the next step

### Verify backend is working:

Open your browser and go to:
https://geotrade-backend.onrender.com/api/health

You should see: {"status":"ok","ts":"2026-..."}
✅ Backend is live on the internet!

---

## ══════════════════════════════════════════════
## PART 7: UPDATE FRONTEND TO USE LIVE BACKEND
## ══════════════════════════════════════════════

The frontend needs to know where your backend is running.

### Step 7a — Update vite.config.js

1. Open VS Code
2. Open the file: frontend/vite.config.js
3. Replace the ENTIRE content with this:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
  }
})
```

### Step 7b — Create a vercel.json file

This tells Vercel how to route API requests to your backend.

1. Inside the frontend/ folder, create a new file: vercel.json
2. Paste this content (replace YOUR-BACKEND-URL with your Render URL):

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://geotrade-backend.onrender.com/api/:path*"
    }
  ]
}
```

For example if your Render URL is https://geotrade-backend-xyz.onrender.com:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://geotrade-backend-xyz.onrender.com/api/:path*"
    }
  ]
}
```

3. Press Ctrl+S to save

### Step 7c — Push the changes to GitHub

In VS Code terminal:

```bash
cd C:\Users\calim\OneDrive\Desktop\geotrade
git add .
git commit -m "Add Vercel config and update for production"
git push
```

---

## ══════════════════════════════════════════════
## PART 8: DEPLOY FRONTEND TO VERCEL (FREE)
## ══════════════════════════════════════════════

Vercel will host your React app and give you a public URL.

### Step 8a — Sign up for Vercel

1. Go to: https://vercel.com
2. Click "Start Deploying"
3. Click "Continue with GitHub"
4. Authorize Vercel to access your GitHub repositories
5. You're logged into Vercel ✅

### Step 8b — Import your project

1. You'll see "Let's build something new"
2. Under "Import Git Repository", find "geotrade" and click "Import"

### Step 8c — Configure the deployment

On the configuration screen:

- **Project Name**: geotrade (or geotrade-app)
- **Framework Preset**: Vite (Vercel usually auto-detects this)
- **Root Directory**: Click "Edit" → type frontend → click "Continue"
- **Build Command**: npm run build (should be pre-filled)
- **Output Directory**: dist (should be pre-filled)
- **Install Command**: npm install (should be pre-filled)

⚠️ The most important setting is Root Directory = frontend

### Step 8d — Deploy

1. Click "Deploy"
2. Watch the build logs — takes about 2 minutes
3. When you see confetti and "Congratulations!" — it's done!
4. Your app URL will be shown:
   https://geotrade-abc123.vercel.app
   (Vercel gives you a random URL — you can customize it later)

### Verify everything works:

1. Click the URL Vercel gives you
2. You should see the GeoTrade disclaimer screen
3. Accept it and you should see the globe with live data
4. Click on India — you should see live news and INR stock prices
5. ✅ Your app is live on the internet!

---

## ══════════════════════════════════════════════
## PART 9: GET A CUSTOM DOMAIN (OPTIONAL, FREE)
## ══════════════════════════════════════════════

You can get a free subdomain or buy a custom domain.

### Free option — customize your Vercel URL:
1. In Vercel dashboard → click your project
2. Click "Settings" → "Domains"
3. You can change it to: geotrade-yourname.vercel.app

### Buy a custom domain (optional, ~$10/year):
Popular registrars: Namecheap.com, Google Domains, GoDaddy
After buying (e.g. geotrade.io):
1. In Vercel → Settings → Domains → Add domain
2. Type your domain name
3. Follow Vercel's instructions to update DNS settings at your registrar
4. Takes 10–30 minutes to activate

---

## ══════════════════════════════════════════════
## PART 10: FUTURE UPDATES
## ══════════════════════════════════════════════

Whenever you make changes to the code:

1. Make your changes in VS Code
2. Open terminal and run:

```bash
cd C:\Users\calim\OneDrive\Desktop\geotrade
git add .
git commit -m "Brief description of what you changed"
git push
```

3. Vercel automatically rebuilds your frontend (~1 minute)
4. Render automatically redeploys your backend (~3 minutes)
5. Changes are live automatically — no manual steps needed

---

## ══════════════════════════════════════════════
## TROUBLESHOOTING — Common Problems
## ══════════════════════════════════════════════

### Problem: "git is not recognized"
Fix: Restart VS Code after installing Git. If still failing, restart your computer.

### Problem: "remote origin already exists"
Fix: Run this first, then retry the push:
git remote remove origin

### Problem: Push asks for password and rejects it
Fix: Use a Personal Access Token (see Part 5 above), NOT your GitHub password.

### Problem: Render shows "Build failed"
Fix: Check that your backend/requirements.txt contains gunicorn==21.2.0
Also make sure "Root Directory" is set to "backend" in Render settings.

### Problem: Vercel shows "Build failed"  
Fix: Check that "Root Directory" is set to "frontend" in Vercel settings.
Also verify package.json is in the frontend/ folder.

### Problem: App loads but shows "Backend not running"
Fix: Check your vercel.json has the correct Render URL.
Visit https://your-render-url.onrender.com/api/health in browser.
If it says "Application failed to respond" — Render is sleeping (free tier).
Wait 30 seconds and refresh — it will wake up.

### Problem: Render free tier is too slow
The free tier "sleeps" after 15 minutes of no traffic.
First visit after sleeping takes 30–60 seconds to respond.
Fix: Upgrade to Render's paid plan ($7/month) for always-on service.
Or use a free service like UptimeRobot to ping it every 14 minutes.

### Problem: "Module not found" errors in Render logs
Fix: Make sure ALL your .py files are in the backend/ folder in GitHub.
Check github.com/yourusername/geotrade/tree/main/backend — all files should be there.

### Problem: "No recent news found" in the app
This is normal if BBC/Al Jazeera is slow to respond.
The app will show articles once the feeds load (usually within 5 seconds).
On the hosted version, the first request may take longer.

---

## ══════════════════════════════════════════════
## QUICK REFERENCE CARD
## ══════════════════════════════════════════════

| Service | URL | What it does | Cost |
|---------|-----|-------------|------|
| GitHub | github.com | Stores your code | Free |
| Render | render.com | Runs Python backend | Free |
| Vercel | vercel.com | Hosts React frontend | Free |

Your live app: https://geotrade-XXXX.vercel.app
Your backend API: https://geotrade-backend-XXXX.onrender.com
Your code: https://github.com/YOURUSERNAME/geotrade

To update: git add . && git commit -m "update" && git push

---

## ══════════════════════════════════════════════
## HOW IT ALL CONNECTS
## ══════════════════════════════════════════════

```
Your Computer (VS Code)
         |
         | git push
         ↓
     GitHub.com
    (stores code)
         |
    ┌────┴────┐
    ↓         ↓
 Vercel    Render
(frontend) (backend)
    |         |
    |         ├── Fetches BBC/Guardian news
    |         ├── Fetches Yahoo Finance stocks
    |         └── Runs NLP engine
    |
    ↓
User's Browser
https://geotrade-xxxx.vercel.app
```

