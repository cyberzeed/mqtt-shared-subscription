const mqtt = require("mqtt");
const topic = process.env.TOPIC || "mqtt-test";
const group = process.env.GROUP || "iot";

class Subscriber {
    client: any;
    topic: string;

    constructor(topic: string) {
        this.topic = topic;
        this.client = mqtt.connect(process.env.MQTT_ENDPOINT, {
            // protocolVersion: 5,
            connectTimeout: 4000,
            reconnectPeriod: 100,
            keepalive: 60,
        });

        const that = this;
        this.client.on("connect", () => that.listen());
        this.client.on("message", this.receive);
        this.client.on("error", (err: Error) => console.log(`MQTT ${err}`));
    }

    listen() {
        this.client.subscribe(this.topic, (err: Error) => {
            const message = (err) ? `MQTT ${err}` : "MQTT Subscribed";
            console.log(message);
        });
    }

    receive(topic: string, message: string) {
        console.log(`MQTT Message: topic => ${topic}, message => ${message}`);
    }
}

const subscriber = new Subscriber(`$share/${group}/${topic}`);
