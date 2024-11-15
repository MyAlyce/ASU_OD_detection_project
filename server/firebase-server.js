const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Function to send notifications
exports.sendNotification = async function(deviceToken, title, body) {
  try {
    const message = {
      token: deviceToken,
      notification: {
        title,
        body
      }
    };
    
    return await admin.messaging().send(message);
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}