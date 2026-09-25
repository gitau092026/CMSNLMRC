import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Save, ArrowLeft, ClipboardList, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { compressImage } from "@/utils/imageCompression";
import { setCachedClient } from "@/lib/clientCache";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const admissionSchema = z.object({
  // Client's Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional().default(""),
  nickname: z.string().optional(),
  dateOfBirth: z.string().optional(),
  placeOfBirth: z.string().optional(),
  healthCondition: z.string().optional(),
  religion: z.string().optional(),
  ethnicCommunity: z.string().optional(),
  hobbies: z.string().optional(),
  gender: z.string().min(1, "Gender is required"),

  // Entry Information
  intakeNumber: z.string().min(1, "Intake/OB Number (Client ID) is required"),
  admissionDate: z.string().optional(),
  typeOfEntry: z.string().optional(),
  policeOBNumber: z.string().optional(),
  drugsAbused: z.string().optional(),
  clientStatus: z.string().default("Active"),
});

type AdmissionFormValues = z.infer<typeof admissionSchema>;

const AdmissionForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("clientId");
  const isEditMode = searchParams.get("mode") === "edit" || Boolean(clientId);

  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingClient, setFetchingClient] = useState(Boolean(clientId));
  const [existingClient, setExistingClient] = useState<any>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isAllowed = [
    "admin",
    "social_work",
    "education",
    "counselling",
    "counsellor",
    "empowerment",
    "intern_social_work",
    "intern_counselling"
  ].includes(user?.role || "");

  const calculateAge = (dob: string) => {
    if (!dob) return "";
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return "";
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age >= 0 ? age.toString() : "";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { blob, dataUrl } = await compressImage(file, { maxWidth: 500, maxHeight: 500, quality: 0.85 });
        setProfilePreview(dataUrl);
        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" });
        setSelectedFile(compressedFile);
      } catch {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setProfilePreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const form = useForm<AdmissionFormValues>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      nickname: "",
      dateOfBirth: "",
      placeOfBirth: "",
      healthCondition: "",
      religion: "",
      ethnicCommunity: "",
      hobbies: "",
      gender: "",
      intakeNumber: "",
      admissionDate: new Date().toISOString().split("T")[0],
      typeOfEntry: "",
      policeOBNumber: "",
      drugsAbused: "",
      clientStatus: "Active",
    },
  });

  useEffect(() => {
    if (clientId) {
      const loadClient = async () => {
        try {
          setFetchingClient(true);
          const { data, error } = await supabase
            .from("clients")
            .select("*")
            .eq("id", clientId)
            .single();

          if (error) throw error;

          if (data) {
            setExistingClient(data);
            let notesObj: any = {};
            try {
              notesObj = typeof data.notes === "string" ? JSON.parse(data.notes) : (data.notes || {});
            } catch {
              notesObj = {};
            }
            const assessmentFields = notesObj.assessmentData || {};
            const parts = (data.name || "").trim().split(/\s+/);
            const firstName = parts[0] || "";
            const lastName = parts.slice(1).join(" ") || "";

            form.reset({
              firstName,
              lastName,
              nickname: data.nickname || "",
              dateOfBirth: data.date_of_birth || "",
              placeOfBirth: notesObj.placeOfBirth || assessmentFields.placeOfBirth || "",
              healthCondition: notesObj.healthCondition || assessmentFields.healthCondition || "",
              religion: notesObj.religion || assessmentFields.religion || "",
              ethnicCommunity: notesObj.ethnicCommunity || assessmentFields.ethnicCommunity || assessmentFields.ethnicity || "",
              hobbies: notesObj.hobbies || assessmentFields.hobbies || "",
              gender: data.gender || "",
              intakeNumber: data.intake_number || data.client_id || "",
              admissionDate: data.admission_date || "",
              typeOfEntry: data.admission_type || "",
              policeOBNumber: data.police_ob_number || "",
              drugsAbused: notesObj.drugsAbused || assessmentFields.drugsAbused || "",
              clientStatus: data.status || "Active",
            });

            if (data.profile_picture) {
              setProfilePreview(data.profile_picture);
            }
          }
        } catch (err: any) {
          console.error("Error loading client for edit:", err);
          toast({
            title: "Error Loading Client",
            description: err.message || "Failed to load client details for editing.",
            variant: "destructive",
          });
        } finally {
          setFetchingClient(false);
        }
      };

      loadClient();
    }
  }, [clientId, form]);

  const watchedDOB = form.watch("dateOfBirth");
  const calculatedAge = watchedDOB ? calculateAge(watchedDOB) : "";

  const onSubmit = async (values: AdmissionFormValues) => {
    if (!isAllowed) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to admit or edit clients.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      let profilePictureUrl = profilePreview || null;

      // Upload profile picture if provided
      if (selectedFile) {
        try {
          const fileExt = selectedFile.name.split(".").pop() || "jpg";
          const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${fileName}`;
          const { error: uploadError } = await supabase.storage
            .from("client-photos")
            .upload(filePath, selectedFile, {
              contentType: selectedFile.type || "image/jpeg",
              cacheControl: "31536000",
              upsert: true
            });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from("client-photos")
              .getPublicUrl(filePath);
            profilePictureUrl = publicUrl;
          }
        } catch {
          // If storage bucket isn't available, continue with profilePreview
        }
      }

      let existingNotes: any = {};
      try {
        existingNotes = typeof existingClient?.notes === "string" ? JSON.parse(existingClient.notes) : (existingClient?.notes || {});
      } catch {
        existingNotes = {};
      }

      const notesPayload = {
        ...existingNotes,
        placeOfBirth: values.placeOfBirth || null,
        healthCondition: values.healthCondition || null,
        religion: values.religion || null,
        ethnicCommunity: values.ethnicCommunity || null,
        hobbies: values.hobbies || null,
        drugsAbused: values.drugsAbused || null,
        ...(existingNotes.assessmentData ? {
          assessmentData: {
            ...existingNotes.assessmentData,
            placeOfBirth: values.placeOfBirth || null,
            healthCondition: values.healthCondition || null,
            religion: values.religion || null,
            ethnicCommunity: values.ethnicCommunity || null,
            hobbies: values.hobbies || null,
            drugsAbused: values.drugsAbused || null,
          }
        } : {})
      };

      const clientData = {
        name: `${values.firstName} ${values.lastName || ''}`.trim(),
        nickname: values.nickname || null,
        profile_picture: profilePictureUrl,
        client_id: values.intakeNumber,
        intake_number: values.intakeNumber,
        date_of_birth: values.dateOfBirth || null,
        age: calculatedAge ? parseInt(calculatedAge) : null,
        gender: values.gender,
        admission_date: values.admissionDate || null,
        admission_type: values.typeOfEntry || null,
        status: values.clientStatus || "Active",
        police_ob_number: values.policeOBNumber || null,
        notes: JSON.stringify(notesPayload),
      };

      if (isEditMode && clientId) {
        const { error } = await supabase
          .from("clients")
          .update(clientData)
          .eq("id", clientId);
        if (error) throw error;

        const fullClient = { ...(existingClient || {}), ...clientData, id: clientId };
        setCachedClient(fullClient);

        toast({
          title: "Admission Details Updated",
          description: `${clientData.name}'s admission details have been updated successfully.`,
        });

        navigate(`/clients/${clientId}`, { state: { client: fullClient } });
      } else {
        const { data, error } = await supabase.from("clients").insert([clientData]).select().single();
        if (error) throw error;

        toast({
          title: "Admission Successful",
          description: `${clientData.name} has been admitted.`
        });

        if (data?.id) {
          const fullClient = { ...clientData, id: data.id };
          setCachedClient(fullClient);
          navigate(`/clients/${data.id}`, { state: { client: fullClient } });
        } else {
          navigate("/clients");
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save client admission details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header Banner */}
      <div className="sticky top-14 z-10 bg-gradient-to-r from-emerald-600 to-teal-600 h-16 flex flex-row items-center justify-between px-4 sm:px-6 shadow-md">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-white" />
          <h1 className="text-lg font-bold text-white">
            {isEditMode ? "Edit Client Admission Details" : "Client Admission Form"}
          </h1>
        </div>
        <div className="relative text-emerald-100 text-xs font-medium hidden sm:block">
          {isEditMode && existingClient ? `EDITING: ${existingClient.name}` : "ADMISSION & INTAKE"}
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => isEditMode && clientId ? navigate(`/clients/${clientId}`) : navigate("/clients")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> {isEditMode && clientId ? "Back to Client Details" : "Back to Clients"}
        </Button>

        {fetchingClient && (
          <div className="flex items-center justify-center p-12 bg-card rounded-xl border">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mr-2" />
            <span className="text-sm font-medium text-muted-foreground">Loading client admission details...</span>
          </div>
        )}

        {!isAllowed && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
            You do not have permission to submit admission forms.
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-12">
            
            {/* CARD 1: CLIENT'S INFORMATION */}
            <Card className="border border-border/80 shadow-sm rounded-xl overflow-hidden bg-card">
              <CardHeader className="pb-4 pt-5 px-6">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
                  <User className="h-5 w-5 text-muted-foreground" /> Client's Information
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <div className="flex flex-col-reverse lg:flex-row gap-6">
                  {/* Left Column: Form Fields */}
                  <div className="flex-1 space-y-4">
                    {/* Row 1: First Name, Last Name, Nick name */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">First Name *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="" className="rounded-lg h-10" />
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
                            <FormLabel className="text-sm font-medium">Last Name *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="" className="rounded-lg h-10" />
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
                            <FormLabel className="text-sm font-medium">Nick name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="" className="rounded-lg h-10" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Row 2: Date of birth, Age, Gender */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Date of birth</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                placeholder="dd/mm/yyyy"
                                className="rounded-lg h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Age</FormLabel>
                        <Input
                          value={calculatedAge}
                          readOnly
                          placeholder=""
                          className="bg-muted/30 rounded-lg h-10 text-muted-foreground"
                        />
                      </FormItem>
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Gender *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger className="rounded-lg h-10">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Row 3: Place of birth, Health Condition, Religion */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="placeOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Place of birth</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="" className="rounded-lg h-10" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="healthCondition"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Health Condition</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="" className="rounded-lg h-10" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="religion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Religion</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="" className="rounded-lg h-10" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Row 4: Ethnic Community, Hobbies */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="ethnicCommunity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Ethnic Community</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="" className="rounded-lg h-10" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="hobbies"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel className="text-sm font-medium">Hobbies</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="" className="rounded-lg h-10" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Right Column: Passport Photo Upload */}
                  <div className="flex flex-col items-center lg:items-end justify-start gap-2.5 lg:w-56 shrink-0 pt-1">
                    <span className="text-xs sm:text-sm font-medium text-foreground text-center lg:text-right w-full">
                      Affix a color PP size photo
                    </span>
                    <div className="w-28 h-32 sm:w-32 sm:h-36 rounded-xl border border-muted-foreground/25 bg-muted/20 flex items-center justify-center overflow-hidden shadow-inner">
                      {profilePreview ? (
                        <img
                          src={profilePreview}
                          alt="Photo Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium">No Photo</span>
                      )}
                    </div>
                    <div className="w-full max-w-[210px]">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="text-xs h-9 cursor-pointer file:cursor-pointer file:text-xs file:font-semibold file:bg-muted file:text-foreground file:border-0 file:rounded-md file:mr-2 file:py-1 file:px-2.5"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CARD 2: ENTRY INFORMATION */}
            <Card className="border border-border/80 shadow-sm rounded-xl overflow-hidden bg-card">
              <CardHeader className="pb-4 pt-5 px-6">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Entry Information
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0 space-y-4">
                {/* Row 1: Intake/OB Number (Client ID) *, Date of entry */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="intakeNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Intake/OB Number (Client ID) *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="" className="rounded-lg h-10" />
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
                        <FormLabel className="text-sm font-medium">Date of entry</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="rounded-lg h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 2: Type of entry */}
                <div>
                  <FormField
                    control={form.control}
                    name="typeOfEntry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Type of entry</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="rounded-lg h-10">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Referred (Social Worker/Staff)">Referred (Social Worker/Staff)</SelectItem>
                            <SelectItem value="Came at will">Came at will</SelectItem>
                            <SelectItem value="Court Committal">Court Committal</SelectItem>
                            <SelectItem value="Police Referral">Police Referral</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 3: Police OB Number, Drugs Client Has Abused */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="policeOBNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Police OB Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="" className="rounded-lg h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="drugsAbused"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Drugs Client Has Abused</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="" className="rounded-lg h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => isEditMode && clientId ? navigate(`/clients/${clientId}`) : navigate("/clients")}
                disabled={loading}
                className="h-10 px-5 rounded-lg"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !isAllowed}
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-6 rounded-lg min-w-[160px]"
              >
                <Save className="mr-2 h-4 w-4" /> {loading ? "Saving..." : (isEditMode ? "Save Changes" : "Submit Admission")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AdmissionForm;
