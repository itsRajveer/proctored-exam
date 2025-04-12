import React from "react";
import { format, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import EventItem, { EventItemProps } from "./EventItem";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

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

const TeacherCalendarView = ({ date, view, filters }: TeacherCalendarViewProps) => {
  const isMobile = useIsMobile();
  
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

  // Render calendar based on selected view
  const renderCalendarView = () => {
    switch (view) {
      case "day":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xl font-semibold">
                {format(date, "EEEE, MMMM d, yyyy")}
              </div>
              {/* {!isMobile ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-1 h-4 w-4" /> Add Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create New Event</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-muted-foreground">Event creation form would go here</p>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-1 h-4 w-4" /> Add Event
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Create New Event</DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 py-4">
                      <p className="text-muted-foreground">Event creation form would go here</p>
                    </div>
                  </DrawerContent>
                </Drawer>
              )} */}
            </div>
            <div className="space-y-2">
              {getEventsForDate(date).length > 0 ? (
                getEventsForDate(date).map((event) => (
                  <EventItem key={event.id} {...event} />
                ))
              ) : (
                <p className="text-center text-muted-foreground">No events scheduled for this day</p>
              )}
            </div>
          </div>
        );

      case "week":
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              {/* {!isMobile ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-1 h-4 w-4" /> Add Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create New Event</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-muted-foreground">Event creation form would go here</p>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-1 h-4 w-4" /> Add Event
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Create New Event</DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 py-4">
                      <p className="text-muted-foreground">Event creation form would go here</p>
                    </div>
                  </DrawerContent>
                </Drawer>
              )} */}
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium">
              {Array.from({ length: 7 }, (_, i) => {
                const day = addDays(date, i - date.getDay());
                return (
                  <div key={i} className="p-2">
                    <div className="mb-1">
                      {format(day, "EEE")}
                    </div>
                    <div className={`rounded-full h-8 w-8 flex items-center justify-center mx-auto ${
                      isSameDay(day, new Date()) ? "bg-primary text-primary-foreground" : ""
                    }`}>
                      {format(day, "d")}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }, (_, i) => {
                const day = addDays(date, i - date.getDay());
                const dayEvents = getEventsForDate(day);
                return (
                  <div key={i} className="min-h-[100px] border rounded-md p-1">
                    <div className="text-xs font-medium mb-1">{format(day, "MMM d")}</div>
                    {dayEvents.length > 0 ? (
                      <div className="space-y-1">
                        {dayEvents.map((event) => (
                          <div 
                            key={event.id} 
                            className={`text-xs p-1 rounded-sm truncate ${
                              event.eventType === "exam" ? "bg-red-100 text-red-800" :
                              event.eventType === "class" ? "bg-blue-100 text-blue-800" :
                              event.eventType === "assignment" ? "bg-amber-100 text-amber-800" :
                              "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {event.title}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "month":
      default:
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              {/* {!isMobile ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-1 h-4 w-4" /> Add Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create New Event</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-muted-foreground">Event creation form would go here</p>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-1 h-4 w-4" /> Add Event
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Create New Event</DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 py-4">
                      <p className="text-muted-foreground">Event creation form would go here</p>
                    </div>
                  </DrawerContent>
                </Drawer>
              )} */}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm font-medium p-2">
                  {day}
                </div>
              ))}
              
              {Array.from({ length: monthStart.getDay() }, (_, i) => (
                <div key={`empty-start-${i}`} className="p-2 border rounded-md opacity-50" />
              ))}
              
              {days.map((day) => {
                const dayEvents = getEventsForDate(day);
                return (
                  <div
                    key={day.toString()}
                    className={`min-h-[80px] p-1 border rounded-md ${
                      isSameDay(day, new Date()) ? "border-primary" : ""
                    }`}
                  >
                    <div className="text-xs font-medium mb-1">{format(day, "d")}</div>
                    {dayEvents.length > 0 ? (
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div 
                            key={event.id} 
                            className={`text-xs p-1 rounded-sm truncate ${
                              event.eventType === "exam" ? "bg-red-100 text-red-800" :
                              event.eventType === "class" ? "bg-blue-100 text-blue-800" :
                              event.eventType === "assignment" ? "bg-amber-100 text-amber-800" :
                              "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-center">+{dayEvents.length - 2} more</div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              
              {Array.from(
                { length: 6 - Math.floor((monthStart.getDay() + days.length - 1) / 7) * 7 - ((monthStart.getDay() + days.length) % 7) },
                (_, i) => (
                  <div key={`empty-end-${i}`} className="p-2 border rounded-md opacity-50" />
                )
              )}
            </div>
          </div>
        );
    }
  };

  return <>{renderCalendarView()}</>;
};

export default TeacherCalendarView;
