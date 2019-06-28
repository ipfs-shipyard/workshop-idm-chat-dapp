import React from 'react';
import ReactDOM from 'react-dom';
import IPFS from 'ipfs';
import createIdmClient from 'idm-client';
import { createClientSide } from 'idm-bridge-postmsg';
import { create } from 'jss';
import { StylesProvider, jssPreset } from '@material-ui/styles';
import { configure } from './stores';
import './index.css';
import Boot from './Boot';
import App from './App';

const WALLET_URL = 'https://demo.nomios.io';
const APP = {
    name: 'Chat demo app',
    homepageUrl: window.location.origin,
    iconUrl: `${window.location.href}favicon.ico`,
};

const setup = async () => {
    // Setup IPFS
    const ipfs = await new Promise((resolve, reject) => {
        const node = new IPFS({
            EXPERIMENTAL: {
                pubsub: true,
            },
            config: {
                Addresses: {
                    Swarm: ['/dns4/ws-star1.par.dwebops.pub/tcp/443/wss/p2p-websocket-star'],
                },
            },
        });

        node.on('ready', () => resolve(node));
        node.on('error', (err) => reject(err));
    });

    // Setup IDM Client
    const idmBridge = await createClientSide(WALLET_URL);
    const idmClient = await createIdmClient(APP, idmBridge, { ipfs });

    // Finally configure our stores
    await configure({ ipfs, idmClient });

    return ipfs;
};

const jss = create({
    ...jssPreset(),
    insertionPoint: 'jss-insertion-point',
});

ReactDOM.render(
    <StylesProvider jss={ jss }>
        <Boot promise={ setup() }>
            <App />
        </Boot>
    </StylesProvider>,
    document.getElementById('root')
);
