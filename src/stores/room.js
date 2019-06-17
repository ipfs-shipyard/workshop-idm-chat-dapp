import signal from 'pico-signals';
import nanoid from 'nanoid';
import { omit } from 'lodash';
import createPubsubRoom from 'ipfs-pubsub-room';
import userStore from './user';

let pubsubRoom;
const onChange = signal();

let state = {
    messages: [],
    peers: {},
    peersCount: 0,
};

export const configure = async (params) => {
    pubsubRoom = createPubsubRoom(params.ipfs, 'IDM_CHAT_APP');

    pubsubRoom
    .on('subscribed', () => {
        console.log('Now connected!');

        const peers = pubsubRoom.getPeers();

        state = {
            ...state,
            peers: peers.reduce((acc, peerId) => {
                acc[peerId] = null;

                return acc;
            }, {}),
            peersCount: peers.length,
        };

        onChange.dispatch(state);
    })
    .on('peer joined', (peerId) => {
        console.log('Peer joined:', peerId);

        state = {
            ...state,
            peers: {
                ...state.peers,
                [peerId]: null,
            },
            peersCount: state.peersCount + 1,
        };

        onChange.dispatch(state);
    })
    .on('peer left', (peerId) => {
        console.log('Peer left:', peerId);

        state = {
            ...state,
            peers: omit(state.peers, peerId),
            peersCount: state.peersCount - 1,
        };

        onChange.dispatch(state);
    })
    .on('message', ({ data }) => {
        const dataStr = new TextDecoder().decode(data);
        const dataJson = JSON.parse(dataStr);

        console.log('New message:', dataJson);

        switch (dataJson.type) {
        case 'NEW_MESSAGE':
            state = {
                ...state,
                messages: [
                    ...state.messages,
                    dataJson.message,
                ],
            };

            onChange.dispatch(state);
            break;
        default:
            console.warn('Unknown message', dataJson);
        }
    });
};

const store = {
    get state() {
        return state;
    },

    sendMessage: async (text) => {
        const { currentUser } = userStore.state;

        // Skip if we are logged out or text message is empty
        if (!currentUser || !text.trim().length) {
            return;
        }

        const message = {
            id: nanoid(),
            author: currentUser,
            text,
            timestamp: Date.now(),
        };

        message.signature = {};

        console.log('Sending message:', message);

        pubsubRoom.broadcast(JSON.stringify({
            type: 'NEW_MESSAGE',
            message,
        }));
    },

    verifyMessage: async (message) => {
        const { signature, ...originalMessage } = message;

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const result = {
            valid: true,
            error: undefined,
        };

        console.log('Verification result:', result);

        return result;
    },

    subscribe: (fn) => onChange.add(fn),
};

export default store;
