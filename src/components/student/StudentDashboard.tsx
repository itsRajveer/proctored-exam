import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, BookOpen, GraduationCap } from "lucide-react";
import { ExamList } from "./ExamList";
import { GradesList } from "./GradesList";

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

export const StudentDashboard = () => {
  return (
    <div className="space-y-6 p-6">
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
      
      <div className="grid grid-cols-1 gap-6">
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