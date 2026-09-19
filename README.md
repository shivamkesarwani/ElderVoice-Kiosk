# ElderVoice Kiosk

ElderVoice Kiosk is an accessible, senior-first countertop voice companion designed for independent seniors. It provides voice queries, item finding, medication reminders, family messages, emergency SOS, and a separate authenticated caregiver companion portal.

## Security & Authentication Configuration

### 1. Caregiver Firebase Authentication Setup

The caregiver companion interface (`CaregiverLogin`) provides remote monitoring and configuration for family members and authorized caregivers.

To secure caregiver access, the app requires real Firebase project credentials. **The app will never fabricate sessions or bypass authentication.** If credentials are not configured, the login screen explicitly displays:
> *"Sign-in is not configured yet. Caregiver login requires a real Firebase project with Authentication enabled."*
and will refuse to log any user in.

#### Required Environment Variables

Set the following environment variables (e.g. in your environment or `.env.local`):

- `VITE_FIREBASE_API_KEY`: Your Firebase project Web API Key
- `VITE_FIREBASE_AUTH_DOMAIN`: `<your-project-id>.firebaseapp.com`
- `VITE_FIREBASE_PROJECT_ID`: Your Google Cloud / Firebase Project ID
- `VITE_FIREBASE_STORAGE_BUCKET`: `<your-project-id>.appspot.com`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase Cloud Messaging sender ID
- `VITE_FIREBASE_APP_ID`: Your Firebase Web App ID

In the Firebase Console:
1. Enable **Authentication** > **Sign-in method**.
2. Enable your desired providers: **Google**, **Email/Password**, and/or **Phone**.
3. Under Google provider and Authorized Domains, add your application host URL.

### 2. On-Device Caregiver PIN

Local kiosk settings and schedule adjustments can be locked with a 4-digit numeric PIN:
- **Environment Variable**: Set `VITE_CAREGIVER_PIN="1234"` (or your preferred 4-digit code) to specify a fixed environment-managed PIN.
- **First-Use On-Device Setup**: If `VITE_CAREGIVER_PIN` is not configured, the kiosk will prompt the caregiver on first use to set and confirm a 4-digit PIN. The PIN is stored exclusively as a cryptographic SHA-256 hash in browser `localStorage`.
- No fixed PINs (such as `1234` or `0000`) are disclosed or hardcoded in the application source code.

## Testing

Run the automated test suite:
```bash
npm test
```
This runs both the unit tests and the end-to-end kiosk integration suite.
