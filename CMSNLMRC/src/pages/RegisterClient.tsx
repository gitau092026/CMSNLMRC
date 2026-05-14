import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User,
  Calendar,
  Cake,
  Users,
  Hash,
  Shield,
  UserCircle,
  UserCircle2,
  GraduationCap,
  Camera,
  FileText,
  LifeBuoy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  secondName: z.string().min(1, "Second name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  calculatedAge: z.string().optional(),
  gender: z.string().min(1, "Gender is required"),
  nickname: z.string().optional(),
  admissionType: z.string().min(1, "Admission type is required"),
  admissionTypeDetails: z.string().optional(),
  streetName: z.string().optional(),
  streetDuration: z.string().optional(),
  partnerName: z.string().optional(),
  partnerContactPerson: z.string().optional(),
  partnerContact: z.string().optional(),
  admissionDate: z.string().min(1, "Admission date is required"),
  intakeNumber: z.string().min(1, "Intake number is required"),
  policeOBNumber: z.string().optional(),
  clientStatus: z.string().min(1, "Client status is required"),
  familyComposition: z.string().optional(),
  siblingsInfo: z.string().optional(),
  motherStatus: z.string().optional(),
  motherName: z.string().optional(),
  motherLocation: z.string().optional(),
  motherContact: z.string().optional(),
  motherOccupation: z.string().optional(),
  fatherStatus: z.string().optional(),
  fatherName: z.string().optional(),
  fatherLocation: z.string().optional(),
  fatherContact: z.string().optional(),
  fatherOccupation: z.string().optional(),
  guardianStatus: z.string().optional(),
  guardianName: z.string().optional(),
  guardianLocation: z.string().optional(),
  guardianContact: z.string().optional(),
  guardianOccupation: z.string().optional(),
  educationLevel: z.string().optional(),
  schoolName: z.string().optional(),
  levelReached: z.string().optional(),
  educationStatus: z.string().optional(),
  profilePicture: z.any().optional(),
  notes: z.string().optional(),
  rescueDetails: z.string().optional(),
});

