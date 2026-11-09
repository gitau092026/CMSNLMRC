import { useState, useEffect } from"react";
import { Button } from"@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Badge } from"@/components/ui/badge";
import { Avatar, AvatarFallback } from"@/components/ui/avatar";
import { Plus, FileText, Download, BookOpen, TrendingUp, Users, Award, Edit, Trash2 } from"lucide-react";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from"@/components/ui/table";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from"@/components/ui/dialog";
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
} from"@/components/ui/alert-dialog";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from"@/components/ui/select";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import { Textarea } from"@/components/ui/textarea";
import { supabase } from"@/integrations/supabase/client";
import { useToast } from"@/hooks/use-toast";
import { useAuth } from"@/contexts/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
 const { toast } = useToast();
 const { user } = useAuth();
 const [students, setStudents] = useState<Client[]>([]);
 const [subjects, setSubjects] = useState<Subject[]>([]);
 const [loading, setLoading] = useState(true);
 const [isEducationStaff, setIsEducationStaff] = useState(false);

 // Subject dialog states
 const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
 const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
 const [subjectForm, setSubjectForm] = useState({ name:"", code:"", description:"" });

 // Delete subject dialog
 const [deleteSubjectDialogOpen, setDeleteSubjectDialogOpen] = useState(false);
 const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

 // Marks dialog states
 const [marksDialogOpen, setMarksDialogOpen] = useState(false);
 const [selectedStudent, setSelectedStudent] = useState<Client | null>(null);
 const [marksForm, setMarksForm] = useState({
 subject_id:"",
 marks:"",
 grade:"",
 term:"",
 year: new Date().getFullYear().toString(),
 remarks:""
 });
 const [editingMarkId, setEditingMarkId] = useState<string | null>(null);

 // Report dialog states
 const [reportDialogOpen, setReportDialogOpen] = useState(false);
 const [reportStudent, setReportStudent] = useState<Client | null>(null);
 const [studentMarks, setStudentMarks] = useState<(Mark & { subject_name: string; subject_code: string })[]>([]);
 const [existingStudentMarks, setExistingStudentMarks] = useState<Mark[]>([]);
 const [loadingReport, setLoadingReport] = useState(false);
 const [aggregateReportOpen, setAggregateReportOpen] = useState(false);

 // Education Level edit states
 const [eduLevelDialogOpen, setEduLevelDialogOpen] = useState(false);
 const [eduLevelStudent, setEduLevelStudent] = useState<Client | null>(null);
 const [eduLevelValue, setEduLevelValue] = useState("");

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
 .in('role', ['admin', 'education', 'social_work', 'counselling']);

 setIsEducationStaff(!!data && data.length > 0 && !error);
 };

 const fetchStudents = async () => {
 try {
 setLoading(true);
 const { data, error } = await supabase
 .from('clients')
 .select('id, name, age, status, education_level, education_status, level_reached, school_name, profile_picture, client_id')
 .or('status.eq.Active,status.eq.Complete')
 .order('name', { ascending: true });

 if (error) throw error;
 setStudents(data || []);
 } catch (error: any) {
 toast({
 title:"Error",
 description: error.message,
 variant:"destructive"
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
 title:"Error",
 description: error.message,
 variant:"destructive"
 });
 }
 };

 const handleAddSubject = () => {
 setEditingSubject(null);
 setSubjectForm({ name:"", code:"", description:"" });
 setSubjectDialogOpen(true);
 };

 const handleEditSubject = (subject: Subject) => {
 setEditingSubject(subject);
 setSubjectForm({
 name: subject.name,
 code: subject.code,
 description: subject.description ||""
 });
 setSubjectDialogOpen(true);
 };

 const handleSaveSubject = async () => {
 if (!subjectForm.name || !subjectForm.code) {
 toast({
 title:"Error",
 description:"Name and code are required",
 variant:"destructive"
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
 toast({ title:"Success", description:"Subject updated successfully" });
 } else {
 const { error } = await supabase
 .from('subjects')
 .insert({
 name: subjectForm.name,
 code: subjectForm.code,
 description: subjectForm.description || null
 });

 if (error) throw error;
 toast({ title:"Success", description:"Subject added successfully" });
 }

 setSubjectDialogOpen(false);
 fetchSubjects();
 } catch (error: any) {
 toast({
 title:"Error",
 description: error.message,
 variant:"destructive"
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

 toast({ title:"Success", description:"Subject deleted successfully" });
 setDeleteSubjectDialogOpen(false);
 setSubjectToDelete(null);
 fetchSubjects();
 } catch (error: any) {
 toast({
 title:"Error",
 description: error.message,
 variant:"destructive"
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

 const handleAddMarks = async (student: Client) => {
 setSelectedStudent(student);
 setEditingMarkId(null);
 setMarksForm({
 subject_id:"",
 marks:"",
 grade:"",
 term:"",
 year: new Date().getFullYear().toString(),
 remarks:""
 });
 setMarksDialogOpen(true);

 try {
 const { data } = await supabase
 .from('marks')
 .select('*')
 .eq('client_id', student.id);

 setExistingStudentMarks(data || []);
 } catch (error) {
 console.error("Error fetching existing marks:", error);
 }
 };

 const handleEditMark = (mark: any) => {
 setEditingMarkId(mark.id);
 setSelectedStudent(reportStudent);
 setMarksForm({
 subject_id: mark.subject_id,
 marks: mark.marks.toString(),
 grade: mark.grade || "",
 term: mark.term,
 year: mark.year.toString(),
 remarks: mark.remarks || ""
 });
 setReportDialogOpen(false);
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
 title:"Error",
 description: error.message,
 variant:"destructive"
 });
 } finally {
 setLoadingReport(false);
 }
 };

 const handleSaveMarks = async () => {
 if (!selectedStudent || !marksForm.subject_id || !marksForm.marks || !marksForm.term || !marksForm.year) {
 toast({
 title:"Error",
 description:"All required fields must be filled",
 variant:"destructive"
 });
 return;
 }

 const marksValue = parseFloat(marksForm.marks);
 if (marksValue < 0 || marksValue > 100) {
 toast({
 title:"Error",
 description:"Marks must be between 0 and 100",
 variant:"destructive"
 });
 return;
 }

 const autoGrade = calculateGrade(marksValue);

 try {
 if (editingMarkId) {
 const { error } = await supabase
 .from('marks')
 .update({
 subject_id: marksForm.subject_id,
 marks: marksValue,
 grade: autoGrade,
 term: marksForm.term,
 year: parseInt(marksForm.year),
 remarks: marksForm.remarks || null
 })
 .eq('id', editingMarkId);

 if (error) throw error;

 toast({
 title:"Success",
 description: `Marks updated successfully with grade ${autoGrade}`
 });

 if (reportStudent && reportStudent.id === selectedStudent.id) {
 handleViewReport(reportStudent);
 }
 } else {
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
 title:"Success",
 description: `Marks added successfully with grade ${autoGrade}`
 });
 }
 setMarksDialogOpen(false);
 setEditingMarkId(null);
 } catch (error: any) {
 toast({
 title:"Error",
 description: error.message,
 variant:"destructive"
 });
 }
 };
 const getInitials = (name: string) => {
 return name.split(' ').map(n => n[0]).join('');
 };

 const handleOpenEduLevel = (student: Client) => {
  setEduLevelStudent(student);
  setEduLevelValue(student.education_level || "");
  setEduLevelDialogOpen(true);
 };

 const handleSaveEducationLevel = async () => {
  if (!eduLevelStudent) return;
  try {
   const { error } = await supabase
    .from('clients')
    .update({ education_level: eduLevelValue || null })
    .eq('id', eduLevelStudent.id);
   if (error) throw error;
   toast({ title: "Success", description: "Education level updated successfully" });
   setEduLevelDialogOpen(false);
   fetchStudents();
  } catch (error: any) {
   toast({ title: "Error", description: error.message, variant: "destructive" });
  }
 };

 const handleDownloadPdf = () => {
   try {
     const doc = new jsPDF();
     
     // Add Header
     doc.setFontSize(20);
     doc.text("Education Department Report", 14, 22);
     
     doc.setFontSize(11);
     doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
     doc.text(`Total Enrolled Students: ${students.length}`, 14, 36);
     doc.text(`Total Subjects: ${subjects.length}`, 14, 42);

     // Add Students Table
     const tableColumn = ["Student Name", "Age", "Education Level", "Status"];
     const tableRows = students.map(student => [
       student.name,
       student.age.toString(),
       student.education_level || "Not Set",
       student.status
     ]);

     autoTable(doc, {
       head: [tableColumn],
       body: tableRows,
       startY: 50,
       theme: 'striped',
       headStyles: { fillColor: [249, 115, 22] },
     });

     doc.save("education_department_report.pdf");
     
     toast({
       title: "Success",
       description: "Report downloaded successfully",
     });
   } catch (error) {
     console.error("Error generating report:", error);
     toast({
       title: "Error",
       description: "Failed to generate report",
       variant: "destructive"
     });
   }
 };

  return (
    <div className="min-h-screen bg-neutral-50/80 w-full max-w-full">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#F97316] to-[#FB923C] p-8 shadow-lg">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <BookOpen className="w-64 h-64 text-white transform rotate-12" />
          </div>
          
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
                Education Department
              </h1>
              <p className="text-orange-100 text-lg font-medium">
                Manage subjects, grades, and academic performance tracking
              </p>
            </div>
            
            {isEducationStaff && (
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  variant="secondary"
                  className="bg-white/95 text-orange-600 hover:bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 font-semibold"
                  onClick={handleAddSubject}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subject
                </Button>
                <Button 
                  variant="secondary" 
                  className="bg-white/20 text-white hover:bg-white/30 border-0 shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-sm font-semibold"
                  onClick={() => setAggregateReportOpen(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-700 delay-100">
          <Card className="border-t-4 border-t-orange-500 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-orange-50 rounded-xl text-orange-600">
                  <BookOpen className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{subjects.length}</p>
                  <p className="text-xs font-bold text-slate-500 tracking-wider font-sans uppercase">Subjects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-emerald-500 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-emerald-50 rounded-xl text-emerald-600">
                  <TrendingUp className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-extrabold text-slate-800 tracking-tight">0</p>
                  <p className="text-xs font-bold text-slate-500 tracking-wider font-sans uppercase">Marks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-amber-500 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-amber-50 rounded-xl text-amber-600">
                  <Users className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{students.length}</p>
                  <p className="text-xs font-bold text-slate-500 tracking-wider font-sans uppercase">Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-purple-500 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-purple-50 rounded-xl text-purple-600">
                  <Award className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-extrabold text-slate-800 tracking-tight">-</p>
                  <p className="text-xs font-bold text-slate-500 tracking-wider font-sans uppercase">Performance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>



          {/* Enrolled Students */}
          <Card className="shadow-sm hover:shadow-md transition-shadow animate-in slide-in-from-bottom-4 duration-700 delay-300">
            <CardHeader className="bg-white border-b border-neutral-100 rounded-t-xl px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-800">Enrolled Students</CardTitle>
                  <p className="text-sm font-medium text-slate-500 mt-1">Students currently enrolled in education programs</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="h-9 w-9 text-slate-600 border-slate-200">
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-9 w-9 text-slate-600 border-slate-200">
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto rounded-xl border border-neutral-100 shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-neutral-100">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12">STUDENT NAME</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12">AGE</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12">EDUCATION LEVEL</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12">STATUS</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12 text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-500 font-medium">
                          <div className="flex items-center justify-center gap-2">
                            <span className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"/>
                            Loading students...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-500 font-medium">
                          No students found
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.map((student) => (
                        <TableRow key={student.id} className="hover:bg-orange-50/30 transition-colors">
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 bg-orange-100 text-orange-700 font-bold border border-orange-200">
                                <AvatarFallback>
                                  {getInitials(student.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-semibold text-slate-800">{student.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 font-medium text-slate-600">
                            {student.age} yrs
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2">
                              {student.education_level ? 
                                <span className="font-medium text-slate-700">{student.education_level}</span> : 
                                <span className="text-slate-400 italic">Not set</span>
                              }
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 font-bold shadow-none">
                              {student.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex justify-end gap-2">
                              {isEducationStaff && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700 shadow-sm font-semibold rounded-lg px-3"
                                    onClick={() => handleOpenEduLevel(student)}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Level
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-[#F97316] text-white hover:bg-orange-600 shadow-sm font-semibold rounded-lg px-4"
                                    onClick={() => handleAddMarks(student)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Grade
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm font-semibold rounded-lg px-4"
                                onClick={() => handleViewReport(student)}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Report
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
        <Card className="shadow-sm hover:shadow-md transition-shadow animate-in slide-in-from-bottom-4 duration-700 delay-400">
          <CardHeader className="bg-white border-b border-neutral-100 rounded-t-xl px-6 py-5">
            <CardTitle className="text-xl font-bold text-slate-800">Available Subjects</CardTitle>
            <p className="text-sm font-medium text-slate-500 mt-1">Subjects available for academic assessment and tracking</p>
          </CardHeader>
          <CardContent className="p-0">
            {subjects.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-medium">
                No subjects configured yet
              </div>
            ) : (
              <div className="overflow-x-auto rounded-b-xl">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-neutral-100">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12 pl-6">SUBJECT</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12">CODE</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12 hidden md:table-cell">DESCRIPTION</TableHead>
                      {isEducationStaff && (
                        <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12 text-right pr-6">ACTIONS</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((subject) => (
                      <TableRow key={subject.id} className="hover:bg-slate-50/50 transition-colors border-b border-neutral-100 last:border-0">
                        <TableCell className="pl-6 py-4">
                          <span className="font-bold text-slate-800">{subject.name}</span>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-bold text-orange-700 ring-1 ring-inset ring-orange-600/20">
                            {subject.code}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-sm font-medium text-slate-500 max-w-md truncate hidden md:table-cell">
                          {subject.description || "-"}
                        </TableCell>
                        {isEducationStaff && (
                          <TableCell className="py-2 pr-6 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-400 hover:text-orange-600 hover:bg-orange-50"
                                onClick={() => handleEditSubject(subject)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteSubjectClick(subject)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subject Dialog */}
      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
        <DialogContent className="w-[95vw] max-w-full sm:max-w-lg">
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
 This will permanently delete the subject"{subjectToDelete?.name}" and all associated marks.
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
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="term">Term *</Label>
 <Select value={marksForm.term} onValueChange={(value) => setMarksForm({ ...marksForm, term: value })}>
 <SelectTrigger>
 <SelectValue placeholder="Select term" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="Half Term">Half Term</SelectItem>
 <SelectItem value="End Term">End Term</SelectItem>
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
 <Label htmlFor="subject">Subject *</Label>
 <Select value={marksForm.subject_id} onValueChange={(value) => setMarksForm({ ...marksForm, subject_id: value })}>
 <SelectTrigger>
 <SelectValue placeholder="Select subject" />
 </SelectTrigger>
 <SelectContent>
 {subjects.filter(subject => {
 if (!marksForm.term || !marksForm.year) return true;
 return !existingStudentMarks.some(m =>
 m.subject_id === subject.id &&
 m.term === marksForm.term &&
 m.year === parseInt(marksForm.year)
 );
 }).map((subject) => (
 <SelectItem key={subject.id} value={subject.id}>
 {subject.name} ({subject.code})
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 {marksForm.term && marksForm.year && (
 <p className="text-xs text-muted-foreground">
 Subjects with existing marks for {marksForm.term} {marksForm.year} are hidden.
 </p>
 )}
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
 <DialogContent className="w-[95vw] max-w-3xl max-h-[80vh] overflow-y-auto">
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
 {isEducationStaff && (
 <TableHead className="text-white font-semibold text-right">ACTIONS</TableHead>
 )}
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
 {isEducationStaff && (
 <TableCell className="text-right">
 <Button
 size="icon"
 variant="ghost"
 className="h-8 w-8 text-slate-400 hover:text-orange-600 hover:bg-orange-50"
 onClick={() => handleEditMark(mark)}
 >
 <Edit className="h-4 w-4" />
 </Button>
 </TableCell>
 )}
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

 {/* Aggregate Report Preview Dialog */}
 <Dialog open={aggregateReportOpen} onOpenChange={setAggregateReportOpen}>
  <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] flex flex-col">
   <DialogHeader>
    <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
     <FileText className="h-5 w-5 text-orange-500" />
     Education Department Report
    </DialogTitle>
    <DialogDescription>
     Overview of all enrolled students and academic statistics. Export to PDF when ready.
    </DialogDescription>
   </DialogHeader>

   <div className="flex-1 overflow-y-auto py-4 space-y-6">
    {/* Summary Cards */}
    <div className="grid grid-cols-2 gap-4">
     <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
      <div className="p-2 bg-orange-100 rounded-lg">
       <Users className="h-5 w-5 text-orange-600" />
      </div>
      <div>
       <p className="text-2xl font-extrabold text-slate-800">{students.length}</p>
       <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Students</p>
      </div>
     </div>
     <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
      <div className="p-2 bg-emerald-100 rounded-lg">
       <BookOpen className="h-5 w-5 text-emerald-600" />
      </div>
      <div>
       <p className="text-2xl font-extrabold text-slate-800">{subjects.length}</p>
       <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Subjects</p>
      </div>
     </div>
    </div>

    {/* Students Table */}
    <div>
     <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Enrolled Students</h3>
     <div className="rounded-xl border border-neutral-200 overflow-hidden overflow-x-auto">
      <Table className="min-w-[500px]">
       <TableHeader className="bg-slate-50">
        <TableRow>
         <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Name</TableHead>
         <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Age</TableHead>
         <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Education Level</TableHead>
         <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</TableHead>
        </TableRow>
       </TableHeader>
       <TableBody>
        {students.length === 0 ? (
         <TableRow>
          <TableCell colSpan={4} className="text-center py-8 text-slate-400">No students enrolled</TableCell>
         </TableRow>
        ) : (
         students.map((student) => (
          <TableRow key={student.id} className="hover:bg-orange-50/30">
           <TableCell className="font-semibold text-slate-800">{student.name}</TableCell>
           <TableCell className="text-slate-600">{student.age} yrs</TableCell>
           <TableCell className="text-slate-600">{student.education_level || <span className="italic text-slate-400">Not set</span>}</TableCell>
           <TableCell>
            <Badge className="bg-emerald-100 text-emerald-700 border-0 font-bold shadow-none hover:bg-emerald-100">
             {student.status}
            </Badge>
           </TableCell>
          </TableRow>
         ))
        )}
       </TableBody>
      </Table>
     </div>
    </div>

    {/* Subjects Table */}
    <div>
     <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Available Subjects</h3>
     <div className="rounded-xl border border-neutral-200 overflow-hidden overflow-x-auto">
      <Table className="min-w-[500px]">
       <TableHeader className="bg-slate-50">
        <TableRow>
         <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</TableHead>
         <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Code</TableHead>
         <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</TableHead>
        </TableRow>
       </TableHeader>
       <TableBody>
        {subjects.length === 0 ? (
         <TableRow>
          <TableCell colSpan={3} className="text-center py-8 text-slate-400">No subjects configured</TableCell>
         </TableRow>
        ) : (
         subjects.map((subject) => (
          <TableRow key={subject.id} className="hover:bg-slate-50/50">
           <TableCell className="font-bold text-slate-800">{subject.name}</TableCell>
           <TableCell>
            <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-bold text-orange-700 ring-1 ring-inset ring-orange-600/20">
             {subject.code}
            </span>
           </TableCell>
           <TableCell className="text-slate-500 text-sm">{subject.description || '-'}</TableCell>
          </TableRow>
         ))
        )}
       </TableBody>
      </Table>
     </div>
    </div>

    <p className="text-xs text-slate-400 text-right">
     Report generated on {new Date().toLocaleDateString('en-KE', { dateStyle: 'full' })}
    </p>
   </div>

   <DialogFooter className="border-t border-neutral-100 pt-4 gap-2">
    <Button variant="outline" onClick={() => setAggregateReportOpen(false)}>
     Close
    </Button>
    <Button
     className="bg-[#F97316] hover:bg-orange-600 text-white font-semibold shadow-sm"
     onClick={() => { handleDownloadPdf(); setAggregateReportOpen(false); }}
    >
     <Download className="h-4 w-4 mr-2" />
     Export PDF
    </Button>
   </DialogFooter>
  </DialogContent>
 </Dialog>

 {/* Edit Education Level Dialog */}
 <Dialog open={eduLevelDialogOpen} onOpenChange={setEduLevelDialogOpen}>
  <DialogContent className="max-w-sm w-[95vw] max-w-full">
   <DialogHeader>
    <DialogTitle className="text-lg font-bold text-slate-800">Set Education Level</DialogTitle>
    <DialogDescription>
     Update the education level for <span className="font-semibold text-slate-700">{eduLevelStudent?.name}</span>.
    </DialogDescription>
   </DialogHeader>
   <div className="py-4 space-y-3">
    <Label htmlFor="edu-level">Education Level</Label>
    <Select value={eduLevelValue} onValueChange={setEduLevelValue}>
     <SelectTrigger id="edu-level" className="w-full">
      <SelectValue placeholder="Select education level" />
     </SelectTrigger>
     <SelectContent>
      <SelectItem value="Level 1">Level 1</SelectItem>
      <SelectItem value="Level 2">Level 2</SelectItem>
     </SelectContent>
    </Select>
   </div>
   <DialogFooter>
    <Button variant="outline" onClick={() => setEduLevelDialogOpen(false)}>Cancel</Button>
    <Button
     className="bg-[#F97316] hover:bg-orange-600 text-white font-semibold"
     onClick={handleSaveEducationLevel}
    >
     Save
    </Button>
   </DialogFooter>
  </DialogContent>
 </Dialog>

 </div>
 );
};

export default Education;
