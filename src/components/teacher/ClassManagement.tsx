import React, { useState, useEffect } from 'react';
import { 
  ChevronDown,
  Plus,
  Search,
  Trash2,
  UserPlus,
  X,
  FileText,
  Users,
  Edit,
  AlertCircle
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Class, Student } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { classService } from '@/services/classService';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export const ClassManagement: React.FC = () => {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [showEditClassDialog, setShowEditClassDialog] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isAddingStudentsToNewClass, setIsAddingStudentsToNewClass] = useState(false);
  
  // Track which accordion items are open individually
  const [openAccordionItems, setOpenAccordionItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await classService.getClasses();
      setClasses(data);
      
      // Get all unique student IDs from all classes
      const allStudentIds = data.reduce((ids: string[], classItem) => {
        return [...ids, ...(classItem.studentIds || [])];
      }, []);
      
      // Fetch student data for all student IDs
      if (allStudentIds.length > 0) {
        const studentData = await classService.getStudentsByIds(allStudentIds);
        setStudents(studentData);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to fetch classes');
      toast({
        title: 'Error',
        description: 'Failed to fetch classes. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = (accordionId: string) => {
    setOpenAccordionItems(prev => ({
      ...prev,
      [accordionId]: !prev[accordionId]
    }));
  };

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateClass = async (name: string, description?: string) => {
    try {
      const newClass = await classService.createClass({ 
        name, 
        description,
        studentIds: selectedStudents 
      });
      setClasses([...classes, newClass]);
      setSelectedStudents([]);
      setShowCreateDialog(false);
      toast({
        title: 'Success',
        description: 'Class created successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create class',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      await classService.deleteClass(id);
      setClasses(classes.filter(c => c.id !== id));
      toast({
        title: 'Success',
        description: 'Class deleted successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete class',
        variant: 'destructive',
      });
    }
  };

  const handleAddStudent = async (classId: string, email: string) => {
    try {
      const updatedClass = await classService.addStudentToClass(classId, email);
      setClasses(classes.map(c => c.id === classId ? updatedClass : c));
      toast({
        title: 'Success',
        description: 'Student added successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to add student',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveStudent = async (classId: string, studentId: string) => {
    try {
      const updatedClass = await classService.removeStudentFromClass(classId, studentId);
      setClasses(classes.map(c => c.id === classId ? updatedClass : c));
      toast({
        title: 'Success',
        description: 'Student removed successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to remove student',
        variant: 'destructive',
      });
    }
  };

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem);
    setShowEditClassDialog(true);
  };

  const handleUpdateClass = async (id: string, name: string, description?: string) => {
    try {
      const updatedClass = await classService.updateClass(id, { name, description });
      setClasses(classes.map(c => c.id === id ? updatedClass : c));
      toast({
        title: 'Success',
        description: 'Class updated successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update class',
        variant: 'destructive',
      });
    }
  };

  const getClassStats = (classId: string) => {
    const classItem = classes.find(c => c.id === classId);
    if (!classItem) return { studentCount: 0, examCount: 0 };
    
    return {
      studentCount: classItem.studentIds.length,
      examCount: classItem.examCount,
    };
  };

  // const handleAddStudentsToNewClass = () => {
  //   setIsAddingStudentsToNewClass(true);
  //   setSelectedClassId(null);
  //   setShowAddStudentDialog(true);
  // };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-lg font-medium">Loading classes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-lg font-medium text-destructive">{error}</p>
          <Button onClick={fetchClasses}>Try Again</Button>
        </div>
      </div>
    );
  }

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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
          {filteredClasses.map((classItem) => {
            const stats = getClassStats(classItem.id);
            const accordionId = `students-${classItem.id}`;
            const isAccordionOpen = openAccordionItems[accordionId] || false;
            
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
                            setIsAddingStudentsToNewClass(false);
                          }}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Student
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClass(classItem)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Class
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
                  <div className="w-full">
                    <button 
                      onClick={() => toggleAccordion(accordionId)}
                      className="flex w-full items-center justify-between py-2 text-sm font-medium hover:underline"
                    >
                      Students List
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform duration-200 ${isAccordionOpen ? 'rotate-180' : ''}`} 
                      />
                    </button>
                    
                    {isAccordionOpen && (
                      <div className="pt-2 pb-4">
                        {classItem.studentIds.length > 0 ? (
                          <ScrollArea className="h-[200px] w-full rounded-md border">
                            <div className="p-4 space-y-2">
                              {classItem.studentIds.map((studentId) => {
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
                              })}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            No students in this class
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
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

            {/* <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Students
                </label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddStudentsToNewClass}
                >
                  <UserPlus className="mr-1 h-3 w-3" />
                  Add Students
                </Button>
              </div>
              <div className="border rounded-md p-2 min-h-[80px] max-h-[150px] overflow-y-auto">
                {selectedStudents.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedStudents.map(studentId => {
                      const student = students.find(s => s.id === studentId);
                      return (
                        <Badge variant="secondary" key={studentId} className="px-2 py-1 flex items-center gap-1">
                          {student?.name}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => handleRemoveStudent(selectedClassId || "", studentId)} 
                          />
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    No students added yet
                  </div>
                )}
              </div>
            </div> */}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setSelectedStudents([]);
            }}>
              Cancel
            </Button>
            <Button onClick={() => handleCreateClass(newClassName, newClassDescription)}>Create Class</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddStudentDialog} onOpenChange={(open) => {
        setShowAddStudentDialog(open);
        if (!open) {
          setIsAddingStudentsToNewClass(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Student to Class</DialogTitle>
            <DialogDescription>
              {isAddingStudentsToNewClass 
                ? "Add students to your new class." 
                : "Enter the student's email address to add them to this class."}
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
            <Button onClick={() => handleAddStudent(selectedClassId || "", studentEmail)}>Add Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditClassDialog} onOpenChange={setShowEditClassDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>Make changes to the class details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="edit-name" className="text-sm font-medium">
                Class Name
              </label>
              <Input
                id="edit-name"
                value={editingClass?.name || ""}
                onChange={(e) => 
                  setEditingClass(editingClass ? {...editingClass, name: e.target.value} : null)
                }
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="edit-description" className="text-sm font-medium">
                Description
              </label>
              <Input
                id="edit-description"
                value={editingClass?.description || ""}
                onChange={(e) => 
                  setEditingClass(editingClass ? {...editingClass, description: e.target.value} : null)
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Students</label>
              <ScrollArea className="h-[200px] border rounded-md p-3">
                <div className="space-y-2">
                  {editingClass?.studentIds.map(studentId => {
                    const student = students.find(s => s.id === studentId);
                    if (!student) return null;
                    
                    return (
                      <div key={student.id} className="flex items-center justify-between bg-muted/40 p-2 rounded-md">
                        <div>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-xs text-muted-foreground">{student.email}</div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            if (editingClass) {
                              setEditingClass({
                                ...editingClass,
                                studentIds: editingClass.studentIds.filter(id => id !== student.id)
                              });
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                  {!editingClass?.studentIds.length && (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No students in this class
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => handleUpdateClass(editingClass?.id || "", editingClass?.name || "", editingClass?.description)}>Save Changes</Button>
            <Button variant="outline" onClick={() => setShowEditClassDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassManagement;
