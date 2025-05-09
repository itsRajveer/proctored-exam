import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "@/styles/exam-mode.css";
import { 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Maximize, 
  Minimize, 
  Save 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { CameraFeed } from "../common/CameraFeed";
import { AIMonitor } from "../common/AIMonitor";
import { Exam, Question } from "@/types";
import { examSubmissionService } from "@/services/examSubmissionService";
import { MonitoringService, MonitoringSession } from "@/services/monitoringService";
import { useAuth } from "@/contexts/AuthContext";

export const ExamView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [violations, setViolations] = useState<{
    type: string;
    timestamp: Date;
    description: string;
  }[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showFullScreenExitDialog, setShowFullScreenExitDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [monitoringSession, setMonitoringSession] = useState<MonitoringSession | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const monitoringServiceInstance = MonitoringService.getInstance();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchExam = async () => {
      if (!id) return;
      
      try {
        const response = await examSubmissionService.getExamDetails(id);
        if (response.exam) {
          setExam(response.exam);
          setTimeRemaining(response.exam.duration * 60);
          
          // If there's a submission, set the answers
          if (response.submission && response.submission.answers) {
            setAnswers(response.submission.answers);
          }

          // Automatically trigger fullscreen when exam data is loaded
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            document.body.classList.add('exam-mode');
            setIsFullScreen(true);
          }
        } else {
          throw new Error('Invalid exam data received');
        }
      } catch (err: any) {
        console.error('Error fetching exam:', err);
        const errorMessage = err.response?.data?.error || 'Failed to load exam';
        
        if (errorMessage === 'You have already submitted this exam') {
          // Show a more detailed message for submitted exams
          toast({
            variant: "destructive",
            title: "Exam Already Submitted",
            description: "You have already submitted this exam. You cannot access it again.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: errorMessage,
          });
        }
        
        // Navigate back to exams list after a short delay
        setTimeout(() => {
          navigate("/dashboard/exams");
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [id, navigate, toast]);

  useEffect(() => {
    if (!exam || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [exam, timeRemaining]);

  const handleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      document.body.classList.add('exam-mode');
      setIsFullScreen(true);
    } else {
      setShowFullScreenExitDialog(true);
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      const isCurrentlyFullScreen = !!document.fullscreenElement;
      setIsFullScreen(isCurrentlyFullScreen);
      
      if (!isCurrentlyFullScreen && isFullScreen) {
        setShowFullScreenExitDialog(true);
        document.body.classList.remove('exam-mode');
      } else if (isCurrentlyFullScreen) {
        document.body.classList.add('exam-mode');
      }
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, [isFullScreen]);

  const handleReturnToFullscreen = () => {
    document.documentElement.requestFullscreen();
    setShowFullScreenExitDialog(false);
  };

  const handleSubmitFromDialog = () => {
    setShowFullScreenExitDialog(false);
    if (document.fullscreenElement) {
      document.exitFullscreen();
      document.body.classList.remove('exam-mode');
    }
    setShowSubmitDialog(true);
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleViolation = (type: string, description: string) => {
    const violation = {
      type,
      timestamp: new Date(),
      description,
    };
    setViolations((prev) => [...prev, violation]);
    
    toast({
      variant: "destructive",
      title: "Violation Detected",
      description: description,
    });
  };

  const handleSubmit = async () => {
    if (!exam || !id) return;

    try {
      // Stop camera stream and end monitoring
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        localVideoRef.current.srcObject = null;
      }
      
      // End monitoring session
      if (sessionIdRef.current) {
        await monitoringServiceInstance.endMonitoring(sessionIdRef.current);
      }

      // Exit fullscreen before submitting
      if (document.fullscreenElement) {
        document.exitFullscreen();
        document.body.classList.remove('exam-mode');
      }
      
      await examSubmissionService.submitExam(id, answers);
      toast({
        title: "Exam Submitted",
        description: "Your answers have been submitted successfully.",
      });
      navigate("/dashboard/exams");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit exam. Please try again.",
      });
    }
  };

  const handleNext = () => {
    if (!exam) return;
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSave = async () => {
    if (!exam || !id) return;

    setIsSaving(true);
    try {
      await examSubmissionService.saveExamProgress(id, answers);
      toast({
        title: "Progress Saved",
        description: "Your answers have been saved successfully.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save progress. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const initializeMonitoring = async () => {
      try {
        if (!exam?.id) {
          console.error('No exam ID available');
          return;
        }

        // Get user media with higher quality settings
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 15 }
          },
          audio: false
        });

        // Set up local video element with proper settings
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
          localVideoRef.current.muted = true; // Mute local video
          await localVideoRef.current.play().catch(error => {
            console.error('Error playing local video:', error);
          });
        }

        // Start monitoring session
        const session = await monitoringServiceInstance.startMonitoringSession(exam.id);
        sessionIdRef.current = session.id;

        // Initialize MediaRecorder with optimized settings
        const mediaRecorder = new MediaRecorder(localStream, {
          mimeType: 'video/webm;codecs=vp8',
          videoBitsPerSecond: 500000 // 500kbps for better quality/bandwidth balance
        });

        const chunks = [];
        mediaRecorder.ondataavailable = async (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
            // Send chunk immediately when it's available
            const blob = new Blob([event.data], { type: 'video/webm' });
            const formData = new FormData();
            formData.append('video', blob);
            formData.append('sessionId', session.id);

            try {
              await fetch(`http://localhost:5002/api/monitoring/${session.id}/stream`, {
                method: 'POST',
                body: formData
              });
            } catch (error) {
              console.error('Error sending stream chunk:', error);
            }
          }
        };

        // Start recording in smaller chunks for more frequent updates
        mediaRecorder.start(2000); // Send chunks every 2 seconds

        return () => {
          mediaRecorder.stop();
          localStream.getTracks().forEach(track => track.stop());
          if (sessionIdRef.current) {
            monitoringServiceInstance.endMonitoring(sessionIdRef.current);
          }
        };
      } catch (error) {
        console.error('Error initializing monitoring:', error);
        toast({
          title: "Error",
          description: "Failed to initialize camera monitoring. Please ensure camera access is granted.",
          variant: "destructive",
        });
      }
    };

    initializeMonitoring();
  }, [exam?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Exam Not Found</h2>
        <p className="mb-4">The exam you're looking for does not exist or has been removed.</p>
        <Button onClick={() => navigate("/dashboard/exams")}>Return to Exams</Button>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const progress = Math.round((Object.keys(answers).length / exam.questions.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-3/4 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{exam.title}</h2>
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-gray-100 px-3 py-2 rounded-md">
                <Clock className="h-5 w-5 mr-2 text-gray-500" />
                <span className="font-mono font-medium">
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleFullScreen}
                title={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullScreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Question {currentQuestionIndex + 1} of {exam.questions.length}
              </span>
              <span>
                {Object.keys(answers).length} of {exam.questions.length} answered
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">
                    Question {currentQuestionIndex + 1}:
                  </h3>
                  <p>{currentQuestion.text}</p>
                </div>

                <div className="pt-4">
                  {currentQuestion.type === "multiple-choice" && (
                    <RadioGroup
                      value={answers[currentQuestion.id]?.toString()}
                      onValueChange={(value) =>
                        handleAnswer(currentQuestion.id, parseInt(value))
                      }
                    >
                      {currentQuestion.options?.map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 py-2"
                        >
                          <RadioGroupItem
                            value={index.toString()}
                            id={`option-${index}`}
                          />
                          <Label htmlFor={`option-${index}`}>{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {currentQuestion.type === "text" && (
                    <div className="space-y-2">
                      <Label htmlFor="text-answer">Your Answer:</Label>
                      <Input
                        id="text-answer"
                        value={answers[currentQuestion.id] || ""}
                        onChange={(e) =>
                          handleAnswer(currentQuestion.id, e.target.value)
                        }
                        className="min-h-[100px]"
                      />
                    </div>
                  )}

                  {currentQuestion.type === "true-false" && (
                    <RadioGroup
                      value={
                        answers[currentQuestion.id] !== undefined
                          ? answers[currentQuestion.id].toString()
                          : ""
                      }
                      onValueChange={(value) =>
                        handleAnswer(
                          currentQuestion.id,
                          value === "true" ? true : false
                        )
                      }
                    >
                      <div className="flex items-center space-x-2 py-2">
                        <RadioGroupItem value="true" id="true" />
                        <Label htmlFor="true">True</Label>
                      </div>
                      <div className="flex items-center space-x-2 py-2">
                        <RadioGroupItem value="false" id="false" />
                        <Label htmlFor="false">False</Label>
                      </div>
                    </RadioGroup>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="space-x-2">
              <Button 
                variant="outline" 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
              {currentQuestionIndex === exam.questions.length - 1 ? (
                <Button onClick={() => setShowSubmitDialog(true)}>
                  Submit Exam
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:w-1/4 space-y-4">
          <div className="flex flex-col h-full">
            <div className="flex-1 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                {/* Local Video */}
                <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
                    <p className="text-white text-sm">Your Camera</p>
                  </div>
                </div>

                {/* Remote Video */}
                {/* <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
                    <p className="text-white text-sm">Teacher's View</p>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
          <AIMonitor onViolation={handleViolation} />
          
          {violations.length > 0 && (
            <div className="border p-3 rounded-lg bg-red-50 border-red-200">
              <h4 className="font-medium text-red-700 mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Violations ({violations.length})
              </h4>
              <ul className="text-sm space-y-2 text-red-600">
                {violations.slice(0, 3).map((v, i) => (
                  <li key={i}>
                    {v.description} at{" "}
                    {v.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </li>
                ))}
                {violations.length > 3 && (
                  <li>...and {violations.length - 3} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your exam? You won't be able to change your answers after submission.
              {Object.keys(answers).length < exam.questions.length && (
                <div className="mt-2 text-red-500">
                  Warning: You have only answered {Object.keys(answers).length} out of {exam.questions.length} questions.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Exam</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Submit Now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              If you leave now, your progress will be saved, but the exam timer will continue. Are you sure you want to leave?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/dashboard/exams")}>Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog 
        open={showFullScreenExitDialog} 
        onOpenChange={setShowFullScreenExitDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Fullscreen Mode?</AlertDialogTitle>
            <AlertDialogDescription>
              You have exited fullscreen mode. This may be considered a violation of exam rules.
              Please return to fullscreen mode or submit your exam.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleReturnToFullscreen}>
              Return to Fullscreen
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitFromDialog}>
              Submit Exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExamView;
