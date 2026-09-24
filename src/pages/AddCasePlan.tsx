import { useState, useEffect } from"react";
import { useNavigate, useSearchParams } from"react-router-dom";
import { useForm, useWatch } from"react-hook-form";
import { zodResolver } from"@hookform/resolvers/zod";
import * as z from"zod";
import {
 User,
 Calendar,
 ClipboardList,
 Save,
 ArrowLeft,
 GraduationCap,
 Shield,
 Heart,
 Activity,
 Users,
 DollarSign,
 CheckCircle2,
 Plus,
 Trash2
} from"lucide-react";
import { supabase } from"@/integrations/supabase/client";
import { useToast } from"@/hooks/use-toast";
import {
 Form,
 FormControl,
 FormField,
 FormItem,
 FormLabel,
 FormMessage,
} from"@/components/ui/form";
import { Input } from"@/components/ui/input";
import { Textarea } from"@/components/ui/textarea";
import { Button } from"@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from"@/components/ui/select";
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
 AlertDialogTrigger,
} from"@/components/ui/alert-dialog";
import { toast as sonnerToast } from"sonner";

// Goal entry schema for repeating sections
const goalEntrySchema = z.object({
 needIdentified: z.string().optional(),
 proposedActions: z.string().optional(),
 deadline: z.string().optional(),
 personResponsible: z.string().optional(),
 actionsCompleted: z.string().optional(),
 explanationIfNotCompleted: z.string().optional(),
 newActionIdentified: z.string().optional(),
});

const formSchema = z.object({
 clientId: z.string().min(1,"Client is required"),
 planDate: z.string().min(1,"Date is required"),

 // Education Goals
 educationGoals: z.string().optional(),
 educationEntries: z.array(goalEntrySchema).optional(),

 // Protection and Safety Goals
 protectionGoals: z.string().optional(),
 protectionEntries: z.array(goalEntrySchema).optional(),

 // Psychosocial Well-being Goals
 psychosocialGoals: z.string().optional(),
 psychosocialEntries: z.array(goalEntrySchema).optional(),

 // Health and Development Goals
 healthGoals: z.string().optional(),
 healthEntries: z.array(goalEntrySchema).optional(),

 // Child-Caregiver Relationship Goals
 relationshipGoals: z.string().optional(),
 relationshipEntries: z.array(goalEntrySchema).optional(),

 // Economic Stability Goals
 economicGoals: z.string().optional(),
 economicEntries: z.array(goalEntrySchema).optional(),

 // Signatures
 caseworkerName: z.string().optional(),
 caseworkerSignature: z.string().optional(),
 caseworkerDate: z.string().optional(),
 caseManagerName: z.string().optional(),
 caseManagerSignature: z.string().optional(),
 caseManagerDate: z.string().optional(),
});



