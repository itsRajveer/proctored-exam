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
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, BookOpen, GraduationCap } from "lucide-react";

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

const StudentDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Student Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back to your exam portal. Here's your overview.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <DashboardOverview
          title="Upcoming Exams"
          description="Exams scheduled in the next 7 days"
          icon={<CalendarIcon className="h-4 w-4" />}
          value="3"
        />
        <DashboardOverview
          title="Courses"
          description="Active courses this semester"
          icon={<BookOpen className="h-4 w-4" />}
          value="5"
        />
        <DashboardOverview
          title="Average Grade"
          description="Your performance this semester"
          icon={<GraduationCap className="h-4 w-4" />}
          value="85%"
        />
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Examinations</CardTitle>
            </CardHeader>
            <CardContent>
              <ExamList />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Grades</CardTitle>
            </CardHeader>
            <CardContent>
              <GradesList />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const TeacherDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back. Manage your classes and monitor student activity.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <DashboardOverview
          title="Active Exams"
          description="Exams currently in progress"
          icon={<CalendarIcon className="h-4 w-4" />}
          value="2"
        />
        <DashboardOverview
          title="Total Students"
          description="Students across all classes"
          icon={<BookOpen className="h-4 w-4" />}
          value="127"
        />
        <DashboardOverview
          title="Classes"
          description="Active classes this semester"
          icon={<GraduationCap className="h-4 w-4" />}
          value="4"
        />
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Class Management</CardTitle>
            </CardHeader>
            <CardContent>
              <ClassManagement />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Student Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <StudentMonitor />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route
          index
          element={
            user?.role === "student" ? <StudentDashboard /> : <TeacherDashboard />
          }
        />
        
        {/* Student Routes */}
        <Route path="exams" element={<ExamList />} />
        <Route path="exam/:id" element={<ExamView />} />
        <Route path="grades" element={<GradesList />} />
        
        {/* Teacher Routes */}
        <Route path="classes" element={<ClassManagement />} />
        <Route path="exams" element={<ExamCreator />} />
        <Route path="exam/:id/review" element={<ExamReview />} />
        <Route path="monitoring" element={<StudentMonitor />} />
      </Route>
    </Routes>
  );
};

export default Dashboard;
