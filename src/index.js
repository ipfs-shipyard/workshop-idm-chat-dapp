import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import * as serviceWorker from './serviceWorker'

const Room = require('ipfs-pubsub-room')
const IPFS = require('ipfs')
const ipfs = new IPFS({
  EXPERIMENTAL: {
    pubsub: true
  },
  config: {
    Addresses: {
      Swarm: [
        '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
      ]
    }
  }
})

// IPFS node is ready, so we can start using ipfs-pubsub-room
ipfs.on('ready', async () => {
  const room = Room(ipfs, 'idm-chat-room')

  room.on('peer joined', (peer) => {
    console.log('Peer joined the room', peer)
  })

  room.on('peer left', (peer) => {
    console.log('Peer left...', peer)
  })

  // now started to listen to room
  room.on('subscribed', () => {
    console.log('Now connected!')
  })

  const peerId = await ipfs.id()
  ReactDOM.render(<App room={room} peerId={peerId} />, document.getElementById('root'))
})

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister()
