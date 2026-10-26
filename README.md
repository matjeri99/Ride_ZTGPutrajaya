# Zontes Putrajaya Ride Hub — GitHub PWA (v1.0)

A **separate staging project** inspired by the existing ChatGPT Sites Ride Hub. The existing Sites hub, Crew Chat and data are **not touched**.

## What works in this package

- Responsive dark green / lime design, metallic Zontes Putrajaya logo, Cameron convoy hero.
- Dashboard: **16 confirmed entries, 25 people** (including Ucop, solo).
- Rider Manifest, itinerary, Google Maps links, Ride History, Gallery link.
- PWA manifest, app icons, HTTPS service worker with offline static shell.
- Google Sheets **public read-only** integration via Apps Script endpoint (needs deployment).
- Firebase Google Login, member approval, Crew Chat, Announcement and Crew Monitor (code included; requires Firebase project setup).
- Manage Participants opens the real Google Sheet, whose **Editor permissions** must be restricted to Admin + Captain. This is not yet an in-app editing form.

## Existing production hub

`https://zontes-cameron-ride-2026.matjeri99.chatgpt.site`

Do **NOT** delete, redeploy or overwrite this existing hub. Chat and message history are stored separately there and **do not automatically transfer** to this GitHub PWA.

## 1. Upload to GitHub Pages (STAGING)

1. Create repository, e.g. `zontes-putrajaya-ride-hub`.
2. Upload **all files inside this extracted ZIP** to repository root, preserving subfolders (`assets/`, `apps-script/`).
3. GitHub repository → **Settings → Pages → Build and deployment → Deploy from a branch → main / (root) → Save**.
4. GitHub shows the real Pages URL. Do not guess the URL; use the actual URL GitHub provides.
5. Open in Chrome (HTTPS). For Android choose menu `⋮ → Add to Home screen / Install app`; for iPhone choose `Safari → Share → Add to Home Screen`.
6. Keep URL with admins for UAT. This is a publicly accessible **staging** site once published: do not add secrets or private records.

### Change site name / path

Relative links, `./manifest.webmanifest`, `./sw.js` and `start_url` support any normal GitHub Pages repository subpath. Keep these relative paths intact.

## 2. Google Sheets (already created and verified)

**REAL editable source:**

`https://docs.google.com/spreadsheets/d/16RRcM5o2-p18DGZ8RnYecVsU_CVU9Rzznu7aDbI0484/edit`

Tabs: `Participants`, `Rides`, `Itinerary`, `Summary`, `START HERE`. `Summary` uses formulas; it shows 16 and 25.

- Keep Sheet **private**; share edit permission only to intended Admin / Captain account.
- When new rider joins, append a row to `Participants` using matching `RideID`, sequential `Bil`, `Rider`, `Pillion / Teman`, number `Bil Orang`, and `Status` (Confirmed, Tentative, Cancelled).
- Dashboard counts only rows with `Confirmed`.
- Never put private contact details into publicly exposed fields.

### Connect Google Sheets to the GitHub PWA

1. Open the Google Sheet → **Extensions → Apps Script**.
2. Replace the starter code with `apps-script/Code.gs` in this ZIP.
3. Ensure the script is **bound to the Google Sheet** (the `getActiveSpreadsheet()` call requires it).
4. In Apps Script **Deploy → New deployment → Web app**.
5. Choose **Execute as: Me**; **Who has access: Anyone** (this endpoint exposes only public nickname/ride fields; no write operations).
6. Authorize the script and copy the deployed **/exec** URL.
7. Paste the URL into `config.js` under `appsScriptUrl` and commit/push the update.
8. On your PWA, verify the banner says `Data peserta diselaraskan daripada Google Sheets` and that edits in the Sheet appear after refresh.

**Important:** Without an Apps Script URL, the GitHub PWA displays the included 16/25 **snapshot**. This snapshot does not automatically reflect Google Sheets edits. The notice in the UI makes this explicit.

Do not publish the Google Sheet itself as public: Apps Script is the **restricted-field public read-only** facade. Deploying the script as `Anyone` makes the filtered endpoint publicly readable by design.

## 3. Crew Chat / Announcement / Crew Monitor (optional, before migration)

GitHub Pages cannot run a private realtime database itself. Firebase project required:

1. Create a Firebase project with **Google Authentication** and **Cloud Firestore**.
2. Add GitHub Pages domain to Firebase Authentication **Authorized domains**.
3. Copy Firebase **Web app config** values (NOT service-account secrets) into `config.js > firebase`.
4. Publish `firestore.rules` to Cloud Firestore Rules. **Do not use Firestore test mode** for actual riders.
5. Admin/Captain logs in once using Google. Firebase Authentication → **Users** lists each person's UID.
6. As Firebase project owner, manually create `members/<UID>` documents in Firestore, with fields:
   - `displayName` (string), e.g. `Pseudo`
   - `role` (string): `admin`, `captain`, `marshal`, or `rider`
   - `active` (boolean): `true`
7. `admin` and `captain` can post **Announcement** and see Crew Monitor. Approved `rider` may chat.
8. Do not give `admin` privileges to someone just by putting an email in JavaScript. Use controlled Firestore member records and rules.
9. Test with 2 separate accounts. Test public visitor cannot read messages or edit members.

Members collection records should not contain phone numbers, addresses or other unnecessary data. The code writes `lastSeenAt` only while the app is visible, approx once per minute. Presence is an approximation, not rider safety telemetry.

**Status before Firebase setup:** GitHub PWA Chat displays a clear `Firebase belum dikonfigurasi` notice and offers a link to the old working Sites Crew Chat. It does **not** simulate real chat or claim that messages were migrated.

## 4. Private controls and their limits

- Public GitHub Pages may expose itinerary, rider nicknames and photo link to anyone with the URL.
- Editing the Google Sheet requires Editor permissions granted in Google Drive. The PWA cannot override this.
- In the PWA, `Manage Participants` is shown to Firebase-approved staff; it opens the protected Sheet rather than editing via an unverified cross-origin endpoint.
- Firestore security rules determine message read and post permissions. Hiding a button alone is not authorization.
- Google Photos upload permission depends on Album **Collaborate** setting independently.
- PWA offline cache covers **static app shell**, not Google Sheets / Firebase live content; cached attendee snapshot can become stale when offline.

## 5. UAT checklist before sharing a new link

- [ ] Logo and responsive layout match current Site on mobile.
- [ ] Dashboard 16/16 and 25 people.
- [ ] Ucop appears as rider #16 with no pillion.
- [ ] Add a test rider in Sheets; PWA count updates (when Apps Script configured).
- [ ] Mark test rider Cancelled; count decreases.
- [ ] Validate Gallery link and itinerary.
- [ ] Install Android/iOS PWA and reopen from home screen.
- [ ] Sign in as Admin/Captain and Rider; confirm permissions.
- [ ] Confirm anonymous visitors CANNOT read Firebase chat.
- [ ] Confirm announcements and chat on 2 devices.
- [ ] Old ChatGPT Sites still works untouched.

## Notes

The original ChatGPT Sites source code was not accessible in this session, so this is a **carefully reproduced design**, not a byte-for-byte copy of the live app. Do not claim it has replaced the old chat. The source is now locally editable and portable.
