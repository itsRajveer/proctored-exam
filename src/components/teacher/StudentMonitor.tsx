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

        // Subscribe to stream updates
        const handleStream = (newStream: MediaStream) => {
          console.log('Received new stream:', newStream);
          setStream(newStream);
          if (videoRef.current) {
            videoRef.current.srcObject = newStream;
            videoRef.current.play().catch(error => {
              console.error('Error playing video:', error);
              setError('Failed to play video stream');
            });
            setIsLoading(false);
          }
        };

        // Store the handler reference
        streamHandlerRef.current = handleStream;
        monitoringService.onStream(handleStream);

        // Start monitoring session
        await monitoringService.startMonitoringSession(student.examId);

        // Setup teacher connection
        await monitoringService.setupTeacherConnection(student.id);

        // Set a timeout to handle cases where stream is not received
        const timeoutId = setTimeout(() => {
          if (isLoading) {
            setError('Connection timeout - stream not received');
            setIsLoading(false);
          }
        }, 10000); // 10 second timeout

        return () => {
          clearTimeout(timeoutId);
          if (streamHandlerRef.current) {
            monitoringService.offStream(streamHandlerRef.current);
            streamHandlerRef.current = null;
          }
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
        };
      } catch (err) {
        console.error('Error setting up stream:', err);
        setError('Failed to setup video stream');
        setIsLoading(false);
      }
    };

    if (isExpanded) {
      setupStream();
    } else {
      setIsLoading(false);
    }
  }, [isExpanded, student, monitoringService]);

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
            className="w-full h-full object-cover"
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
        await Promise.all([
          fetchOngoingExams(),
          fetchActiveSessions()
        ]);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch initial data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Separate useEffect for polling active sessions
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) { // Only fetch if not already loading
        fetchActiveSessions();
      }
    }, 10000); // Poll every 10 seconds instead of 5

    return () => clearInterval(interval);
  }, [loading]);

  const fetchOngoingExams = async () => {
    try {
      const exams = await examService.getTeacherExams();
      const ongoing = exams.filter(exam => {
        const now = new Date();
        const startTime = new Date(exam.startTime);
        const endTime = new Date(exam.endTime);
        return now >= startTime && now <= endTime;
      });
      setOngoingExams(ongoing);
    } catch (error) {
      console.error('Error fetching ongoing exams:', error);
      toast({
        title: "Error",
        description: "Failed to fetch ongoing exams",
        variant: "destructive",
      });
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const sessions = await monitoringService.getActiveSessions();
      setActiveSessions(sessions);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch active sessions",
        variant: "destructive",
      });
    }
  };

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
