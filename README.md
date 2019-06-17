# IDM Chat app workshop

This walk-through will guide you into the process of integrating IDM to provide authentication and signing into a simple decentralized chat app.

The project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Walk-through

Follow the each step below to complete the workshop. At any time, you may check the final application in the [`with-idm`](https://github.com/ipfs-shipyard/workshop-idm-chat-dapp/compare/master...with-idm) branch if you are stuck or running into issues.

1. [Prerequisits](#1-prerequisits)
1. [Installing](#2-installing)
1. [Understanding the Chat app](#3-understanding-the-chat-app)
1. [Setting up `idm-client` in the project](#4-setting-up-idm-client-in-the-project)
1. [Integrate login & logout](#5-integrate-login--logout)
1. [Integrate signing and verification of signatures](#6-integrate-signing-and-verification-of-signatures)
    1. [Signing with the device key](#7-signing-with-the-device-key)

### 1. Prerequisits

1. [`git`](https://git-scm.com/) must be installed on your machine.
1. [Node.js](https://nodejs.org/download/) `^10.16.0`o r greater installed on your machine.

    > ⚠️ Node `v12` is not yet supported as some libraries do not compile correctly.
1. A modern browser, such as [Chrome](https://www.google.com/chrome) or [Firefox](https://www.mozilla.org/firefox/new/)
1. A code editor, such as [Visual Code](https://code.visualstudio.com/), [Atom](https://atom.io/) or [Sublime](https://www.sublimetext.com/)


### 2. Installing

Be sure to have [Node.js](https://nodejs.org/download/) `^10.16.0` or greater installed on your machine.

> ⚠️ Node `v12` is not yet supported as some libraries do not compile correctly.

For this workshop, we will need to clone and run two projects:

- [Nomios wallet](https://github.com/ipfs-shipyard/nomios-web): The reference IDM wallet based on web technologies
- [Chat app](https://github.com/ipfs-shipyard/workshop-idm-chat-dapp): The chat app that lives in this repository

Run the following commands to install and run both projects:

```sh
# On terminal 1
$ git clone git@github.com:ipfs-shipyard/nomios-web.git
$ cd nomios-web && npm i && npm start
```

```sh
# On terminal 2
$ git clone git@github.com:ipfs-shipyard/workshop-idm-chat-dapp.git
$ cd workshop-idm-chat-dapp && npm i && npm start
```

> 🙏 These commands may take a while, so please be patient.

### 3. Understanding the Chat app

The [`index.js`](src/index.js) file is the main entry point. Its responsibility is to setup the app, initialize a IPFS node for the real-time chat, and to render the root [`App`](src/App.js) React component. The `App` component will be displaying a loading while the setup process is inflight and will only render the actual inner app when everything is ready. It also connects to the [`stores`](src/stores) so that parts of the app will re-render automatically whenever these stores' state change.

Feel free to peek at the rest of the React [`components`](src/components), but we will be mainly focusing on the [`stores`](src/stores) during the workshop.

There are two stores: the [`userStore`](src/stores/user.js) and the [`roomStore`](src/stores/room.js). As the names suggest, the `userStore` manages the current logged in user and export functions to `login()` and `logout()`, while the `roomStore` manages the room messages and peers and export functions to `sendMessage()` and `verifyMessage()`. These functions contain mocks that we will be re-implementing.

The Chat app should be running on `http://localhost:3500`, try it out! 🚀

> ℹ️ Most of the code was kept simple so that it's easy to understand. As an example, we avoided using react hooks, functional components and state management libraries such as Redux.

### 4. Setting up `idm-client` in the project

We need to install and setup a IDM Client, in order to interact with IDM based wallets. You may skip the install command below as both are already installed, but for reference you would type:

```sh
npm i idm-client idm-bridge-postmsg
```

The [`idm-client`](https://github.com/ipfs-shipyard/js-idm-client) package is the reference implementation of the IDM Client in JavaScript. But IDM Clients alone can't discover nor communicate with IDM Wallets. For that they need to be configured with a bridge. That's why we also installed the [`idm-bridge-postmsg`](https://github.com/ipfs-shipyard/js-idm-bridge-postmsg) which internally uses the [`postMessage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) API.

Now lets setup these libraries shall we? Lets open [`index.js`](src/index.js) in your favorite editor and add the following lines:

```js
// src/index.js
import createIdmClient from 'idm-client';
import { createClientSide } from 'idm-bridge-postmsg';

// ...

const WALLET_URL = 'http://localhost:3000';
const APP = {
    name: 'Chat demo app',
    homepageUrl: window.location.origin,
    iconUrl: `${window.location.href}favicon.ico`,
};
```

Above, we are importing both libraries as well as defining some constants. The `WALLET_URL` constant is where the IDM Wallet is running, which in this case is Nomios. The `APP` constant holds the app details that will be shown when prompting the user to authenticate and to sign.

Now, lets initialize the actual IDM Client:

```js
// src/index.js
// ...

const setup = async () => {
    // ...

    // Setup IDM Client
    const idmBridge = await createClientSide(WALLET_URL);
    const idmClient = await createIdmClient(APP, idmBridge, { ipfs });

    // Finally configure our stores
    await configure({ ipfs, idmClient });
});
```

We are now creating an `idmBridge` instance, passing the `WALLET_URL` that we previously defined. We are also creating actual `idmClient` we will be using, passing the `idmBridge` as an argument. The `ipfs` node is also being passed to the `idmClient` so that we are able to resolve [DID-Documents](https://w3c-ccg.github.io/did-spec/#did-documents) based on [IPID](https://did-ipid.github.io/ipid-did-method/), which uses IPFS. Finally, the `idmClient` is passed to the `configure()` function so that our stores may get configured with it.

> ⚠️ You must keep the Nomios wallet open ([http://localhost:3000](http://localhost:3000)) at all times. This limitation will be overcome in a later release by leveraging Service Workers.

> ℹ️ In the future, we will automatically discover wallets without having to hardcode their URLs.

### 5. Integrate login & logout

As previously stated, the [`userStore`](src/stores/user.js) has two partially mocked functions that we need to work on. Lets start by storing a reference to the `idmClient` and listening to `onSessionChange` events:

```js
// src/stores/user.js
// ...

let idmClient;

export const configure = async (params) => {
    idmClient = params.idmClient;

    idmClient.onSessionChange((session) => {
        state = {
            ...state,
            currentUser: session ? session.profileDetails : undefined,
        };

        onChange.dispatch(state);
    });
};
```

The `onSessionChange` event fires whenever we the underlying session changes. This way we react not lot only when we login & logout, but also if the app (and its correspondent session) gets revoked by the user.

Now that we have a reference to the `idmClient`, lets use it in the `login()` and `logout()` functions:

```js
// src/stores/user.js
// ...

const store = {
    // ...

    login: async () => {
        const session = await idmClient.authenticate();

        console.log('Logged in!', session);
    },

    logout: async () => {
        await idmClient.unauthenticate();

        console.log('Logged out!');
    },

    // ...
};
```

The `login()` function now calls `idmClient.authenticate()`, which prompts the user to consent sending its [DID](https://w3c-ccg.github.io/did-spec/) and profile details to the app. If the user accepts, a unique session between the app and the wallet will be created. The returned `session` object contains the user DID and profile, among other fields. The profile may be one of the following schema.org types: [Person](https://schema.org/Person), [Organization](https://schema.org/Organization) or [Thing](https://schema.org/Thing).

Note that we no longer need to update the store's `state` nor to dispatch a `onChange` event as the `idmClient` will fire a `onSessionChange` event for us, which we are already handling in the `configure()` function.

With just these small changes, we should be able to use the Nomios wallet to login & logout in and from the app. If you haven't created your identity yet, please create it in Nomios.

There's an issue though: if you refresh the app, you will be logged out 😭. Lets fix that by adding a check at `configure()` right before the line we subscribe to `onSessionChange`:

```js
// src/stores/user.js
export const configure = async (params) => {
    // ...

    if (idmClient.isAuthenticated()) {
        state = {
            ...state,
            currentUser: idmClient.getSession().profileDetails,
        };
    }

    // ...
};
```

By leveraging `idmClient.isAuthenticated()` and `idmClient.getSession()`, we are now able to resume a previous session successfully 💪.

### 6. Integrate signing and verification of signatures

The final part we are missing is to guarantee that messages can be cryptographically verified by others. This will ensure the authenticity of messages by checking if they were made by one of the public keys listed in the [DID-Document](https://w3c-ccg.github.io/did-spec/#did-documents).

> ⚠️ Because DIDs allow for "self-sovereign" digital identity, anyone may try to impersonate others by creating a fake profile. DIDs begin by being "trustless" in the sense that they don't directly provide meaningful identity attributes. But trust between DID-identified peers can be built up through the exchange of [Verifiable Credentials](https://www.w3.org/TR/verifiable-claims-data-model/) - credentials about identity attributes that include cryptographic proof. These proofs can be verified by reference to the issuer's DID and DID-Document.

> ℹ️ Nomios will allow users to self-sign Verifiable Credentials proving they own certain profiles on social networks, similar to how [Keybase does](https://keybase.io/). As of today, many people trust the mainstream social networks, such as Facebook and Twitter, and identities may use them to post cryptographic proofs that link their profiles to a hash of their DID.

As mentioned earlier, the [`roomStore`](src/stores/room.js) has two partially mocked functions that we need to work on. Lets start by storing a reference to the `idmClient` in the `configure()` function, similar to what we did before:

```js
// src/stores/room.js
let idmClient;

export const configure = async (params) => {
    idmClient = params.idmClient;

    // ...
};
```

Now that we have a reference to the `idmClient`, lets use it in the `sendMessage()` and `verifyMessage()` functions.

```js
// src/stores/room.js
const store = {
    // ...

    sendMessage: async (text) => {
        // ...

        message.signature = await idmClient.sign(message);

        // ...
    },

    verifyMessage: async (message) => {
        // ...

        const result = idmClient.verifySignature(originalMessage, signature);

        // ...
    },
};
```

That was easy huh? Now go test it, hurry!

### 6.1. Signing with the device key

The previous signing example was made using the session private key. This allows for non-intrusive signing use-cases where you do not want to prompt the user. Do you imagine using a chat app where we were prompting the user every-time a new message was typed? I certainly don't...

The trade-off here is that if someone gets access to the physical device and is able to bypass the built-in OS lock-screen (e.g.: by coercion), will see the raw session private keys because they are unencrypted. Anyone verifying signatures with those compromised session keys will see them as valid until the DID owner revokes that device from another IDM Wallet. Revoking a device key will automatically revoke all session keys because all session keys are childs of device keys.

Anyway, there are use-cases where you may want a higher level of security, such as when deleting a chat room. In those scenarios, you may request signing with the device private key which is stored encrypted within the IDM Wallet.

But we are not going to implement a "Delete room" feature in our app. Instead, we will be doing something easier but cooler 😎: lets sign with the device whenever the message's text contains the word "IPFS".

```js
// src/stores/room.js
const store = {
    // ...

    sendMessage: async (text) => {
        // ...

        message.signature = await idmClient.sign(message, {
            signWith: /\bipfs\b/i.test(message.text) ? 'device' : 'session',
        });

        // ...
    },
};
```

See how we defined the `signWith` option in relation to the IPFS word been present? That should do it!

## Interested in knowing more?

While IDM and Nomios are still in its infancy, this workshop was meant to showcase its potential and commitment to open-standards, such as [DIDs](https://w3c-ccg.github.io/did-spec) and [Verifiable Credentials](https://www.w3.org/TR/verifiable-claims-data-model/).

If you are interested in helping us or even just tracking progress, you may do so via:

- Subscribing to Nomios newsletter on http://nomios.io
- Chatting with us on `#ipfs` and `#ipfs-identity` IRC channels on freenode.net
- Attending our bi-weekly progress calls - https://github.com/ipfs-shipyard/pm-idm/issues?q=progress+label%3Aprogress-call

Here are few references if you want to know more:

- Project management repository on GitHub - https://github.com/ipfs-shipyard/pm-idm
- IDM Concept document - https://github.com/ipfs-shipyard/pm-idm/blob/master/docs/idm-concept.md
- IDM Specification document - https://github.com/ipfs-shipyard/pm-idm/blob/master/docs/idm-spec.md
- IDM & Nomios codebase - https://github.com/ipfs-shipyard/pm-idm#codebase
