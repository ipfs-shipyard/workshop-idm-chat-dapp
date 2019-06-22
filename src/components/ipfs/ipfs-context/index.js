import { createContext } from 'react';

const IpfsContext = createContext();

export const IpfsProvider = IpfsContext.Provider;
export const IpfsConsumer = IpfsContext.Consumer;

export default IpfsContext;
