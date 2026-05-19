# MailClean Frontend

React frontend for the MailClean email verification API.

## Setup

1. Install Node.js from https://nodejs.org (LTS version)

2. Open terminal in this folder and run:
   npm install

3. Start the dev server:
   npm start

4. Opens at http://localhost:3000

## Requirements

- Backend must be running at http://127.0.0.1:8000
- Start it with: uvicorn main:app --reload (in the email_verifier_api folder)

## Deploy

1. Build for production:
   npm run build

2. Deploy the /build folder to Netlify or Vercel

3. Update .env with your Railway backend URL before building:
   REACT_APP_API_URL=https://your-app.up.railway.app