// Component for rendering goal entry rows
const GoalEntryRow = ({ control, baseName, index, onRemove, showDelete }: any) => {
 // Use useWatch to reactively track the completion status
 const completionStatus = useWatch({
 control,
 name: `${baseName}.${index}.actionsCompleted`,
 });

 const showFollowUpFields = completionStatus === 'no';

 return (
 <div className="p-4 border rounded-lg bg-muted/30 space-y-4 relative">
 {/* Delete Button with Confirmation - only show if allowed */}
 {showDelete && (
 <AlertDialog>
 <AlertDialogTrigger asChild>
 <Button
 type="button"
 variant="ghost"
 size="sm"
 className="absolute top-2 right-2 h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
 >
 <Trash2 className="h-4 w-4" />
 </Button>
 </AlertDialogTrigger>
 <AlertDialogContent>
 <AlertDialogHeader>
 <AlertDialogTitle>Delete Action Plan Entry?</AlertDialogTitle>
 <AlertDialogDescription>
 This will permanently remove this action plan entry. This action cannot be undone.
 </AlertDialogDescription>
 </AlertDialogHeader>
 <AlertDialogFooter>
 <AlertDialogCancel>Cancel</AlertDialogCancel>
 <AlertDialogAction
 onClick={onRemove}
 className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
 >
 Delete
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 )}

 {/* First Row - Main fields that need more space */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 <FormField
 control={control}
 name={`${baseName}.${index}.needIdentified`}
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-xs">Need Identified</FormLabel>
 <FormControl>
 <Textarea {...field} className="min-h-[100px] text-sm" placeholder="Refer to assessment forms" />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={control}
 name={`${baseName}.${index}.proposedActions`}
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-xs">Proposed Actions</FormLabel>
 <FormControl>
 <Textarea {...field} className="min-h-[100px] text-sm" placeholder="Actions & referrals" />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 </div>

 {/* Second Row - Deadline, Person Responsible, Completion Status */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 <FormField
 control={control}
 name={`${baseName}.${index}.deadline`}
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-xs">Deadline</FormLabel>
 <FormControl>
 <Input type="date" {...field} className="text-sm" />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={control}
 name={`${baseName}.${index}.personResponsible`}
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-xs">Person Responsible</FormLabel>
 <FormControl>
 <Input {...field} className="text-sm" placeholder="Name & contact" />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={control}
 name={`${baseName}.${index}.actionsCompleted`}
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-xs">Completed?</FormLabel>
 <Select onValueChange={field.onChange} defaultValue={field.value}>
 <FormControl>
 <SelectTrigger className="text-sm">
 <SelectValue placeholder="Select" />
 </SelectTrigger>
 </FormControl>
 <SelectContent>
 <SelectItem value="yes">Yes</SelectItem>
 <SelectItem value="no">No</SelectItem>
 <SelectItem value="in_progress">In Progress</SelectItem>
 </SelectContent>
 </Select>
 <FormMessage />
 </FormItem>
 )}
 />
 </div>

 {/* Third Row - Explanation and New Action (Conditional) */}
 {showFollowUpFields && (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 <FormField
 control={control}
 name={`${baseName}.${index}.explanationIfNotCompleted`}
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-xs">If Not Completed</FormLabel>
 <FormControl>
 <Textarea {...field} className="min-h-[80px] text-sm" placeholder="Explanation" />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={control}
 name={`${baseName}.${index}.newActionIdentified`}
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-xs">New Action</FormLabel>
 <FormControl>
 <Textarea {...field} className="min-h-[80px] text-sm" placeholder="New actions" />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 </div>
 )}
 </div>
 );
};

// Component for managing action plan entries with add functionality
const ActionPlanSection = ({ control, baseName, form }: any) => {
 const entries = useWatch({
 control,
 name: baseName,
 }) || [];

 const addEntry = () => {
 const currentEntries = form.getValues(baseName) || [];
 form.setValue(baseName, [...currentEntries, {}]);
 };

 const removeEntry = (index: number) => {
 const currentEntries = form.getValues(baseName) || [];
 form.setValue(baseName, currentEntries.filter((_: any, i: number) => i !== index));
 };

 return (
 <div className="space-y-3">
 <h4 className="font-semibold text-sm">Action Plan</h4>

 {entries.map((_: any, index: number) => (
 <GoalEntryRow
 key={index}
 control={control}
 baseName={baseName}
 index={index}
 onRemove={() => removeEntry(index)}
 showDelete={index > 0}
 />
 ))}

 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={addEntry}
 className="w-full"
 >
 <Plus className="h-4 w-4 mr-2" />
 Add Need
 </Button>
 </div>
 );
};

