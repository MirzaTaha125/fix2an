# Ngrok Setup Guide for Backend

## Step 1: Download and Install Ngrok

1. **Visit the ngrok website:**
   - Go to: https://ngrok.com/download
   - Or directly: https://ngrok.com/download/windows

2. **Download ngrok for Windows:**
   - Click on "Download for Windows"
   - The file will be named something like `ngrok-v3-stable-windows-amd64.zip`

3. **Extract the zip file:**
   - Extract the zip file to a location you prefer (e.g., `C:\ngrok\` or `D:\ngrok\`)
   - You'll get an `ngrok.exe` file

4. **Add ngrok to your PATH (Optional but recommended):**
   - Right-click on "This PC" or "My Computer" → Properties
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", find and select "Path", then click "Edit"
   - Click "New" and add the folder path where you extracted ngrok (e.g., `C:\ngrok`)
   - Click "OK" on all dialogs
   - **OR** you can just use the full path to ngrok.exe when running commands

## Step 2: Sign Up for a Free Ngrok Account

1. **Create an account:**
   - Go to: https://dashboard.ngrok.com/signup
   - Sign up with your email (it's free!)

2. **Get your authtoken:**
   - After signing up, go to: https://dashboard.ngrok.com/get-started/your-authtoken
   - Copy your authtoken (it looks like: `2abc123def456ghi789jkl012mno345pqr678stu901vwx234yz`)

3. **Configure ngrok with your authtoken:**
   - Open PowerShell or Command Prompt
   - Navigate to where ngrok.exe is located, OR if you added it to PATH, you can run from anywhere
   - Run this command (replace YOUR_AUTHTOKEN with your actual token):
     ```powershell
     ngrok config add-authtoken YOUR_AUTHTOKEN
     ```
   - You should see: "Authtoken saved to configuration file."

## Step 3: Start Your Backend Server

1. **Open a terminal/PowerShell window**
2. **Navigate to your Backend folder:**
   ```powershell
   cd "D:\Mahnoor\Fahad And Mahnoor\Our git projects\fixa2an\Backend"
   ```
3. **Start your backend server:**
   ```powershell
   npm start
   ```
   - Or if you use `npm run dev`:
   ```powershell
   npm run dev
   ```
4. **Verify it's running:**
   - You should see: `Backend listening on http://localhost:4000`
   - Keep this terminal window open!

## Step 4: Start Ngrok Tunnel

1. **Open a NEW terminal/PowerShell window** (keep the backend running in the first one)
2. **Start ngrok tunnel:**
   ```powershell
   ngrok http 4000
   ```
   - If ngrok is not in your PATH, use the full path:
   ```powershell
   C:\ngrok\ngrok.exe http 4000
   ```
   - Or navigate to the ngrok folder first:
   ```powershell
   cd C:\ngrok
   .\ngrok.exe http 4000
   ```

3. **You'll see output like this:**
   ```
   Session Status                online
   Account                       Your Name (Plan: Free)
   Version                       3.x.x
   Region                        United States (us)
   Forwarding                    https://abc123xyz.ngrok-free.app -> http://localhost:4000
   
   Connections                   ttl     opn     rt1     rt5     p50     p90
                                 0       0       0.00    0.00    0.00    0.00
   ```

4. **Copy the Forwarding URL:**
   - Look for the line that says `Forwarding`
   - Copy the HTTPS URL (e.g., `https://abc123xyz.ngrok-free.app`)
   - **This is your ngrok URL!**

## Step 5: Test Your Ngrok URL

1. **Open a browser**
2. **Visit your ngrok URL:**
   - Go to: `https://your-ngrok-url.ngrok-free.app`
   - You should see the backend homepage
3. **Test the health endpoint:**
   - Go to: `https://your-ngrok-url.ngrok-free.app/health`
   - You should see: `{"status":"ok"}`

## Step 6: Update Frontend Configuration

✅ **Good News!** Your frontend is now configured to use a centralized configuration file.

**To update your ngrok URL, you only need to change it in ONE place:**

1. Open `Frontend/src/config/api.js`
2. Update the URL on line 7:
   ```javascript
   export const API_BASE_URL = import.meta.env.VITE_API_URL || 'YOUR_NEW_NGROK_URL_HERE'
   ```
3. Also update `Frontend/vite.config.js` (line 16) if you're using the proxy:
   ```javascript
   target: 'YOUR_NEW_NGROK_URL_HERE',
   ```

That's it! All API calls throughout your frontend will automatically use the new URL.

**Important Notes:**
- The ngrok URL will change every time you restart ngrok (unless you have a paid plan with a static domain)
- Keep both terminal windows open (backend server + ngrok)
- If you close ngrok, you'll need to restart it and get a new URL
- The free plan has some limitations (connection limits, etc.)

## Troubleshooting

**Problem: "ngrok: command not found"**
- Solution: Use the full path to ngrok.exe or add it to your PATH

**Problem: "authtoken not configured"**
- Solution: Run `ngrok config add-authtoken YOUR_AUTHTOKEN`

**Problem: Backend not accessible through ngrok**
- Solution: Make sure your backend is running on port 4000
- Check that ngrok is forwarding to the correct port

**Problem: CORS errors**
- Solution: The backend CORS is already configured to allow all origins in development, so this should work

**Problem: Login/API requests hanging or timing out**
- Solution: This is often caused by ngrok's free plan browser warning page
- The frontend is now configured with `ngrok-skip-browser-warning` header to bypass this
- If requests still hang:
  1. Try visiting your ngrok URL directly in a browser first: `https://your-ngrok-url.ngrok-free.app`
  2. Click "Visit Site" on the ngrok warning page
  3. Then try your API requests again
  4. Restart your backend server if needed
  5. Check that both backend and ngrok are running

**Problem: Requests showing OPTIONS 204 but POST requests hanging**
- This usually means CORS preflight is working but the actual request is blocked
- Check browser console for errors
- Verify ngrok tunnel is active (check ngrok terminal)
- Try visiting the ngrok URL in browser first to bypass warning page

---

**Next Step:** Once you have your ngrok URL, share it with me and I'll update your frontend configuration!

