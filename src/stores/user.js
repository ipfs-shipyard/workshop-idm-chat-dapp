import signal from 'pico-signals';
import pDelay from 'delay';

const onChange = signal();

let state = {
    currentUser: undefined,
};

export const configure = async (params) => {

};

const store = {
    get state() {
        return state;
    },

    login: async () => {
        await pDelay(1000);

        state = {
            ...state.currentUser,
            currentUser: {
                '@context': 'https://schema.org/',
                '@type': 'Person',
                identifier: `did:xxx:${Math.round(Math.random() * 100000000000000).toString(36)}`,
                name: 'John Doe',
            },
        };

        onChange.dispatch(state);
    },

    logout: async () => {
        await pDelay(1000);

        state = {
            ...state,
            currentUser: undefined,
        };

        onChange.dispatch(state);
    },

    subscribe: (fn) => onChange.add(fn),
};

export default store;
