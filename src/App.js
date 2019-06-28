import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Header from './components/header';
import MessageList from './components/message-list';
import MessageInput from './components/message-input';
import { connect, userStore, roomStore } from './stores';
import './App.css';

class App extends Component {
    render() {
        const { userStore, roomStore } = this.props;

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
                        sendMessage={ roomStore.sendMessage } />
                </div>
            </div>
        );
    }
}

App.propTypes = {
    userStore: PropTypes.object.isRequired,
    roomStore: PropTypes.object.isRequired,
};

export default connect({
    userStore,
    roomStore,
})(App);
