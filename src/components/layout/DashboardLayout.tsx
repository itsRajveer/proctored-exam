
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  GraduationCap,
  Home,
  Users,
  FileText,
  Video,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "./Navbar";

const StudentMenu = () => (
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <a href="/dashboard">
          <Home />
          <span>Dashboard</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <a href="/dashboard/exams">
          <FileText />
          <span>Exams</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <a href="/dashboard/grades">
          <GraduationCap />
          <span>Grades</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <a href="/dashboard/calendar">
          <Calendar />
          <span>Calendar</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
);

const TeacherMenu = () => (
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <a href="/dashboard">
          <Home />
          <span>Dashboard</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <a href="/dashboard/classes">
          <Users />
          <span>Classes</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <a href="/dashboard/exams">
          <FileText />
          <span>Exams</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <a href="/dashboard/monitoring">
          <Video />
          <span>Monitoring</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <a href="/dashboard/calendar">
          <Calendar />
          <span>Calendar</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
);

export const DashboardLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />
      <div className="flex flex-1">
        <SidebarProvider>
          <Sidebar className="border-r">
            <SidebarContent className="pt-6">
              <div className="flex items-center gap-2 px-4 pb-6">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold">ExamEye</span>
              </div>
              {user.role === "student" ? <StudentMenu /> : <TeacherMenu />}
            </SidebarContent>
          </Sidebar>
          <div className="flex-1">
            <div className="container py-6">
              <SidebarTrigger className="lg:hidden mb-4" />
              <Outlet />
            </div>
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
};

export default DashboardLayout;
