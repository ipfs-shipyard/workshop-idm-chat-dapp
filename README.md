# IDM Chat app workshop

This walk-through will guide you into the process of integrating IDM to provide authentication and signing into a simple decentralized chat app. There're [introductory slides](https://docs.google.com/presentation/d/1HbydOI0w-T_FY23zCACAyHmzDq1ZvyG2tklpPSm6OQQ/edit?usp=sharing) that talk about the underlying standards IDM uses, such as DIDs and Verifiable Credentials.

The project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Walk-through

Follow each step below to complete the workshop. At any time, you may check the final application in the [`with-idm`](https://github.com/ipfs-shipyard/workshop-idm-chat-dapp/compare/master...with-idm) branch if you are stuck or running into issues.

1. [Prerequisites](#1-prerequisites)
1. [Installation](#2-installation)
1. [Understanding the chat app](#3-understanding-the-chat-app)
1. [Setting up `idm-client` in the project](#4-setting-up-idm-client-in-the-project)
1. [Integrate login & logout](#5-integrate-login--logout)
1. [Integrate signing and verification of signatures](#6-integrate-signing-and-verification-of-signatures)
    1. [Signing with the device key](#61-signing-with-the-device-key)

### 1. Prerequisites

- [`git`](https://git-scm.com/) installed on your machine.
- [Node.js](https://nodejs.org/download/) `^10.16.0` or greater installed on your machine.

    > ⚠️ Node `v12` is not yet supported as some libraries do not compile correctly.
- A modern browser, such as [Chrome](https://www.google.com/chrome) or [Firefox](https://www.mozilla.org/firefox/new/).
- A code editor, such as [Visual Code](https://code.visualstudio.com/), [Atom](https://atom.io/) or [Sublime](https://www.sublimetext.com/).

### 2. Installation

Simply clone this repository, install the dependencies and run the app locally:

```sh
$ git clone git@github.com:ipfs-shipyard/workshop-idm-chat-dapp.git
$ cd workshop-idm-chat-dapp && npm i && npm start
```

> 🙏 These commands may take a while, please be patient.

### 3. Understanding the chat app

The [`index.js`](src/index.js) file is the main entry point. Its responsibility is to setup the app, initialize an IPFS node for the real-time chat, and to render the root [`<Boot>`](src/Boot.js) & [`<App>`](src/App.js) React components.

The `<Boot>` component will display a loading icon while the setup process is inflight and an error message if the setup process failed. The `<App>` component will only be rendered once the setup process finishes successfully. It also connects to all the [`stores`](src/stores) so that parts of the app will re-render automatically whenever these stores' change state.

Feel free to peek at the rest of the React [`components`](src/components), but we will be mainly focusing on the [`stores`](src/stores) during the workshop.

There are two stores: the [`userStore`](src/stores/user.js) and the [`roomStore`](src/stores/room.js). As the names suggest, the `userStore` manages the current logged in user and exports functions to `login()` and `logout()`, while the `roomStore` manages the room messages and peers and exports functions to `sendMessage()` and `verifyMessage()`. These functions contain mocks that we will be re-implementing.

The chat app should be running on `http://localhost:3500`, try it out! 🚀

> ℹ️ Most of the code was kept simple so that it's easy to understand. In this example, we avoided using react hooks, functional components and state management libraries such as Redux.

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

const WALLET_URL = 'https://demo.nomios.io';
const APP = {
    name: 'Example Chat App',
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

Before creating the actual `idmClient`, we are initializing the `idmBridge` based on the postMessage API and passing `WALLET_URL` to its factory. The `idmClient` is then created using the `APP` details, the `idmBridge` and the `ipfs` node we already had in place. That IPFS node will be used by the IDM Client to resolve [DID-Documents](https://w3c-ccg.github.io/did-spec/#did-documents) based on [IPID](https://did-ipid.github.io/ipid-did-method/). Finally, the created `idmClient` is passed to the `configure()` function so that our stores may use it internally.

> ⚠️ You must keep the Nomios wallet open ([https://demo.nomios.io](https://demo.nomios.io)) at all times. This limitation will be overcome in a later release by leveraging Service Workers.

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

The `onSessionChange` callback we registered is called whenever the underlying session changes. This way we react not only when we login & logout, but also if the app (and its corresponding session) gets revoked by the user.

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

Note that we no longer need to update the store's `state` nor dispatch an `onChange` event as the `idmClient` will call the `onSessionChange` callback we registered ealier.

With just these small changes, we should be able to use the Nomios wallet to login to the app & logout from the app. If you haven't created your identity yet, please create it in Nomios.

There's an issue though: if you refresh the app, you will be logged out 😭. Lets fix that by adding a check at `configure()` right before the line where we subscribe to `onSessionChange`:

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

> ⚠️ Because DIDs allow for "self-sovereign" digital identity, someone could try to impersonate others by creating a fake profiles. DIDs begin by being "trustless" in the sense that they don't directly provide meaningful identity attributes. But trust between DID-identified peers can be built up through the exchange of [Verifiable Credentials](https://www.w3.org/TR/verifiable-claims-data-model/) - credentials about identity attributes that include cryptographic proof. These proofs can be verified by reference to the issuer's DID and DID-Document.

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

        const result = await idmClient.verifySignature(originalMessage, signature);

        // ...
    },
};
```

That was easy huh? Now go test it, hurry!

If you want to know more about the signing and verifications process, you may read the Motivation section of the [idm-signatures](https://github.com/ipfs-shipyard/js-idm-signatures#motivation) repository.

#### 6.1. Signing with the device key

The previous signing example was made using the session private key. This allows for non-intrusive signing use-cases where you do not want to prompt the user. Could you imagine using a chat app where you were prompted every-time a new message was typed? I certainly couldn't...

The trade-off here is that if someone gets access to the physical device and is able to bypass the built-in OS lock-screen (e.g.: by coercion), that person will see the raw session private keys because they are unencrypted. Anyone verifying signatures with those compromised session keys will see them as valid until the DID owner revokes that device from another IDM Wallet. Revoking a device key will automatically revoke all session keys because all session keys are children of device keys.

There are use-cases where you may want a higher level of security, such as when deleting a chat room. In those scenarios, you may request signing with the device private key which is stored encrypted within the IDM Wallet.

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

While IDM and Nomios are still in their infancy, this workshop is meant to showcase its potential and commitment to open-standards, such as [DIDs](https://w3c-ccg.github.io/did-spec) and [Verifiable Credentials](https://www.w3.org/TR/verifiable-claims-data-model/).

Here are some references if you want to know more:

- Project management repository on GitHub - https://github.com/ipfs-shipyard/pm-idm
- IDM Concept document - https://github.com/ipfs-shipyard/pm-idm/blob/master/docs/idm-concept.md
- IDM Specification document - https://github.com/ipfs-shipyard/pm-idm/blob/master/docs/idm-spec.md
- IDM & Nomios codebase - https://github.com/ipfs-shipyard/pm-idm#codebase

If you are interested in helping us or even just tracking progress, you may do so via:

- Subscribing to the Nomios newsletter at http://nomios.io
- Chatting with us on `#ipfs` and `#ipfs-identity` IRC channels on freenode.net
- Attending our bi-weekly progress calls - https://github.com/ipfs-shipyard/pm-idm/issues?q=progress+label%3Aprogress-call
