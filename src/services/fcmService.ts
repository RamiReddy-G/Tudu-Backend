import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { ServiceAccount } from 'firebase-admin';

const serviceAccountPath = path.resolve('./serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8')) as ServiceAccount;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function sendPush(token: string, title: string, body: string) {
  if (!token) return;

  const message: admin.messaging.Message = {
    token,
    notification: { title, body },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Notification sent:', response);
  } catch (error: any) {
    console.error('❌ Error sending notification:', error.message);
  }
}
