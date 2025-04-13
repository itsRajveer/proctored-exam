import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, BookOpen, GraduationCap } from "lucide-react";
import { ClassManagement } from "./ClassManagement";
import { StudentMonitor } from "./StudentMonitor";

const DashboardOverview = ({ title, description, icon, value }: { 
  title: string;
  description: string;
  icon: React.ReactNode;
  value: string;
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

export const TeacherDashboard = () => {
  return (
    <div className="space-y-6 p-6">
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
      
      <div className="grid grid-cols-1 gap-6">
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
            <CardContent>
              <StudentMonitor />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 