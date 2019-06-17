import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import './MessageInput.css';

class MessageInput extends PureComponent {
    state = {
        text: '',
    };

    componentDidUpdate(prevProps) {
        if (!this.props.currentUser && prevProps.currentUser) {
            this.setState({ text: '' });
        }
    }

    render() {
        const { currentUser, className } = this.props;
        const { text } = this.state;

        return (
            <form
                onSubmit={ this.handleSubmit }
                className={ classNames('MessageInput', className) }>
                <TextField
                    value={ text }
                    margin="dense"
                    variant="outlined"
                    placeholder={ currentUser ? 'Type your message' : 'Please login to write a message' }
                    disabled={ !currentUser }
                    className="MessageInput-input"
                    onChange={ this.handleChange } />

                <Button
                    variant="outlined"
                    disabled={ !currentUser || !text }
                    className="MessageInput-button"
                    onClick={ this.handleSubmit }>
                    Send
                </Button>
            </form>
        );
    }

    handleChange = (e) => {
        this.setState({ text: e.target.value });
    };

    handleSubmit = (e) => {
        e.preventDefault();
        this.setState({ text: '' });

        this.props.onSend(this.state.text);
    };
}

MessageInput.propTypes = {
    currentUser: PropTypes.object,
    className: PropTypes.string,
    onSend: PropTypes.func.isRequired,
};

export default MessageInput;
