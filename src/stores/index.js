import userStore, { configure as configureUserStore } from './user';
import roomStore, { configure as configureRoomStore } from './room';
import connect from './utils/connect';

const configure = async (params) => {
    await configureUserStore(params);
    await configureRoomStore(params);
};

export {
    userStore,
    roomStore,
    connect,
    configure,
};
