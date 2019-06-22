import React from 'react';
import PropTypes from 'prop-types';
import Avatar from '@material-ui/core/Avatar';
import IpfsUrl from '../ipfs-url';

const IpfsAvatar = ({ src, ...rest }) => {
    if (!src) {
        return <Avatar { ...rest } />;
    }

    return (
        <IpfsUrl input={ src }>
            { ({ status, value }) => (
                <Avatar
                    src={ status === 'fulfilled' ? value : undefined }
                    { ...rest } />
            ) }
        </IpfsUrl>
    );
};

IpfsAvatar.propTypes = {
    src: PropTypes.string,
};

export default IpfsAvatar;
