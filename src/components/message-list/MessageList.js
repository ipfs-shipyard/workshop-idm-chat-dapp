import React, { PureComponent, createRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import MessageItem from '../message-item';
import './MessageList.css';

const SCROLL_BOTTOM_THRESHOLD = 40;

class MessageList extends PureComponent {
    ulRef = createRef();

    getSnapshotBeforeUpdate() {
        const ulNode = this.ulRef.current;

        return {
            atBottom: ulNode.scrollTop >= (ulNode.scrollHeight - ulNode.offsetHeight - SCROLL_BOTTOM_THRESHOLD),
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const ulNode = this.ulRef.current;

        if (snapshot.atBottom) {
            this.ulRef.current.scrollTop = ulNode.scrollHeight - ulNode.offsetHeight;
        }
    }

    render() {
        const { messages, currentUser, verifyMessage, className } = this.props;

        return (
            <ul
                ref={ this.ulRef }
                className={ classNames('MessageList', className) }>
                { messages.map((message, index) => {
                    const previousMessage = messages[index - 1];

                    const fromMyself = Boolean(
                        currentUser &&
                        currentUser.identifier === message.author.identifier
                    );
                    const sameUserAsPreviousAndWithinThreshold = Boolean(
                        previousMessage &&
                        previousMessage.author.identifier === message.author.identifier &&
                        message.timestamp - previousMessage.timestamp < 60000,
                    );

                    return (
                        <MessageItem
                            key={ message.id }
                            message={ message }
                            verifyMessage={ verifyMessage }
                            flipped={ fromMyself }
                            coalesced={ sameUserAsPreviousAndWithinThreshold } />
                    );
                }) }
            </ul>
        );
    }
}

MessageList.propTypes = {
    messages: PropTypes.array.isRequired,
    verifyMessage: PropTypes.func,
    currentUser: PropTypes.object,
    className: PropTypes.string,
};

export default MessageList;
