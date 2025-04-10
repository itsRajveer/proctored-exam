
import React, { useCallback, useState, useEffect } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { FaceDetection } from "@/types";
import { useToast } from "@/components/ui/use-toast";

interface AIMonitorProps {
  onViolation?: (violationType: string, description: string) => void;
}

export const AIMonitor: React.FC<AIMonitorProps> = ({ onViolation }) => {
  const [status, setStatus] = useState<'normal' | 'warning' | 'violation'>('normal');
  const [message, setMessage] = useState("Monitoring active");
  const [lastDetection, setLastDetection] = useState<FaceDetection | null>(null);
  const [noFaceCount, setNoFaceCount] = useState(0);
  const { toast } = useToast();

  const handleFaceDetection = useCallback((detection: FaceDetection | null) => {
    setLastDetection(detection);
    
    if (!detection) {
      setNoFaceCount(prev => prev + 1);
      
      // After 3 consecutive frames without a face, trigger warning
      if (noFaceCount >= 2) {
        setStatus('warning');
        setMessage("No face detected");
        
        // After 10 consecutive frames without a face, trigger violation
        if (noFaceCount >= 5) {
          setStatus('violation');
          if (onViolation) {
            onViolation('no-face', 'No face detected for extended period');
          }
          toast({
            variant: "destructive",
            title: "Violation Detected",
            description: "No face detected for extended period",
          });
        }
      }
    } else {
      setNoFaceCount(0);
      
      // Check head position
      const { headPose } = detection;
      if (headPose) {
        const { yaw, pitch } = headPose;
        
        // If head is turned too much, trigger warning
        if (Math.abs(yaw) > 30 || Math.abs(pitch) > 20) {
          setStatus('warning');
          setMessage("Looking away from screen");
          
          // If head is turned too much for too long, trigger violation
          if (Math.abs(yaw) > 45 || Math.abs(pitch) > 30) {
            setStatus('violation');
            if (onViolation) {
              onViolation('looking-away', 'Looking away from screen for extended period');
            }
            toast({
              variant: "destructive",
              title: "Violation Detected",
              description: "Looking away from screen",
            });
          }
        } else {
          setStatus('normal');
          setMessage("Monitoring active");
        }
      }
    }
  }, [noFaceCount, onViolation, toast]);
  
  // Mock AI monitoring with random events
  useEffect(() => {
    const interval = setInterval(() => {
      const random = Math.random();
      
      // Simulate occasional warnings and violations
      if (random < 0.05) {
        handleFaceDetection(null); // Simulate no face
      } else if (random < 0.1) {
        handleFaceDetection({
          boundingBox: { x: 50, y: 50, width: 200, height: 200 },
          headPose: { pitch: 35, yaw: 50, roll: 0 } // Looking away
        });
      } else {
        handleFaceDetection({
          boundingBox: { x: 50, y: 50, width: 200, height: 200 },
          headPose: { pitch: Math.random() * 10 - 5, yaw: Math.random() * 10 - 5, roll: 0 }
        });
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [handleFaceDetection]);

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="font-medium mb-2">AI Monitoring Status</h3>
      
      <div className="flex items-center">
        <div className={`h-4 w-4 rounded-full mr-2 ${
          status === 'normal' ? 'bg-green-500' : 
          status === 'warning' ? 'bg-yellow-500' : 
          'bg-red-500 animate-pulse'
        }`}></div>
        
        <div className="flex items-center">
          {status === 'normal' ? (
            <Check className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <AlertTriangle className={`h-4 w-4 ${
              status === 'warning' ? 'text-yellow-500' : 'text-red-500'
            } mr-1`} />
          )}
          <span className={`text-sm ${
            status === 'normal' ? 'text-green-700' : 
            status === 'warning' ? 'text-yellow-700' : 
            'text-red-700'
          }`}>
            {message}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AIMonitor;
