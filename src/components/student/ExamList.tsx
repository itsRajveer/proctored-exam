import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Exam } from "@/types";
import { examSubmissionService } from "@/services/examSubmissionService";
import { useToast } from "@/components/ui/use-toast";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface ExamCardProps {
  exam: Exam;
}

const ExamCard: React.FC<ExamCardProps> = ({ exam }) => {
  const now = new Date();
  const startTime = new Date(exam.startTime);
  const endTime = new Date(exam.endTime);
  
  const isUpcoming = startTime > now;
  const isOngoing = startTime <= now && endTime >= now;
  const isPast = endTime < now;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{exam.title}</CardTitle>
          {isOngoing && (
            <Badge className="bg-green-500 hover:bg-green-600">Ongoing</Badge>
          )}
          {isUpcoming && (
            <Badge variant="outline" className="border-blue-500 text-blue-500">
              Upcoming
            </Badge>
          )}
          {isPast && (
            <Badge variant="outline" className="border-gray-500 text-gray-500">
              Past
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-4">{exam.description}</p>
        <div className="grid gap-2">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span>
              {formatDate(exam.startTime.toString())}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
            <span>{exam.duration} minutes</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          asChild 
          className="w-full"
          disabled={!isOngoing && !isUpcoming}
        >
          <Link to={`/dashboard/exam/${exam.id}`}>
            {isOngoing ? "Continue Exam" : isUpcoming ? "View Details" : "Review"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export const ExamList: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await examSubmissionService.getStudentExams();
        setExams(data);
      } catch (err) {
        setError('Failed to fetch exams');
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch exams. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [toast]);

  const now = new Date();
  
  const upcoming = exams.filter(
    (exam) => new Date(exam.startTime) > now
  );
  
  const ongoing = exams.filter(
    (exam) => 
      new Date(exam.startTime) <= now && 
      new Date(exam.endTime) >= now
  );
  
  const past = exams.filter(
    (exam) => new Date(exam.endTime) < now
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading exams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Exams</h2>
        <p className="mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">My Exams</h2>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
            {exams.length === 0 && (
              <div className="col-span-full text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">No exams found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  You don't have any exams assigned yet.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="ongoing" className="mt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ongoing.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
            {ongoing.length === 0 && (
              <div className="col-span-full text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">No ongoing exams</h3>
                <p className="mt-2 text-sm text-gray-500">
                  You don't have any ongoing exams at the moment.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="upcoming" className="mt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
            {upcoming.length === 0 && (
              <div className="col-span-full text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">No upcoming exams</h3>
                <p className="mt-2 text-sm text-gray-500">
                  You don't have any upcoming exams scheduled.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="past" className="mt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
            {past.length === 0 && (
              <div className="col-span-full text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">No past exams</h3>
                <p className="mt-2 text-sm text-gray-500">
                  You haven't taken any exams yet.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExamList;
