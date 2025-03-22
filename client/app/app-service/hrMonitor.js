import { HeartRate } from '@zos/sensor';
import * as notificationMgr from "@zos/notification";

const heart = new HeartRate();
const MAX_HR = 120;
const MIN_HR = 40;

const HRMonitor = {
    start() {
        console.log('Heart Rate Monitoring Service Started');

        heart.onCurrentChange(() => {
            const currentHR = heart.getCurrent();
            console.log(`Current HR: ${currentHR}`);

            // Check for abnormal heart rate
            if (currentHR > MAX_HR || currentHR < MIN_HR) {
                HRMonitor.triggerEmergencyCheck(currentHR);
            }
        });
    },

    triggerEmergencyCheck(currentHR) {
        console.log(`ALERT! Heart rate at ${currentHR}`);

        HRMonitor.sendNotification(
            "Heart Rate Alert",
            `Your heart rate is ${currentHR}. Are you okay?`,
            HRMonitor.cancelEmergency // Cancels the alert if user confirms
        );
    },

    cancelEmergency() {
        console.log("User confirmed they are okay. Cancelling emergency alert.");
    },

    sendNotification(title, content, onConfirm = null) {
        notificationMgr.notify({
            title: title,
            content: content,
            actions: [
                {
                    text: "I'm OK",
                    file: "page/index", // Redirects to home page
                    param: "",
                    click_func: onConfirm, // If tapped, cancels emergency
                },
            ],
            vibrate: 6,
        });
    }
};

export default HRMonitor;
