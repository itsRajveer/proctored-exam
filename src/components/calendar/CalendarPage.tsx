
import React, { useState } from "react";
import { format, isToday, isSameDay } from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import StudentCalendarView from "./StudentCalendarView";
import TeacherCalendarView from "./TeacherCalendarView";

const CalendarPage = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("month");
  const [filters, setFilters] = useState({
    exams: true,
    classes: true,
    assignments: true,
    meetings: true,
  });

  const handleFilterChange = (key: keyof typeof filters) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const navigateToday = () => setDate(new Date());
  const navigatePrevious = () => {
    const newDate = new Date(date);
    if (view === "day") {
      newDate.setDate(date.getDate() - 1);
    } else if (view === "week") {
      newDate.setDate(date.getDate() - 7);
    } else {
      newDate.setMonth(date.getMonth() - 1);
    }
    setDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(date);
    if (view === "day") {
      newDate.setDate(date.getDate() + 1);
    } else if (view === "week") {
      newDate.setDate(date.getDate() + 7);
    } else {
      newDate.setMonth(date.getMonth() + 1);
    }
    setDate(newDate);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
        <p className="text-muted-foreground">
          Manage your schedule and upcoming events.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left sidebar */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(day) => day && setDate(day)}
              className="rounded-md border"
            />

            <div className="space-y-2">
              <div className="text-sm font-medium">Filter Events</div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Filter className="mr-2 h-4 w-4" />
                    <span>Filter</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuCheckboxItem
                    checked={filters.exams}
                    onCheckedChange={() => handleFilterChange("exams")}
                  >
                    Exams
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.classes}
                    onCheckedChange={() => handleFilterChange("classes")}
                  >
                    Classes
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.assignments}
                    onCheckedChange={() => handleFilterChange("assignments")}
                  >
                    Assignments
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.meetings}
                    onCheckedChange={() => handleFilterChange("meetings")}
                  >
                    Meetings
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Main calendar area */}
        <Card className="md:col-span-2">
          <CardHeader className="space-y-0 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={navigatePrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button onClick={navigateToday} variant="outline" size="sm">
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={navigateNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="text-lg font-semibold">
                  {format(date, "MMMM yyyy")}
                  {view === "day" && `, ${format(date, "d")}`}
                </div>
              </div>

              <Tabs
                defaultValue="month"
                value={view}
                onValueChange={(v) => setView(v as "day" | "week" | "month")}
                className="hidden md:block"
              >
                <TabsList>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>

          <CardContent>
            {user?.role === "student" ? (
              <StudentCalendarView 
                date={date} 
                view={view} 
                filters={filters} 
              />
            ) : (
              <TeacherCalendarView 
                date={date} 
                view={view} 
                filters={filters} 
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalendarPage;
