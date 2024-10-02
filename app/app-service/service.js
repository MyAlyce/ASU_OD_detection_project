import { Time } from '@zos/sensor'
// import { BaseSideService } from "@zeppos/zml/base-page";
import { BaseSideService } from '@zeppos/zml/base-side';

const timeSensor = new Time();
const url = 'https://31c5-24-251-182-244.ngrok-free.app/post'; // replace with your ngrok tunnel url

AppService(
    BaseSideService({
        onInit() {
            this.log('app service onInit')

            timeSensor.onPerMinute(() => {
                this.log("app service running");
                this.httpRequest({
                    method: 'POST',
                    url: url,
                    body: {
                        "data": "hello from watch"
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
