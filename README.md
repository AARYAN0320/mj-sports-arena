# 🏟️ MJ Sports Arena — Booking System

A complete online slot booking system for Cricket & Pickleball courts with admin dashboard, revenue tracking, WhatsApp confirmations, and UPI QR payments.

---

## 📁 FOLDER STRUCTURE

```
mj-sports-arena/
├── src/
│   ├── App.jsx          ← Main app (all components in one file)
│   ├── main.jsx         ← React entry point
│   └── index.css        ← Global styles & fonts
├── index.html           ← HTML page
├── package.json         ← Dependencies list
├── vite.config.js       ← Build tool config
├── firestore.rules      ← Database security rules
├── .env.example         ← Template for your secrets
├── .env                 ← YOUR secrets (never share this!)
└── .gitignore           ← Files to hide from GitHub
```

---

## 🚀 STEP-BY-STEP DEPLOYMENT GUIDE

> **You are a beginner? No problem! Follow each step carefully.**

---

### STEP 1 — Set Up Firebase (Your Database)

Firebase is a free database by Google. It stores all your bookings.

1. Go to **https://firebase.google.com**
2. Click **"Get started"** and sign in with Google
3. Click **"Add project"** → name it `mj-sports-arena` → Continue
4. Disable Google Analytics (not needed) → **Create project**

**Create the Database:**
5. In the left menu, click **"Firestore Database"**
6. Click **"Create database"**
7. Choose **"Start in test mode"** → Next
8. Select location: **asia-south1 (Mumbai)** → Enable

**Get Your Config Keys:**
9. Go to **Project Settings** (gear icon, top left)
10. Scroll down to **"Your apps"** → Click the **</>** (Web) icon
11. Register app with name `mj-arena-web` → Register
12. You'll see a `firebaseConfig` object — **copy it!** It looks like:
```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "mj-sports-arena.firebaseapp.com",
  projectId: "mj-sports-arena",
  storageBucket: "mj-sports-arena.appspot.com",
  messagingSenderId: "12345678",
  appId: "1:12345:web:abcdef"
};
```

**Add Security Rules:**
13. Go to **Firestore → Rules** tab
14. Delete the existing rules
15. Copy the contents of `firestore.rules` file and paste them
16. Click **Publish**

---

### STEP 2 — Set Up Your Computer

1. Install **Node.js** from https://nodejs.org (choose "LTS" version)
   - To check: open Terminal/Command Prompt, type `node -v` — should show a version number

2. Install **Git** from https://git-scm.com

3. Install **VS Code** from https://code.visualstudio.com (optional but helpful)

---

### STEP 3 — Set Up the Project

1. Open Terminal (Mac/Linux) or Command Prompt (Windows)

2. Download the project:
```bash
# Navigate to Desktop
cd Desktop

# Create project folder
mkdir mj-sports-arena
cd mj-sports-arena
```

3. Copy all the project files into this folder (the ones you downloaded)

4. Install dependencies:
```bash
npm install
```
> This downloads all the required libraries. Takes 1-2 minutes.

---

### STEP 4 — Configure Your Environment Variables

1. In your project folder, find `.env.example`
2. Make a **copy** of it and name it `.env` (no .example)
3. Open `.env` in any text editor and fill in your values:

```env
# From Firebase Console (Step 1):
VITE_FIREBASE_API_KEY=AIzaSy...paste your key here...
VITE_FIREBASE_AUTH_DOMAIN=mj-sports-arena.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mj-sports-arena
VITE_FIREBASE_STORAGE_BUCKET=mj-sports-arena.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456:web:abcdef

# Admin password (change this to something strong):
VITE_ADMIN_PASSWORD=MJArena@2024

# Your UPI ID for QR payments:
VITE_UPI_ID=yourname@paytm

# Your WhatsApp number (India +91, no plus sign):
VITE_WHATSAPP_NUMBER=919876543210
```

4. **Save the file**

---

### STEP 5 — Test Locally

```bash
npm run dev
```

Open your browser and go to: **http://localhost:5173**

You should see your arena booking website! 🎉

Test it:
- Book a slot as a customer
- Click "Admin →" in top right, enter your admin password
- See the booking appear in the dashboard

---

### STEP 6 — Deploy to Vercel (Make it Live Online)

Vercel is free and makes your website available to everyone.

