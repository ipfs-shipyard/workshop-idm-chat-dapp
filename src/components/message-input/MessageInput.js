import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { PromiseState, getPromiseState } from 'react-promiseful';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import ErrorIcon from '@material-ui/icons/Error';
import CircularProgress from '@material-ui/core/CircularProgress';
import './MessageInput.css';

class MessageInput extends PureComponent {
    state = {
        text: '',
        sendPromise: undefined,
    };

    componentDidUpdate(prevProps) {
        if (!this.props.currentUser && prevProps.currentUser) {
            this.setState({ text: '' });
        }
    }

    render() {
        const { currentUser, className } = this.props;
        const { text, sendPromise } = this.state;

        return (
            <form
                onSubmit={ this.handleSubmit }
                className={ classNames('MessageInput', className) }>

                <PromiseState promise={ sendPromise }>
                    { ({ status, value }) => (
                        <>
                            <TextField
                                value={ text }
                                margin="dense"
                                variant="outlined"
                                placeholder={ currentUser ? 'Type your message' : 'Please login to write a message' }
                                disabled={ !currentUser }
                                className="MessageInput-input"
                                onChange={ this.handleChange } />

                            <div className="MessageInput-buttonWrapper">
                                <Button
                                    variant="outlined"
                                    disabled={ !currentUser || !text || status === 'pending' }
                                    className="MessageInput-button"
                                    onClick={ this.handleSubmit }>
                                    { status === 'pending' && (
                                        <CircularProgress size={ 24 } color="primary" className="MessageInput-buttonProgress" />
                                    ) }
                                    { status !== 'rejected' && 'Send' }
                                </Button>

                                { status === 'rejected' && (
                                    <Tooltip title={ `${value.code ? `${value.code} - ` : ''}${value.message}` }>
                                        <ErrorIcon color="error" className="MessageInput-errorIcon" />
                                    </Tooltip>
                                ) }
                            </div>
                        </>
                    ) }
                </PromiseState>
            </form>
        );
    }

    handleChange = (e) => {
        this.setState({
            text: e.target.value,
        });

        // Unset promise when typing if it's rejected
        const errored = getPromiseState(this.state.sendPromise).status === 'rejected';

        if (errored) {
            this.setState({ sendPromise: undefined });
        }
    };

    handleSubmit = (e) => {
        e.preventDefault();

        // Skip if we are still sending a message
        if (getPromiseState(this.state.sendPromise).status === 'pending') {
            return;
        }

        this.setState((state) => ({
            text: '',
            sendPromise: this.props.sendMessage(state.text),
        }));
    };
}

MessageInput.propTypes = {
    currentUser: PropTypes.object,
    className: PropTypes.string,
    sendMessage: PropTypes.func.isRequired,
};

export default MessageInput;
