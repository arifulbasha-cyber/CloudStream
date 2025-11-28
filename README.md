# CloudStream Drive APK Build Guide

It looks like you are trying to build this app but do not have Node.js installed.

## Step 1: Install Node.js
To run commands like `npm install`, you must install Node.js.
1. Download it here: [https://nodejs.org/](https://nodejs.org/)
2. Install the **LTS** version.
3. **Restart your computer** after installation.

## Step 2: Setup
Open your project folder in VS Code or Terminal and run:

```bash
npm install
```

## Step 3: Build APK
Run these commands one by one:

```bash
# 1. Build the web app
npm run build

# 2. Create Android project
npx cap add android

# 3. Sync code to Android
npx cap sync

# 4. Open Android Studio
npx cap open android
```

Inside Android Studio, go to **Build > Build Bundle(s) / APK(s) > Build APK**.
