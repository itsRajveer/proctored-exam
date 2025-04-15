import React, { useState, useEffect, useRef } from "react";
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
import { useToast } from "@/components/ui/use-toast";
import { WebRTCService } from "@/services/webrtcService";
import { monitoringService } from "@/services/monitoringService";
import { getAuth } from "firebase/auth";
import { examService } from "@/services/examService";

interface MonitoringSession {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: 'active' | 'ended';
  violations: number;
  lastViolationTime: string | null;
  peerId: string | null;
  aiFlags: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export const StudentMonitor: React.FC = () => {
  const { toast } = useToast();
  const auth = getAuth();
  const [selectedExam, setSelectedExam] = useState("");
  const [exams, setExams] = useState<Array<{ id: string; title: string }>>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "warning" | "flagged">("all");
  const [expandedStudentId, setExpandedStudentId] = useState("");
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [sessions, setSessions] = useState<MonitoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const webrtcRef = useRef<WebRTCService | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch exams
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await examService.getTeacherExams();
        setExams(response);
        if (response.length > 0 && !selectedExam) {
          setSelectedExam(response[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch exams:', err);
        toast({
          title: "Error",
          description: "Failed to fetch exams",
          variant: "destructive",
        });
      }
    };

    fetchExams();
  }, [toast]);

  // Fetch monitoring sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!selectedExam) return;
      
      try {
        setLoading(true);
        const response = await monitoringService.getActiveSessions(selectedExam);
        setSessions(response);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch monitoring sessions:', err);
        setError("Failed to fetch monitoring sessions");
        toast({
          title: "Error",
          description: "Failed to fetch monitoring sessions",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (selectedExam) {
      fetchSessions();
      const interval = setInterval(fetchSessions, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [selectedExam, toast]);

  const handleViewStudent = async (sessionId: string) => {
    if (sessionId === expandedStudentId) {
      // Stop monitoring
      if (webrtcRef.current) {
        webrtcRef.current.cleanup();
        webrtcRef.current = null;
      }
      setExpandedStudentId("");
      return;
    }

    const session = sessions.find(s => s.id === sessionId);
    if (!session || !session.peerId) return;

    try {
      // Initialize WebRTC
      webrtcRef.current = new WebRTCService();
      await webrtcRef.current.startLocalStream();
      
      // Start signaling
      webrtcRef.current.startSignaling(sessionId, auth.currentUser?.uid || '', (stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });

      // Create and send offer
      const offer = await webrtcRef.current.createOffer(session.peerId);
      await webrtcRef.current.sendSignalingMessage(
        sessionId,
        auth.currentUser?.uid || '',
        session.peerId,
        'offer',
        offer
      );

      setExpandedStudentId(sessionId);
    } catch (error) {
      console.error('Error starting monitoring:', error);
      toast({
        title: "Error",
        description: "Failed to start video monitoring",
        variant: "destructive",
      });
    }
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

  // Filter sessions based on selected status
  const filteredSessions = filterStatus === "all" 
    ? sessions 
    : sessions.filter(session => {
        if (filterStatus === "active") return session.violations === 0;
        if (filterStatus === "warning") return session.violations > 0 && session.violations < 3;
        if (filterStatus === "flagged") return session.violations >= 3;
        return true;
      });

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
            {exams.map((exam) => (
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
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expandedStudentId ? (
            // Show only the expanded student
            <div className="col-span-full">
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full mr-2 bg-green-500" />
                      <h3 className="font-medium">
                        {sessions.find(s => s.id === expandedStudentId)?.studentName}
                      </h3>
                    </div>
                    <Button 
                      onClick={() => handleViewStudent(expandedStudentId)}
                      variant="outline"
                    >
                      <EyeOff className="mr-2 h-4 w-4" />
                      Close View
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="w-full h-auto aspect-video bg-black/10 relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 text-xs rounded">
                        Student Camera
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">AI Monitoring</h4>
                      <div className="space-y-1">
                        {sessions.find(s => s.id === expandedStudentId)?.aiFlags.map((flag, index) => (
                          <div key={index} className="text-sm text-red-500">
                            {new Date(flag.timestamp).toLocaleTimeString()} - {flag.description}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Show all students
            filteredSessions.map((session) => (
              <Card key={session.id} className={`overflow-hidden ${
                session.violations >= 3 ? "border-red-500" : 
                session.violations > 0 ? "border-yellow-500" : ""
              }`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div className={`h-3 w-3 rounded-full mr-2 ${
                        session.violations === 0 ? "bg-green-500" : 
                        session.violations < 3 ? "bg-yellow-500" : 
                        "bg-red-500 animate-pulse"
                      }`} />
                      <h3 className="font-medium">{session.studentName}</h3>
                    </div>
                    
                    {session.violations > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {session.violations} violations
                      </Badge>
                    )}
                  </div>
                  
                  <Button 
                    onClick={() => handleViewStudent(session.id)}
                    className="w-full"
                    variant="secondary"
                    disabled={!session.peerId}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Monitor Student
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
          
          {filteredSessions.length === 0 && (
            <div className="col-span-full text-center py-12">
              <User className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No Students Found</h3>
              <p className="mt-2 text-sm text-gray-500">
                No students match the selected filter criteria.
              </p>
            </div>
          )}
        </div>
      )}
      
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
