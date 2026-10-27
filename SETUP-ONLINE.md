# Turning on the online log (one-time setup, about 20 minutes)

Free plan (Firebase "Spark"). No credit card needed.
Until you finish this, the tool keeps working with the old per-device log.

## A. Make the online database
1. Open https://console.firebase.google.com and sign in with a Google account.
2. Click **Create a project**. Name it `emb-r7-eia`. Turn Google Analytics **off**. Click Create.
3. Left menu, **Build > Authentication > Get started**. Under **Sign-in method**, choose **Email/Password**, switch it **on**, Save.
4. Still in Authentication, open the **Users** tab and click **Add user**. Enter a staff email and password. Repeat for each staff member.
5. Left menu, **Build > Firestore Database > Create database**. Location: `asia-southeast1` (Singapore). Choose **Production mode**. Create.
6. Open the **Rules** tab. Delete everything, paste the contents of `firestore.rules`, then click **Publish**.
7. Open the **Data** tab. Click **Start collection**. Collection ID: `staff`.
   - Document ID: the staff email in **lowercase** (for example `akira@gmail.com`).
   - Add one field: `name` (string) with the person's name. Save.
   - Use **Add document** for each other staff member. Only emails listed here can open the log.
8. **Authentication > Settings > Authorized domains > Add domain**: `luffycreator.github.io`.

## B. Connect the tool
1. Click the gear icon (top left) > **Project settings** > **General**. Scroll to **Your apps** and click the web icon `</>`.
2. Nickname: `emb-tool`. Leave Hosting off. Click Register app.
3. You will see a block called `firebaseConfig`. Copy these four values: `apiKey`, `authDomain`, `projectId`, `appId`.
4. Open `firebase-config.js` in VS Code. Replace each `PASTE_HERE` with the matching value (keep the quotes). Save.

## C. Publish
1. Test first on your laptop with Live Server (the folder from this zip).
   - If sign-in fails with "unauthorized domain", add `localhost` under Authentication > Settings > Authorized domains.
2. In your GitHub repository, use **Add file > Upload files** and upload these files (they replace the old ones):
   `index.html`, `pow.js`, `online.js`, `firebase-config.js`.
   (`app.js`, `data.js`, `style.css`, `eia-logo.png` did not change.)
3. Wait 1 to 2 minutes, open the site link, and press Ctrl+F5.

## How staff use it
- Click **Staff sign in** at the top. After signing in, the button shows **Shared log (n)**.
- Search the project, enter the size, then fill in **Log this applicant**. Use **Locate the project on the map** or **Use my current location** to set the coordinates. At POW, hand the phone to the applicant so they can tap their project on the map.
- Applicants without coordinates can be located later from the log (**Locate** button).
- The **Map** tab shows all applicants, colored by status.

## Good to know
- Keep this page open if there is no signal. Entries made offline are sent when the internet returns.
- Maps and place search need internet. Typing latitude and longitude always works.
- The log holds names and contact numbers. Only emails in the `staff` collection can read it. Check with your office that using Google's servers for this is allowed.
- Free plan limits (about 50,000 reads and 20,000 writes per day) are far above what POW needs.
