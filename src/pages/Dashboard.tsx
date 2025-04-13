import React from "react";
import { Route, Routes } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ExamList } from "@/components/student/ExamList";
import { ExamView } from "@/components/student/ExamView";
import { GradesList } from "@/components/student/GradesList";
import { ClassManagement } from "@/components/teacher/ClassManagement";
import { ExamCreator } from "@/components/teacher/ExamCreator";
import { ExamReview } from "@/components/teacher/ExamReview";
import { StudentMonitor } from "@/components/teacher/StudentMonitor";
import CalendarPage from "@/components/calendar/CalendarPage";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, BookOpen, GraduationCap } from "lucide-react";
import { StudentDashboard } from "../components/student/StudentDashboard";
import { TeacherDashboard } from "../components/teacher/TeacherDashboard";

const DashboardOverview = ({ title, description, icon, value }: { 
  title: string; 
  description: string;
  icon: React.ReactNode;
  value: string | number;
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return null; // or a loading state
  }

  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route
          index
          element={
            user.role === "student" ? <StudentDashboard /> : <TeacherDashboard />
          }
        />
        
        {/* Student Routes */}
        <Route
          path="exams"
          element={user.role === "student" ? <ExamList /> : <ExamCreator />}
        />
        <Route path="exam/:id" element={<ExamView />} />
        <Route path="grades" element={<GradesList />} />
        
        {/* Teacher Routes */}
        <Route path="classes" element={<ClassManagement />} />
        <Route path="exam/:id/review" element={<ExamReview />} />
        <Route path="monitoring" element={<StudentMonitor />} />
        
        {/* Calendar Route (shared between student and teacher) */}
        <Route path="calendar" element={<CalendarPage />} />
      </Route>
    </Routes>
  );
};

export default Dashboard;
