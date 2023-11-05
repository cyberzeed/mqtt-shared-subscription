const os = require("os");
const mqtt = require("mqtt");
const {Docker} = require("node-docker-api");

const delay = (time: number) => new Promise((resolve) => setTimeout(resolve, time));
const topic = process.env.TOPIC || "mqtt-test";
const docker = new Docker({ socketPath: "/run/docker.sock" });

class Publisher {
    client: any;
    queue: any;
    size: number;
    topic: string;
    slots: string[] = [];

    constructor(topic: string, size: number) {
        this.size = size;
        this.topic = topic;
        this.client = mqtt.connect(process.env.MQTT_ENDPOINT, {
            // protocolVersion: 5,
            connectTimeout: 4000,
            reconnectPeriod: 100,
            keepalive: 60,
        });

        const that = this;
        this.client.on("connect", () => that.send());
        this.client.on("reconnect", () => that.send());
        this.client.on("error", (err: Error) => console.log(`MQTT ${err}`));

        this.queue = require("fastq").promise(async (message: string) => {
            this.slots.push(message);
            this.client.reconnect();
        }, this.size);
    }

    send() {
        const message = this.slots.shift();
        if (message) {
            this.client.publish(this.topic, message, {dup: false}, (err: Error) => {
                const msg = (err) ? `MQTT ${err}` : `MQTT Published: topic => ${this.topic}, message => ${message}`;
                console.log(msg);
            });
        }
    }

    async publish (message: string) {
        if (this.slots.length >= this.size) {
            console.log("Warning: slot message is full, waiting free slot...");
            await delay(100);
        }

        await this.queue.push(message);
    }
}

const main = async (container_name: string) => {
    const publisher = new Publisher(topic, 5);
    while (true) {
        await publisher.publish(`${container_name} ${Date.now()}`);
        await delay(500);
    }
}

docker.container.get(os.hostname()).status().then((container: any) => {
    main(container.data.Name.replace(/^\//, ""));
});
