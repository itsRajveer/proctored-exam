
import React, { useRef, useState, useEffect } from "react";
import { Camera, CameraOff, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaceDetection } from "@/types";

interface CameraFeedProps {
  onFrame?: (videoElement: HTMLVideoElement) => void;
  onFaceDetection?: (detection: FaceDetection | null) => void;
  isRecording?: boolean;
  showOverlay?: boolean;
  className?: string;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  onFrame,
  onFaceDetection,
  isRecording = false,
  showOverlay = true,
  className = "",
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceDetection, setFaceDetection] = useState<FaceDetection | null>(null);

  // Mock face detection for demo
  useEffect(() => {
    if (!cameraActive || !videoRef.current) return;

    let animationFrameId: number;
    let lastDetection = Date.now();
    const updateDetection = () => {
      const now = Date.now();
      // Only update detection every 500ms
      if (now - lastDetection > 500) {
        // Mock face detection with some random variation
        const detection: FaceDetection = {
          boundingBox: {
            x: 20 + Math.random() * 10,
            y: 20 + Math.random() * 10,
            width: 200 + Math.random() * 20,
            height: 200 + Math.random() * 20,
          },
          headPose: {
            pitch: Math.random() * 10 - 5, // -5 to +5
            yaw: Math.random() * 10 - 5,   // -5 to +5
            roll: Math.random() * 10 - 5,   // -5 to +5
          }
        };
        
        setFaceDetection(detection);
        if (onFaceDetection) {
          onFaceDetection(detection);
        }
        lastDetection = now;
      }

      if (onFrame && videoRef.current) {
        onFrame(videoRef.current);
      }

      animationFrameId = requestAnimationFrame(updateDetection);
    };

    animationFrameId = requestAnimationFrame(updateDetection);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [cameraActive, onFrame, onFaceDetection]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setCameraActive(true);
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    }
    
    setStream(null);
    setCameraActive(false);
  };

  useEffect(() => {
    if (isRecording && !cameraActive) {
      startCamera();
    }
    
    // Cleanup on component unmount
    return () => {
      stopCamera();
    };
  }, [isRecording]);

  return (
    <div className={`relative ${className}`}>
      <div className="camera-container w-full h-full aspect-video bg-black/10">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="camera-feed"
        />
        
        {showOverlay && faceDetection && cameraActive && (
          <div className="camera-overlay">
            <div
              className="face-detection-box"
              style={{
                top: `${faceDetection.boundingBox.y}px`,
                left: `${faceDetection.boundingBox.x}px`,
                width: `${faceDetection.boundingBox.width}px`,
                height: `${faceDetection.boundingBox.height}px`,
              }}
            />
          </div>
        )}
        
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
            {error ? (
              <>
                <AlertTriangle size={32} className="mb-2 text-red-500" />
                <p className="text-center mb-4">{error}</p>
              </>
            ) : (
              <>
                <CameraOff size={32} className="mb-2" />
                <p className="text-center mb-4">Camera is off</p>
              </>
            )}
            <Button onClick={startCamera} variant="default">
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
          </div>
        )}
        
        {cameraActive && !isRecording && (
          <div className="absolute top-2 right-2">
            <Button 
              onClick={stopCamera} 
              size="sm" 
              variant="destructive"
            >
              <CameraOff className="h-4 w-4 mr-2" />
              Stop
            </Button>
          </div>
        )}
        
        {cameraActive && isRecording && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center px-2 py-1 bg-red-500 text-white rounded-md text-sm">
              <span className="h-2 w-2 rounded-full bg-white mr-2 animate-pulse-slow"></span>
              Recording
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraFeed;