const AddCasePlan = () => {
 const navigate = useNavigate();
 const { toast } = useToast();
 const [searchParams] = useSearchParams();
 const paramClientId = searchParams.get('clientId');
 const paramPlanId = searchParams.get('planId');
 const [clientName, setClientName] = useState("");
 const [loading, setLoading] = useState(false);
 const [savingSection, setSavingSection] = useState<string | null>(null);
 const [savedSections, setSavedSections] = useState<Set<string>>(new Set());

 const form = useForm<z.infer<typeof formSchema>>({
 resolver: zodResolver(formSchema),
 defaultValues: {
 clientId: paramClientId ||"",
 planDate: new Date().toISOString().split('T')[0],
 educationEntries: [{}],
 protectionEntries: [{}],
 psychosocialEntries: [{}],
 healthEntries: [{}],
 relationshipEntries: [{}],
 economicEntries: [{}],
 },
 });

 useEffect(() => {
 if (paramClientId) {
 fetchClientName(paramClientId);
 loadDraft(paramClientId);
 }
 }, [paramClientId, paramPlanId]);

 const fetchClientName = async (id: string) => {
 const { data } = await supabase.from('clients').select('name').eq('id', id).single();
 if (data) setClientName(data.name);
 };

 // Load draft from DB (priority) or LocalStorage (fallback)
 const loadDraft = async (clientId: string) => {
 try {
 // Check DB for Draft OR Edit Plan
 let query = (supabase as any).from('case_plans').select('*');

 if (paramPlanId) {
 query = query.eq('id', paramPlanId).single();
 } else {
 query = query.eq('client_id', clientId).eq('status', 'Draft').maybeSingle();
 }

 const { data: dbDraft, error } = await query;

 if (dbDraft) {
 // Map DB snake_case to form camelCase
 const formData = {
 clientId: dbDraft.client_id,
 planDate: dbDraft.plan_date || new Date().toISOString().split('T')[0],
 educationGoals: dbDraft.education_goals ||"",
 educationEntries: dbDraft.education_entries || [{}],
 protectionGoals: dbDraft.protection_goals ||"",
 protectionEntries: dbDraft.protection_entries || [{}],
 psychosocialGoals: dbDraft.psychosocial_goals ||"",
 psychosocialEntries: dbDraft.psychosocial_entries || [{}],
 healthGoals: dbDraft.health_goals ||"",
 healthEntries: dbDraft.health_entries || [{}],
 relationshipGoals: dbDraft.relationship_goals ||"",
 relationshipEntries: dbDraft.relationship_entries || [{}],
 economicGoals: dbDraft.economic_goals ||"",
 economicEntries: dbDraft.economic_entries || [{}],
 caseworkerName: dbDraft.caseworker_name ||"",
 caseworkerSignature: dbDraft.caseworker_signature ||"",
 caseworkerDate: dbDraft.caseworker_date ||"",
 caseManagerName: dbDraft.case_manager_name ||"",
 caseManagerSignature: dbDraft.case_manager_signature ||"",
 caseManagerDate: dbDraft.case_manager_date ||"",
 };

 form.reset(formData);
 setSavedSections(new Set(dbDraft.saved_sections || []));
 sonnerToast.info("Draft loaded from server", {
 description:"Your progress has been synced."
 });
 return;
 }

 // Fallback: Check LocalStorage
 const draftKey = `case_plan_draft_${clientId}`;
 const savedDraft = localStorage.getItem(draftKey);
 if (savedDraft) {
 const draftData = JSON.parse(savedDraft);
 const formData = draftData.formData;

 // Ensure array presence
 ['educationEntries', 'protectionEntries', 'psychosocialEntries', 'healthEntries', 'relationshipEntries', 'economicEntries'].forEach(key => {
 if (!formData[key] || formData[key].length === 0) formData[key] = [{}];
 });

 form.reset(formData);
 setSavedSections(new Set(draftData.savedSections || []));
 sonnerToast.info("Local Draft loaded", {
 description:"Please save to sync with server."
 });
 }
 } catch (error) {
 console.error("Error loading draft:", error);
 }
 };

 // Save to DB
 const saveToDb = async (status: 'Draft' | 'Active', sectionName?: string) => {
 if (!paramClientId) return;

 const values = form.getValues();
 const updatedSections = new Set(savedSections);
 if (sectionName) updatedSections.add(sectionName);
 if (status === 'Draft') setSavedSections(updatedSections);

 const dbData = {
 client_id: paramClientId,
 plan_date: values.planDate,
 education_goals: values.educationGoals,
 education_entries: values.educationEntries,
 protection_goals: values.protectionGoals,
 protection_entries: values.protectionEntries,
 psychosocial_goals: values.psychosocialGoals,
 psychosocial_entries: values.psychosocialEntries,
 health_goals: values.healthGoals,
 health_entries: values.healthEntries,
 relationship_goals: values.relationshipGoals,
 relationship_entries: values.relationshipEntries,
 economic_goals: values.economicGoals,
 economic_entries: values.economicEntries,
 caseworker_name: values.caseworkerName,
 caseworker_signature: values.caseworkerSignature,
 caseworker_date: values.caseworkerDate || null,
 case_manager_name: values.caseManagerName,
 case_manager_signature: values.caseManagerSignature,
 case_manager_date: values.caseManagerDate || null,
 saved_sections: Array.from(updatedSections),
 status: status,
 updated_at: new Date().toISOString()
 };

 try {
 if (paramPlanId) {
 // Update specific plan
 await (supabase as any).from('case_plans').update(dbData).eq('id', paramPlanId);
 } else {
 // Upsert based on client_id and status='Draft'
 const { data: existing } = await (supabase as any).from('case_plans').select('id').eq('client_id', paramClientId).eq('status', 'Draft').maybeSingle();

 if (existing) {
 await (supabase as any).from('case_plans').update(dbData).eq('id', existing.id);
 } else {
 await (supabase as any).from('case_plans').insert([dbData]);
 }
 }

 // If saving as Active (Submit), delete local draft
 if (status === 'Active') {
 localStorage.removeItem(`case_plan_draft_${paramClientId}`);
 }

 } catch (error: any) {
 console.error("Save error:", error);
 throw error;
 }
 };

 // Save individual section (wrapper)
 // Save individual section (wrapper)
 const saveSection = async (sectionName: string) => {
 setSavingSection(sectionName);
 try {
 await saveToDb('Draft', sectionName);

 sonnerToast.success(`${sectionName} saved`, {
 description:"Your progress has been saved to the server.",
 icon: <CheckCircle2 className="h-4 w-4" />
 });
 } catch (error: any) {
 // If table missing, fallback to local?
 console.error(error);
 // Warn user
 sonnerToast.error("Save failed", {
 description:"Could not save to server. Check connection or database."
 });
 } finally {
 setSavingSection(null);
 }
 };

 const onSubmit = async (values: z.infer<typeof formSchema>) => {
 try {
 setLoading(true);
 await saveToDb('Active');

 toast({
 title:"Success",
 description:"Case Plan submitted successfully!",
 });
 navigate("/case-plans");
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

 return (
 <div className="min-h-screen bg-background w-full overflow-x-hidden">
 <div className="sticky top-14 z-10 shadow-md bg-gradient-to-r from-blue-600 to-cyan-600 h-24 flex items-center px-4 sm:px-6 lg:px-8 overflow-x-hidden">
 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
 <div className="relative flex items-center gap-4">
 <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => navigate("/case-plans")}>
 <ArrowLeft className="h-5 w-5" />
 </Button>
 <div>
 <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Client Case Plan</h1>
 <p className="text-sm sm:text-base text-white/90">
 {clientName ? `For ${clientName}` :"Create comprehensive case plan"}
 </p>
 </div>
 </div>
 </div>

 <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
 <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
 <p className="text-sm text-blue-900 dark:text-blue-100">
 <strong>Instructions:</strong> Use information from the child and family assessment form. Pre-reunification/placement goals focus on preparing for safe transition. Reintegration goals focus on full integration into family and community.
 </p>
 </div>

 <Form {...form}>
 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

 {/* EDUCATION GOALS */}
 <Card className="border-t-4 border-t-purple-500">
 <CardHeader>
 <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
 <CardTitle className="flex items-center gap-2 min-w-0 truncate">
 <GraduationCap className="h-5 w-5 text-purple-600 shrink-0" />
 Goals for Education
 {savedSections.has("Education") && (
 <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
 )}
 </CardTitle>
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={() => saveSection("Education")}
 disabled={savingSection ==="Education"}
 >
 <Save className="h-4 w-4 mr-2" />
 {savingSection ==="Education" ?"Saving..." :"Save Progress"}
 </Button>
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 <FormField
 control={form.control}
 name="educationGoals"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Goals</FormLabel>
 <FormControl>
 <Textarea {...field} placeholder="Enter education goals..." className="min-h-[100px]" />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 <ActionPlanSection control={form.control} baseName="educationEntries" form={form} />
 </CardContent>
 </Card>

 {/* PROTECTION AND SAFETY GOALS */}
 <Card className="border-t-4 border-t-red-500">
 <CardHeader>
 <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
 <CardTitle className="flex items-center gap-2 min-w-0 truncate">
 <Shield className="h-5 w-5 text-red-600 shrink-0" />
 Goals for Protection and Safety
 {savedSections.has("Protection") && (
 <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
 )}
 </CardTitle>
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={() => saveSection("Protection")}
 disabled={savingSection ==="Protection"}
 >
 <Save className="h-4 w-4 mr-2" />
 {savingSection ==="Protection" ?"Saving..." :"Save Progress"}
 </Button>
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 <FormField
 control={form.control}
 name="protectionGoals"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Goals</FormLabel>
 <FormControl>
 <Textarea {...field} placeholder="Enter protection and safety goals..." className="min-h-[100px]" />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 <ActionPlanSection control={form.control} baseName="protectionEntries" form={form} />
 </CardContent>
 </Card>

 {/* PSYCHOSOCIAL WELL-BEING GOALS */}
 <Card className="border-t-4 border-t-green-500">
 <CardHeader>
 <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
 <CardTitle className="flex items-center gap-2 min-w-0 truncate">
 <Heart className="h-5 w-5 text-green-600 shrink-0" />
 Goals for Psychosocial Well-being and Community Belonging
 {savedSections.has("Psychosocial") && (
 <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
 )}
 </CardTitle>
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={() => saveSection("Psychosocial")}
 disabled={savingSection ==="Psychosocial"}
 >
 <Save className="h-4 w-4 mr-2" />
 {savingSection ==="Psychosocial" ?"Saving..." :"Save Progress"}
 </Button>
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 <FormField
 control={form.control}
 name="psychosocialGoals"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Goals</FormLabel>
 <FormControl>
 <Textarea {...field} placeholder="Enter psychosocial well-being and community belonging goals..." className="min-h-[100px]" />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 <ActionPlanSection control={form.control} baseName="psychosocialEntries" form={form} />
 </CardContent>
 </Card>

 {/* HEALTH AND DEVELOPMENT GOALS */}
 <Card className="border-t-4 border-t-blue-500">
 <CardHeader>
 <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
 <div>
 <CardTitle className="flex items-center gap-2 min-w-0">
 <Activity className="h-5 w-5 text-blue-600 shrink-0" />
 Goals for Health and Development (Basic Needs)
 {savedSections.has("Health") && (
 <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
 )}
 </CardTitle>
 <p className="text-sm text-muted-foreground mt-1">Including food, nutrition, hygiene, and sanitation</p>
 </div>
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={() => saveSection("Health")}
 disabled={savingSection ==="Health"}
 >
 <Save className="h-4 w-4 mr-2" />
 {savingSection ==="Health" ?"Saving..." :"Save Progress"}
 </Button>
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 <FormField
 control={form.control}
 name="healthGoals"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Goals</FormLabel>
 <FormControl>
 <Textarea {...field} placeholder="Enter health and development goals (food, nutrition, hygiene, sanitation)..." className="min-h-[100px]" />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 <ActionPlanSection control={form.control} baseName="healthEntries" form={form} />
 </CardContent>
 </Card>

 {/* CHILD-CAREGIVER RELATIONSHIP GOALS */}
 <Card className="border-t-4 border-t-orange-500">
 <CardHeader>
 <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
 <CardTitle className="flex items-center gap-2 min-w-0 truncate">
 <Users className="h-5 w-5 text-orange-600 shrink-0" />
 Goals for Child-Caregiver/Mentor Relationship and Attachment
 {savedSections.has("Relationship") && (
 <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
 )}
 </CardTitle>
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={() => saveSection("Relationship")}
 disabled={savingSection ==="Relationship"}
 >
 <Save className="h-4 w-4 mr-2" />
 {savingSection ==="Relationship" ?"Saving..." :"Save Progress"}
 </Button>
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 <FormField
 control={form.control}
 name="relationshipGoals"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Goals</FormLabel>
 <FormControl>
 <Textarea {...field} placeholder="Enter child-caregiver/mentor relationship and attachment goals..." className="min-h-[100px]" />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 <ActionPlanSection control={form.control} baseName="relationshipEntries" form={form} />
 </CardContent>
 </Card>

 {/* ECONOMIC STABILITY GOALS */}
 <Card className="border-t-4 border-t-yellow-500">
 <CardHeader>
 <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
 <CardTitle className="flex items-center gap-2 min-w-0 truncate">
 <DollarSign className="h-5 w-5 text-yellow-600 shrink-0" />
 Goals for Economic Stability
 {savedSections.has("Economic") && (
 <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
 )}
 </CardTitle>
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={() => saveSection("Economic")}
 disabled={savingSection ==="Economic"}
 >
 <Save className="h-4 w-4 mr-2" />
 {savingSection ==="Economic" ?"Saving..." :"Save Progress"}
 </Button>
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 <FormField
 control={form.control}
 name="economicGoals"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Goals</FormLabel>
 <FormControl>
 <Textarea {...field} placeholder="Enter economic stability goals..." className="min-h-[100px]" />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 <ActionPlanSection control={form.control} baseName="economicEntries" form={form} />
 </CardContent>
 </Card>

 {/* SIGNATURES */}
 <Card className="border-t-4 border-t-cyan-500">
 <CardHeader>
 <CardTitle>Signatures</CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <FormField
 control={form.control}
 name="caseworkerName"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Caseworker's Name</FormLabel>
 <FormControl>
 <Input {...field} placeholder="Full name" />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="caseworkerSignature"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Signature</FormLabel>
 <FormControl>
 <Input {...field} placeholder="Digital signature" />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="caseworkerDate"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Date</FormLabel>
 <FormControl>
 <Input type="date" {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <FormField
 control={form.control}
 name="caseManagerName"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Case Manager's Name</FormLabel>
 <FormControl>
 <Input {...field} placeholder="Full name" />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="caseManagerSignature"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Signature</FormLabel>
 <FormControl>
 <Input {...field} placeholder="Digital signature" />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="caseManagerDate"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Date</FormLabel>
 <FormControl>
 <Input type="date" {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 </div>
 </CardContent>
 </Card>

 <div className="flex justify-end gap-4 sticky bottom-4 bg-background/95 backdrop-blur p-4 rounded-lg border">
 <Button type="button" variant="outline" onClick={() => navigate("/case-plans")}>
 Cancel
 </Button>
 <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" disabled={loading}>
 <Save className="h-4 w-4 mr-2" />
 Save Case Plan
 </Button>
 </div>
 </form>
 </Form>
 </div>
 </div>
 );
};

export default AddCasePlan;
