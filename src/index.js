import React from 'react';
import ReactDOM from 'react-dom';
import IPFS from 'ipfs';
import { create } from 'jss';
import { StylesProvider, jssPreset } from '@material-ui/styles';
import { configure } from './stores';
import './index.css';
import App from './App';

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

    // Finally configure our stores
    await configure({ ipfs });
};

const jss = create({
    ...jssPreset(),
    insertionPoint: 'jss-insertion-point',
});

ReactDOM.render(
    <StylesProvider jss={ jss }>
        <App setupPromise={ setup() } />
    </StylesProvider>,
    document.getElementById('root')
);
