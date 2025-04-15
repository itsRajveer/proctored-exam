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
  streamUrl?: string;
  peerId?: string;
  teacherId?: string;
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

  private constructor() {
    this.signalingService = SignalingService.getInstance();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  public async startMonitoring(sessionId: string, studentId: string, studentName: string, examId: string): Promise<void> {
    try {
      // Check if a session already exists for this exam
      const existingSession = Array.from(this.sessions.values()).find(
        session => session.examId === examId && session.status === 'active'
      );

      if (existingSession) {
        console.log('Session already exists for this exam:', existingSession.id);
        return;
      }

      // Check if signaling server is available
      const isServerAvailable = await this.checkSignalingServer();
      if (!isServerAvailable) {
        throw new Error('Signaling server is not available');
      }

      // Get user media
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      // Add local stream to peer connection
      localStream.getTracks().forEach(track => {
        this.signalingService.peerConnection?.addTrack(track, localStream);
      });

      // Create offer
      const offer = await this.signalingService.peerConnection.createOffer();
      await this.signalingService.peerConnection.setLocalDescription(offer);

      // Connect to signaling server
      await this.signalingService.connect(sessionId);
      
      const session: MonitoringSession = {
        id: sessionId,
        studentId,
        studentName,
        examId,
        violations: [],
        status: 'active',
        startTime: new Date().toISOString(),
        streamUrl: localStream.id,
        peerId: this.signalingService.peerConnection.localDescription?.sdp
      };

      // Create monitoring session in database
      await api.post(`/api/monitoring/${examId}/start`, {
        examId: session.examId,
        streamUrl: session.streamUrl,
        peerId: session.peerId
      });

      // Store session in local Map
      this.sessions.set(sessionId, session);
      console.log(`Started monitoring session ${sessionId} for student ${studentName}`);
    } catch (error) {
      console.error('Error starting monitoring session:', error);
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

      // End session in database
      await api.post(`/api/monitoring/${sessionId}/end`);

      // Disconnect from signaling server
      this.signalingService.disconnect();

      // Remove session from local storage
      this.sessions.delete(sessionId);
      console.log(`Ended monitoring session ${sessionId}`);
    } catch (error) {
      console.error('Error ending monitoring:', error);
      throw error;
    }
  }

  public getSession(sessionId: string): MonitoringSession | undefined {
    return this.sessions.get(sessionId);
  }

  public async getAllSessions(): Promise<MonitoringSession[]> {
    try {
      const response = await api.get('/api/monitoring/active');
      const sessions = response.data;
      this.sessions.clear();
      sessions.forEach((session: MonitoringSession) => {
        this.sessions.set(session.id, session);
      });
      return sessions;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return Array.from(this.sessions.values());
    }
  }

  public async getActiveSessions(): Promise<MonitoringSession[]> {
    const sessions = await this.getAllSessions();
    return sessions.filter(session => session.status === 'active');
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
    this.streamHandlers.forEach(handler => handler(stream));
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

  // Start monitoring session
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

      // Check if signaling server is available
      const isServerAvailable = await this.checkSignalingServer();
      if (!isServerAvailable) {
        throw new Error('Signaling server is not available');
      }

      // Get user media
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      // Create peer connection and get offer
      this.signalingService.createPeerConnection();
      const offer = await this.signalingService.peerConnection.createOffer();
      await this.signalingService.peerConnection.setLocalDescription(offer);

      // Create monitoring session in database
      const response = await api.post(`/api/monitoring/${examId}/start`, {
        examId,
        streamUrl: localStream.id,
        studentId: this.getCurrentUserId(),
        studentName: this.getCurrentUserName(),
        peerId: this.signalingService.peerConnection.localDescription?.sdp
      });

      if (!response.data || !response.data.id) {
        throw new Error('Failed to create monitoring session');
      }

      const session = response.data;
      console.log('Created monitoring session:', session);

      // Store session
      this.sessions.set(session.id, session);

      // Set up signaling
      await this.setupSignaling(session.id, localStream);

      return session;
    } catch (error) {
      console.error('Error starting monitoring:', error);
      throw error;
    }
  }

  private getCurrentUserId(): string {
    // Get current user ID from your auth system
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.uid || '';
  }

  private getCurrentUserName(): string {
    // Get current user name from your auth system
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.displayName || 'Student';
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
}

export default MonitoringService.getInstance(); 