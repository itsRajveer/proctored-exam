import { SignalingService } from './signalingService';
import api from './api';

export interface MonitoringSession {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'ended';
  violations: any[];
}

export interface Violation {
  type: 'multiple_faces' | 'no_face' | 'looking_away' | 'phone_detected' | 'person_detected';
  timestamp: string;
  confidence: number;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private sessions: Map<string, MonitoringSession> = new Map();
  private signalingService: SignalingService;
  private streamHandlers: ((stream: MediaStream) => void)[] = [];
  private recorders: Map<string, MediaRecorder> = new Map();

  private constructor() {
    this.signalingService = SignalingService.getInstance();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  public async startMonitoringSession(examId: string): Promise<MonitoringSession> {
    try {
      // Check if a session already exists for this exam
      const existingSession = Array.from(this.sessions.values()).find(
        session => session.examId === examId && session.status === 'active'
      );

      if (existingSession) {
        console.log('Session already exists for this exam:', existingSession.id);
        return existingSession;
      }

      // Create new session
      const session: MonitoringSession = {
        id: this.generateSessionId(),
        examId,
        studentId: this.getCurrentUserId(),
        studentName: this.getCurrentUserName(),
        status: 'active',
        startTime: new Date().toISOString(),
        violations: []
      };

      // Store session
      this.sessions.set(session.id, session);
      console.log('Started monitoring session:', session.id);

      return session;
    } catch (error) {
      console.error('Error starting monitoring:', error);
      throw error;
    }
  }

  public async endMonitoring(sessionId: string): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.status = 'ended';
      session.endTime = new Date().toISOString();
      this.sessions.delete(sessionId);
      
      console.log('Ended monitoring session:', sessionId);
    } catch (error) {
      console.error('Error ending monitoring:', error);
      throw error;
    }
  }

  public getActiveSessions(): MonitoringSession[] {
    return Array.from(this.sessions.values()).filter(
      session => session.status === 'active'
    );
  }

  private getCurrentUserId(): string {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.uid || '';
  }

  private getCurrentUserName(): string {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.displayName || 'Student';
  }

  private generateSessionId(): string {
    return '-' + Math.random().toString(36).substr(2, 9);
  }

  public addViolation(sessionId: string, violation: Violation): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.violations.push(violation);
      console.log(`Added violation to session ${sessionId}:`, violation);
    }
  }

  public onStream(handler: (stream: MediaStream) => void): void {
    this.streamHandlers.push(handler);
  }

  public offStream(handler: (stream: MediaStream) => void): void {
    this.streamHandlers = this.streamHandlers.filter(h => h !== handler);
  }

  private handleStream(stream: MediaStream): void {
    console.log('Handling stream:', stream);
    this.streamHandlers.forEach(handler => {
      try {
        handler(stream);
      } catch (error) {
        console.error('Error in stream handler:', error);
      }
    });
  }

  public async setupTeacherConnection(sessionId: string): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        console.error('Session not found:', sessionId);
        throw new Error('Session not found');
      }

      // Check if we already have a peer connection for this session
      if (this.signalingService.peerConnection) {
        console.log('Peer connection already exists, cleaning up and creating new one...');
        this.signalingService.peerConnection.close();
        this.signalingService.peerConnection = null;
      }

      // First ensure WebSocket is connected
      await this.signalingService.connect(sessionId);

      // Create new peer connection
      this.signalingService.createPeerConnection();

      // Set up event handlers for the peer connection
      this.signalingService.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Sending ICE candidate:', event.candidate);
          this.signalingService.sendMessage({
            type: 'ice-candidate',
            candidate: {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid || '0',
              sdpMLineIndex: event.candidate.sdpMLineIndex || 0
            },
            sessionId: sessionId,
            targetSessionId: sessionId
          });
        }
      };

      this.signalingService.peerConnection.onconnectionstatechange = () => {
        console.log('Connection state changed:', this.signalingService.peerConnection.connectionState);
        if (this.signalingService.peerConnection.connectionState === 'failed') {
          console.error('WebRTC connection failed');
          this.signalingService.peerConnection.restartIce();
        }
      };

      this.signalingService.peerConnection.ontrack = (event) => {
        console.log('Received track:', event.track);
        if (event.streams && event.streams[0]) {
          console.log('Stream received:', event.streams[0]);
          this.handleStream(event.streams[0]);
        }
      };

      // Get user media
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      // Add tracks to peer connection
      localStream.getTracks().forEach(track => {
        this.signalingService.peerConnection?.addTrack(track, localStream);
      });

      // Create and send offer
      const offer = await this.signalingService.peerConnection.createOffer();
      await this.signalingService.peerConnection.setLocalDescription(offer);

      // Send the offer
      this.signalingService.sendMessage({
        type: 'offer',
        offer: offer,
        sessionId: sessionId,
        targetSessionId: sessionId
      });

      // Set up a timeout to handle connection failure
      setTimeout(() => {
        if (this.signalingService.peerConnection?.connectionState !== 'connected') {
          console.error('Connection timeout - stream not received');
          this.signalingService.peerConnection?.restartIce();
        }
      }, 10000);
    } catch (error) {
      console.error('Error in setupTeacherConnection:', error);
      throw error;
    }
  }

  public async setupSignaling(sessionId: string, localStream: MediaStream): Promise<void> {
    try {
      // Connect to signaling server
      await this.signalingService.connect(sessionId);

      // Create peer connection
      this.signalingService.createPeerConnection();

      // Add local stream tracks to peer connection
      localStream.getTracks().forEach(track => {
        this.signalingService.addTrack(track, localStream);
      });

      // Create and send offer
      const offer = await this.signalingService.peerConnection.createOffer();
      await this.signalingService.peerConnection.setLocalDescription(offer);

      this.signalingService.sendMessage({
        type: 'offer',
        offer: offer,
        sessionId: sessionId
      });
    } catch (error) {
      console.error('Error setting up signaling:', error);
      throw error;
    }
  }

  private async checkSignalingServer(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:5001/health');
      return response.ok;
    } catch (error) {
      console.error('Error checking signaling server:', error);
      return false;
    }
  }

  public async updateSessionViolations(sessionId: string, violations: Violation[]): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.violations = violations;
      await api.post(`/api/monitoring/${sessionId}/violations`, { violations });
    } catch (error) {
      console.error('Error updating session violations:', error);
      throw error;
    }
  }

  public getSessions(): MonitoringSession[] {
    return Array.from(this.sessions.values());
  }

  // End monitoring session
  public async endMonitoringSession(sessionId: string): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // End session in database
      await api.post(`/api/monitoring/${sessionId}/end`);

      // Disconnect from signaling server
      this.signalingService.disconnect();

      // Remove session
      this.sessions.delete(sessionId);
    } catch (error) {
      console.error('Error ending monitoring:', error);
      throw error;
    }
  }

  public getSessionByExamId(examId: string): MonitoringSession | undefined {
    return Array.from(this.sessions.values()).find(
      session => session.examId === examId && session.status === 'active'
    );
  }

  public async sendStreamToServer(sessionId: string, stream: MediaStream): Promise<void> {
    try {
      // Convert stream to blob
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const formData = new FormData();
        formData.append('video', blob);
        formData.append('sessionId', sessionId);

        // Send the video stream to the streaming server
        await fetch(`http://localhost:5002/api/monitoring/${sessionId}/stream`, {
          method: 'POST',
          body: formData
        });
      };

      // Start recording
      mediaRecorder.start(1000); // Record in 1-second chunks

      // Store the recorder for cleanup
      this.recorders.set(sessionId, mediaRecorder);
    } catch (error) {
      console.error('Error sending stream to server:', error);
      throw error;
    }
  }

  public async getStudentStream(sessionId: string): Promise<string> {
    try {
      const response = await fetch(`http://localhost:5002/api/monitoring/${sessionId}/stream`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get stream URL');
      }
      
      // Return the full URL for the stream
      return `http://localhost:5002${data.streamUrl}`;
    } catch (error) {
      console.error('Error getting student stream:', error);
      throw error;
    }
  }
}

export default MonitoringService.getInstance(); 