import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User, Calendar, GraduationCap, MapPin, Clock, Save, ArrowLeft, ClipboardList
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

const admissionSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().optional(),
  gender: z.string().min(1, "Gender is required"),
  intakeNumber: z.string().min(1, "Client/Intake ID is required"),
  admissionDate: z.string().optional(),
  clientStatus: z.string().min(1, "Status is required"),
  educationLevel: z.string().optional(),
  schoolName: z.string().optional(),
  basePartnerLocation: z.string().optional(),
  durationOnStreet: z.string().optional(),
  policeOBNumber: z.string().optional(),
  parentOrGuardian: z.string().optional(),
  reasonForStreet: z.string().optional(),
  nickname: z.string().optional(),
  homeLocation: z.string().optional(),
});

type AdmissionFormValues = z.infer<typeof admissionSchema>;

const EDUCATION_LEVELS = [
  "None",
  "Pre-Primary",
  "Primary (Class 1-3)",
  "Primary (Class 4-6)",
  "Primary (Class 7-8)",
  "Junior Secondary (Grade 7-9)",
  "Secondary (Form 1-2)",
  "Secondary (Form 3-4)",
  "Post-Secondary / College",
  "University",
  "Vocational Training",
];

const STREET_DURATIONS = [
  "Less than 1 month",
  "1 - 3 months",
  "3 - 6 months",
  "6 - 12 months",
  "1 - 2 years",
  "2 - 3 years",
  "3 - 5 years",
  "Over 5 years",
  "Unknown",
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
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      intakeNumber: "",
      admissionDate: new Date().toISOString().split("T")[0],
      clientStatus: "Active",
      educationLevel: "",
      schoolName: "",
      basePartnerLocation: "",
      durationOnStreet: "",
      policeOBNumber: "",
      parentOrGuardian: "",
      reasonForStreet: "",
      nickname: "",
      homeLocation: "",
    },
  });

  const watchedDOB = form.watch("dateOfBirth");
  const calculatedAge = watchedDOB ? calculateAge(watchedDOB) : "";

  const onSubmit = async (values: AdmissionFormValues) => {
    if (!isAllowed) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to admit clients.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const clientData = {
        name: `${values.firstName} ${values.lastName}`,
        nickname: values.nickname || null,
        address: values.homeLocation || null,
        profile_picture: profilePreview || null,
        client_id: values.intakeNumber,
        intake_number: values.intakeNumber,
        date_of_birth: values.dateOfBirth || null,
        age: parseInt(calculatedAge || "0"),
        gender: values.gender,
        admission_date: values.admissionDate || null,
        status: values.clientStatus,
        education_level: values.educationLevel || null,
        school_name: values.schoolName || null,
        police_ob_number: values.policeOBNumber || null,
        street_name: values.basePartnerLocation || null,
        street_duration: values.durationOnStreet || null,
        guardian_name: values.parentOrGuardian || null,
        notes: JSON.stringify({ assessmentData: { reasonForStreet: values.reasonForStreet || "" } }),
      };

      const { data, error } = await supabase
        .from("clients")
        .insert([clientData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Admission Successful",
        description: `${values.firstName} ${values.lastName} has been admitted successfully.`,
      });

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
      <div className="sticky top-14 z-10 bg-gradient-to-r from-emerald-600 to-teal-600 h-24 flex flex-col items-center justify-center px-4 shadow-md">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative flex items-center gap-3">
          <ClipboardList className="h-7 w-7 text-white" />
          <h1 className="text-2xl font-bold text-white">Admission Form</h1>
        </div>
        <p className="relative text-emerald-100 text-sm mt-1">Quick client intake &amp; admission</p>
      </div>

      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/clients")}
          className="text-muted-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
        </Button>

        {!isAllowed && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
            You do not have permission to submit admission forms. Please contact an administrator.
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-emerald-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name / Surname *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> Date of Birth
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>Age (auto-calculated)</FormLabel>
                    <Input
                      value={calculatedAge}
                      readOnly
                      className="bg-muted cursor-default"
                      placeholder="Auto-calculated"
                    />
                  </FormItem>
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="parentOrGuardian"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent or Guardian Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter parent/guardian name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nickname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nickname (a.k.a)</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional nickname" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="homeLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Location (Address)</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g. Kibera, Nairobi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-1 lg:col-span-3">
                    <FormItem>
                      <FormLabel>Profile Picture</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          {profilePreview && (
                            <img src={profilePreview} alt="Preview" className="h-16 w-16 rounded-full object-cover border shadow-sm" />
                          )}
                          <Input type="file" accept="image/*" onChange={handleFileChange} className="w-full md:w-auto" />
                        </div>
                      </FormControl>
                    </FormItem>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClipboardList className="h-5 w-5 text-emerald-600" />
                  Admission Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="intakeNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client / Intake ID *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. NLMRC-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="admissionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Admission</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="policeOBNumber"
                  render={({ field }) => (
                    <FormItem className="max-w-xs">
                      <FormLabel>Police OB Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="h-5 w-5 text-emerald-600" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="educationLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Education Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EDUCATION_LEVELS.map((lvl) => (
                              <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="schoolName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last School Attended</FormLabel>
                        <FormControl>
                          <Input placeholder="School name (if any)" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  Street / Base Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="basePartnerLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          Base / Partner Name or Location
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Nairobi CBD, Partner XYZ" {...field} />
                        </FormControl>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          The street base or partner organisation/location where the child was found or referred from.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="durationOnStreet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          Duration on Street
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STREET_DURATIONS.map((d) => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Approximate time the child has been living or working on the street.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reasonForStreet"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Reason for going to street</FormLabel>
                        <FormControl>
                          <Input placeholder="Briefly describe the reason..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pb-10">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/clients")}
                disabled={loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !isAllowed}
                className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[160px]"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Saving..." : "Submit Admission"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AdmissionForm;
