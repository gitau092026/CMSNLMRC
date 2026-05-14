import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, FileText, Download, BookOpen, TrendingUp, Users, Award, Edit, Trash2, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Client {
  id: string;
  name: string;
  age: number;
  status: string;
  education_level?: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

interface Mark {
  id: string;
  client_id: string;
  subject_id: string;
  marks: number;
  grade: string | null;
  term: string;
  year: number;
  remarks: string | null;
}

const Education = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [students, setStudents] = useState<Client[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEducationStaff, setIsEducationStaff] = useState(false);
  
  // Subject dialog states
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", description: "" });
  
  // Delete subject dialog
  const [deleteSubjectDialogOpen, setDeleteSubjectDialogOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  
  // Marks dialog states
  const [marksDialogOpen, setMarksDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Client | null>(null);
  const [marksForm, setMarksForm] = useState({
    subject_id: "",
    marks: "",
    grade: "",
    term: "",
    year: new Date().getFullYear().toString(),
    remarks: ""
  });

  // Report dialog states
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportStudent, setReportStudent] = useState<Client | null>(null);
  const [studentMarks, setStudentMarks] = useState<(Mark & { subject_name: string; subject_code: string })[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchSubjects();
    checkEducationRole();
  }, []);

  const checkEducationRole = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'education']);
    
    setIsEducationStaff(!!data && data.length > 0 && !error);
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .or('status.eq.Active,status.eq.Complete')
        .order('name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setSubjects(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleAddSubject = () => {
    setEditingSubject(null);
    setSubjectForm({ name: "", code: "", description: "" });
    setSubjectDialogOpen(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectForm({
      name: subject.name,
      code: subject.code,
      description: subject.description || ""
    });
    setSubjectDialogOpen(true);
  };

  const handleSaveSubject = async () => {
    if (!subjectForm.name || !subjectForm.code) {
      toast({
        title: "Error",
        description: "Name and code are required",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingSubject) {
        const { error } = await supabase
          .from('subjects')
          .update({
            name: subjectForm.name,
            code: subjectForm.code,
            description: subjectForm.description || null
          })
          .eq('id', editingSubject.id);

        if (error) throw error;
        toast({ title: "Success", description: "Subject updated successfully" });
      } else {
        const { error } = await supabase
          .from('subjects')
          .insert({
            name: subjectForm.name,
            code: subjectForm.code,
            description: subjectForm.description || null
          });

        if (error) throw error;
        toast({ title: "Success", description: "Subject added successfully" });
      }

      setSubjectDialogOpen(false);
      fetchSubjects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteSubjectClick = (subject: Subject) => {
    setSubjectToDelete(subject);
    setDeleteSubjectDialogOpen(true);
  };

  const handleDeleteSubjectConfirm = async () => {
    if (!subjectToDelete) return;

    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectToDelete.id);

      if (error) throw error;

      toast({ title: "Success", description: "Subject deleted successfully" });
      setDeleteSubjectDialogOpen(false);
      setSubjectToDelete(null);
      fetchSubjects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const calculateGrade = (marks: number): string => {
    if (marks >= 80) return 'A';
    if (marks >= 75) return 'A-';
    if (marks >= 70) return 'B+';
    if (marks >= 65) return 'B';
    if (marks >= 60) return 'B-';
    if (marks >= 55) return 'C+';
    if (marks >= 50) return 'C';
    if (marks >= 45) return 'C-';
    if (marks >= 40) return 'D+';
    if (marks >= 35) return 'D';
    if (marks >= 30) return 'D-';
    return 'E';
  };

  const handleAddMarks = (student: Client) => {
    setSelectedStudent(student);
    setMarksForm({
      subject_id: "",
      marks: "",
      grade: "",
      term: "",
      year: new Date().getFullYear().toString(),
      remarks: ""
    });
    setMarksDialogOpen(true);
  };

  const handleViewReport = async (student: Client) => {
    setReportStudent(student);
    setReportDialogOpen(true);
    setLoadingReport(true);
    
    try {
      const { data, error } = await supabase
        .from('marks')
        .select(`
          id,
          client_id,
          subject_id,
          marks,
          grade,
          term,
          year,
          remarks,
          subjects (name, code)
        `)
        .eq('client_id', student.id)
        .order('year', { ascending: false })
        .order('term', { ascending: true });

      if (error) throw error;
      
      const formattedMarks = (data || []).map((mark: any) => ({
        ...mark,
        subject_name: mark.subjects?.name || 'Unknown',
        subject_code: mark.subjects?.code || '-'
      }));
      
      setStudentMarks(formattedMarks);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingReport(false);
    }
  };

  const handleSaveMarks = async () => {
    if (!selectedStudent || !marksForm.subject_id || !marksForm.marks || !marksForm.term || !marksForm.year) {
      toast({
        title: "Error",
        description: "All required fields must be filled",
        variant: "destructive"
      });
      return;
    }

    const marksValue = parseFloat(marksForm.marks);
    if (marksValue < 0 || marksValue > 100) {
      toast({
        title: "Error",
        description: "Marks must be between 0 and 100",
        variant: "destructive"
      });
      return;
    }

    const autoGrade = calculateGrade(marksValue);

    try {
      const { error } = await supabase
        .from('marks')
        .insert({
          client_id: selectedStudent.id,
          subject_id: marksForm.subject_id,
          marks: marksValue,
          grade: autoGrade,
          term: marksForm.term,
          year: parseInt(marksForm.year),
          remarks: marksForm.remarks || null
        });

      if (error) throw error;

      toast({ 
        title: "Success", 
        description: `Marks added successfully with grade ${autoGrade}` 
      });
      setMarksDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 w-full max-w-full overflow-x-hidden">
      <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-full">
        {/* Header */}
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 border-0 shadow-lg">
          <CardHeader className="pb-6 sm:pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                  Education Department
                </CardTitle>
                <p className="text-orange-100 text-sm sm:text-base lg:text-lg">
                  Manage subjects, grades, and academic performance tracking
                </p>
              </div>
              {isEducationStaff && (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button 
                    variant="secondary" 
                    className="bg-white text-orange-600 hover:bg-orange-50 w-full sm:w-auto"
                    onClick={handleAddSubject}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subject
                  </Button>
                  <Button variant="secondary" className="bg-white text-orange-600 hover:bg-orange-50 w-full sm:w-auto">
                    <FileText className="h-4 w-4 mr-2" />
                    View Reports
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-t-4 border-t-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{subjects.length}</p>
                  <p className="text-sm text-muted-foreground">SUBJECTS</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-green-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">0</p>
                  <p className="text-sm text-muted-foreground">MARKS</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{students.length}</p>
                  <p className="text-sm text-muted-foreground">STUDENTS</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">-</p>
                  <p className="text-sm text-muted-foreground">PERFORMANCE</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Quick Actions</CardTitle>
            <p className="text-sm text-muted-foreground">Common education department tasks</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
{isEducationStaff && (
              <Card 
                className="border-t-4 border-t-blue-500 cursor-pointer hover:shadow-md transition-shadow"
                onClick={handleAddSubject}
              >
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-blue-100 rounded-lg">
                      <BookOpen className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Add</p>
                      <p className="text-sm text-muted-foreground">NEW SUBJECT</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}

              <Card className="border-t-4 border-t-green-500 cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-green-100 rounded-lg">
                      <FileText className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold">View</p>
                      <p className="text-sm text-muted-foreground">OVERALL REPORT</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-orange-500 cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-orange-100 rounded-lg">
                      <Download className="h-8 w-8 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Export</p>
                      <p className="text-sm text-muted-foreground">PDF REPORTS</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Enrolled Students */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">Enrolled Students</CardTitle>
                <p className="text-sm text-muted-foreground">Students currently enrolled in education programs</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Users className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <TrendingUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                  <TableHeader className="bg-slate-800">
                  <TableRow>
                    <TableHead className="text-white font-semibold">STUDENT NAME</TableHead>
                    <TableHead className="text-white font-semibold">AGE</TableHead>
                    <TableHead className="text-white font-semibold">EDUCATION LEVEL</TableHead>
                    <TableHead className="text-white font-semibold">STATUS</TableHead>
                    <TableHead className="text-white font-semibold">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Loading students...
                      </TableCell>
                    </TableRow>
                  ) : students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No students found
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="bg-orange-500">
                              <AvatarFallback className="bg-orange-500 text-white font-semibold">
                                {getInitials(student.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{student.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-orange-500" />
                            <span>{student.age} years</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-orange-500" />
                            <span>{student.education_level || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-500 text-white hover:bg-green-600">
                            • {student.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col sm:flex-row gap-2">
                            {isEducationStaff && (
                              <Button 
                                size="sm" 
                                className="bg-orange-500 text-white hover:bg-orange-600 whitespace-nowrap"
                                onClick={() => handleAddMarks(student)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                ADD MARKS
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-orange-500 border-orange-500 hover:bg-orange-50 whitespace-nowrap"
                              onClick={() => handleViewReport(student)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              VIEW REPORT
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Available Subjects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Available Subjects</CardTitle>
            <p className="text-sm text-muted-foreground">Subjects available for academic assessment and tracking</p>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No subjects configured yet
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((subject) => (
                  <Card key={subject.id} className="border-t-4 border-t-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-lg">{subject.name}</h4>
                          <p className="text-sm text-muted-foreground">Code: {subject.code}</p>
                        </div>
                        {isEducationStaff && (
                          <div className="flex gap-1">
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => handleEditSubject(subject)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => handleDeleteSubjectClick(subject)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {subject.description && (
                        <p className="text-sm text-muted-foreground mt-2">{subject.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subject Dialog */}
      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
            <DialogDescription>
              {editingSubject ? 'Update the subject information' : 'Create a new subject for academic tracking'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Subject Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Mathematics"
                value={subjectForm.name}
                onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Subject Code *</Label>
              <Input
                id="code"
                placeholder="e.g., MATH101"
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description"
                value={subjectForm.description}
                onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubjectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSubject}>
              {editingSubject ? 'Update' : 'Create'} Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subject Confirmation */}
      <AlertDialog open={deleteSubjectDialogOpen} onOpenChange={setDeleteSubjectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the subject "{subjectToDelete?.name}" and all associated marks. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSubjectConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Marks Dialog */}
      <Dialog open={marksDialogOpen} onOpenChange={setMarksDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Marks for {selectedStudent?.name}</DialogTitle>
            <DialogDescription>
              Enter the marks information. Grade will be calculated automatically based on Kenya grading system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select value={marksForm.subject_id} onValueChange={(value) => setMarksForm({ ...marksForm, subject_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="marks">Marks (0-100) *</Label>
              <Input
                id="marks"
                type="number"
                min="0"
                max="100"
                placeholder="e.g., 85"
                value={marksForm.marks}
                onChange={(e) => setMarksForm({ ...marksForm, marks: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Grade will be assigned automatically: A (80-100), A- (75-79), B+ (70-74), B (65-69), B- (60-64), C+ (55-59), C (50-54), C- (45-49), D+ (40-44), D (35-39), D- (30-34), E (0-29)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="term">Term *</Label>
                <Select value={marksForm.term} onValueChange={(value) => setMarksForm({ ...marksForm, term: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                    <SelectItem value="Term 3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder={new Date().getFullYear().toString()}
                  value={marksForm.year}
                  onChange={(e) => setMarksForm({ ...marksForm, year: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Optional remarks"
                value={marksForm.remarks}
                onChange={(e) => setMarksForm({ ...marksForm, remarks: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarksDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMarks}>
              Add Marks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-orange-500" />
              Academic Report - {reportStudent?.name}
            </DialogTitle>
            <DialogDescription>
              All subjects, marks, and grades for this student
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loadingReport ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading marks...
              </div>
            ) : studentMarks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No marks recorded for this student yet
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-800">
                    <TableRow>
                      <TableHead className="text-white font-semibold">SUBJECT</TableHead>
                      <TableHead className="text-white font-semibold">CODE</TableHead>
                      <TableHead className="text-white font-semibold">MARKS</TableHead>
                      <TableHead className="text-white font-semibold">GRADE</TableHead>
                      <TableHead className="text-white font-semibold">TERM</TableHead>
                      <TableHead className="text-white font-semibold">YEAR</TableHead>
                      <TableHead className="text-white font-semibold">REMARKS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentMarks.map((mark) => (
                      <TableRow key={mark.id}>
                        <TableCell className="font-medium">{mark.subject_name}</TableCell>
                        <TableCell>{mark.subject_code}</TableCell>
                        <TableCell>
                          <span className="font-semibold">{mark.marks}</span>/100
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              mark.grade?.startsWith('A') ? 'bg-green-500 text-white' :
                              mark.grade?.startsWith('B') ? 'bg-blue-500 text-white' :
                              mark.grade?.startsWith('C') ? 'bg-yellow-500 text-white' :
                              mark.grade?.startsWith('D') ? 'bg-orange-500 text-white' :
                              'bg-red-500 text-white'
                            }
                          >
                            {mark.grade}
                          </Badge>
                        </TableCell>
                        <TableCell>{mark.term}</TableCell>
                        <TableCell>{mark.year}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{mark.remarks || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Education;
