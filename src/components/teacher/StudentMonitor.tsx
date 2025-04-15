import React, { useState, useEffect, useRef, useMemo } from "react";
import { Bell, Clock, Filter, Shield, User, Video, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CameraFeed } from "../common/CameraFeed";
import { AIMonitor } from "../common/AIMonitor";
import { useToast } from "@/components/ui/use-toast";
import monitoringService, { MonitoringSession } from "@/services/monitoringService";
import { examService } from "@/services/examService";
import { Exam } from "@/types";
import { Box, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import { toast } from 'react-toastify';

// Adding explicit type for student status
type StudentStatus = "active" | "warning" | "flagged" | "offline";

interface StudentCardProps {
  student: MonitoringSession;
  onView: (id: string) => void;
  isExpanded: boolean;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onView, isExpanded }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamHandlerRef = useRef<((stream: MediaStream) => void) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!student || !student.id) {
      setError('Invalid student data');
      setIsLoading(false);
      return;
    }

    const setupStream = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('Setting up stream for student:', student.id);

        // Get the student's stream URL from the server
        const response = await fetch(`http://localhost:5002/api/monitoring/${student.id}/stream`);
        const data = await response.json();
        
        console.log('Stream response:', data);
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to get stream URL');
        }

        const streamUrl = `http://localhost:5002${data.streamUrl}`;
        console.log('Full stream URL:', streamUrl);
        
        if (videoRef.current) {
          console.log('Setting up video element');
          
          // Reset video element
          videoRef.current.pause();
          videoRef.current.removeAttribute('src');
          videoRef.current.load();
          
          // Set up video element with proper settings
          videoRef.current.src = streamUrl;
          videoRef.current.crossOrigin = 'anonymous';
          videoRef.current.playsInline = true;
          videoRef.current.autoplay = true;
          videoRef.current.muted = true;
          videoRef.current.controls = true;
          
          // Add event listeners for better error handling and debugging
          videoRef.current.onerror = (e: Event) => {
            const error = (e.target as HTMLVideoElement).error;
            console.error('Video error:', error?.code, error?.message);
            
            // Try to recover from the error by reloading the stream
            if (videoRef.current) {
              console.log('Attempting to recover from error...');
              videoRef.current.load();
              
              // Add a small delay before trying to play again
              setTimeout(() => {
                if (videoRef.current) {
                  videoRef.current.play().catch(playError => {
                    console.error('Recovery attempt failed:', playError);
                    setError('Failed to recover video playback');
                    setIsLoading(false);
                  });
                }
              }, 1000);
            }
          };

          videoRef.current.onloadeddata = () => {
            console.log('Video data loaded');
            setError(null);
            setIsLoading(false);
          };

          videoRef.current.onplaying = () => {
            console.log('Video is playing');
            setError(null);
            setIsLoading(false);
          };

          videoRef.current.onstalled = () => {
            console.log('Video playback stalled');
            // Don't set error immediately, wait to see if it recovers
            setTimeout(() => {
              if (videoRef.current && videoRef.current.readyState < 3) {
                console.log('Attempting to recover from stall...');
                videoRef.current.load();
                videoRef.current.play().catch(error => {
                  console.error('Failed to recover from stall:', error);
                });
              }
            }, 2000);
          };

          // Attempt to play the video
          try {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.error('Error playing video:', error);
                // Only set error if it's not a user interaction required error
                if (error.name !== 'NotAllowedError') {
                  setError('Failed to play video stream');
                  
                  // Try to recover by reloading after a short delay
                  setTimeout(() => {
                    if (videoRef.current) {
                      videoRef.current.load();
                      videoRef.current.play().catch(console.error);
                    }
                  }, 1000);
                }
                setIsLoading(false);
              });
            }
          } catch (error) {
            console.error('Error playing video:', error);
            setError('Failed to play video stream');
            setIsLoading(false);
          }
        }

        // Set up periodic refresh of the stream
        const refreshInterval = setInterval(async () => {
          try {
            if (!videoRef.current) return;

            const response = await fetch(`http://localhost:5002/api/monitoring/${student.id}/stream`);
            const data = await response.json();
            
            if (data.success) {
              const newStreamUrl = `http://localhost:5002${data.streamUrl}`;
              console.log('Refreshing stream URL:', newStreamUrl);
              
              if (videoRef.current.src !== newStreamUrl) {
                const wasPlaying = !videoRef.current.paused;
                const currentTime = videoRef.current.currentTime;
                videoRef.current.src = newStreamUrl;
                
                if (wasPlaying) {
                  const playPromise = videoRef.current.play();
                  if (playPromise !== undefined) {
                    playPromise.catch(error => {
                      if (error.name !== 'NotAllowedError') {
                        console.error('Error playing refreshed video:', error);
                      }
                    });
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error refreshing stream:', error);
          }
        }, 5000);

        // Set a timeout to handle cases where stream is not received
        const timeoutId = setTimeout(() => {
          if (isLoading) {
            setError('Connection timeout - stream not received');
            setIsLoading(false);
          }
        }, 10000);

        return () => {
          console.log('Cleaning up video stream');
          clearTimeout(timeoutId);
          clearInterval(refreshInterval);
          if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.src = '';
            videoRef.current.removeAttribute('src');
            videoRef.current.load();
          }
        };
      } catch (error) {
        console.error('Error setting up stream:', error);
        setError(`Failed to setup video stream: ${error.message}`);
        setIsLoading(false);
      }
    };

    if (isExpanded) {
      setupStream();
    } else {
      setIsLoading(false);
    }
  }, [isExpanded, student]);

  const getStatus = (violations: any[]): StudentStatus => {
    if (!violations) return "offline";
    if (violations.length > 5) return "flagged";
    if (violations.length > 2) return "warning";
    return "active";
  };

  // Memoize the status calculation
  const status = useMemo(() => getStatus(student?.violations || []), [student?.violations]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <Card className={`overflow-hidden ${
      status === "flagged" ? "border-red-500" : 
      status === "warning" ? "border-yellow-500" : ""
    }`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${
              status === "active" ? "bg-green-500" : 
              status === "warning" ? "bg-yellow-500" : 
              status === "flagged" ? "bg-red-500 animate-pulse" : 
              "bg-gray-400"
            }`} />
            <h3 className="font-medium">{student.studentName || 'Unknown Student'}</h3>
          </div>
          
          {student.violations?.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {student.violations.length} violations
            </Badge>
          )}
        </div>
        
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="ml-2 text-sm text-gray-600">Connecting to student...</p>
            </div>
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            controls
            className="w-full h-full object-cover"
            style={{ backgroundColor: 'black' }}
          />
        </div>

        {student.violations?.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Violations:</h4>
            <ul className="space-y-1">
              {student.violations.map((violation, index) => (
                <li key={index} className="text-sm text-red-600">
                  {new Date(violation.timestamp).toLocaleTimeString()} - {violation.type}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {!isExpanded ? (
          <Button 
            onClick={() => onView(student.id)}
            className="w-full"
            variant="secondary"
          >
            <Eye className="mr-2 h-4 w-4" />
            Monitor Student
          </Button>
        ) : (
          <div className="space-y-4">
            <AIMonitor />
            <Button 
              onClick={() => onView("")}
              className="w-full"
              variant="outline"
            >
              <EyeOff className="mr-2 h-4 w-4" />
              Close View
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const StudentMonitor: React.FC = () => {
  const { toast } = useToast();
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"all" | StudentStatus>("all");
  const [expandedStudentId, setExpandedStudentId] = useState<string>("");
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [activeSessions, setActiveSessions] = useState<MonitoringSession[]>([]);
  const [ongoingExams, setOngoingExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // Single useEffect for initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch active sessions from streaming server
        console.log('Fetching sessions from streaming server...');
        const response = await fetch('http://localhost:5002/api/monitoring/sessions');
        const data = await response.json();
        console.log('Received sessions response:', data);
        
        if (data.success) {
          console.log('Setting active sessions:', data.sessions);
          setActiveSessions(data.sessions);
        } else {
          console.error('Failed to fetch sessions:', data.error);
          setActiveSessions([]);
        }
        
        const exams = await examService.getTeacherExams();
        const ongoing = exams.filter(exam => {
          const now = new Date();
          const startTime = new Date(exam.startTime);
          const endTime = new Date(exam.endTime);
          return now >= startTime && now <= endTime;
        });
        setOngoingExams(ongoing);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch initial data",
          variant: "destructive",
        });
        setActiveSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    // Poll for active sessions
    const interval = setInterval(async () => {
      try {
        console.log('Polling for sessions...');
        const response = await fetch('http://localhost:5002/api/monitoring/sessions');
        const data = await response.json();
        console.log('Polling response:', data);
        if (data.success) {
          console.log('Updating active sessions:', data.sessions);
          setActiveSessions(data.sessions);
        }
      } catch (error) {
        console.error('Error polling sessions:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleViewStudent = (studentId: string) => {
    setExpandedStudentId(studentId === expandedStudentId ? "" : studentId);
  };

  const handleToggleAlerts = () => {
    setAlertsEnabled(!alertsEnabled);
    
    toast({
      title: alertsEnabled ? "Alerts Disabled" : "Alerts Enabled",
      description: alertsEnabled 
        ? "You will no longer receive violation alerts." 
        : "You will now receive violation alerts.",
    });
  };

  // Filter students based on selected status
  const filteredStudents = filterStatus === "all" 
    ? activeSessions 
    : activeSessions.filter(session => {
        const violations = session.violations;
        if (filterStatus === "flagged") return violations.length > 5;
        if (filterStatus === "warning") return violations.length > 2 && violations.length <= 5;
        return violations.length <= 2;
      });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (activeSessions.length === 0) {
    return (
      <Box p={3}>
        <Typography variant="h6" color="textSecondary">
          No active monitoring sessions
        </Typography>
      </Box>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Student Monitoring</h2>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={alertsEnabled ? "default" : "outline"}
            size="sm"
            onClick={handleToggleAlerts}
          >
            <Bell className={`mr-2 h-4 w-4 ${!alertsEnabled && "line-through"}`} />
            {alertsEnabled ? "Alerts On" : "Alerts Off"}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>Current Exam:</span>
        </div>
        
        <Select value={selectedExam} onValueChange={setSelectedExam}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Select Exam" />
          </SelectTrigger>
          <SelectContent>
            {ongoingExams.map((exam) => (
              <SelectItem key={exam.id} value={exam.id}>
                {exam.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex items-center space-x-2 ml-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span>Filter:</span>
          <Select value={filterStatus} onValueChange={setFilterStatus as (value: string) => void}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
              <SelectItem value="warning">Warnings</SelectItem>
              <SelectItem value="active">Active</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {expandedStudentId ? (
          // Show only the expanded student
          <div className="col-span-full">
            <StudentCard 
              student={activeSessions.find(s => s.id === expandedStudentId)!} 
              onView={handleViewStudent}
              isExpanded={true}
            />
          </div>
        ) : (
          // Show all students
          filteredStudents.map((student) => (
            <StudentCard 
              key={student.id} 
              student={student} 
              onView={handleViewStudent}
              isExpanded={false}
            />
          ))
        )}
        
        {filteredStudents.length === 0 && (
          <div className="col-span-full text-center py-12">
            <User className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No Students Found</h3>
            <p className="mt-2 text-sm text-gray-500">
              No students match the selected filter criteria.
            </p>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
        <div className="flex items-center">
          <Video className="h-5 w-5 mr-2 text-primary" />
          <div>
            <h3 className="font-medium">AI Monitoring Active</h3>
            <p className="text-sm text-muted-foreground">
              The AI is actively monitoring for rule violations.
            </p>
          </div>
        </div>
        
        <Shield className="h-8 w-8 text-primary" />
      </div>
    </div>
  );
};

export default StudentMonitor;
