import React, { useEffect, useState } from "react";
import { format, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import EventItem, { EventItemProps } from "./EventItem";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Exam } from "@/types";
import { examService } from "@/services/examService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

// Mock data for teacher events
const teacherEvents: EventItemProps[] = [
  {
    id: "e1",
    title: "Physics Exam",
    description: "Monitor final examination",
    startTime: "09:00",
    endTime: "11:00",
    location: "Hall A",
    eventType: "exam",
    participants: 30,
  },
  {
    id: "e2",
    title: "Grade Assignments",
    description: "Review and grade student essays",
    startTime: "13:00",
    endTime: "15:00",
    eventType: "assignment",
  },
  {
    id: "e3",
    title: "Advanced Physics Lecture",
    startTime: "14:00",
    endTime: "15:30",
    location: "Science Building, Room 305",
    eventType: "class",
    participants: 25,
  },
  {
    id: "e4",
    title: "Department Meeting",
    description: "Discuss curriculum changes",
    startTime: "16:00",
    endTime: "17:30",
    location: "Faculty Meeting Room",
    eventType: "meeting",
    participants: 12,
  },
];

interface TeacherCalendarViewProps {
  date: Date;
  view: "day" | "week" | "month";
  filters: {
    exams: boolean;
    classes: boolean;
    assignments: boolean;
    meetings: boolean;
  };
}

const TeacherCalendarView: React.FC<TeacherCalendarViewProps> = ({ date, view, filters }) => {
  const isMobile = useIsMobile();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const examsData = await examService.getTeacherExams();
        setExams(examsData);
      } catch (error) {
        console.error('Error fetching exams:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load exams",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [toast]);

  // Filter events based on selected filters
  const filteredEvents = teacherEvents.filter((event) => {
    if (event.eventType === "exam" && !filters.exams) return false;
    if (event.eventType === "class" && !filters.classes) return false;
    if (event.eventType === "assignment" && !filters.assignments) return false;
    if (event.eventType === "meeting" && !filters.meetings) return false;
    return true;
  });

  // Function to get events for a specific date
  const getEventsForDate = (date: Date) => {
    // In a real app, we would filter by date properly
    // This is mock data that always shows our sample events on the current selected date
    return isSameDay(date, new Date()) ? filteredEvents : [];
  };

  const getExamsForDate = (currentDate: Date) => {
    return exams.filter(exam => {
      const examStartDate = new Date(exam.startTime);
      return isSameDay(examStartDate, currentDate);
    });
  };

  const renderMonthView = () => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayExams = getExamsForDate(day);
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[100px] p-2 border rounded-md ${
                isSameDay(day, new Date()) ? "bg-muted" : ""
              }`}
            >
              <div className="text-sm font-medium mb-1">
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayExams.map((exam) => (
                  <Card key={exam.id} className="p-2 text-xs">
                    <CardContent className="p-0">
                      <div className="font-medium truncate">{exam.title}</div>
                      <div className="text-muted-foreground">
                        {format(new Date(exam.startTime), "HH:mm")} - {format(new Date(exam.endTime), "HH:mm")}
                      </div>
                      <Badge variant="secondary" className="mt-1">
                        {exam.studentIds.length} students
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayExams = getExamsForDate(date);
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          {format(date, "EEEE, MMMM d, yyyy")}
        </h3>
        {dayExams.length > 0 ? (
          dayExams.map((exam) => (
            <Card key={exam.id} className="p-4">
              <CardContent className="p-0">
                <div className="font-medium text-lg">{exam.title}</div>
                <div className="text-muted-foreground mt-1">
                  {format(new Date(exam.startTime), "HH:mm")} - {format(new Date(exam.endTime), "HH:mm")}
                </div>
                <div className="mt-2">{exam.description}</div>
                <div className="mt-2">
                  <Badge variant="secondary">
                    {exam.studentIds.length} students
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No exams scheduled for this day
          </div>
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayExams = getExamsForDate(day);
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[150px] p-2 border rounded-md ${
                isSameDay(day, new Date()) ? "bg-muted" : ""
              }`}
            >
              <div className="text-sm font-medium mb-1">
                {format(day, "EEE d")}
              </div>
              <div className="space-y-1">
                {dayExams.map((exam) => (
                  <Card key={exam.id} className="p-2 text-xs">
                    <CardContent className="p-0">
                      <div className="font-medium truncate">{exam.title}</div>
                      <div className="text-muted-foreground">
                        {format(new Date(exam.startTime), "HH:mm")} - {format(new Date(exam.endTime), "HH:mm")}
                      </div>
                      <Badge variant="secondary" className="mt-1">
                        {exam.studentIds.length} students
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {view === "month" && renderMonthView()}
      {view === "week" && renderWeekView()}
      {view === "day" && renderDayView()}
    </div>
  );
};

export default TeacherCalendarView;
