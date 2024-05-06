/*
 *  Copyright (c) 2021 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';


let pc;

const canvas = document.querySelector('canvas');

const stream = canvas.captureStream();


const signaling = new BroadcastChannel('webrtc');
signaling.onmessage = e => {
    console.log(e)
    if (!stream) {
        console.log('not ready yet');
        return;
    }
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


function createPeerConnection() {
    console.log('cpc');
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
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
}


async function makeCall() {
    console.log('call');
    await createPeerConnection();
    // note the following should be called before before calling either RTCPeerConnection.createOffer() or createAnswer()
    let tcvr = pc.getTransceivers()[0];
    let codecs = RTCRtpReceiver.getCapabilities('video').codecs;
    let vp9_codecs = [];
    // iterate over supported codecs and pull out the codecs we want
    for (let i = 0; i < codecs.length; i++) {
        console.log(codecs[i]);
        if (codecs[i].mimeType == "video/VP9") {
            vp9_codecs.push(codecs[i]);
        }
    }
    // currently not all browsers support setCodecPreferences
    if (tcvr.setCodecPreferences != undefined) {
        tcvr.setCodecPreferences(vp9_codecs);
    }
    const senders = pc.getSenders();
    const parameters = senders[0].getParameters();
    parameters.encodings[0].maxBitrate = 100000000;

    senders[0].setParameters(parameters);
    const offer = await pc.createOffer();
    signaling.postMessage({ type: 'offer', sdp: offer.sdp });
    await pc.setLocalDescription(offer);
}

async function handleOffer(offer) {
    console.log('offer');
    if (pc) {
        console.error('existing peerconnection');
        return;
    }
    await createPeerConnection();
    await pc.setRemoteDescription(offer);
    // note the following should be called before before calling either RTCPeerConnection.createOffer() or createAnswer()
    let tcvr = pc.getTransceivers()[0];
    let codecs = RTCRtpReceiver.getCapabilities('video').codecs;
    let vp8_codecs = [];
    // iterate over supported codecs and pull out the codecs we want
    for (let i = 0; i < codecs.length; i++) {
        console.log(codecs[i])
        if (codecs[i].mimeType == "video/VP8") {
            vp8_codecs.push(codecs[i]);
        }
    }
    // currently not all browsers support setCodecPreferences
    if (tcvr.setCodecPreferences != undefined) {
        tcvr.setCodecPreferences(vp8_codecs);
    }
    const answer = await pc.createAnswer();
    signaling.postMessage({ type: 'answer', sdp: answer.sdp });
    await pc.setLocalDescription(answer);
}

async function handleAnswer(answer) {
    console.log('answer');
    if (!pc) {
        console.error('no peerconnection');
        return;
    }
    await pc.setRemoteDescription(answer);
}

async function handleCandidate(candidate) {
    console.log('candidate');
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