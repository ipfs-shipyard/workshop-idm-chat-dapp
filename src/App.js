import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { PromiseState } from 'react-promiseful';
import Header from './components/header';
import MessageList from './components/message-list';
import MessageInput from './components/message-input';
import CircularProgress from '@material-ui/core/CircularProgress';
import { connect, userStore, roomStore } from './stores';
import './App.css';

class App extends Component {
    render() {
        const { setupPromise } = this.props;

        return (
            <PromiseState promise={ setupPromise } onSettle={ this.handleSetupPromiseSettle }>
                { ({ status, value }) => {
                    switch (status) {
                    case 'pending': return this.renderLoading();
                    case 'rejected': return this.renderError(value);
                    case 'fulfilled': return this.renderInnerApp(value);
                    default: return null;
                    }
                } }
            </PromiseState>
        );
    }

    renderLoading() {
        return (
            <div className="App App-loading">
                <CircularProgress size={ 48 } />
            </div>
        );
    }

    renderError(error) {
        return (
            <div className="App App-error">
                { error.code ? `${error.code} - ` : null }
                { error.message }
            </div>
        );
    }

    renderInnerApp() {
        const { userStore, roomStore } = this.props;

        console.log('userState', userStore.state);
        console.log('roomState', roomStore.state);

        return (
            <div className="App">
                <Header
                    currentUser={ userStore.state.currentUser }
                    peersCount={ roomStore.state.peersCount }
                    login={ userStore.login }
                    logout={ userStore.logout } />

                <div className="App-room">
                    <MessageList
                        messages={ roomStore.state.messages }
                        verifyMessage={ roomStore.verifyMessage }
                        currentUser={ userStore.state.currentUser }
                        className="App-messageList" />
                    <MessageInput
                        currentUser={ userStore.state.currentUser }
                        onSend={ this.handleSend } />
                </div>
            </div>
        );
    }

    handleSend = (text) => {
        this.props.roomStore.sendMessage(text);
    };

    handleSetupPromiseSettle = ({ status, value }) => {
        if (status === 'rejected') {
            console.error(value);
        }
    };
}

App.propTypes = {
    setupPromise: PropTypes.shape({
        then: PropTypes.func.isRequired,
        catch: PropTypes.func.isRequired,
    }).isRequired,
    userStore: PropTypes.object.isRequired,
    roomStore: PropTypes.object.isRequired,
};

export default connect({
    userStore,
    roomStore,
})(App);
