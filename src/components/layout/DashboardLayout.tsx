import React from "react";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  FileText,
  GraduationCap,
  Home,
  Users,
  Video,
  Menu,
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
import { Button } from "@/components/ui/button";

const StudentMenu = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton 
          asChild 
          isActive={currentPath === "/dashboard" || currentPath === "/dashboard/"}
        >
          <Link to="/dashboard">
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          asChild
          isActive={currentPath.includes("/dashboard/exams")}
        >
          <Link to="/dashboard/exams">
            <FileText className="h-5 w-5" />
            <span>Exams</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          asChild
          isActive={currentPath.includes("/dashboard/grades")}
        >
          <Link to="/dashboard/grades">
            <GraduationCap className="h-5 w-5" />
            <span>Grades</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          asChild
          isActive={currentPath.includes("/dashboard/calendar")}
        >
          <Link to="/dashboard/calendar">
            <Calendar className="h-5 w-5" />
            <span>Calendar</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

const TeacherMenu = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton 
          asChild
          isActive={currentPath === "/dashboard" || currentPath === "/dashboard/"}
        >
          <Link to="/dashboard">
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          asChild
          isActive={currentPath.includes("/dashboard/classes")}
        >
          <Link to="/dashboard/classes">
            <Users className="h-5 w-5" />
            <span>Classes</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          asChild
          isActive={currentPath.includes("/dashboard/exams")}
        >
          <Link to="/dashboard/exams">
            <FileText className="h-5 w-5" />
            <span>Exams</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          asChild
          isActive={currentPath.includes("/dashboard/monitoring")}
        >
          <Link to="/dashboard/monitoring">
            <Video className="h-5 w-5" />
            <span>Monitoring</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          asChild
          isActive={currentPath.includes("/dashboard/calendar")}
        >
          <Link to="/dashboard/calendar">
            <Calendar className="h-5 w-5" />
            <span>Calendar</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export const DashboardLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <BookOpen className="h-12 w-12 animate-pulse text-primary" />
          <p className="text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="topbar">
        <Navbar />
      </div>
      <div className="flex flex-1">
        <SidebarProvider>
          <div className="sidebar">
            <Sidebar className="border-r">
              <SidebarContent className="pt-6">
                <div className="flex items-center gap-2 px-4 pb-6">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <span className="text-lg font-semibold">ExamEye</span>
                </div>
                {user.role === "student" ? <StudentMenu /> : <TeacherMenu />}
              </SidebarContent>
            </Sidebar>
          </div>
          <div className="main-content flex-1 bg-background/95">
            <div className="container max-w-7xl px-4 py-6 md:px-6 lg:py-8">
              {/* Make SidebarTrigger more prominent */}
              <div className="mb-6 flex items-center">
                <SidebarTrigger className="flex items-center gap-2 border rounded-md p-2">
                  <Menu className="h-5 w-5" />
                  <span className="text-sm">Menu</span>
                </SidebarTrigger>
              </div>
              <Outlet />
            </div>
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
};

export default DashboardLayout;
