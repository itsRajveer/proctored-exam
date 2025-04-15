import { db } from '@/config/firebase';
import { ref, onValue, set, off } from 'firebase/database';

interface SignalingData {
  type: 'offer' | 'answer' | 'candidate';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  from: string;
  to: string;
}

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private signalingRef: any = null;

  constructor() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
    };
  }

  async startLocalStream(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');

    // Add local stream tracks to peer connection
    this.localStream?.getTracks().forEach(track => {
      this.peerConnection?.addTrack(track, this.localStream!);
    });

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');

    // Add local stream tracks to peer connection
    this.localStream?.getTracks().forEach(track => {
      this.peerConnection?.addTrack(track, this.localStream!);
    });

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async handleCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  startSignaling(sessionId: string, userId: string, onRemoteStream: (stream: MediaStream) => void) {
    this.signalingRef = ref(db, `signaling/${sessionId}`);
    
    onValue(this.signalingRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const signalingData: SignalingData = data;
      
      if (signalingData.to !== userId) return;

      switch (signalingData.type) {
        case 'offer':
          this.handleOffer(signalingData.sdp!).then(answer => {
            this.sendSignalingMessage(sessionId, userId, signalingData.from, 'answer', answer);
          });
          break;
        case 'answer':
          this.handleAnswer(signalingData.sdp!);
          break;
        case 'candidate':
          this.handleCandidate(signalingData.candidate!);
          break;
      }
    });

    this.peerConnection!.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage(sessionId, userId, '', 'candidate', undefined, event.candidate);
      }
    };

    this.peerConnection!.ontrack = (event) => {
      onRemoteStream(event.streams[0]);
    };
  }

  stopSignaling() {
    if (this.signalingRef) {
      off(this.signalingRef);
      this.signalingRef = null;
    }
  }

  async sendSignalingMessage(
    sessionId: string,
    from: string,
    to: string,
    type: 'offer' | 'answer' | 'candidate',
    sdp?: RTCSessionDescriptionInit,
    candidate?: RTCIceCandidateInit
  ) {
    const signalingRef = ref(db, `signaling/${sessionId}`);
    await set(signalingRef, {
      type,
      sdp,
      candidate,
      from,
      to
    });
  }

  cleanup() {
    this.stopSignaling();
    this.localStream?.getTracks().forEach(track => track.stop());
    this.peerConnection?.close();
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
  }
} 