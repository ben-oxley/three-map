/*
 *  Copyright (c) 2021 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

const startButton = document.getElementById('startButton');
const hangupButton = document.getElementById('hangupButton');
hangupButton.disabled = true;

const remoteVideo = document.getElementById('remoteVideo');

let pc;
let localStream;

const signaling = new BroadcastChannel('webrtc');
signaling.onmessage = e => {
    switch (e.data.type) {
        case 'offer':
            handleOffer(e.data);
            break;
        case 'answer':
            handleAnswer(e.data);
            break;
        case 'candidate':
            handleCandidate(e.data);
            break;
        case 'ready':
            // A second tab joined. This tab will initiate a call unless in a call already.
            if (pc) {
                console.log('already in call, ignoring');
                return;
            }
            makeCall();
            break;
        case 'bye':
            if (pc) {
                hangup();
            }
            break;
        default:
            console.log('unhandled', e);
            break;
    }
};

startButton.onclick = async () => {
    startButton.disabled = true;
    hangupButton.disabled = false;

    signaling.postMessage({ type: 'ready' });
};

hangupButton.onclick = async () => {
    hangup();
    signaling.postMessage({ type: 'bye' });
};

async function hangup() {
    if (pc) {
        pc.close();
        pc = null;
    }
    startButton.disabled = false;
    hangupButton.disabled = true;
};

function createPeerConnection() {
    pc = new RTCPeerConnection();
    pc.onicecandidate = e => {
        const message = {
            type: 'candidate',
            candidate: null,
        };
        if (e.candidate) {
            message.candidate = e.candidate.candidate;
            message.sdpMid = e.candidate.sdpMid;
            message.sdpMLineIndex = e.candidate.sdpMLineIndex;
        }
        signaling.postMessage(message);
    };
    pc.ontrack = e => remoteVideo.srcObject = e.streams[0];
}

async function makeCall() {
    await createPeerConnection();

    const offer = await pc.createOffer();
    signaling.postMessage({ type: 'offer', sdp: offer.sdp });
    await pc.setLocalDescription(offer);
}

async function handleOffer(offer) {
    if (pc) {
        console.error('existing peerconnection');
        return;
    }
    await createPeerConnection();
    await pc.setRemoteDescription(offer);

    const answer = await pc.createAnswer();
    var arr = answer.sdp.split('\r\n');
    arr.forEach((str, i) => {
        if (/^a=fmtp:\d*/.test(str)) {
            arr[i] = str + ';x-google-max-bitrate=100000;x-google-min-bitrate=0;x-google-start-bitrate=60000';
        } else if (/^a=mid:(1|video)/.test(str)) {
            arr[i] += '\r\nb=AS:10000';
        }
    });
    answer.sdp = arr.join('\r\n');
    signaling.postMessage({ type: 'answer', sdp: answer.sdp });
    await pc.setLocalDescription(answer);
}

async function handleAnswer(answer) {
    if (!pc) {
        console.error('no peerconnection');
        return;
    }
    await pc.setRemoteDescription(answer);
}

async function handleCandidate(candidate) {
    if (!pc) {
        console.error('no peerconnection');
        return;
    }
    if (!candidate.candidate) {
        await pc.addIceCandidate(null);
    } else {
        await pc.addIceCandidate(candidate);
    }
}