const RegisterClient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');
  const mode = searchParams.get('mode');
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      secondName: "",
      dateOfBirth: "",
      calculatedAge: "",
      gender: "",
      nickname: "",
      admissionType: "",
      admissionTypeDetails: "",
      streetName: "",
      streetDuration: "",
      partnerName: "",
      partnerContactPerson: "",
      partnerContact: "",
      admissionDate: "",
      intakeNumber: "",
      policeOBNumber: "",
      clientStatus: "Active",
      familyComposition: "",
      siblingsInfo: "",
      motherStatus: "",
      motherName: "",
      motherLocation: "",
      motherContact: "",
      motherOccupation: "",
      fatherStatus: "",
      fatherName: "",
      fatherLocation: "",
      fatherContact: "",
      fatherOccupation: "",
      guardianStatus: "",
      guardianName: "",
      guardianLocation: "",
      guardianContact: "",
      guardianOccupation: "",
      educationLevel: "",
      schoolName: "",
      levelReached: "",
      educationStatus: "",
      notes: "",
      rescueDetails: "",
    },
  });

  useEffect(() => {
    if (clientId) {
      fetchClientData();
    }
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;

      if (data) {
        form.reset({
          firstName: data.name?.split(' ')[0] || "",
          secondName: data.name?.split(' ').slice(1).join(' ') || "",
          dateOfBirth: data.date_of_birth || "",
          calculatedAge: data.age?.toString() || "",
          gender: data.gender || "",
          nickname: data.nickname || "",
          admissionType: data.admission_type || "",
          admissionTypeDetails: data.admission_type_details || "",
          streetName: data.street_name || "",
          streetDuration: data.street_duration || "",
          partnerName: data.partner_name || "",
          partnerContactPerson: data.partner_contact_person || "",
          partnerContact: data.partner_contact || "",
          admissionDate: data.admission_date || "",
          intakeNumber: data.intake_number || data.client_id || "",
          policeOBNumber: data.police_ob_number || "",
          clientStatus: data.status || "Active",
          familyComposition: data.family_composition || "",
          siblingsInfo: data.siblings_info || "",
          motherStatus: data.mother_status || "",
          motherName: data.mother_name || "",
          motherLocation: data.mother_location || "",
          motherContact: data.mother_contact || "",
          motherOccupation: data.mother_occupation || "",
          fatherStatus: data.father_status || "",
          fatherName: data.father_name || "",
          fatherLocation: data.father_location || "",
          fatherContact: data.father_contact || "",
          fatherOccupation: data.father_occupation || "",
          guardianStatus: data.guardian_status || "",
          guardianName: data.guardian_name || "",
          guardianLocation: data.guardian_location || "",
          guardianContact: data.guardian_contact || "",
          guardianOccupation: data.guardian_occupation || "",
          educationLevel: data.education_level || "",
          schoolName: data.school_name || "",
          levelReached: data.level_reached || "",
          educationStatus: data.education_status || "",
          notes: data.notes || "",
          rescueDetails: data.rescue_details || "",
        });
      }
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

  const calculateAge = (dob: string) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      
      const clientData = {
        name: `${values.firstName} ${values.secondName}`,
        client_id: values.intakeNumber,
        age: parseInt(values.calculatedAge || "0"),
        gender: values.gender,
        date_of_birth: values.dateOfBirth || null,
        nickname: values.nickname || null,
        admission_type: values.admissionType || null,
        admission_type_details: values.admissionTypeDetails || null,
        street_name: values.streetName || null,
        street_duration: values.streetDuration || null,
        partner_name: values.partnerName || null,
        partner_contact_person: values.partnerContactPerson || null,
        partner_contact: values.partnerContact || null,
        admission_date: values.admissionDate,
        intake_number: values.intakeNumber || null,
        police_ob_number: values.policeOBNumber || null,
        status: values.clientStatus === 'Complete' ? 'Alumni - Awaiting Placement' : values.clientStatus,
        family_composition: values.familyComposition || null,
        siblings_info: values.siblingsInfo || null,
        mother_status: values.motherStatus || null,
        mother_name: values.motherName || null,
        mother_location: values.motherLocation || null,
        mother_contact: values.motherContact || null,
        mother_occupation: values.motherOccupation || null,
        father_status: values.fatherStatus || null,
        father_name: values.fatherName || null,
        father_location: values.fatherLocation || null,
        father_contact: values.fatherContact || null,
        father_occupation: values.fatherOccupation || null,
        guardian_status: values.guardianStatus || null,
        guardian_name: values.guardianName || null,
        guardian_location: values.guardianLocation || null,
        guardian_contact: values.guardianContact || null,
        guardian_occupation: values.guardianOccupation || null,
        education_level: values.educationLevel || null,
        school_name: values.schoolName || null,
        level_reached: values.levelReached || null,
        education_status: values.educationStatus || null,
        rescue_details: values.rescueDetails || null,
        contact: values.motherContact || values.fatherContact || values.guardianContact || "",
        address: values.motherLocation || values.fatherLocation || values.guardianLocation || "",
        notes: values.notes || ""
      };

      if (clientId && mode === 'edit') {
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', clientId);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Client updated successfully!"
        });
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([clientData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Client registered successfully!"
        });
      }

      navigate("/clients");
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 h-24 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <h1 className="relative text-2xl sm:text-3xl font-bold text-white">Register New Client</h1>
        <p className="relative text-white/90 text-sm">Add New Client</p>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card className="relative overflow-hidden border-border">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-card-accent-primary" />
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Essential client details and personal information
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          First Name *
                        </FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="secondName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          Second Name *
                        </FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-success" />
                          Date of Birth *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              form.setValue("calculatedAge", calculateAge(e.target.value));
                            }}
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="calculatedAge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Cake className="h-4 w-4 text-purple-600" />
                          Calculated Age
                        </FormLabel>
                        <FormControl>
                          <Input {...field} readOnly className="bg-muted" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <UserCircle className="h-4 w-4" />
                          Gender *
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover border-border z-50">
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nickname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <span className="text-primary">🏷️</span>
                          Nickname
                        </FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="admissionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <span className="text-purple-600">🔐</span>
                          Admission Type *
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select admission type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover border-border z-50">
                            <SelectItem value="Street">Street</SelectItem>
                            <SelectItem value="Partner referral">Partner referral</SelectItem>
                            <SelectItem value="Court referral">Court referral</SelectItem>
                            <SelectItem value="Childrens officer referral">Children's officer referral</SelectItem>
                            <SelectItem value="Family">Family</SelectItem>
                            <SelectItem value="Others">Others</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="admissionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-success" />
                          Admission Date *
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("admissionType") === "Street" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="streetName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              Street Name/Base
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter street name or base location"
                                className="bg-background"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="streetDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-success" />
                              Duration Stayed on Street
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g., 2 years, 6 months"
                                className="bg-background"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {form.watch("admissionType") === "Partner referral" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="partnerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <UserCircle2 className="h-4 w-4 text-primary" />
                              Partner Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter partner organization name"
                                className="bg-background"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="partnerContactPerson"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <User className="h-4 w-4 text-primary" />
                              Contact Person Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter contact person name"
                                className="bg-background"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="partnerContact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <span className="text-primary">📞</span>
                              Contact
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter phone or email"
                                className="bg-background"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {form.watch("admissionType") && !["Street", "Partner referral"].includes(form.watch("admissionType")) && (
                  <FormField
                    control={form.control}
                    name="admissionTypeDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          {form.watch("admissionType")} Details
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={`Provide more details about the ${form.watch("admissionType")} admission...`}
                            className="min-h-[100px] bg-background resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="intakeNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          Intake Number *
                        </FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="policeOBNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Police OB Number
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter Police OB Number" className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <span className="text-blue-600">●</span>
                          Client Status *
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Active" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover border-border z-50">
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Complete">Complete</SelectItem>
                            <SelectItem value="Escape">Escape</SelectItem>
                            <SelectItem value="Voluntary Discharge">Voluntary Discharge</SelectItem>
                            <SelectItem value="Early Reintegration">Early Reintegration</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Family Composition */}
            <Card className="relative overflow-hidden border-border">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-card-accent-primary" />
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Family Composition
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Family structure and composition details
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="familyComposition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Family Composition Details
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="min-h-[120px] bg-background resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="siblingsInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <span className="text-blue-600">👥</span>
                        Siblings Information
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter information about siblings"
                          className="min-h-[120px] bg-background resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Mother Information */}
            <Card className="relative overflow-hidden border-border">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-card-accent-primary" />
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <span className="text-xl">👩</span>
                    Mother Information
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Mother's details and contact information
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="motherStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <span className="text-pink-600">●</span>
                        Mother Status
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select mother status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border z-50">
                          <SelectItem value="Available">Available</SelectItem>
                          <SelectItem value="Deceased">Deceased</SelectItem>
                          <SelectItem value="Unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("motherStatus") === "Available" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="motherName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            Mother's Name
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter mother's name" className="bg-background" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="motherContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span className="text-success">📞</span>
                            Contact
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter phone number" className="bg-background" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="motherLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span className="text-blue-600">📍</span>
                            Location
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter location" className="bg-background" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="motherOccupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span className="text-purple-600">💼</span>
                            Occupation
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter occupation" className="bg-background" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Father Information */}
            <Card className="relative overflow-hidden border-border">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-card-accent-primary" />
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <span className="text-xl">👨</span>
                    Father Information
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Father's details and contact information
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="fatherStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <span className="text-blue-600">●</span>
                        Father Status
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select father status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border z-50">
                          <SelectItem value="Available">Available</SelectItem>
                          <SelectItem value="Deceased">Deceased</SelectItem>
                          <SelectItem value="Unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("fatherStatus") === "Available" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fatherName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            Father's Name
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter father's name" className="bg-background" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fatherContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span className="text-success">📞</span>
                            Contact
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter phone number" className="bg-background" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fatherLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span className="text-blue-600">📍</span>
                            Location
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter location" className="bg-background" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fatherOccupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span className="text-purple-600">💼</span>
                            Occupation
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter occupation" className="bg-background" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Guardian Information */}
            <Card className="relative overflow-hidden border-border">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-card-accent-primary" />
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <UserCircle2 className="h-5 w-5" />
                    Guardian Information
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Guardian's details (if different from parents)
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="guardianStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <span className="text-purple-600">●</span>
                        Guardian Status
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select guardian status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border z-50">
                          <SelectItem value="Available">Available</SelectItem>
                          <SelectItem value="Deceased">Deceased</SelectItem>
                          <SelectItem value="Unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("guardianStatus") === "Available" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="guardianName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            Guardian's Name
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter guardian's name" className="bg-background" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="guardianContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span className="text-success">📞</span>
                            Contact
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter phone number" className="bg-background" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="guardianLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span className="text-blue-600">📍</span>
                            Location
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter location" className="bg-background" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="guardianOccupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span className="text-purple-600">💼</span>
                            Occupation
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter occupation" className="bg-background" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card className="relative overflow-hidden border-border">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-card-accent-primary" />
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Additional Information
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Additional client details and background information
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="educationLevel"
                  render={({ field }) => (
                    <FormItem className="max-w-xs">
                      <FormLabel className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                        Education Level
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select education level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border z-50">
                          <SelectItem value="None">None</SelectItem>
                          <SelectItem value="Primary">Primary</SelectItem>
                          <SelectItem value="Secondary">Secondary</SelectItem>
                          <SelectItem value="Tertiary">Tertiary</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {["Primary", "Secondary", "Tertiary"].includes(form.watch("educationLevel")) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="schoolName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span className="text-primary">🏫</span>
                            School Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter school name"
                              className="bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="levelReached"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span className="text-success">📊</span>
                            Level Reached
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., Standard 5"
                              className="bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="educationStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span className="text-blue-600">●</span>
                            Status
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover border-border z-50">
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="Dropped out">Dropped out</SelectItem>
                              <SelectItem value="Suspended">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile Picture */}
            <Card className="relative overflow-hidden border-border">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-card-accent-primary" />
              <CardContent className="p-6 space-y-6">
                <FormField
                  control={form.control}
                  name="profilePicture"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Profile Picture
                      </FormLabel>
                      <FormControl>
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/30 hover:bg-muted/50 transition-colors">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif"
                            onChange={handleFileChange}
                            className="hidden"
                            id="profile-upload"
                          />
                          <label htmlFor="profile-upload" className="cursor-pointer">
                            {profilePreview ? (
                              <img
                                src={profilePreview}
                                alt="Profile preview"
                                className="mx-auto max-h-48 rounded-lg"
                              />
                            ) : (
                              <>
                                <span className="text-4xl text-muted-foreground mb-2 block">☁️</span>
                                <p className="text-foreground font-medium mb-1">
                                  Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Supports: JPG, PNG, GIF (Max 5MB)
                                </p>
                              </>
                            )}
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="relative overflow-hidden border-border">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-card-accent-primary" />
              <CardContent className="p-6 space-y-6">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Notes
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter any additional notes about the client (e.g., drug/substances abused, behavioral observations, medical history, etc.)"
                          className="min-h-[120px] bg-background resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Rescue Information */}
            <Card className="relative overflow-hidden border-border">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-card-accent-primary" />
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <LifeBuoy className="h-5 w-5" />
                    Rescue Information
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Details about the rescue operation and circumstances
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="rescueDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <span className="text-red-600">⚠️</span>
                        Rescue Details
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="min-h-[120px] bg-background resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="border-border">
              <CardContent className="p-6 flex justify-center gap-4">
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <span className="mr-2">📋</span>
                  Register Client
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/clients")}
                >
                  ✕ Cancel
                </Button>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default RegisterClient;
