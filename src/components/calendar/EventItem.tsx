
import React from "react";
import { Clock, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EventItemProps {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  eventType: "exam" | "class" | "assignment" | "meeting";
  participants?: number;
  className?: string;
}

const eventTypeClasses = {
  exam: "bg-red-100 border-red-300 text-red-800",
  class: "bg-blue-100 border-blue-300 text-blue-800",
  assignment: "bg-amber-100 border-amber-300 text-amber-800",
  meeting: "bg-purple-100 border-purple-300 text-purple-800",
};

const EventItem = ({
  title,
  description,
  startTime,
  endTime,
  location,
  eventType,
  participants,
  className,
}: EventItemProps) => {
  return (
    <div
      className={cn(
        "mb-3 rounded-md border p-3 transition-all hover:shadow-md",
        eventTypeClasses[eventType],
        className
      )}
    >
      <h4 className="font-medium">{title}</h4>
      {description && <p className="mt-1 text-sm opacity-80">{description}</p>}
      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>
            {startTime} - {endTime}
          </span>
        </div>
        {location && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <span>{location}</span>
          </div>
        )}
        {participants && (
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{participants} participants</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventItem;
