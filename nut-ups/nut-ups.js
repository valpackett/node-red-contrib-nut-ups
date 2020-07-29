module.exports = function(RED) {
    'use strict';
    function NutUpsNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        const Nut = require('node-nut');

        this.on('input', function(msg, send, done) {
			send = send || function() { node.send.apply(node,arguments) }

            const ups = msg.ups || config.ups || 'ups';
            const [upsName, upsServer] = ups.split('@');
            const upsPort = msg.port || config.port || '3493';

            const nut = new Nut(upsPort, upsServer);

            nut.on('error', err => {
                if (done) {
                    done(err);
                } else {
                    node.error(err, msg);
                }
                this.status({fill:"red",shape:"ring",text:err.message});
            });

            nut.on('close', () => {
                this.trace('connection closed');
            });

            nut.on('ready', () => {
                const result = {};
                nut.GetUPSVars(upsName, (upsVars, err) => {
                    if (err) {
                        if (done) {
                            done(err);
                        } else {
                            node.error(err, msg);
                        }
                        this.status({fill:"red",shape:"ring",text:err});
                    } else {
                        Object.keys(upsVars).forEach(upsVar => {
                            let key = upsVar.split('.');
                            key.reduce(function(obj, k) {
                                if (typeof obj[k] === 'undefined') obj[k] = {};
                                return obj[k];
                            }, result).value = upsVars[upsVar].trim();
                        });
                        msg.payload = result;
                        send(msg);
                        this.status({});
                    }
                });
                nut.close();
                if (done) {
                    done();
                }
            });

            nut.start();
            this.trace('started');
        });
    }
    RED.nodes.registerType('nut-ups', NutUpsNode);
};
