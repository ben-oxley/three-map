import LayerSwitcher from '@russss/maplibregl-layer-switcher';
import mqtt from 'mqtt';



const setting = {
    url: 'wss://e8c681f0b4ba40d78aad5ddb06840b9b.s1.eu.hivemq.cloud:8884/mqtt',
    config: {
        username: 'emfmap',
        password: 'hA6H7AK&7J#fme#dmhe2',
        port: 8884
    }
}



export function useMQTT(map: maplibregl.Map, layerSwitcher: LayerSwitcher) {
    // const url = 'wss://e8c681f0b4ba40d78aad5ddb06840b9b.s1.eu.hivemq.cloud:8884/mqtt'

    // // Create an MQTT client instance
    // const options = {
    //     // Clean session
    //     clean: true,
    //     connectTimeout: 4000,
    //     // Authentication
    //     clientId: `mqtt${Math.random().toString(16).substr(2, 8)}`,
    //     username: 'emfmap',
    //     password: 'hA6H7AK&7J#fme#dmhe2',
    //     port: 8884
    // }
    // const client = mqtt.connect(url, options)
    // client.on('connect', function () {
    //     console.log('Connected')
    //     // Subscribe to a topic
    //     client.subscribe('test', function (err) {
    //         if (!err) {
    //             // Publish a message to a topic
    //             client.publish('test', 'Hello mqtt')
    //         }
    //     })
    // })

    // // Receive messages
    // client.on('message', function (topic, message) {
    //     // message is Buffer
    //     console.log(message.toString())
    //     client.end()
    // })

    mqttClient.connect();
    mqttClient.mqttSubscribe('#')
    mqttClient.addListener((p:{ topic: any; message: any; })=>{
        if (p.topic == 'add'){
            if (!layerSwitcher)
                return;
            layerSwitcher._visible.push(p.message);
            layerSwitcher._updateVisibility();
        }
        if (p.topic == 'remove'){
            if (!layerSwitcher)
                return;
            layerSwitcher._visible.push(p.message);
            layerSwitcher._visible = layerSwitcher._visible.filter((item) => item !== p.message);
            layerSwitcher._updateVisibility();
        }
        if (p.topic == 'getstate'){
            let str = layerSwitcher.getURLString();
            mqttClient.mqttPublish('state',str);
        }
        if (p.topic == 'state'){
            let str = layerSwitcher.setURLString(p.message);
            layerSwitcher._updateVisibility();
        }
    })
}

class MQTTClient {
    client: any = null;
    isConnected = false;
    payload = {};
    listeners: any = [];

    _getclientId() {
        console.log('Set MQTT Broker...');
        return `mqtt${Math.random().toString(16).substr(2, 8)}`;
    };

    async _mqttConnect(): Promise<any> {
        const clientId = this._getclientId();
        const url = setting.url;
        const options = {
            clientId: clientId,
            keepalive: 60,
            clean: true,
            reconnectPeriod: 300000,
            connectTimeout: 30000,
            rejectUnauthorized: false,
            ...setting.config
        };
        this.client = mqtt.connect(url, options);
    };

    mqttDisconnect() {
        if (this.client) {
            this.client.end(() => {
                console.log('MQTT Disconnected');
                this.isConnected = false;
            });
        }
    };

    mqttPublish(topic: any, message: any) {
        this.client.publish(topic, message)
    }

    async mqttSubscribe(topic: any) {
        if (this.client) {
            console.log('MQTT subscribe ', topic);
            this.client = await this.client.subscribe(topic, {
                qos: 0,
                rap: false,
                rh: 0,
            }, (error: any) => {
                if (error) {
                    console.log('MQTT Subscribe to topics error', error);
                    return;
                }
            });

        }
    };

    async mqttUnSubscribe(topic: any) {
        if (this.client) {
            this.client = await this.client.unsubscribe(topic, (error: any) => {
                if (error) {
                    console.log('MQTT Unsubscribe error', error);
                    return;
                }
            });
        }
    };

    async connect() {
        await this._mqttConnect();

        if (this.client) {
            this.client.on('connect', () => {
                this.isConnected = true;
                console.log('MQTT Connected');
            });
            this.client.on('error', (err: any) => {
                console.error('MQTT Connection error: ', err);
                this.client.end();
            });
            this.client.on('reconnect', () => {
                console.log('MQTT Reconnect');
                this.isConnected = true;
            });
            this.client.on('message', (_topic: any, message: { toString: () => any; }) => {
                console.log(message)
                const payloadMessage = { topic: _topic, message: message.toString() };
                this.listeners.forEach((l: (arg0: { topic: any; message: any; }) => void) => {
                    l(payloadMessage);
                });
            });
        }
    }



    addListener(listener: any) {
        this.listeners.push(listener);
    }
}

const mqttClient = new MQTTClient();