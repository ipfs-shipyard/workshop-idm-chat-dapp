import signal from 'pico-signals';

let idmClient;
const onChange = signal();

let state = {
    currentUser: undefined,
};

export const configure = async (params) => {
    idmClient = params.idmClient;

    if (idmClient.isAuthenticated()) {
        state = {
            ...state,
            currentUser: idmClient.getSession().profileDetails,
        };
    }

    idmClient.onSessionChange((session) => {
        state = {
            ...state,
            currentUser: session ? session.profileDetails : undefined,
        };

        onChange.dispatch(state);
    });
};

const store = {
    get state() {
        return state;
    },

    login: async () => {
        const session = await idmClient.authenticate();

        console.log('Logged in!', session);
    },

    logout: async () => {
        await idmClient.unauthenticate();

        console.log('Logged out!');
    },

    subscribe: (fn) => onChange.add(fn),
};

export default store;
