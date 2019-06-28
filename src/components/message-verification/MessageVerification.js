import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { PromiseState } from 'react-promiseful';
import Tooltip from '@material-ui/core/Tooltip';
import CircularProgress from '@material-ui/core/CircularProgress';
import IconButton from '@material-ui/core/IconButton';
import ErrorIcon from '@material-ui/icons/Error';
import ClearIcon from '@material-ui/icons/Clear';
import DoneAll from '@material-ui/icons/DoneAll';
import RefreshIcon from '@material-ui/icons/Refresh';
import './MessageVerification.css';

class MessageVerification extends Component {
    state = {
        verifyPromise: undefined,
    };

    componentDidMount() {
        this.verifyMessage();
    }

    render() {
        const { flipped, className } = this.props;
        const { verifyPromise } = this.state;

        return (
            <div className={ classNames(
                'MessageVerification',
                flipped && 'MessageVerification-flipped',
                className
            ) }>
                <PromiseState promise={ verifyPromise }>
                    { ({ status, value }) => (
                        <>
                            { status === 'pending' && (
                                <span className="MessageVerification-progress">
                                    <CircularProgress
                                        size={ 16 }
                                        color="inherit" />
                                </span>
                            ) }
                            { status === 'rejected' && (
                                <Tooltip title={ `${value.code ? `${value.code} - ` : ''}${value.message}` }>
                                    <span className="MessageVerification-error">
                                        <ErrorIcon color="error" className="MessageVerification-icon MessageVerification-iconError" />
                                        <IconButton className="MessageVerification-retry" onClick={ this.handleRetryClick }>
                                            <RefreshIcon className="MessageVerification-icon" />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            ) }
                            { status === 'fulfilled' && !value.valid && (
                                <Tooltip title={ value.error.message }>
                                    <ClearIcon color="error" className="MessageVerification-icon" />
                                </Tooltip>
                            ) }
                            { status === 'fulfilled' && value.valid && (
                                <DoneAll className="MessageVerification-icon" />
                            ) }
                        </>
                    ) }
                </PromiseState>
            </div>
        );
    }

    verifyMessage() {
        const { message, verifyMessage } = this.props;

        this.setState({
            verifyPromise: verifyMessage(message),
        });
    }

    handleRetryClick = () => this.verifyMessage();
}

MessageVerification.propTypes = {
    message: PropTypes.object.isRequired,
    flipped: PropTypes.bool.isRequired,
    verifyMessage: PropTypes.func.isRequired,
    className: PropTypes.string,
};

export default MessageVerification;
