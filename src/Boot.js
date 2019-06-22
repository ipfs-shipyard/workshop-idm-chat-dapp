import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { PromiseState } from 'react-promiseful';
import CircularProgress from '@material-ui/core/CircularProgress';
import { IpfsProvider } from './components/ipfs';
import './Boot.css';

class Boot extends Component {
    render() {
        const { promise } = this.props;

        return (
            <PromiseState
                promise={ promise }
                onSettle={ this.handlePromiseSettle }>
                { ({ status, value }) => {
                    switch (status) {
                    case 'pending': return this.renderLoading();
                    case 'rejected': return this.renderError(value);
                    case 'fulfilled': return this.renderSuccess(value);
                    default: return null;
                    }
                } }
            </PromiseState>
        );
    }

    renderLoading() {
        return (
            <div className="Boot">
                <CircularProgress size={ 48 } />
            </div>
        );
    }

    renderError(error) {
        return (
            <div className="Boot">
                { error.code ? `${error.code} - ` : null }
                { error.message }
            </div>
        );
    }

    renderSuccess(ipfs) {
        return (
            <IpfsProvider value={ ipfs }>
                { this.props.children }
            </IpfsProvider>
        );
    }

    handlePromiseSettle = ({ status, value }) => {
        if (status === 'rejected') {
            console.error(value);
        }
    };
}

Boot.propTypes = {
    promise: PropTypes.shape({
        then: PropTypes.func.isRequired,
        catch: PropTypes.func.isRequired,
    }).isRequired,
    children: PropTypes.node.isRequired,
};

export default Boot;
