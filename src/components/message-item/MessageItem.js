import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import TimeAgo from 'react-time-ago';
import timeAgo from 'javascript-time-ago';
import timeAgoEnLocale from 'javascript-time-ago/locale/en';
import { IpfsAvatar } from '../ipfs';
import MessageVerification from '../message-verification';
import './MessageItem.css';

timeAgo.locale(timeAgoEnLocale);

class MessageItem extends PureComponent {
    state = {
        verifyPromise: undefined,
    };

    render() {
        const { message, flipped, coalesced, verifyMessage, className } = this.props;

        return (
            <li
                key={ message.id }
                className={ classNames('MessageItem', {
                    'MessageItem-flipped': flipped,
                    'MessageItem-coalesced': coalesced,
                }, className) }>

                <IpfsAvatar
                    src={ message.author.image }
                    size="large"
                    className="MessageItem-authorAvatar">
                    { message.author.name.substr(0, 1) }
                </IpfsAvatar>

                <div className="MessageItem-content">
                    <div className="MessageItem-authorName">
                        { message.author.name }
                    </div>

                    <div className="MessageItem-text">
                        { message.text }
                    </div>

                    <div className="MessageItem-info">
                        { verifyMessage && (
                            <MessageVerification
                                message={ message }
                                flipped={ flipped }
                                verifyMessage={ verifyMessage } />
                        ) }
                        <TimeAgo date={ message.timestamp } className="MessageItem-date" />
                    </div>
                </div>
            </li>
        );
    }
}

MessageItem.propTypes = {
    message: PropTypes.object.isRequired,
    flipped: PropTypes.bool,
    coalesced: PropTypes.bool,
    verifyMessage: PropTypes.func,
    className: PropTypes.string,
};

export default MessageItem;
