import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User, Calendar, GraduationCap, MapPin, Clock, Save, ArrowLeft, ClipboardList, Users, Home, ShieldCheck, Plus, Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const admissionSchema = z.object({
  // Client's Info
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  nickname: z.string().optional(),
  dateOfBirth: z.string().optional(),
  placeOfBirth: z.string().optional(),
  healthCondition: z.string().optional(),
  religion: z.string().optional(),
  ethnicCommunity: z.string().optional(),
  hobbies: z.string().optional(),
  gender: z.string().min(1, "Gender is required"),
  
  // Entry Info
  intakeNumber: z.string().min(1, "Client/Intake ID is required"),
  admissionDate: z.string().optional(),
  typeOfEntry: z.string().optional(),
  policeOBNumber: z.string().optional(),
  drugsAbused: z.string().optional(),
  clientStatus: z.string().min(1, "Status is required"),

  // Child's Home/Rural
  homeCounty: z.string().optional(),
  homeSubCounty: z.string().optional(),
  homeLocation: z.string().optional(),
  homeSubLocation: z.string().optional(),
  homeVillage: z.string().optional(),
  homeAddress: z.string().optional(),

  // Current/Last Residential
  basePartnerLocation: z.string().optional(),
  placeBeforeStreet: z.string().optional(),
  reasonForStreet: z.string().optional(),
  durationOnStreet: z.string().optional(),

  // Siblings
  siblings: z.array(z.object({
    name: z.string().optional(),
    sex: z.string().optional(),
    age: z.string().optional(),
    schoolStatus: z.string().optional()
  })).optional(),

  // Education
  schoolName: z.string().optional(),
  schoolLocation: z.string().optional(),
  typeOfSchool: z.string().optional(),
  likedSchool: z.string().optional(),
  favoriteSubject: z.string().optional(),
  classForm: z.string().optional(),
  skillPrior: z.string().optional(),
  interestBackToSchool: z.string().optional(),
  educationLevel: z.string().optional(),

  // Parents Marital Status
  parentsMaritalStatus: z.string().optional(),

  // Father
  fatherType: z.string().optional(),
  fatherName: z.string().optional(),
  fatherEthnicCommunity: z.string().optional(),
  fatherReligion: z.string().optional(),
  fatherOccupation: z.string().optional(),
  fatherDeceased: z.string().optional(),
  fatherCounty: z.string().optional(),
  fatherSubCounty: z.string().optional(),
  fatherVillage: z.string().optional(),
  fatherMobile: z.string().optional(),
  fatherAddress: z.string().optional(),

  // Mother
  motherType: z.string().optional(),
  motherName: z.string().optional(),
  motherEthnicCommunity: z.string().optional(),
  motherReligion: z.string().optional(),
  motherOccupation: z.string().optional(),
  motherDeceased: z.string().optional(),
  motherCounty: z.string().optional(),
  motherSubCounty: z.string().optional(),
  motherVillage: z.string().optional(),
  motherMobile: z.string().optional(),
  motherAddress: z.string().optional(),

  // Guardian
  guardianType: z.string().optional(),
  guardianTypeOther: z.string().optional(),
  guardianName: z.string().optional(),
  guardianEthnicCommunity: z.string().optional(),
  guardianRelation: z.string().optional(),
  guardianCounty: z.string().optional(),
  guardianSubCounty: z.string().optional(),
  guardianVillage: z.string().optional(),
  guardianMobile: z.string().optional(),
  guardianAddress: z.string().optional(),

  // Official Signatures
  socialWorkerName: z.string().optional(),
  socialWorkerDate: z.string().optional(),
  headOfRehabName: z.string().optional(),
  headOfRehabDate: z.string().optional(),
  directorName: z.string().optional(),
  directorDate: z.string().optional(),
});

type AdmissionFormValues = z.infer<typeof admissionSchema>;

const EDUCATION_LEVELS = [
  "None", "Pre-Primary", "Primary (Class 1-3)", "Primary (Class 4-6)", "Primary (Class 7-8)",
  "Junior Secondary (Grade 7-9)", "Secondary (Form 1-2)", "Secondary (Form 3-4)", 
  "Post-Secondary / College", "University", "Vocational Training",
];

