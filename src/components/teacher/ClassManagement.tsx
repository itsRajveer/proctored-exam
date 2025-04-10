
import React, { useState } from "react";
import { 
  ChevronDown,
  Plus,
  Search,
  Trash2,
  UserPlus,
  X,
  GraduationCap,
  FileText,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Class, Student } from "@/types";
import { useToast } from "@/components/ui/use-toast";

// Mock data
const mockClasses: Class[] = [
  {
    id: "c1",
    name: "Mathematics 101",
    description: "Introduction to algebra and calculus",
    teacherId: "t1",
    studentIds: ["s1", "s2", "s3", "s4", "s5"]
  },
  {
    id: "c2",
    name: "Physics 101",
    description: "Introduction to mechanics and thermodynamics",
    teacherId: "t1",
    studentIds: ["s1", "s2", "s3"]
  }
];

const mockStudents: Student[] = [
  {
    id: "s1",
    name: "John Doe",
    email: "john@example.com",
    role: "student",
    classIds: ["c1", "c2"],
  },
  {
    id: "s2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "student",
    classIds: ["c1", "c2"],
  },
  {
    id: "s3",
    name: "Michael Brown",
    email: "michael@example.com",
    role: "student",
    classIds: ["c1", "c2"],
  },
  {
    id: "s4",
    name: "Emily Johnson",
    email: "emily@example.com",
    role: "student",
    classIds: ["c1"],
  },
  {
    id: "s5",
    name: "David Wilson",
    email: "david@example.com",
    role: "student",
    classIds: ["c1"],
  }
];

export const ClassManagement: React.FC = () => {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>(mockClasses);
  const [students] = useState<Student[]>(mockStudents);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateClass = () => {
    if (!newClassName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Class name is required",
      });
      return;
    }
    
    const newClass: Class = {
      id: `c${Date.now()}`,
      name: newClassName,
      description: newClassDescription,
      teacherId: "t1", // Current teacher ID
      studentIds: []
    };
    
    setClasses([...classes, newClass]);
    setNewClassName("");
    setNewClassDescription("");
    setShowCreateDialog(false);
    
    toast({
      title: "Class Created",
      description: `${newClassName} has been created successfully.`,
    });
  };

  const handleDeleteClass = (classId: string) => {
    setClasses(classes.filter(c => c.id !== classId));
    
    toast({
      title: "Class Deleted",
      description: "The class has been deleted successfully.",
    });
  };

  const handleAddStudent = () => {
    if (!selectedClassId || !studentEmail.trim()) {
      return;
    }
    
    // In a real app, you would validate the email and check if the student exists
    const studentExists = students.some(s => s.email === studentEmail);
    
    if (!studentExists) {
      toast({
        variant: "destructive",
        title: "Student Not Found",
        description: `No student found with email ${studentEmail}`,
      });
      return;
    }
    
    // Check if student is already in the class
    const classIndex = classes.findIndex(c => c.id === selectedClassId);
    const student = students.find(s => s.email === studentEmail);
    
    if (student && classes[classIndex].studentIds.includes(student.id)) {
      toast({
        variant: "destructive",
        title: "Student Already Added",
        description: `${student.name} is already in this class`,
      });
      return;
    }
    
    // Add student to class
    if (student) {
      const updatedClasses = [...classes];
      updatedClasses[classIndex].studentIds.push(student.id);
      setClasses(updatedClasses);
      
      toast({
        title: "Student Added",
        description: `${student.name} has been added to the class`,
      });
    }
    
    setStudentEmail("");
    setShowAddStudentDialog(false);
  };

  const handleRemoveStudent = (classId: string, studentId: string) => {
    const classIndex = classes.findIndex(c => c.id === classId);
    if (classIndex !== -1) {
      const updatedClasses = [...classes];
      updatedClasses[classIndex].studentIds = updatedClasses[classIndex].studentIds.filter(
        id => id !== studentId
      );
      setClasses(updatedClasses);
      
      const student = students.find(s => s.id === studentId);
      if (student) {
        toast({
          title: "Student Removed",
          description: `${student.name} has been removed from the class`,
        });
      }
    }
  };

  const getClassStats = (classId: string) => {
    const classItem = classes.find(c => c.id === classId);
    if (!classItem) return { studentCount: 0, examCount: 0 };
    
    return {
      studentCount: classItem.studentIds.length,
      examCount: 2 // Mock: In a real app, this would be fetched from your API
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Class Management</h2>
        
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search classes..."
              className="w-full sm:w-[200px] pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Class
          </Button>
        </div>
      </div>
      
      {filteredClasses.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <Users className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No Classes Found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchTerm ? "No classes match your search criteria." : "You haven't created any classes yet."}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Class
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((classItem) => {
            const stats = getClassStats(classItem.id);
            
            return (
              <Card key={classItem.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between">
                    <CardTitle>{classItem.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedClassId(classItem.id);
                            setShowAddStudentDialog(true);
                          }}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Student
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClass(classItem.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Class
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription>{classItem.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-1">
                  <div className="flex space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Users className="mr-1 h-4 w-4" />
                      {stats.studentCount} Students
                    </div>
                    <div className="flex items-center">
                      <FileText className="mr-1 h-4 w-4" />
                      {stats.examCount} Exams
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col items-start pt-1">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="students">
                      <AccordionTrigger className="text-sm py-2">
                        Students List
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {classItem.studentIds.length > 0 ? (
                            classItem.studentIds.map((studentId) => {
                              const student = students.find((s) => s.id === studentId);
                              if (!student) return null;
                              
                              return (
                                <div
                                  key={student.id}
                                  className="flex items-center justify-between bg-muted/40 p-2 rounded-md"
                                >
                                  <div>
                                    <div className="font-medium">
                                      {student.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {student.email}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleRemoveStudent(classItem.id, student.id)
                                    }
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              No students in this class
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Class Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
            <DialogDescription>
              Add a new class to your teaching portfolio.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Class Name
              </label>
              <Input
                id="name"
                placeholder="e.g. Mathematics 101"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Input
                id="description"
                placeholder="e.g. Introduction to algebra and calculus"
                value={newClassDescription}
                onChange={(e) => setNewClassDescription(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateClass}>Create Class</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Student to Class</DialogTitle>
            <DialogDescription>
              Enter the student's email address to add them to this class.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Student Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStudentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStudent}>Add Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassManagement;
