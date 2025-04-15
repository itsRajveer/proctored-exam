export class SignalingService {
  private static instance: SignalingService;
  public peerConnection: RTCPeerConnection | null = null;
  private socket: WebSocket | null = null;
  private streamListeners: ((stream: MediaStream) => void)[] = [];
  private signalingServerUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number = 1000;
  private connectionPromise: Promise<void> | null = null;
  private isConnected = false;
  private isConnecting = false;
  private sessionId: string | null = null;

  private constructor() {
    this.signalingServerUrl = import.meta.env.VITE_SIGNALING_SERVER_URL || 'ws://localhost:5001';
  }

  public static getInstance(): SignalingService {
    if (!SignalingService.instance) {
      SignalingService.instance = new SignalingService();
    }
    return SignalingService.instance;
  }

  public async connect(sessionId: string): Promise<void> {
    try {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        return;
      }

      this.sessionId = sessionId;
      console.log('Connecting to signaling server:', `${this.signalingServerUrl}/ws?sessionId=${sessionId}`);
      this.socket = new WebSocket(`${this.signalingServerUrl}/ws?sessionId=${sessionId}`);

      // Create a promise that resolves when the connection is established
      const connectionPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);

        this.socket!.onopen = () => {
          console.log('WebSocket connection established');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          clearTimeout(timeout);
          resolve();
        };

        this.socket!.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
      });

      this.socket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        this.isConnected = false;
        this.handleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Received message:', message);

          switch (message.type) {
            case 'offer':
              this.handleOffer(message.offer, message.senderSessionId);
              break;
            case 'answer':
              this.handleAnswer(message.answer);
              break;
            case 'ice-candidate':
              if (message.candidate && message.candidate.candidate) {
                // Ensure the candidate has all required fields
                const candidateData = {
                  candidate: message.candidate.candidate,
                  sdpMid: message.candidate.sdpMid || '0',
                  sdpMLineIndex: message.candidate.sdpMLineIndex || 0,
                  usernameFragment: message.candidate.usernameFragment
                };
                this.handleCandidate(candidateData);
              } else {
                console.warn('Received ICE candidate message without valid candidate data:', message);
              }
              break;
            case 'error':
              console.error('Signaling error:', message.error);
              break;
            default:
              console.warn('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error handling message:', error);
        }
      };

      // Wait for the connection to be established
      await connectionPromise;
    } catch (error) {
      console.error('Error connecting to signaling server:', error);
      throw error;
    }
  }

  public createPeerConnection(): void {
    if (this.peerConnection) {
      console.log('Peer connection already exists, cleaning up and creating new one...');
      this.peerConnection.close();
      this.peerConnection = null;
    }

    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('New ICE candidate:', event.candidate);
        if (this.sessionId) {
          this.sendMessage({
            type: 'ice-candidate',
            candidate: {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid || '0',
              sdpMLineIndex: event.candidate.sdpMLineIndex || 0,
              usernameFragment: event.candidate.usernameFragment
            },
            sessionId: this.sessionId,
            targetSessionId: this.sessionId
          });
        }
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state changed:', this.peerConnection?.connectionState);
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state changed:', this.peerConnection?.iceConnectionState);
    };

    this.peerConnection.ontrack = (event) => {
      console.log('Received track:', event.track);
      if (event.streams && event.streams[0]) {
        console.log('Stream received:', event.streams[0]);
        this.emitStream(event.streams[0]);
      }
    };
  }

  public async setupTeacherConnection(sessionId: string): Promise<void> {
    try {
      // First ensure WebSocket is connected
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        console.log('WebSocket not connected, connecting...');
        await this.connect(sessionId);
      }

      // Then create peer connection
      this.createPeerConnection();

      // Get user media
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      // Add tracks to peer connection
      localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, localStream);
      });

      // Create and send offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Ensure WebSocket is still connected before sending offer
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        console.log('WebSocket disconnected, reconnecting...');
        await this.connect(sessionId);
      }

      console.log('Sending offer to student:', sessionId);
      this.sendMessage({
        type: 'offer',
        offer: offer,
        sessionId: this.sessionId,
        targetSessionId: sessionId
      });
    } catch (error) {
      console.error('Error setting up teacher connection:', error);
      throw error;
    }
  }

  private async handleOffer(offer: RTCSessionDescriptionInit, senderSessionId: string): Promise<void> {
    try {
      if (!this.peerConnection) {
        this.createPeerConnection();
      }

      // Check if we're in a stable state before setting remote description
      if (this.peerConnection.signalingState !== 'stable') {
        console.log('Peer connection not in stable state, current state:', this.peerConnection.signalingState);
        return;
      }

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('Remote description set successfully');

      const answer = await this.peerConnection.createAnswer();
      console.log('Created answer:', answer);
      await this.peerConnection.setLocalDescription(answer);
      console.log('Local description set successfully');

      // Ensure we have a valid session ID
      if (!this.sessionId) {
        console.error('No session ID available to send answer');
        return;
      }

      // Ensure WebSocket is connected before sending answer
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        console.log('WebSocket not connected, reconnecting...');
        await this.connect(this.sessionId);
      }

      this.sendMessage({
        type: 'answer',
        answer: answer,
        sessionId: this.sessionId,
        targetSessionId: senderSessionId
      });
    } catch (error) {
      console.error('Error handling offer:', error);
      throw error;
    }
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      if (!this.peerConnection) {
        console.error('No peer connection available');
        return;
      }

      // Check if we're in the correct state
      if (this.peerConnection.signalingState !== 'have-local-offer') {
        console.log('Peer connection not in have-local-offer state, current state:', this.peerConnection.signalingState);
        // If we're not in the correct state, try to recover
        if (this.peerConnection.signalingState === 'stable') {
          console.log('Peer connection is stable, creating new offer...');
          const offer = await this.peerConnection.createOffer();
          await this.peerConnection.setLocalDescription(offer);
          this.sendMessage({
            type: 'offer',
            offer: offer,
            sessionId: this.sessionId,
            targetSessionId: this.sessionId
          });
        }
        return;
      }

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('Remote description (answer) set successfully');
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  private async handleCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      if (!this.peerConnection) {
        console.error('No peer connection available');
        return;
      }

      // Validate the candidate data
      if (!candidate || !candidate.candidate) {
        console.warn('Invalid ICE candidate format:', candidate);
        return;
      }

      // Create a new RTCIceCandidate with validated data
      const iceCandidate = new RTCIceCandidate({
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid || '0',
        sdpMLineIndex: candidate.sdpMLineIndex || 0,
        usernameFragment: candidate.usernameFragment
      });

      try {
        await this.peerConnection.addIceCandidate(iceCandidate);
        console.log('Successfully added ICE candidate');
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    } catch (error) {
      console.error('Error handling candidate:', error);
    }
  }

  public async sendMessage(message: any): Promise<void> {
    console.log('Current sessionId before sending:', this.sessionId);
    if (!this.sessionId) {
      throw new Error('Session ID not initialized. Call connect(sessionId) before sending messages.');
    }

    // Wait for socket to be in OPEN state
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not ready, waiting for connection...');
      await new Promise<void>((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            clearInterval(checkInterval);
            resolve();
          } else if (this.socket && this.socket.readyState === WebSocket.CLOSED) {
            clearInterval(checkInterval);
            reject(new Error('WebSocket closed while waiting for connection'));
          }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Timeout waiting for WebSocket connection'));
        }, 5000);
      });
    }

    try {
      const messageWithSession = {
        ...message,
        sessionId: this.sessionId,
        targetSessionId: message.targetSessionId || this.sessionId
      };
      this.socket.send(JSON.stringify(messageWithSession));
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
  
  

  public onStream(callback: (stream: MediaStream) => void): void {
    this.streamListeners.push(callback);
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.streamListeners = [];
    this.isConnected = false;
    this.sessionId = null;
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => {
        if (this.sessionId) {
          this.connect(this.sessionId).catch(console.error);
        }
      }, this.reconnectTimeout * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.isConnecting = false;
    }
  }

  private getTargetSessionId(): string {
    if (!this.sessionId) {
      throw new Error('No session ID available');
    }
    return this.sessionId;
  }

  private emitStream(stream: MediaStream): void {
    this.streamListeners.forEach(callback => callback(stream));
  }

  public addTrack(track: MediaStreamTrack, stream: MediaStream): void {
    if (!this.peerConnection) {
      console.error('No peer connection available');
      return;
    }

    // Check if track already exists
    const existingSender = this.peerConnection.getSenders().find(
      sender => sender.track?.id === track.id
    );

    if (!existingSender) {
      this.peerConnection.addTrack(track, stream);
    }
  }
} 