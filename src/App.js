import React, { Component } from 'react';
import './App.css';
import Messages from "./Messages";
import Input from "./Input";

function randomName() {
  const adjectives = [
    "autumn", "hidden", "bitter", "misty", "silent", "empty", "dry", "dark",
    "summer", "icy", "delicate", "quiet", "white", "cool", "spring", "winter",
    "patient", "twilight", "dawn", "crimson", "wispy", "weathered", "blue",
    "billowing", "broken", "cold", "damp", "falling", "frosty", "green", "long",
    "late", "lingering", "bold", "little", "morning", "muddy", "old", "red",
    "rough", "still", "small", "sparkling", "throbbing", "shy", "wandering",
    "withered", "wild", "black", "young", "holy", "solitary", "fragrant",
    "aged", "snowy", "proud", "floral", "restless", "divine", "polished",
    "ancient", "purple", "lively", "nameless"
  ];
  const nouns = [
    "waterfall", "river", "breeze", "moon", "rain", "wind", "sea", "morning",
    "snow", "lake", "sunset", "pine", "shadow", "leaf", "dawn", "glitter",
    "forest", "hill", "cloud", "meadow", "sun", "glade", "bird", "brook",
    "butterfly", "bush", "dew", "dust", "field", "fire", "flower", "firefly",
    "feather", "grass", "haze", "mountain", "night", "pond", "darkness",
    "snowflake", "silence", "sound", "sky", "shape", "surf", "thunder",
    "violet", "water", "wildflower", "wave", "water", "resonance", "sun",
    "wood", "dream", "cherry", "tree", "fog", "frost", "voice", "paper", "frog",
    "smoke", "star"
  ];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return adjective + noun;
}

function randomColor() {
  return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16);
}

class App extends Component {
  
  constructor(props) {
    super(props)
    this.peerId = this.props.peerId
    this.member = {username: randomName(),color: randomColor(), id: this.props.peerId.id}
  }

  state = {
    messages: [],
    members: {
    },
    peers: {
      total: 0,
      list: []
    }
  }
  

  getOrCreateMember(memberPeerId, username=false){
    console.log("Looking for: "+memberPeerId)
    if(this.state.members[memberPeerId]){
      console.log("Found: "+memberPeerId)
      console.log("returning: "+JSON.stringify(this.state.members[memberPeerId]))
      return this.state.members[memberPeerId]
    }else{
      const newMember = {username: username ? username: randomName(),color: randomColor(), id: memberPeerId}
      const membersList = this.state.members
      
      this.setState( {members: {...this.state.members, [memberPeerId]: newMember}})
      window.state = this.state

      console.log("NOT Found: "+memberPeerId)
      console.log("returning: "+JSON.stringify(newMember))


      return newMember
    }
  }

  getMember(memberPeerId){
    if(this.state.members[memberPeerId]){
      return this.state.members[memberPeerId]
    }else{
      return false
    }
  }

  // constructor() {
  //   super();
  //   this.drone = new window.Scaledrone("YOUR-CHANNEL-ID", {
  //     data: this.state.member
  //   });
  //   this.drone.on('open', error => {
  //     if (error) {
  //       return console.error(error);
  //     }
  //     const member = {...this.state.member};
  //     member.id = this.drone.clientId;
  //     this.setState({member});
  //   });
  //   const room = this.drone.subscribe("observable-room");
  //   room.on('data', (data, member) => {
  //     const messages = this.state.messages;
  //     messages.push({member, text: data});
  //     this.setState({messages});
  //   });
  // }

  updatePeers({joined=false, left=false}) {
    const peers = this.props.room.getPeers()
    const total = peers.length
    let newTotal = total

    if(joined){
      newTotal = total+1
    }

    if(left){
      newTotal = total-1
    }

    const list = peers
    this.setState({peers: {total: newTotal,list}})
  }

  componentDidMount() {
    window.room = this.props.room
    this.updatePeers({})
    this.props.room.on('peer joined', (peer) => {
      console.log('Peer joined...', peer)
      this.updatePeers({joined:true})
    })
  
    this.props.room.on('peer left', (peer) => {
      console.log('Peer left...', peer)
      this.updatePeers({left:true})
    })


    this.props.room.on('message', (message) => {
    if(message.from === this.peerId.id){
      return
    }
    const enc = new TextDecoder('utf-8')
    const msg = enc.decode(message.data)
    console.log('MSG! ' + msg)
    this.onReceiveMessage({msg, from: message.from})
  })
  }

  render() {
    if(!this.state.members[this.peerId.id]){
      this.setState( {members: {[this.peerId.id]: this.member}})
    }
    return (
      <div className="App">
        <div className="App-header">
          <h1 className="App-title">IDM Chat 🚀</h1>
          <p>{this.state.members[this.peerId.id] ? this.state.members[this.peerId.id].username : "loading"}</p>
          <p>Connected Peers: {this.state.peers.total}</p>
        </div>
        <Messages
          messages={this.state.messages}
          currentMember={this.getMember(this.peerId.id)}
        />
        <Input
          onSendMessage={this.onSendMessage}
        />
      </div>
    );
  }

  
  

  onSendMessage = (message) => {
    console.log("Senfing")
    console.log(message)
    const messages = this.state.messages
    const {room} = this.props
    messages.push({
      text: message,
      member: this.getOrCreateMember(this.peerId.id)
    })
    room.broadcast(JSON.stringify({message, username: this.getMember(this.peerId.id).username}))
    this.setState({messages: messages})
  }

  onReceiveMessage = (encodedMsg) => {
    console.log("got msg")
    console.log(encodedMsg)
    console.log(JSON.parse(encodedMsg.msg))
    const {message, username} = JSON.parse(encodedMsg.msg)
    console.log("Msg"+message+"user: "+username)
    const messages = this.state.messages
    const {room} = this.props
    messages.push({
      text: message,
      member: this.getOrCreateMember(encodedMsg.from, username)
    })
    this.setState({messages: messages})
  }

}

export default App;
