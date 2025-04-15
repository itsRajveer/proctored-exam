import { useState, useEffect, useRef } from 'react';
import { monitoringService } from '@/services/monitoringService';

export const useWebRTC = (sessionId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    const setupWebRTC = async () => {
      try {
        // Get media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Create peer connection
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        });

        // Add local stream to peer connection
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        // Handle ICE candidates
        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            await monitoringService.updatePeerId(sessionId, event.candidate.toJSON());
          }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
          setIsConnected(pc.connectionState === 'connected');
        };

        // Handle incoming tracks
        pc.ontrack = (event) => {
          if (videoRef.current) {
            videoRef.current.srcObject = event.streams[0];
          }
        };

        peerConnection.current = pc;

        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await monitoringService.updatePeerId(sessionId, offer);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to setup WebRTC');
        console.error('WebRTC setup failed:', err);
      }
    };

    setupWebRTC();

    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [sessionId]);

  return {
    videoRef,
    isConnected,
    error
  };
}; 