const STREET_DURATIONS = [
  "Less than 1 month", "1 - 3 months", "3 - 6 months", "6 - 12 months", 
  "1 - 2 years", "2 - 3 years", "3 - 5 years", "Over 5 years", "Unknown",
];

const AdmissionForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  const isAllowed = ["admin", "social_work", "education", "counselling", "empowerment"].includes(
    user?.role || ""
  );

  const calculateAge = (dob: string) => {
    if (!dob) return "";
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
    )
      age--;
    return age.toString();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const form = useForm<AdmissionFormValues>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      firstName: "", lastName: "", nickname: "", dateOfBirth: "", placeOfBirth: "",
      healthCondition: "", religion: "", ethnicCommunity: "", hobbies: "", gender: "",
      intakeNumber: "", admissionDate: new Date().toISOString().split("T")[0],
      typeOfEntry: "", policeOBNumber: "", drugsAbused: "", clientStatus: "Active",
      homeCounty: "", homeSubCounty: "", homeLocation: "", homeSubLocation: "", homeVillage: "", homeAddress: "",
      basePartnerLocation: "", placeBeforeStreet: "", reasonForStreet: "", durationOnStreet: "",
      siblings: [],
      schoolName: "", schoolLocation: "", typeOfSchool: "", likedSchool: "", favoriteSubject: "", classForm: "", skillPrior: "", interestBackToSchool: "", educationLevel: "",
      parentsMaritalStatus: "",
      fatherType: "", fatherName: "", fatherEthnicCommunity: "", fatherReligion: "", fatherOccupation: "", fatherDeceased: "", fatherCounty: "", fatherSubCounty: "", fatherVillage: "", fatherMobile: "", fatherAddress: "",
      motherType: "", motherName: "", motherEthnicCommunity: "", motherReligion: "", motherOccupation: "", motherDeceased: "", motherCounty: "", motherSubCounty: "", motherVillage: "", motherMobile: "", motherAddress: "",
      guardianType: "", guardianTypeOther: "", guardianName: "", guardianEthnicCommunity: "", guardianRelation: "", guardianCounty: "", guardianSubCounty: "", guardianVillage: "", guardianMobile: "", guardianAddress: "",
      socialWorkerName: "", socialWorkerDate: "", headOfRehabName: "", headOfRehabDate: "", directorName: "", directorDate: "",
    },
  });

  const { fields: siblingFields, append: appendSibling, remove: removeSibling } = useFieldArray({
    control: form.control,
    name: "siblings"
  });

  const watchedDOB = form.watch("dateOfBirth");
  const calculatedAge = watchedDOB ? calculateAge(watchedDOB) : "";

  const onSubmit = async (values: AdmissionFormValues) => {
    if (!isAllowed) {
      toast({ title: "Permission Denied", description: "You do not have permission to admit clients.", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);

      const notesPayload = {
        placeOfBirth: values.placeOfBirth,
        healthCondition: values.healthCondition,
        religion: values.religion,
        ethnicCommunity: values.ethnicCommunity,
        hobbies: values.hobbies,
        drugsAbused: values.drugsAbused,
        homeDetails: {
          county: values.homeCounty, subCounty: values.homeSubCounty, location: values.homeLocation,
          subLocation: values.homeSubLocation, village: values.homeVillage, address: values.homeAddress
        },
        residentialDetails: {
          placeBeforeStreet: values.placeBeforeStreet, reasonForStreet: values.reasonForStreet
        },
        schoolInfo: {
          typeOfSchool: values.typeOfSchool, likedSchool: values.likedSchool,
          favoriteSubject: values.favoriteSubject, classForm: values.classForm,
          skillPrior: values.skillPrior, interestBackToSchool: values.interestBackToSchool,
          schoolLocation: values.schoolLocation
        },
        parentsMaritalStatus: values.parentsMaritalStatus,
        fatherDetails: {
          type: values.fatherType, ethnicCommunity: values.fatherEthnicCommunity,
          religion: values.fatherReligion, deceased: values.fatherDeceased,
          county: values.fatherCounty, subCounty: values.fatherSubCounty, village: values.fatherVillage, address: values.fatherAddress
        },
        motherDetails: {
          type: values.motherType, ethnicCommunity: values.motherEthnicCommunity,
          religion: values.motherReligion, deceased: values.motherDeceased,
          county: values.motherCounty, subCounty: values.motherSubCounty, village: values.motherVillage, address: values.motherAddress
        },
        guardianDetails: {
          type: values.guardianType, typeOther: values.guardianTypeOther, ethnicCommunity: values.guardianEthnicCommunity,
          relation: values.guardianRelation, county: values.guardianCounty, subCounty: values.guardianSubCounty,
          village: values.guardianVillage, address: values.guardianAddress
        },
        officialSignatures: {
          socialWorker: { name: values.socialWorkerName, date: values.socialWorkerDate },
          headOfRehab: { name: values.headOfRehabName, date: values.headOfRehabDate },
          director: { name: values.directorName, date: values.directorDate }
        }
      };

      const clientData = {
        name: `${values.firstName} ${values.lastName}`,
        nickname: values.nickname || null,
        address: values.homeAddress || null,
        profile_picture: profilePreview || null,
        client_id: values.intakeNumber,
        intake_number: values.intakeNumber,
        date_of_birth: values.dateOfBirth || null,
        age: parseInt(calculatedAge || "0"),
        gender: values.gender,
        admission_date: values.admissionDate || null,
        admission_type: values.typeOfEntry || null,
        status: values.clientStatus,
        education_level: values.educationLevel || null,
        level_reached: values.classForm || null,
        education_status: values.interestBackToSchool || null,
        school_name: values.schoolName || null,
        police_ob_number: values.policeOBNumber || null,
        street_name: values.basePartnerLocation || null,
        street_duration: values.durationOnStreet || null,
        family_composition: values.parentsMaritalStatus || null,
        
        // Relatives
        father_name: values.fatherName || null,
        father_occupation: values.fatherOccupation || null,
        father_contact: values.fatherMobile || null,
        father_status: values.fatherDeceased === "Yes" ? "Deceased" : (values.fatherDeceased === "No" ? "Alive" : null),
        father_location: [values.fatherVillage, values.fatherSubCounty, values.fatherCounty].filter(Boolean).join(", ") || null,
        
        mother_name: values.motherName || null,
        mother_occupation: values.motherOccupation || null,
        mother_contact: values.motherMobile || null,
        mother_status: values.motherDeceased === "Yes" ? "Deceased" : (values.motherDeceased === "No" ? "Alive" : null),
        mother_location: [values.motherVillage, values.motherSubCounty, values.motherCounty].filter(Boolean).join(", ") || null,
        
        guardian_name: values.guardianName || null,
        guardian_contact: values.guardianMobile || null,
        guardian_status: values.guardianRelation || null,
        guardian_location: [values.guardianVillage, values.guardianSubCounty, values.guardianCounty].filter(Boolean).join(", ") || null,
        
        siblings_info: values.siblings?.length ? JSON.stringify(values.siblings) : null,
        notes: JSON.stringify(notesPayload),
      };

      const { data, error } = await supabase.from("clients").insert([clientData]).select().single();
      if (error) throw error;

      toast({ title: "Admission Successful", description: `${values.firstName} ${values.lastName} has been admitted.` });
      
      if (data?.id && ["admin", "social_work"].includes(user?.role || "")) {
        navigate(`/register?clientId=${data.id}&mode=edit`);
      } else {
        navigate("/clients");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="sticky top-14 z-10 bg-gradient-to-r from-emerald-600 to-teal-600 h-16 flex flex-row items-center justify-between px-4 sm:px-6 shadow-md">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-white" />
          <h1 className="text-lg font-bold text-white">Client Admission</h1>
        </div>
        <div className="relative text-emerald-100 text-xs font-medium hidden sm:block">CASE HISTORY (FORM A1)</div>
      </div>

      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/clients")} className="text-muted-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
        </Button>

        {!isAllowed && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
            You do not have permission to submit admission forms.
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-12">
            
            <div className="space-y-12">
              {/* SECTION 1: CLIENT & ENTRY INFO */}
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" /> Client's Information</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-col-reverse md:flex-row gap-6">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField control={form.control} name="firstName" render={({ field }) => (
                          <FormItem><FormLabel>First Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="lastName" render={({ field }) => (
                          <FormItem><FormLabel>Last Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="nickname" render={({ field }) => (
                          <FormItem><FormLabel>Nick name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        
                        <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                          <FormItem><FormLabel>Date of birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormItem><FormLabel>Age</FormLabel><Input value={calculatedAge} readOnly className="bg-muted" /></FormItem>
                        <FormField control={form.control} name="gender" render={({ field }) => (
                          <FormItem><FormLabel>Gender *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                              </SelectContent>
                            </Select><FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="placeOfBirth" render={({ field }) => (
                          <FormItem><FormLabel>Place of birth</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="healthCondition" render={({ field }) => (
                          <FormItem><FormLabel>Health Condition</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="religion" render={({ field }) => (
                          <FormItem><FormLabel>Religion</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        <FormField control={form.control} name="ethnicCommunity" render={({ field }) => (
                          <FormItem><FormLabel>Ethnic Community</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="hobbies" render={({ field }) => (
                          <FormItem className="lg:col-span-2"><FormLabel>Hobbies</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>

                      <div className="flex flex-col items-center md:items-end gap-3 md:w-56 shrink-0">
                        <FormLabel className="text-center md:text-right font-medium">Affix a color PP size photo</FormLabel>
                        {profilePreview ? (
                          <img src={profilePreview} alt="Preview" className="h-32 w-32 rounded-md object-cover border shadow-sm" />
                        ) : (
                          <div className="h-32 w-32 rounded-md bg-muted border flex items-center justify-center text-muted-foreground text-xs text-center p-2">No Photo</div>
                        )}
                        <Input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-xs" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-lg">Entry Information</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="intakeNumber" render={({ field }) => (
                      <FormItem><FormLabel>Intake/OB Number (Client ID) *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="admissionDate" render={({ field }) => (
                      <FormItem><FormLabel>Date of entry</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    
                    <FormField control={form.control} name="typeOfEntry" render={({ field }) => (
                      <FormItem className="md:col-span-2"><FormLabel>Type of entry</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Referred (Social Worker/Staff)">Referred (Social Worker/Staff)</SelectItem>
                            <SelectItem value="Came at will">Came at will</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={form.control} name="policeOBNumber" render={({ field }) => (
                      <FormItem><FormLabel>Police OB Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="drugsAbused" render={({ field }) => (
                      <FormItem><FormLabel>Drugs Client Has Abused</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </CardContent>
                </Card>
              </div>

              {/* SECTION 2: LOCATION */}
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5" /> Child's Home / Rural Particulars</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField control={form.control} name="homeCounty" render={({ field }) => (<FormItem><FormLabel>County</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="homeSubCounty" render={({ field }) => (<FormItem><FormLabel>Sub-County</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="homeLocation" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="homeSubLocation" render={({ field }) => (<FormItem><FormLabel>Sub-location</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="homeVillage" render={({ field }) => (<FormItem><FormLabel>Village</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="homeAddress" render={({ field }) => (<FormItem><FormLabel>Address/Landmark</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader><CardTitle className="text-lg">Current or Last Residential Place</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="basePartnerLocation" render={({ field }) => (<FormItem><FormLabel>Name of place of residence (base)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="placeBeforeStreet" render={({ field }) => (<FormItem><FormLabel>Place living before street</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="reasonForStreet" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Reason for running to street</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="durationOnStreet" render={({ field }) => (
                      <FormItem><FormLabel>Period of stay at base/streets</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {STREET_DURATIONS.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>
              </div>

              {/* SECTION 3: FAMILY SIBLINGS */}
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" /> Siblings</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {siblingFields.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border p-3 rounded-md bg-muted/30">
                        <div className="md:col-span-3">
                          <FormField control={form.control} name={`siblings.${index}.name`} render={({ field }) => (
                            <FormItem><FormLabel className="text-xs">Name</FormLabel><FormControl><Input size={1} {...field} /></FormControl></FormItem>
                          )} />
                        </div>
                        <div className="md:col-span-2">
                          <FormField control={form.control} name={`siblings.${index}.sex`} render={({ field }) => (
                            <FormItem><FormLabel className="text-xs">Sex</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Sex" /></SelectTrigger></FormControl>
                                <SelectContent><SelectItem value="M">Male</SelectItem><SelectItem value="F">Female</SelectItem></SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                        </div>
                        <div className="md:col-span-2">
                          <FormField control={form.control} name={`siblings.${index}.age`} render={({ field }) => (
                            <FormItem><FormLabel className="text-xs">Age</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                          )} />
                        </div>
                        <div className="md:col-span-4">
                          <FormField control={form.control} name={`siblings.${index}.schoolStatus`} render={({ field }) => (
                            <FormItem><FormLabel className="text-xs">School/Status</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                          )} />
                        </div>
                        <div className="md:col-span-1 flex justify-end">
                          <Button type="button" variant="destructive" size="icon" onClick={() => removeSibling(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => appendSibling({ name: "", sex: "", age: "", schoolStatus: "" })} className="w-full mt-2">
                      <Plus className="h-4 w-4 mr-2" /> Add Sibling
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* SECTION 4: EDUCATION */}
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><GraduationCap className="h-5 w-5" /> School Information</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="typeOfSchool" render={({ field }) => (
                      <FormItem><FormLabel>Type of school</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Day">Day</SelectItem><SelectItem value="Boarding">Boarding</SelectItem><SelectItem value="Special School">Special School</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />

                    {form.watch("typeOfSchool") && (
                      <>
                        <FormField control={form.control} name="schoolName" render={({ field }) => (<FormItem><FormLabel>Name of school(s) attended before</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="schoolLocation" render={({ field }) => (<FormItem><FormLabel>School Location</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="educationLevel" render={({ field }) => (
                          <FormItem><FormLabel>Overall Level Reached</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {EDUCATION_LEVELS.map(lvl => <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                      </>
                    )}
                    
                    <FormField control={form.control} name="likedSchool" render={({ field }) => (
                      <FormItem><FormLabel>Did you like school?</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="favoriteSubject" render={({ field }) => (<FormItem><FormLabel>If yes, favorite subject?</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    
                    <FormField control={form.control} name="classForm" render={({ field }) => (<FormItem><FormLabel>Class/Form</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    
                    <FormField control={form.control} name="skillPrior" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Any skill the client has prior to intake?</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="interestBackToSchool" render={({ field }) => (
                      <FormItem><FormLabel>Interest to go back to school/course after rehab?</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>
              </div>

              {/* SECTION 5: PARENTS & GUARDIANS */}
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Home className="h-5 w-5" /> Parents' Marital Status</CardTitle></CardHeader>
                  <CardContent>
                    <FormField control={form.control} name="parentsMaritalStatus" render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select Marital Status" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Married & Living together">Married &amp; Living together</SelectItem>
                            <SelectItem value="Married & Separated">Married &amp; Separated</SelectItem>
                            <SelectItem value="Single Parent">Single Parent</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* FATHER */}
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Father's Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <FormField control={form.control} name="fatherType" render={({ field }) => (
                        <FormItem><FormLabel>Specify Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="Biological">Biological</SelectItem><SelectItem value="Adoptive">Adoptive</SelectItem>
                              <SelectItem value="Foster">Foster</SelectItem><SelectItem value="Step">Step</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="fatherName" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="fatherEthnicCommunity" render={({ field }) => (<FormItem><FormLabel>Ethnic Community</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="fatherReligion" render={({ field }) => (<FormItem><FormLabel>Religion</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      </div>
                      <FormField control={form.control} name="fatherOccupation" render={({ field }) => (<FormItem><FormLabel>Occupation</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="fatherDeceased" render={({ field }) => (
                        <FormItem><FormLabel>Deceased?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="fatherCounty" render={({ field }) => (<FormItem><FormLabel>County</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="fatherSubCounty" render={({ field }) => (<FormItem><FormLabel>Sub-county</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      </div>
                      <FormField control={form.control} name="fatherVillage" render={({ field }) => (<FormItem><FormLabel>Town/Village</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="fatherMobile" render={({ field }) => (<FormItem><FormLabel>Mobile No</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="fatherAddress" render={({ field }) => (<FormItem><FormLabel>Address/Landmark</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </CardContent>
                  </Card>

                  {/* MOTHER */}
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Mother's Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <FormField control={form.control} name="motherType" render={({ field }) => (
                        <FormItem><FormLabel>Specify Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="Biological">Biological</SelectItem><SelectItem value="Adoptive">Adoptive</SelectItem>
                              <SelectItem value="Foster">Foster</SelectItem><SelectItem value="Step">Step</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="motherName" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="motherEthnicCommunity" render={({ field }) => (<FormItem><FormLabel>Ethnic Community</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="motherReligion" render={({ field }) => (<FormItem><FormLabel>Religion</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      </div>
                      <FormField control={form.control} name="motherOccupation" render={({ field }) => (<FormItem><FormLabel>Occupation</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="motherDeceased" render={({ field }) => (
                        <FormItem><FormLabel>Deceased?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="motherCounty" render={({ field }) => (<FormItem><FormLabel>County</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="motherSubCounty" render={({ field }) => (<FormItem><FormLabel>Sub-county</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      </div>
                      <FormField control={form.control} name="motherVillage" render={({ field }) => (<FormItem><FormLabel>Town/Village</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="motherMobile" render={({ field }) => (<FormItem><FormLabel>Mobile No</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="motherAddress" render={({ field }) => (<FormItem><FormLabel>Address/Landmark</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader><CardTitle className="text-lg">Guardian / Caregiver / Next of Kin</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField control={form.control} name="guardianType" render={({ field }) => (
                      <FormItem><FormLabel>Specify Relation</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Grandparent">Grandparent</SelectItem><SelectItem value="Aunt">Aunt</SelectItem>
                            <SelectItem value="Uncle">Uncle</SelectItem><SelectItem value="Cousin">Cousin</SelectItem>
                            <SelectItem value="Sister">Sister</SelectItem><SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="guardianTypeOther" render={({ field }) => (<FormItem><FormLabel>If other, specify</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="guardianName" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="guardianEthnicCommunity" render={({ field }) => (<FormItem><FormLabel>Ethnic Community</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="guardianRelation" render={({ field }) => (<FormItem><FormLabel>Relationship to Client</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="guardianCounty" render={({ field }) => (<FormItem><FormLabel>County</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="guardianSubCounty" render={({ field }) => (<FormItem><FormLabel>Sub-county</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="guardianVillage" render={({ field }) => (<FormItem><FormLabel>Town/Village</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="guardianMobile" render={({ field }) => (<FormItem><FormLabel>Mobile No</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="guardianAddress" render={({ field }) => (<FormItem className="md:col-span-3"><FormLabel>Address/Landmark</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                  </CardContent>
                </Card>
              </div>

              {/* SECTION 6: OFFICIAL USE ONLY */}
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> For Official Use Only</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
                      <FormField control={form.control} name="socialWorkerName" render={({ field }) => (<FormItem><FormLabel>Social Worker Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="socialWorkerDate" render={({ field }) => (<FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
                      <FormField control={form.control} name="headOfRehabName" render={({ field }) => (<FormItem><FormLabel>Head of Rehab Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="headOfRehabDate" render={({ field }) => (<FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                      <FormField control={form.control} name="directorName" render={({ field }) => (<FormItem><FormLabel>Director Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="directorDate" render={({ field }) => (<FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                    </div>
                    <div className="bg-muted p-4 rounded-md text-sm text-muted-foreground">
                      <strong>NB:</strong> A Social Worker may do a narrative case summary of one page to back up this information.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pb-10 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate("/clients")} disabled={loading}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button type="submit" disabled={loading || !isAllowed} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[160px]">
                <Save className="mr-2 h-4 w-4" /> {loading ? "Saving..." : "Submit Admission"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AdmissionForm;
