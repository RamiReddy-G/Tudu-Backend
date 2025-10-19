import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FCM_PROJECT_ID,
      clientEmail: process.env.FCM_CLIENT_EMAIL,
      privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function sendPush(
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  if (!deviceToken) return;

  const message: admin.messaging.Message = {
    token: deviceToken,
    notification: { title, body },
    data: data || {},
  };

  return admin.messaging().send(message);
}
