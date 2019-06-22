import React, { useContext } from 'react';
import { IpfsUrl } from 'react-ipfs-url';
import IpfsContext from '../ipfs-context';

const ConnectedIpfsUrl = (props) => {
    const ipfs = useContext(IpfsContext);

    return <IpfsUrl ipfs={ ipfs } { ...props } />;
};

ConnectedIpfsUrl.defaultProps = {
    strategy: 'ipfs-offline-first',
    checkTimeouts: {
        ipfs: 15000,
    },
};

export default ConnectedIpfsUrl;