**First, push to GitHub:**
1. Create account at https://github.com
2. Create a **New Repository** called `mj-sports-arena`
3. Run these commands:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mj-sports-arena.git
git push -u origin main
```

**Deploy on Vercel:**
4. Go to https://vercel.com and sign in with GitHub
5. Click **"Add New Project"**
6. Select your `mj-sports-arena` repository → Import
7. Framework Preset: **Vite** (auto-detected)
8. Click **"Environment Variables"** and add ALL your `.env` variables:
   - `VITE_FIREBASE_API_KEY` → your value
   - `VITE_FIREBASE_AUTH_DOMAIN` → your value
   - `VITE_FIREBASE_PROJECT_ID` → your value
   - `VITE_FIREBASE_STORAGE_BUCKET` → your value
   - `VITE_FIREBASE_MESSAGING_SENDER_ID` → your value
   - `VITE_FIREBASE_APP_ID` → your value
   - `VITE_ADMIN_PASSWORD` → your password
   - `VITE_UPI_ID` → your UPI ID
   - `VITE_WHATSAPP_NUMBER` → your number
9. Click **Deploy**

🎊 **Your website is now LIVE!** Vercel will give you a URL like:
`https://mj-sports-arena.vercel.app`

---

## ⚙️ HOW TO CUSTOMIZE

### Change Prices
Open `src/App.jsx` and find the `CONFIG` object near the top:

```js
sports: {
  cricket: {
    pricePerHour: 800,    ← Change this number (in rupees)
  },
  pickleball: {
    pricePerHour: 400,    ← Change this number (in rupees)
  },
},
```

### Change Time Slots
In the same `CONFIG` object, edit the `slots` arrays:

```js
cricket: {
  slots: [
    "06:00 AM", "07:00 AM",  ← Add or remove time slots here
    ...
  ],
},
```

### Change Arena Name
```js
const CONFIG = {
  arenaName: "MJ Sports Arena",  ← Change this
```

### Add More Sports
Duplicate an existing sport block in CONFIG and change the details. The UI will automatically show the new sport.

---

## 📱 FEATURES EXPLAINED

### For Customers:
- **Landing page** shows arena name, sports, and pricing
- **Booking form** lets them select sport → date → slot → enter details
- **Booked slots** appear greyed out so no double bookings
- **WhatsApp** confirmation message opens automatically after booking
- **UPI QR** code appears for payment

### For You (Admin):
- Go to your website URL → click **"Admin →"** (top right)
- Enter your admin password
- Dashboard shows ALL bookings in a table
- Revenue auto-calculated: daily / weekly / monthly / all-time
- Filter bookings by sport or date
- Cancel any booking with one click

---

## 🔧 COMMON PROBLEMS & FIXES

**Problem:** Website shows blank screen
**Fix:** Check browser console (F12) for errors. Usually a missing env variable.

**Problem:** Bookings not saving
**Fix:** Check Firebase Firestore rules are published correctly.

**Problem:** WhatsApp not opening
**Fix:** Make sure VITE_WHATSAPP_NUMBER has country code and no + sign. India: 91XXXXXXXXXX

**Problem:** QR code wrong amount
**Fix:** Update pricePerHour in CONFIG and redeploy.

**Problem:** Admin password not working
**Fix:** Check VITE_ADMIN_PASSWORD in Vercel environment variables. After changing, redeploy.

---

## 🛡️ SECURITY NOTES

1. **Never share** your `.env` file or commit it to GitHub
2. **Change** the default admin password immediately
3. The admin area is password-protected client-side. For extra security later, upgrade to Firebase Authentication.
4. Firestore rules prevent users from editing/deleting bookings

---

## 📊 REVENUE TRACKING

Revenue is automatically calculated from all bookings:
- **Today** = Sum of all bookings created today
- **This Week** = Sunday to today
- **This Month** = 1st of month to today
- **All Time** = Every booking ever

Each booking stores the price at time of booking, so price changes don't affect old records.

---

## 🌟 FUTURE UPGRADES (Optional)

When you're ready to grow:
- Add SMS notifications (Twilio)
- Add online payment gateway (Razorpay)
- Add multiple courts (Cricket A, Cricket B)
- Add loyalty/discount system
- Firebase Authentication for more secure admin

---

## 💬 NEED HELP?

If something doesn't work:
1. Check the Firebase Console for errors
2. Check Vercel deployment logs
3. Open browser Developer Tools (F12) → Console tab for errors

---

*Built with React + Firebase + Vite. Deployable on Vercel for free.*
