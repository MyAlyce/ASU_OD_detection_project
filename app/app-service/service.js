import { Time } from '@zos/sensor'
import { BasePage } from "@zeppos/zml/base-page";

const timeSensor = new Time();
const url = 'ngrok_url_here'; // replace with your ngrok tunnel url

AppService(
    BasePage({
        onInit() {
            this.log('app service onInit')

            timeSensor.onPerMinute(() => {
                this.log("app service running");
                this.httpRequest({
                    method: 'POST',
                    url: url,
                    body: {
                        "data": "placeholder-data"
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(result => {
                    return result.json();
                }).then(data => {
                    this.log(data);
                }).catch(error => {
                    this.log(error);
                });

            });
        },
        onRun() {
            this.log('app side service onRun')
        },
        onDestroy() {
            this.log('app side service onDestroy')
        },
    }));
