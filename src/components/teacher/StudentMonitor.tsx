
import React, { useState } from "react";
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

// Mock data
const mockExams = [
  { id: "e1", title: "Mid-term Mathematics" },
  { id: "e2", title: "Introduction to Physics" },
];

// Adding explicit type for student status
type StudentStatus = "active" | "warning" | "flagged" | "offline";

const mockStudents = [
  { id: "s1", name: "John Doe", violations: 0, status: "active" as StudentStatus },
  { id: "s2", name: "Jane Smith", violations: 2, status: "warning" as StudentStatus },
  { id: "s3", name: "Michael Brown", violations: 0, status: "active" as StudentStatus },
  { id: "s4", name: "Emily Johnson", violations: 5, status: "flagged" as StudentStatus },
  { id: "s5", name: "David Wilson", violations: 1, status: "active" as StudentStatus },
];

interface StudentCardProps {
  student: {
    id: string;
    name: string;
    violations: number;
    status: StudentStatus;
  };
  onView: (id: string) => void;
  isExpanded: boolean;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onView, isExpanded }) => {
  return (
    <Card className={`overflow-hidden ${
      student.status === "flagged" ? "border-red-500" : 
      student.status === "warning" ? "border-yellow-500" : ""
    }`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${
              student.status === "active" ? "bg-green-500" : 
              student.status === "warning" ? "bg-yellow-500" : 
              student.status === "flagged" ? "bg-red-500 animate-pulse" : 
              "bg-gray-400"
            }`} />
            <h3 className="font-medium">{student.name}</h3>
          </div>
          
          {student.violations > 0 && (
            <Badge variant="destructive" className="ml-2">
              {student.violations} violations
            </Badge>
          )}
        </div>
        
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
            <CameraFeed className="w-full h-auto aspect-video mb-2" />
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
  const [selectedExam, setSelectedExam] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | StudentStatus>("all");
  const [expandedStudentId, setExpandedStudentId] = useState("");
  const [alertsEnabled, setAlertsEnabled] = useState(true);

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
    ? mockStudents 
    : mockStudents.filter(student => student.status === filterStatus);

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
            {mockExams.map((exam) => (
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
              student={mockStudents.find(s => s.id === expandedStudentId)!} 
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
