
import React from "react";
import { Route, Routes } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ExamList } from "@/components/student/ExamList";
import { ExamView } from "@/components/student/ExamView";
import { GradesList } from "@/components/student/GradesList";
import { ClassManagement } from "@/components/teacher/ClassManagement";
import { ExamCreator } from "@/components/teacher/ExamCreator";
import { StudentMonitor } from "@/components/teacher/StudentMonitor";
import { useAuth } from "@/contexts/AuthContext";

const StudentDashboard = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Student Dashboard</h2>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="col-span-2">
          <ExamList />
        </div>
        <div>
          <GradesList />
        </div>
      </div>
    </div>
  );
};

const TeacherDashboard = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h2>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="col-span-2">
          <ClassManagement />
        </div>
        <div>
          <StudentMonitor />
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
        <Route path="monitoring" element={<StudentMonitor />} />
      </Route>
    </Routes>
  );
};

export default Dashboard;
