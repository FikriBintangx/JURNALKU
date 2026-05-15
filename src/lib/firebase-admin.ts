import * as admin from 'firebase-admin';

let serviceAccount = undefined;
try {
  serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;
} catch (e) {
  console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not a valid JSON or missing. Skipping Admin init during build.");
}

if (serviceAccount && admin.apps.length === 0) {
  try {
    // Fix for private key newlines
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e) {
    console.error("Failed to initialize Firebase Admin:", e);
  }
}

export const adminAuth = admin.auth();
