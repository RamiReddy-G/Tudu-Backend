import admin from 'firebase-admin';
import path from 'path';

if (!admin.apps.length) {
  const keyPath = process.env.FCM_SERVICE_ACCOUNT_PATH || './fcm-service-account.json';
  admin.initializeApp({
    credential: admin.credential.cert(require(path.resolve(keyPath)))
  });
}

export async function sendPush(deviceToken: string, title: string, body: string, data?: any) {
  if (!deviceToken) return;
  const message: admin.messaging.Message = {
    token: deviceToken,
    notification: { title, body },
    data: data || {}
  };
  return admin.messaging().send(message);
}
