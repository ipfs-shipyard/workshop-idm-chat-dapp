import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { PromiseState } from 'react-promiseful';
import Button from '@material-ui/core/Button';
import Badge from '@material-ui/core/Badge';
import PeopleIcon from '@material-ui/icons/People';
import Tooltip from '@material-ui/core/Tooltip';
import ErrorIcon from '@material-ui/icons/Error';
import CircularProgress from '@material-ui/core/CircularProgress';
import { IpfsAvatar } from '../ipfs';
import './Header.css';

class Header extends PureComponent {
    state = {
        promise: undefined,
    };

    render() {
        const { currentUser, peersCount, className } = this.props;

        return (
            <div className={ classNames('Header', className) }>
                <div className="Header-wrapper">
                    <div className="Header-logo">
                        <span className="Header-logotype">IDM Chat</span>

                        <Badge badgeContent={ peersCount } showZero>
                            <PeopleIcon />
                        </Badge>
                    </div>

                    <div className="Header-auth">
                        { currentUser ? this.renderLoggedIn() : this.renderLoggedOut() }
                    </div>
                </div>

            </div>
        );
    }

    renderLoggedIn() {
        const { promise } = this.state;
        const { currentUser } = this.props;

        return (
            <>
                <IpfsAvatar src={ currentUser.image } className="Header-userAvatar">
                    { currentUser.name.substr(0, 1) }
                </IpfsAvatar>

                <div className="Header-userName">
                    { currentUser.name }
                </div>

                <PromiseState promise={ promise }>
                    { ({ status, value }) => (
                        <>
                            { status === 'rejected' && (
                                <Tooltip title={ `${value.code ? `${value.code} - ` : ''}${value.message}` }>
                                    <ErrorIcon color="error" className="Header-errorIcon" />
                                </Tooltip>
                            ) }

                            <Button
                                variant="contained"
                                color="secondary"
                                className="Header-button"
                                disabled={ status === 'pending' }
                                onClick={ this.handleLogoutClick }>
                                { status === 'pending' && (
                                    <CircularProgress size={ 24 } color="secondary" className="Header-buttonProgress" />
                                ) }
                                Logout
                            </Button>
                        </>
                    ) }
                </PromiseState>
            </>
        );
    }

    renderLoggedOut() {
        const { promise } = this.state;

        return (
            <PromiseState promise={ promise }>
                { ({ status, value }) => (
                    <>
                        { status === 'rejected' && (
                            <Tooltip title={ `${value.code ? `${value.code} - ` : ''}${value.message}` }>
                                <ErrorIcon color="error" className="Header-errorIcon" />
                            </Tooltip>
                        ) }

                        <Button
                            variant="contained"
                            color="primary"
                            className="Header-button"
                            disabled={ status === 'pending' }
                            onClick={ this.handleLoginClick }>
                            { status === 'pending' && (
                                <CircularProgress size={ 24 } className="Header-buttonProgress" />
                            ) }
                            Login with IDM
                        </Button>
                    </>
                ) }
            </PromiseState>
        );
    }

    handleLoginClick = async () => {
        this.setState({
            promise: this.props.login(),
        });
    };

    handleLogoutClick = async () => {
        this.setState({
            promise: this.props.logout(),
        });
    };
}

Header.propTypes = {
    peersCount: PropTypes.number,
    currentUser: PropTypes.object,
    login: PropTypes.func,
    logout: PropTypes.func,
    className: PropTypes.string,
};

Header.defaultProps = {
    peersCount: 0,
};

export default Header;
