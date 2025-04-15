import React, { useState, useEffect } from "react";
import { format, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import EventItem, { EventItemProps } from "./EventItem";
import { calendarService, CalendarEvent } from "@/services/calendarService";
import { useToast } from "@/components/ui/use-toast";

interface StudentCalendarViewProps {
  date: Date;
  view: "day" | "week" | "month";
  filters: {
    exams: boolean;
    classes: boolean;
    assignments: boolean;
    meetings: boolean;
  };
}

const StudentCalendarView = ({ date, view, filters }: StudentCalendarViewProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await calendarService.getStudentEvents();
        setEvents(data);
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load calendar events. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [toast]);

  // Filter events based on selected filters
  const filteredEvents = events.filter((event) => {
    if (event.eventType === "exam" && !filters.exams) return false;
    return true;
  });

  // Function to get events for a specific date
  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return isSameDay(eventDate, date);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading calendar events...</p>
        </div>
      </div>
    );
  }

  // Render calendar based on selected view
  const renderCalendarView = () => {
    switch (view) {
      case "day":
        return (
          <div className="space-y-4">
            <div className="text-xl font-semibold">
              {format(date, "EEEE, MMMM d, yyyy")}
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
                            className="text-xs p-1 rounded-sm truncate bg-red-100 text-red-800"
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
                            className="text-xs p-1 rounded-sm truncate bg-red-100 text-red-800"
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

export default StudentCalendarView;
