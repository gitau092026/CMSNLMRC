import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User, Users, Shield, UserCircle,
  FileText, Activity, School,
  Brain, CheckSquare, ArrowRight, ArrowLeft, Plus, Trash2,
  Search, ChevronDown, Edit
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { compressImage } from "@/utils/imageCompression";
import { setCachedClient } from "@/lib/clientCache";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
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

const formSchema = z.object({
  firstName: z.string().optional(),
  secondName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  calculatedAge: z.string().optional(),
  gender: z.string().optional(),
  nickname: z.string().optional(),
  admissionType: z.string().optional(),
  admissionTypeDetails: z.string().optional(),
  partnerName: z.string().optional(),
  partnerContactPerson: z.string().optional(),
  partnerContact: z.string().optional(),
  admissionDate: z.string().optional(),
  intakeNumber: z.string().optional(),
  policeOBNumber: z.string().optional(),
  clientStatus: z.string().optional().default("Active"),
  familyComposition: z.string().optional(),
  siblingsInfo: z.string().optional(),
  siblingsList: z.array(z.object({
    name: z.string().optional(),
    nickname: z.string().optional(),
    location: z.string().optional(),
    education: z.string().optional(),
    classLevel: z.string().optional(),
    age: z.string().optional(),
  })).optional(),
  otherRelativesList: z.array(z.object({
    name: z.string().optional(),
    relationship: z.string().optional(),
    location: z.string().optional(),
    phone: z.string().optional(),
  })).optional(),
  contactWithFamily: z.string().optional(),
  contactWithFamilyWhom: z.string().optional(),
  contactWithFamilyLastVisit: z.string().optional(),
  homeOnHolidays: z.string().optional(),
  familyVisits: z.string().optional(),
  familyVisitFrequency: z.string().optional(),
  caregiverPreference: z.string().optional(),
  caregiverPreferenceDetails: z.string().optional(),
  motherStatus: z.string().optional(),
  motherName: z.string().optional(),
  motherContact: z.string().optional(),
  motherOccupation: z.string().optional(),
  motherCounty: z.string().optional(),
  motherSubCounty: z.string().optional(),
  motherLocation: z.string().optional(),
  motherSubLocation: z.string().optional(),
  motherVillage: z.string().optional(),
  fatherStatus: z.string().optional(),
  fatherName: z.string().optional(),
  fatherLocation: z.string().optional(),
  fatherContact: z.string().optional(),
  fatherOccupation: z.string().optional(),
  fatherCounty: z.string().optional(),
  fatherSubCounty: z.string().optional(),
  fatherSubLocation: z.string().optional(),
  fatherVillage: z.string().optional(),
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
  rescueDetails: z.string().optional(),

  // Assessment Fields
  birthRegistered: z.string().optional(),
  birthRegistrationNumber: z.string().optional(),
  placeOfBirthCounty: z.string().optional(),
  placeOfBirthSubCounty: z.string().optional(),
  placeOfBirthVillage: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  complexion: z.string().optional(),
  ethnicity: z.string().optional(),
  religion: z.string().optional(),
  distinguishingFeatures: z.string().optional(),
  languages: z.string().optional(),
  hasVisionDifficulty: z.string().optional(),
  hasVisionDifficultyDetails: z.string().optional(),
  hasHearingDifficulty: z.string().optional(),
  hasHearingDifficultyDetails: z.string().optional(),
  hasMobilityDifficulty: z.string().optional(),
  hasMobilityDifficultyDetails: z.string().optional(),
  hasCognitiveDifficulty: z.string().optional(),
  hasCognitiveDifficultyDetails: z.string().optional(),
  hasSelfCareDifficulty: z.string().optional(),
  hasSelfCareDifficultyDetails: z.string().optional(),
  hasCommDifficulty: z.string().optional(),
  hasCommDifficultyDetails: z.string().optional(),
  admissionAge: z.string().optional(),
  committalOrderNo: z.string().optional(),
  committalDate: z.string().optional(),
  referrerName: z.string().optional(),
  referrerTitle: z.string().optional(),
  referrerRelationship: z.string().optional(),
  referrerContact: z.string().optional(),
  referrerLocation: z.string().optional(),
  currentCareProviderName: z.string().optional(),
  currentCareProviderPhone: z.string().optional(),
  currentCareProviderReg: z.string().optional(),
  reasonsForAdmission: z.string().optional(), // Store as comma sep string
  historyOfPlacements: z.string().optional(),
  vulnerabilityStats: z.string().optional(),
  preAdmissionLiving: z.string().optional(), // Kept for backward compatibility or general notes

  // Structured Pre-Admission Fields
  preAdmissionPerson1Name: z.string().optional(), preAdmissionPerson1Rel: z.string().optional(),
  preAdmissionPerson2Name: z.string().optional(), preAdmissionPerson2Rel: z.string().optional(),
  preAdmissionPerson3Name: z.string().optional(), preAdmissionPerson3Rel: z.string().optional(),
  preAdmissionPerson4Name: z.string().optional(), preAdmissionPerson4Rel: z.string().optional(),
  preAdmissionPhone: z.string().optional(),
  preAdmissionIsCCI: z.string().optional(), // "Yes" or "" or "No"
  preAdmissionCCIDetails: z.string().optional(),
  preAdmissionCounty: z.string().optional(),
  preAdmissionSubCounty: z.string().optional(),
  preAdmissionLocation: z.string().optional(),
  preAdmissionSubLocation: z.string().optional(),
  preAdmissionVillage: z.string().optional(),
  preAdmissionLandmark: z.string().optional(),

  siblingsWithChild: z.string().optional(),
  siblingsElsewhere: z.string().optional(),
  parentsLivingTogether: z.string().optional(),
  familyContact: z.string().optional(),
  healthGrowth: z.string().optional(),
  healthHistory: z.string().optional(),
  healthCurrentStatus: z.string().optional(),
  healthCurrentDetails: z.string().optional(),
  healthChronicStatus: z.string().optional(),
  healthChronicDetails: z.string().optional(),
  healthMedsStatus: z.string().optional(),
  healthMedsDetails: z.string().optional(),
  healthImmunizationStatus: z.string().optional(),
  healthImmunizationReason: z.string().optional(),
  healthAllergyStatus: z.string().optional(),
  healthAllergyDetails: z.string().optional(),
  healthFeeding: z.string().optional(),
  educationPreviousStatus: z.string().optional(),
  educationPreviousType: z.string().optional(),
  educationPreviousMode: z.string().optional(),
  educationPreviousNameLocation: z.string().optional(),
  educationCurrentStatus: z.string().optional(),
  educationCurrentType: z.string().optional(),
  educationCurrentMode: z.string().optional(),
  educationCurrentNameLocation: z.string().optional(),
  educationCurrentLevel: z.string().optional(),
  educationPerformance: z.string().optional(),
  psychoFriendsActivities: z.string().optional(),
  psychoFriendsViews: z.string().optional(),
  psychoFriendQuality: z.string().optional(),
  psychoFriendAge: z.string().optional(),
  psychoCaregiverAttachmentLevel: z.string().optional(),
  psychoCaregiverAttachmentDesc: z.string().optional(),
  psychoPrevCaregiverAttachmentLevel: z.string().optional(),
  psychoPrevCaregiverAttachmentDesc: z.string().optional(),
  psychoRisks: z.array(z.string()).optional(),
  psychoRoutine: z.string().optional(),
  psychoIndependence: z.string().optional(),
  psychoLikes: z.string().optional(),
  psychoDislikes: z.string().optional(),
  psychoFears: z.string().optional(),
  psychoSkills: z.string().optional(),
  reintegrationPreference: z.string().optional(),
  reintegrationConcerns: z.string().optional(),
  reasonsForAdmissionList: z.array(z.string()).optional(),
  reasonsForAdmissionOther: z.string().optional(),

  // New Admission Fields
  otherAdmissionForms: z.string().optional(),
  dcsSubcounty: z.string().optional(),
  admissionOrderIssued: z.string().optional(),
  placementOrderNo: z.string().optional(),

  currentCarePlacementType: z.array(z.string()).optional(),
  currentCarePlacementOther: z.string().optional(),

  vulnerabilityType: z.array(z.string()).optional(),
  vulnerabilityLocationStreet: z.string().optional(),
  vulnerabilityLocationSeparation: z.string().optional(),
  vulnerabilityOther: z.string().optional(),

  historyPlacementsData: z.array(z.object({
    type: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional()
  })).optional(),

  reintegrationPreferenceStatus: z.string().optional(),
  reintegrationPreferenceDetails: z.string().optional(),
  reintegrationConcernsStatus: z.string().optional(),
  reintegrationConcernsDetails: z.string().optional(),
  assessmentStrengths: z.string().optional(),
  assessmentNeeds: z.string().optional(),
  assessmentObservations: z.string().optional(),
  assessmentGoals: z.string().optional(),
  caseworkerName: z.string().optional(),
  caseworkerSignDate: z.string().optional(),
  managerName: z.string().optional(),
  managerSignDate: z.string().optional(),
  assessmentStatus: z.string().optional(),
});

const RegisterClient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeClientId, setActiveClientId] = useState<string | null>(searchParams.get('clientId'));
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("bio");
  const [preAdmissionCount, setPreAdmissionCount] = useState(1);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [deletePersonIndex, setDeletePersonIndex] = useState<number | null>(null);
  const [deleteSiblingIndex, setDeleteSiblingIndex] = useState<number | null>(null);
  const [deleteOtherRelativeIndex, setDeleteOtherRelativeIndex] = useState<number | null>(null);
  const { user } = useAuth();

  // Client selector state
  const [allClients, setAllClients] = useState<Array<{
    id: string; name: string; intake_number: string | null; client_id: string;
    date_of_birth: string | null; age: number | null; gender: string | null;
    police_ob_number: string | null; admission_date: string | null;
    education_level: string | null; street_name: string | null;
    street_duration: string | null; profile_picture: string | null;
  }>>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientSummary, setSelectedClientSummary] = useState<any>(null);

  const isAllowed = ["admin", "social_work", "education", "counselling", "counsellor", "empowerment", "intern_social_work", "intern_counselling"].includes(user?.role || "");

  useEffect(() => {
    if (user && !isAllowed) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to register clients. Please contact an administrator.",
        variant: "destructive"
      });
    }
  }, [user, isAllowed]);

  const safeJsonParse = (input: any) => {
    if (!input) return {};

    // Quick string check: if it looks like our internal JSON structure, be very careful
    if (typeof input === 'string') {
      const trimmed = input.trim();
      // If it starts with { and has assessmentData, it IS our data. 
      // If we fail to extract notes from it, we MUST return empty notes, NOT the raw string.
      if (trimmed.startsWith('{') && trimmed.includes('"assessmentData"')) {
        try {
          // Try standard parse
          let parsed = JSON.parse(input);
          if (typeof parsed === 'object' && parsed !== null) {
            return parsed;
          }
        } catch (e) {
          // Try aggressive cleanup
          try {
            const cleaned = input.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
            let parsed = JSON.parse(cleaned);
            if (typeof parsed === 'object' && parsed !== null) {
              return parsed;
            }
          } catch (e2) {
            // ignore
          }
        }
        // If we are here, we matched the pattern but failed to parse. 
        // Return empty structure to hide the mess.
        return { notes: "", assessmentData: {} };
      }
    }

    // Standard logic for other cases
    try {
      if (typeof input === 'string') {
        const parsed = JSON.parse(input);
        if (typeof parsed === 'object' && parsed !== null) return parsed;
      } else if (typeof input === 'object' && input !== null) {
        return input;
      }
    } catch (e) { /* ignore */ }

    return { notes: String(input) };
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "", secondName: "", dateOfBirth: "", calculatedAge: "", gender: "", nickname: "",
      admissionType: "", admissionTypeDetails: "",
      partnerName: "", partnerContactPerson: "", partnerContact: "", admissionDate: "",
      intakeNumber: "", policeOBNumber: "", clientStatus: "Active", familyComposition: "",
      siblingsInfo: "", siblingsList: [{ name: "", nickname: "", location: "", education: "", classLevel: "", age: "" }],
      otherRelativesList: [{ name: "", relationship: "", location: "", phone: "" }],
      contactWithFamily: "", contactWithFamilyWhom: "", contactWithFamilyLastVisit: "",
      homeOnHolidays: "", familyVisits: "", familyVisitFrequency: "", caregiverPreference: "", caregiverPreferenceDetails: "",
      motherStatus: "", motherName: "", motherContact: "", motherOccupation: "",
      motherCounty: "", motherSubCounty: "", motherLocation: "", motherSubLocation: "", motherVillage: "",
      fatherStatus: "", fatherName: "", fatherLocation: "", fatherContact: "",
      fatherOccupation: "", fatherCounty: "", fatherSubCounty: "", fatherSubLocation: "", fatherVillage: "", guardianStatus: "", guardianName: "", guardianLocation: "",
      guardianContact: "", guardianOccupation: "", educationLevel: "", schoolName: "",
      levelReached: "", educationStatus: "", rescueDetails: "",
      birthRegistered: "", birthRegistrationNumber: "", placeOfBirthCounty: "", placeOfBirthSubCounty: "", placeOfBirthVillage: "",
      height: "", weight: "", complexion: "", ethnicity: "", religion: "", distinguishingFeatures: "", languages: "",
      hasVisionDifficulty: "", hasVisionDifficultyDetails: "",
      hasHearingDifficulty: "", hasHearingDifficultyDetails: "",
      hasMobilityDifficulty: "", hasMobilityDifficultyDetails: "",
      hasCognitiveDifficulty: "", hasCognitiveDifficultyDetails: "",
      hasSelfCareDifficulty: "", hasSelfCareDifficultyDetails: "",
      hasCommDifficulty: "", hasCommDifficultyDetails: "",
      admissionAge: "", committalOrderNo: "", committalDate: "", referrerName: "", referrerTitle: "", referrerRelationship: "", referrerContact: "", referrerLocation: "",
      currentCareProviderName: "", currentCareProviderPhone: "", currentCareProviderReg: "", reasonsForAdmission: "", historyOfPlacements: "",
      vulnerabilityStats: "", preAdmissionLiving: "",
      preAdmissionPerson1Name: "", preAdmissionPerson1Rel: "",
      preAdmissionPerson2Name: "", preAdmissionPerson2Rel: "",
      preAdmissionPerson3Name: "", preAdmissionPerson3Rel: "",
      preAdmissionPerson4Name: "", preAdmissionPerson4Rel: "",
      preAdmissionPhone: "", preAdmissionIsCCI: "No", preAdmissionCCIDetails: "",
      preAdmissionCounty: "", preAdmissionSubCounty: "", preAdmissionLocation: "",
      preAdmissionSubLocation: "", preAdmissionVillage: "", preAdmissionLandmark: "",
      siblingsWithChild: "", siblingsElsewhere: "", parentsLivingTogether: "", familyContact: "",
      reasonsForAdmissionList: [], reasonsForAdmissionOther: "",
      otherAdmissionForms: "", admissionOrderIssued: "", placementOrderNo: "",
      currentCarePlacementType: [], currentCarePlacementOther: "",
      vulnerabilityType: [], vulnerabilityLocationStreet: "", vulnerabilityLocationSeparation: "", vulnerabilityOther: "",
      historyPlacementsData: [{ type: "", from: "", to: "" }],
      healthGrowth: "", healthHistory: "", healthCurrentStatus: "", healthCurrentDetails: "",
      healthChronicStatus: "", healthChronicDetails: "", healthMedsStatus: "", healthMedsDetails: "",
      healthImmunizationStatus: "", healthImmunizationReason: "", healthAllergyStatus: "", healthAllergyDetails: "", healthFeeding: "",
      educationPreviousStatus: "", educationPreviousType: "", educationPreviousMode: "", educationPreviousNameLocation: "",
      educationCurrentStatus: "", educationCurrentType: "", educationCurrentMode: "", educationCurrentNameLocation: "", educationCurrentLevel: "",
      educationPerformance: "",
      psychoFriendsActivities: "", psychoFriendsViews: "", psychoFriendQuality: "", psychoFriendAge: "",
      psychoCaregiverAttachmentLevel: "", psychoCaregiverAttachmentDesc: "",
      psychoPrevCaregiverAttachmentLevel: "", psychoPrevCaregiverAttachmentDesc: "",
      psychoRisks: [],
      psychoRoutine: "", psychoIndependence: "", psychoLikes: "", psychoDislikes: "", psychoFears: "", psychoSkills: "",
      reintegrationPreferenceStatus: "", reintegrationPreferenceDetails: "",
      reintegrationConcernsStatus: "", reintegrationConcernsDetails: "",
      assessmentStrengths: "", assessmentNeeds: "", assessmentObservations: "", assessmentGoals: "",
      caseworkerName: "", caseworkerSignDate: "", managerName: "", managerSignDate: "", assessmentStatus: "Pending"
    }
  });

  const { fields: historyFields, append: appendHistory, remove: removeHistory } = useFieldArray({
    control: form.control,
    name: "historyPlacementsData"
  });

  const { fields: siblingFields, append: appendSibling, remove: removeSibling } = useFieldArray({
    control: form.control,
    name: "siblingsList"
  });

  const { fields: otherRelativesFields, append: appendOtherRelative, remove: removeOtherRelative } = useFieldArray({
    control: form.control,
    name: "otherRelativesList"
  });

  useEffect(() => {
    fetchAllClients();
  }, []);

  useEffect(() => {
    const clientIdFromUrl = searchParams.get('clientId');
    if (clientIdFromUrl && (!selectedClientSummary || selectedClientSummary.id !== clientIdFromUrl)) {
      setActiveClientId(clientIdFromUrl);
      fetchClientData(clientIdFromUrl);
    }
  }, [searchParams]);

  const fetchAllClients = async () => {
    try {
      const { data, error } = await supabase.from('clients').select(`
        id, name, intake_number, client_id, date_of_birth, age, gender,
        police_ob_number, admission_date, education_level, street_name,
        street_duration, profile_picture, status
      `).order('created_at', { ascending: false });
      if (error) throw error;
      
      // Only show clients who have not graduated
      const activeClients = (data || []).filter(c => 
        !['Graduated', 'Alumni', 'Alumni - Placed', 'Alumni - Awaiting Placement', 'Complete'].includes(c.status || '')
      );
      
      setAllClients(activeClients);
    } catch (error) {
      console.error("Error fetching clients list:", error);
    }
  };

  const handleSelectClient = (clientId: string) => {
    setActiveClientId(clientId);
    setShowClientDropdown(false);
    setClientSearch("");
    
    // Update URL via React Router search params
    setSearchParams({ clientId, mode: 'edit' });
    
    // Immediately fetch and populate client assessment data
    fetchClientData(clientId);
  };

  const fetchClientData = async (clientId: string = activeClientId as string) => {
    if (!clientId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.from('clients').select('*').eq('id', clientId).single();
      if (error) throw error;
      if (data) {
        setSelectedClientSummary(data);
        const extraData = safeJsonParse(data.notes);
        const assessmentFields = extraData.assessmentData || {};
        form.reset({
          firstName: data.name?.split(' ')[0] || "",
          secondName: data.name?.split(' ').slice(1).join(' ') || "",
          dateOfBirth: data.date_of_birth || "",
          calculatedAge: data.age?.toString() || "",
          gender: data.gender || "",
          nickname: data.nickname || "",
          admissionType: data.admission_type || "",
          admissionTypeDetails: data.admission_type_details || "",
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
          rescueDetails: data.rescue_details || "",
          historyPlacementsData: assessmentFields.historyPlacementsData || [{ type: "", from: "", to: "" }, { type: "", from: "", to: "" }, { type: "", from: "", to: "" }],
          reasonsForAdmissionList: assessmentFields.reasonsForAdmissionList || [],
          // Handle backward compatibility: if it was an array, take the first item, otherwise use as string
          otherAdmissionForms: Array.isArray(assessmentFields.otherAdmissionForms)
            ? assessmentFields.otherAdmissionForms[0] || ""
            : assessmentFields.otherAdmissionForms || "",
          currentCarePlacementType: assessmentFields.currentCarePlacementType || [],
          vulnerabilityType: assessmentFields.vulnerabilityType || [],
          ...assessmentFields
        });

        // Dynamic Pre-Admission Count
        const preAdmCount = [4, 3, 2].find(n => assessmentFields[`preAdmissionPerson${n}Name`] || assessmentFields[`preAdmissionPerson${n}Rel`]) || 1;
        setPreAdmissionCount(preAdmCount);

        if (data.profile_picture) setProfilePreview(data.profile_picture);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>, shouldNavigate = true) => {
    try {
      setLoading(true);
      const {
        firstName, secondName, dateOfBirth, calculatedAge, gender, nickname,
        admissionType, admissionTypeDetails,
        partnerName, partnerContactPerson, partnerContact, admissionDate,
        intakeNumber, policeOBNumber, clientStatus, familyComposition,
        siblingsInfo, motherStatus, motherName, motherLocation, motherContact,
        motherOccupation, fatherStatus, fatherName, fatherLocation, fatherContact,
        fatherOccupation, guardianStatus, guardianName, guardianLocation,
        guardianContact, guardianOccupation, educationLevel, schoolName,
        levelReached, educationStatus, profilePicture, rescueDetails,
        ...assessmentData
      } = values;

      let existingNotesObj: any = {};
      try {
        existingNotesObj = typeof selectedClientSummary?.notes === 'string'
          ? JSON.parse(selectedClientSummary.notes)
          : (selectedClientSummary?.notes || {});
      } catch {
        existingNotesObj = {};
      }

      const packedNotes = JSON.stringify({
        ...existingNotesObj,
        assessmentData: {
          ...(existingNotesObj.assessmentData || {}),
          ...assessmentData
        }
      });

      const clientData = {
        name: (values.firstName ? `${values.firstName} ${values.secondName || ''}`.trim() : selectedClientSummary?.name) || "",
        client_id: values.intakeNumber || selectedClientSummary?.client_id || selectedClientSummary?.intake_number || "",
        age: parseInt(values.calculatedAge || selectedClientSummary?.age?.toString() || "0") || null,
        gender: values.gender || selectedClientSummary?.gender || null,
        date_of_birth: values.dateOfBirth || selectedClientSummary?.date_of_birth || null,
        nickname: values.nickname || selectedClientSummary?.nickname || null,
        admission_type: values.admissionType || selectedClientSummary?.admission_type || null,
        admission_type_details: values.admissionTypeDetails || selectedClientSummary?.admission_type_details || null,
        partner_name: values.partnerName || selectedClientSummary?.partner_name || null,
        partner_contact_person: values.partnerContactPerson || selectedClientSummary?.partner_contact_person || null,
        partner_contact: values.partnerContact || selectedClientSummary?.partner_contact || null,
        admission_date: values.admissionDate || selectedClientSummary?.admission_date || null,
        intake_number: values.intakeNumber || selectedClientSummary?.intake_number || selectedClientSummary?.client_id || null,
        police_ob_number: values.policeOBNumber || selectedClientSummary?.police_ob_number || null,
        status: values.clientStatus === 'Complete' ? 'Alumni - Awaiting Placement' : (values.clientStatus || selectedClientSummary?.status || 'Active'),
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
        contact: values.motherContact || values.fatherContact || values.guardianContact || selectedClientSummary?.contact || "",
        address: values.motherLocation || values.fatherLocation || values.guardianLocation || selectedClientSummary?.address || "",
        notes: packedNotes
      };

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop() || 'jpg';
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;
        const { error: uploadError } = await supabase.storage.from('client-photos').upload(filePath, selectedFile, {
          contentType: selectedFile.type || 'image/jpeg',
          cacheControl: '31536000',
          upsert: true
        });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('client-photos').getPublicUrl(filePath);
        (clientData as any).profile_picture = publicUrl;
      }

      let savedClientId = activeClientId;

      if (activeClientId) {
        const { error } = await supabase.from('clients').update(clientData).eq('id', activeClientId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('clients').insert([clientData]).select().single();
        if (error) throw error;
        if (data) {
          savedClientId = data.id;
          setActiveClientId(data.id);
          // Silently update the URL to include the new clientId so refresh doesn't lose context
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('clientId', data.id);
          newUrl.searchParams.set('mode', 'edit');
          window.history.replaceState({}, '', newUrl.toString());
        }
      }

      setCachedClient({ ...clientData, id: savedClientId });

      toast({ title: "Success", description: shouldNavigate ? "Client & Assessment saved successfully!" : "Progress saved." });
      if (shouldNavigate) {
        if (values.clientStatus === 'Complete' || values.clientStatus === 'Alumni - Awaiting Placement') {
          navigate(`/aftercare/add/${savedClientId}`);
        } else if (savedClientId) {
          navigate(`/clients/${savedClientId}`);
        } else {
          navigate("/clients");
        }
      }
      return true;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    } finally { setLoading(false); }
  };

  const handleNext = async (nextTab: string) => {
    const success = await onSubmit(form.getValues(), false);
    if (success) setActiveTab(nextTab);
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
        const reader = new FileReader();
        reader.onloadend = () => setProfilePreview(reader.result as string);
        reader.readAsDataURL(file);
        setSelectedFile(file);
      }
    }
  };

  const disabilityOptions = [
    { id: "hasVisionDifficulty", label: "Have difficulty seeing, even if wearing glasses?" },
    { id: "hasHearingDifficulty", label: "Have difficulty hearing, even if using a hearing aid?" },
    { id: "hasMobilityDifficulty", label: "Have difficulty walking or climbing steps?" },
    { id: "hasCognitiveDifficulty", label: "Have difficulty remembering or concentrating?" },
    { id: "hasSelfCareDifficulty", label: "Have difficulty (with self-care, such as) washing all over or dressing?" },
    { id: "hasCommDifficulty", label: "Have difficulty communicating, (for example understanding or being understood by others)?" },
  ];

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="sticky top-14 z-10 bg-gradient-to-r from-purple-600 to-blue-600 h-24 flex flex-col items-center justify-center px-4 shadow-md">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <h1 className="relative text-2xl font-bold text-white">Client Assessment</h1>
      </div>

      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => onSubmit(v, true), (errors) => {
            console.error("Validation errors:", errors);
            toast({
              title: "Validation Error",
              description: "Please check all tabs for required fields.",
              variant: "destructive"
            });
          })} className="space-y-6">
            {/* Client Selector */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6 relative z-20">
              <div className="flex flex-col space-y-4">
                <Label className="text-lg font-semibold text-primary flex items-center gap-2">
                  <Search className="h-5 w-5" /> Select Client for Assessment
                </Label>
                <div className="relative">
                  <div 
                    className="flex items-center justify-between border rounded-md p-3 cursor-pointer hover:border-primary transition-colors bg-white"
                    onClick={() => setShowClientDropdown(!showClientDropdown)}
                  >
                    <span className={activeClientId && selectedClientSummary ? "text-foreground font-medium" : "text-muted-foreground"}>
                      {selectedClientSummary 
                        ? `${selectedClientSummary.name} (${selectedClientSummary.intake_number || selectedClientSummary.client_id})` 
                        : activeClientId && loading
                        ? "Loading client details..."
                        : "Choose a client to assess..."}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showClientDropdown ? "rotate-180" : ""}`} />
                  </div>
                  
                  {showClientDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowClientDropdown(false)} />
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                        <div className="p-2 sticky top-0 bg-white border-b z-10">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search client by name or ID..."
                              value={clientSearch}
                              onChange={(e) => setClientSearch(e.target.value)}
                              className="pl-8"
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="p-1">
                          {allClients
                            .filter(c => 
                              c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
                              (c.intake_number || c.client_id || "").toLowerCase().includes(clientSearch.toLowerCase())
                            )
                            .map(client => (
                              <div 
                                key={client.id}
                                className="p-3 hover:bg-muted cursor-pointer rounded-sm flex flex-col transition-colors"
                                onClick={() => handleSelectClient(client.id)}
                              >
                                <span className="font-medium text-foreground">{client.name}</span>
                                <span className="text-xs text-muted-foreground">ID: {client.intake_number || client.client_id} | Admitted: {client.admission_date ? new Date(client.admission_date).toLocaleDateString() : 'N/A'}</span>
                              </div>
                            ))}
                          {allClients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || (c.intake_number || c.client_id || "").toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && (
                            <div className="p-3 text-sm text-muted-foreground text-center">No clients found</div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Read-Only Admission Summary Card */}
            {activeClientId && selectedClientSummary && (
              <Card className="mb-6 bg-slate-50/50 border-primary/20 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <CardHeader className="pb-3 border-b bg-white/50">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserCircle className="h-5 w-5 text-primary" /> Admission Summary
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => navigate(`/admission?clientId=${activeClientId}&mode=edit`)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" /> Edit Admission Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                  <div><span className="text-muted-foreground block text-xs uppercase mb-1">Full Name</span><span className="font-medium">{selectedClientSummary.name}</span></div>
                  <div><span className="text-muted-foreground block text-xs uppercase mb-1">Date of Birth / Age</span><span className="font-medium">{selectedClientSummary.date_of_birth ? new Date(selectedClientSummary.date_of_birth).toLocaleDateString() : 'N/A'} ({selectedClientSummary.age ? `${selectedClientSummary.age} yrs` : 'N/A'})</span></div>
                  <div><span className="text-muted-foreground block text-xs uppercase mb-1">Gender</span><span className="font-medium">{selectedClientSummary.gender || 'N/A'}</span></div>
                  
                  <div><span className="text-muted-foreground block text-xs uppercase mb-1">Client/Intake ID</span><span className="font-medium">{selectedClientSummary.intake_number || selectedClientSummary.client_id || 'N/A'}</span></div>
                  <div><span className="text-muted-foreground block text-xs uppercase mb-1">Police OB No.</span><span className="font-medium">{selectedClientSummary.police_ob_number || 'N/A'}</span></div>
                  <div><span className="text-muted-foreground block text-xs uppercase mb-1">Admission Date</span><span className="font-medium">{selectedClientSummary.admission_date ? new Date(selectedClientSummary.admission_date).toLocaleDateString() : 'N/A'}</span></div>
                  
                  <div><span className="text-muted-foreground block text-xs uppercase mb-1">Education Level</span><span className="font-medium">{selectedClientSummary.education_level || 'N/A'}</span></div>
                  <div><span className="text-muted-foreground block text-xs uppercase mb-1">Base/Partner</span><span className="font-medium">{selectedClientSummary.street_name || 'N/A'}</span></div>
                  <div><span className="text-muted-foreground block text-xs uppercase mb-1">Duration on Street</span><span className="font-medium">{selectedClientSummary.street_duration || 'N/A'}</span></div>
                </CardContent>
              </Card>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className={`w-full ${!activeClientId ? 'opacity-50 pointer-events-none' : ''}`}>
              <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-muted rounded-lg gap-1">
                <TabsTrigger value="bio" className="h-full whitespace-normal px-1 py-1 text-[10px] sm:text-sm leading-tight flex items-center justify-center text-center">Biographical</TabsTrigger>
                <TabsTrigger value="admission" className="h-full whitespace-normal px-1 py-1 text-[10px] sm:text-sm leading-tight flex items-center justify-center text-center">Admission</TabsTrigger>
                <TabsTrigger value="family" className="h-full whitespace-normal px-1 py-1 text-[10px] sm:text-sm leading-tight flex items-center justify-center text-center">Family</TabsTrigger>
                <TabsTrigger value="wellbeing" className="h-full whitespace-normal px-1 py-1 text-[10px] sm:text-sm leading-tight flex items-center justify-center text-center">Well-being</TabsTrigger>
                <TabsTrigger value="conclusion" className="h-full whitespace-normal px-1 py-1 text-[10px] sm:text-sm leading-tight flex items-center justify-center text-center">Conclusion</TabsTrigger>
              </TabsList>

              <TabsContent value="bio" className="space-y-4 pt-4">
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Biographical Information</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="nickname" render={({ field }) => (
                        <FormItem><FormLabel>Nickname</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="profilePicture" render={() => (
                        <FormItem><FormLabel>Profile Picture</FormLabel><FormControl><div className="flex items-center gap-4">{profilePreview && <img src={profilePreview} alt="Preview" className="h-16 w-16 rounded-full object-cover" />}<Input type="file" accept="image/*" onChange={handleFileChange} /></div></FormControl></FormItem>
                      )} />
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={form.control} name="birthRegistered" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Birth Registered?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                              <SelectItem value="Not Sure">Not Sure</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      {form.watch("birthRegistered") === "Yes" && (
                        <FormField control={form.control} name="birthRegistrationNumber" render={({ field }) => (
                          <FormItem><FormLabel>Birth Reg Number</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={form.control} name="placeOfBirthCounty" render={({ field }) => (
                        <FormItem><FormLabel>Place of Birth (County)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="placeOfBirthSubCounty" render={({ field }) => (
                        <FormItem><FormLabel>Sub-County</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="placeOfBirthVillage" render={({ field }) => (
                        <FormItem><FormLabel>Village</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <FormField control={form.control} name="height" render={({ field }) => (
                        <FormItem><FormLabel>Height</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="weight" render={({ field }) => (
                        <FormItem><FormLabel>Weight</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="complexion" render={({ field }) => (
                        <FormItem><FormLabel>Complexion</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="ethnicity" render={({ field }) => (
                        <FormItem><FormLabel>Ethnicity</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="religion" render={({ field }) => (
                        <FormItem><FormLabel>Religion</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="languages" render={({ field }) => (
                        <FormItem><FormLabel>Languages</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="distinguishingFeatures" render={({ field }) => (
                      <FormItem><FormLabel>Distinguishing Physical Features</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
                    )} />
                    <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-semibold">Disability / Functioning Assessment</Label>
                        <p className="text-[10px] text-muted-foreground leading-tight">Does the child (tick the one response that applies):</p>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                        {disabilityOptions.map((opt) => (
                          <div key={opt.id} className="space-y-1.5 border rounded p-2 bg-background">
                            <FormField control={form.control} name={opt.id as any} render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-[11px] font-normal leading-tight line-clamp-2">{opt.label}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                  <FormControl>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="No" className="text-xs">No</SelectItem>
                                    <SelectItem value="Yes, some difficulty" className="text-xs">Yes, some difficulty</SelectItem>
                                    <SelectItem value="Yes, a lot of difficulty" className="text-xs">Yes, a lot of difficulty</SelectItem>
                                    <SelectItem value="Cannot do it at all" className="text-xs">Cannot do it at all</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )} />
                            {(form.watch(opt.id as any)?.includes("Yes") || form.watch(opt.id as any) === "Cannot do it at all") && (
                              <FormField control={form.control} name={`${opt.id}Details` as any} render={({ field }) => (
                                <FormItem className="space-y-0.5">
                                  <FormLabel className="text-[10px] text-muted-foreground">Explain:</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} placeholder="Details..." className="min-h-[50px] text-xs resize-none" />
                                  </FormControl>
                                </FormItem>
                              )} />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-2 mt-2">
                        <p className="text-[10px] text-blue-900 dark:text-blue-100 leading-tight">
                          <strong>Note:</strong> If "yes" to any question, administer the "Disability and Functioning Assessment Tool."
                        </p>
                      </div>
                    </div>
                  </CardContent><CardFooter className="flex justify-end"><Button type="button" onClick={() => handleNext('admission')}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button></CardFooter></Card>
              </TabsContent>

              <TabsContent value="admission" className="space-y-4 pt-4">
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Admission Details</CardTitle></CardHeader>
                  <CardContent className="space-y-6">



                    {/* Other Forms of Admission */}
                    <div className="space-y-3">
                      <FormField control={form.control} name="otherAdmissionForms" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Placement Form</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select admission type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Partner">Partner</SelectItem>
                              <SelectItem value="Court">Court</SelectItem>
                              <SelectItem value="DCS">DCS</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {/* Partner sub-fields */}
                      {form.watch("otherAdmissionForms") === "Partner" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-md bg-muted/20 mt-2">
                          <FormField control={form.control} name="partnerName" render={({ field }) => (
                            <FormItem><FormLabel>Partner Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="partnerContactPerson" render={({ field }) => (
                            <FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="partnerContact" render={({ field }) => (
                            <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                      )}

                      {/* Court sub-fields */}
                      {form.watch("otherAdmissionForms") === "Court" && (
                        <div className="border p-4 rounded-md bg-muted/20 mt-2 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormItem>
                              <FormLabel className="text-green-600">Placement Order</FormLabel>
                              <Input value="Court Order" disabled className="bg-muted font-medium" />
                            </FormItem>
                            <FormField control={form.control} name="committalOrderNo" render={({ field }) => (
                              <FormItem><FormLabel>Committal Order #</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="committalDate" render={({ field }) => (
                              <FormItem><FormLabel>Date of Committal</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                            )} />
                          </div>
                        </div>
                      )}

                      {/* DCS sub-fields */}
                      {form.watch("otherAdmissionForms") === "DCS" && (
                        <div className="border p-4 rounded-md bg-muted/20 mt-2 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormItem>
                              <FormLabel className="text-green-600">Placement Order</FormLabel>
                              <Input value="DCS" disabled className="bg-muted font-medium" />
                            </FormItem>
                            <FormField control={form.control} name="dcsSubcounty" render={({ field }) => (
                              <FormItem><FormLabel>DCS Subcounty Office Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Referrer & Current Care */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm">Who referred the child?</h4>
                        <FormField control={form.control} name="referrerName" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="referrerTitle" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="referrerRelationship" render={({ field }) => (<FormItem><FormLabel>Relationship to child</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <div className="grid grid-cols-2 gap-2">
                          <FormField control={form.control} name="referrerContact" render={({ field }) => (<FormItem><FormLabel>Contact</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                          <FormField control={form.control} name="referrerLocation" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm">Current Care Provider</h4>
                        <FormField control={form.control} name="currentCareProviderName" render={({ field }) => (<FormItem><FormLabel>Name & Address</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <div className="grid grid-cols-2 gap-2">
                          <FormField control={form.control} name="currentCareProviderPhone" render={({ field }) => (<FormItem><FormLabel>Phone No</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                          <FormField control={form.control} name="currentCareProviderReg" render={({ field }) => (<FormItem><FormLabel>Registration Status</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Current Alternative Care Placement Type */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Current alternative care placement type:</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          "Kinship care", "Foster care", "Temporary shelter", "CCI", "SCI",
                          "Supported child-headed household", "Supported independent living (SIL)", "Guardianship", "Kafaalah", "Other"
                        ].map((item) => (
                          <FormField key={item} control={form.control} name="currentCarePlacementType" render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), item])
                                      : field.onChange(field.value?.filter((value) => value !== item));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal text-xs">{item}</FormLabel>
                            </FormItem>
                          )} />
                        ))}
                      </div>
                      {form.watch("currentCarePlacementType")?.includes("Other") && (
                        <FormField control={form.control} name="currentCarePlacementOther" render={({ field }) => (
                          <FormItem><FormControl><Input {...field} placeholder="Specify other..." className="max-w-md" /></FormControl></FormItem>
                        )} />
                      )}
                    </div>

                    <Separator />

                    {/* Reasons for Admission */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Reasons for admission (tick all that apply):</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {[
                          "School/education access", "Poverty/family vulnerability",
                          "Abuse or neglect at home", "Child abandoned",
                          "Child on the street", "HIV & AIDS or other chronic illness",
                          "Special needs (disability)", "Child victim of human trafficking",
                          "Orphan", "Child lost and found",
                          "Separated/unaccompanied", "Child of imprisoned parent",
                          "Other"
                        ].map((item) => (
                          <FormField key={item} control={form.control} name="reasonsForAdmissionList" render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), item])
                                      : field.onChange(field.value?.filter((value) => value !== item));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal text-xs">{item}</FormLabel>
                            </FormItem>
                          )} />
                        ))}
                      </div>
                      {form.watch("reasonsForAdmissionList")?.includes("Other") && (
                        <FormField control={form.control} name="reasonsForAdmissionOther" render={({ field }) => (
                          <FormItem><FormControl><Input {...field} placeholder="Specify other reasons..." /></FormControl></FormItem>
                        )} />
                      )}
                    </div>

                    <Separator />

                    {/* Previous History of Placements */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Previous history of placements</Label>
                      <div className="space-y-4">
                        {historyFields.map((field, index) => (
                          <div key={field.id} className="border rounded-md p-4 bg-background relative shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-medium text-muted-foreground">Placement {index + 1}</h4>
                              {historyFields.length > 1 && (
                                <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteIndex(index)} className="h-8 w-8 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <FormField control={form.control} name={`historyPlacementsData.${index}.type` as any} render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Type of placement</FormLabel><FormControl><Input {...field} placeholder="e.g. CCI, Kinship" /></FormControl></FormItem>
                              )} />
                              <FormField control={form.control} name={`historyPlacementsData.${index}.from` as any} render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">From (Date)</FormLabel><FormControl><Input {...field} placeholder="DD/MM/YYYY" /></FormControl></FormItem>
                              )} />
                              <FormField control={form.control} name={`historyPlacementsData.${index}.to` as any} render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">To (Date)</FormLabel><FormControl><Input {...field} placeholder="DD/MM/YYYY" /></FormControl></FormItem>
                              )} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => appendHistory({ type: "", from: "", to: "" })} className="mt-2 text-primary border-primary/20 hover:bg-primary/5"><Plus className="h-4 w-4 mr-2" /> Add Placement</Button>
                      <FormField control={form.control} name="historyOfPlacements" render={({ field }) => (
                        <FormItem className="mt-4"><FormLabel className="text-xs">If child has been in several types of care, indicate types/names of CCIs:</FormLabel><FormControl><Textarea {...field} className="h-20" /></FormControl></FormItem>
                      )} />
                    </div>

                    <Separator />

                    {/* Vulnerability */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">If child is not in any institution, indicate type of vulnerability:</Label>
                      <div className="space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-2 border rounded-md">
                          <FormField control={form.control} name="vulnerabilityType" render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0 min-w-[200px]">
                              <FormControl><Checkbox checked={field.value?.includes("Street-connected child")} onCheckedChange={(c) => c ? field.onChange([...(field.value || []), "Street-connected child"]) : field.onChange(field.value?.filter(v => v !== "Street-connected child"))} /></FormControl>
                              <FormLabel className="font-normal">Street-connected child</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="vulnerabilityLocationStreet" render={({ field }) => (
                            <FormItem className="flex-1 w-full"><FormControl><Input {...field} className="h-8" placeholder="Location" /></FormControl></FormItem>
                          )} />
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-2 border rounded-md">
                          <FormField control={form.control} name="vulnerabilityType" render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0 min-w-[200px]">
                              <FormControl><Checkbox checked={field.value?.includes("Child at risk of separation")} onCheckedChange={(c) => c ? field.onChange([...(field.value || []), "Child at risk of separation"]) : field.onChange(field.value?.filter(v => v !== "Child at risk of separation"))} /></FormControl>
                              <FormLabel className="font-normal">Child at risk of separation</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="vulnerabilityLocationSeparation" render={({ field }) => (
                            <FormItem className="flex-1 flex items-center gap-2 space-y-0"><FormLabel className="whitespace-nowrap">Location:</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl></FormItem>
                          )} />
                        </div>
                        <div className="flex items-center gap-4">
                          <FormField control={form.control} name="vulnerabilityType" render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0 min-w-[200px]">
                              <FormControl><Checkbox checked={field.value?.includes("Other")} onCheckedChange={(c) => c ? field.onChange([...(field.value || []), "Other"]) : field.onChange(field.value?.filter(v => v !== "Other"))} /></FormControl>
                              <FormLabel className="font-normal">Other</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="vulnerabilityOther" render={({ field }) => (
                            <FormItem className="flex-1"><FormControl><Input {...field} className="h-8" /></FormControl></FormItem>
                          )} />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Pre-admission Living */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-semibold">With whom and where was the child living before admission to care?</Label>
                        <p className="text-[10px] text-muted-foreground">(Hint: Look for tracing clues.)</p>
                      </div>

                      {/* Names and Relationships Grid */}
                      <div className="border rounded-md p-3 space-y-3 bg-muted/10">
                        <div className="grid grid-cols-[20px_1fr_1fr] gap-2 items-end mb-2">
                          <span className="text-xs font-semibold">#</span>
                          <span className="text-xs font-semibold">Name(s)</span>
                          <span className="text-xs font-semibold">Relationship(s) to child</span>
                        </div>
                        {[1, 2, 3, 4].slice(0, preAdmissionCount).map((num) => (
                          <div key={num} className="grid grid-cols-[20px_1fr_1fr_auto] gap-2 items-center">
                            <span className="text-xs">{num}.</span>
                            <FormField control={form.control} name={`preAdmissionPerson${num}Name` as any} render={({ field }) => (
                              <FormItem><FormControl><Input {...field} className="h-8" /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name={`preAdmissionPerson${num}Rel` as any} render={({ field }) => (
                              <FormItem><FormControl><Input {...field} className="h-8" /></FormControl></FormItem>
                            )} />
                            {preAdmissionCount > 1 && (
                              <Button type="button" variant="ghost" size="icon" onClick={() => setDeletePersonIndex(num)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            )}
                          </div>
                        ))}
                      </div>
                      {preAdmissionCount < 4 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => setPreAdmissionCount(c => c + 1)} className="mt-1"><Plus className="h-4 w-4 mr-2" /> Add Person</Button>
                      )}

                      {/* Contact and CCI */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="preAdmissionPhone" render={({ field }) => (
                          <FormItem><FormLabel>Phone no.</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />

                        <div className="space-y-4">
                          <FormField control={form.control} name="preAdmissionIsCCI" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>Institution</FormLabel>
                                <FormDescription>Specify if this placement was in CCI</FormDescription>
                              </div>
                              <FormControl>
                                <Checkbox
                                  checked={field.value === "Yes"}
                                  onCheckedChange={(checked) => field.onChange(checked ? "Yes" : "No")}
                                />
                              </FormControl>
                            </FormItem>
                          )} />
                          {form.watch("preAdmissionIsCCI") === "Yes" && (
                            <FormField control={form.control} name="preAdmissionCCIDetails" render={({ field }) => (
                              <FormItem><FormLabel>CCI Details</FormLabel><FormControl><Input {...field} placeholder="Name of CCI / Details" /></FormControl></FormItem>
                            )} />
                          )}
                        </div>
                      </div>

                      {/* Address Details */}
                      <div className="space-y-3 border p-3 rounded-md">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <FormField control={form.control} name="preAdmissionCounty" render={({ field }) => (
                            <FormItem><FormLabel>County</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name="preAdmissionSubCounty" render={({ field }) => (
                            <FormItem><FormLabel>Subcounty</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <FormField control={form.control} name="preAdmissionLocation" render={({ field }) => (
                            <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name="preAdmissionSubLocation" render={({ field }) => (
                            <FormItem><FormLabel>Sub-location</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                          )} />
                        </div>
                        <FormField control={form.control} name="preAdmissionVillage" render={({ field }) => (
                          <FormItem><FormLabel>Village/estate</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="preAdmissionLandmark" render={({ field }) => (
                          <FormItem><FormLabel>Landmark (e.g., school, church, mosque, market)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />
                      </div>
                    </div>

                  </CardContent><CardFooter className="flex justify-between"><Button type="button" variant="outline" onClick={() => setActiveTab('bio')}><ArrowLeft className="mr-2 h-4 w-4" /> Previous</Button><Button type="button" onClick={() => handleNext('family')}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button></CardFooter></Card>
              </TabsContent>

              <TabsContent value="family" className="space-y-4 pt-4">
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Family Information</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 border p-4 rounded">
                        <h3 className="font-semibold">Mother</h3>
                        <FormField control={form.control} name="motherStatus" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Alive">Alive</SelectItem>
                                <SelectItem value="Dead">Dead</SelectItem>
                                <SelectItem value="Unknown">Unknown</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="motherName" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        {form.watch("motherStatus") === "Alive" && (
                          <div className="space-y-3 pt-2 bg-muted/20 p-2 rounded border">
                            <div className="text-xs font-medium text-muted-foreground uppercase">Mother's Contact & Last Known Location</div>
                            <FormField control={form.control} name="motherContact" render={({ field }) => (<FormItem><FormLabel>Contact</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <div className="grid grid-cols-2 gap-2">
                              <FormField control={form.control} name="motherCounty" render={({ field }) => (<FormItem><FormLabel>County</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                              <FormField control={form.control} name="motherSubCounty" render={({ field }) => (<FormItem><FormLabel>Subcounty</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <FormField control={form.control} name="motherLocation" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                              <FormField control={form.control} name="motherSubLocation" render={({ field }) => (<FormItem><FormLabel>Sub-Location</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            </div>
                            <FormField control={form.control} name="motherVillage" render={({ field }) => (<FormItem><FormLabel>Village/estate</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="motherOccupation" render={({ field }) => (<FormItem><FormLabel>Occupation</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                          </div>
                        )}
                      </div>
                      <div className="space-y-4 border p-4 rounded">
                        <h3 className="font-semibold">Father</h3>
                        <FormField control={form.control} name="fatherStatus" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="Alive">Alive</SelectItem>
                                <SelectItem value="Dead">Dead</SelectItem>
                                <SelectItem value="Unknown">Unknown</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="fatherName" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        {form.watch("fatherStatus") === "Alive" && (
                          <div className="space-y-3 pt-2 bg-muted/20 p-2 rounded border">
                            <div className="text-xs font-medium text-muted-foreground uppercase">Father's Contact & Last Known Location</div>
                            <FormField control={form.control} name="fatherContact" render={({ field }) => (<FormItem><FormLabel>Contact</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <div className="grid grid-cols-2 gap-2">
                              <FormField control={form.control} name="fatherCounty" render={({ field }) => (<FormItem><FormLabel>County</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                              <FormField control={form.control} name="fatherSubCounty" render={({ field }) => (<FormItem><FormLabel>Subcounty</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <FormField control={form.control} name="fatherLocation" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                              <FormField control={form.control} name="fatherSubLocation" render={({ field }) => (<FormItem><FormLabel>Sub-Location</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            </div>
                            <FormField control={form.control} name="fatherVillage" render={({ field }) => (<FormItem><FormLabel>Village/estate</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="fatherOccupation" render={({ field }) => (<FormItem><FormLabel>Occupation</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                          </div>
                        )}
                      </div>
                    </div>
                    <FormField control={form.control} name="parentsLivingTogether" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parents living together?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                            <SelectItem value="Unknown">Unknown</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <div className="space-y-2">
                      <Label>Name(s) of other siblings currently living with caregiver</Label>
                      <div className="space-y-4">
                        {siblingFields.map((field, index) => (
                          <div key={field.id} className="border rounded-md p-4 bg-background relative shadow-sm space-y-3">
                            <div className="flex justify-between items-center">
                              <h4 className="text-sm font-medium text-muted-foreground">Sibling {index + 1}</h4>
                              {siblingFields.length > 1 && (
                                <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteSiblingIndex(index)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              <FormField control={form.control} name={`siblingsList.${index}.name`} render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                              )} />
                              <FormField control={form.control} name={`siblingsList.${index}.nickname`} render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Nickname</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                              )} />
                              <FormField control={form.control} name={`siblingsList.${index}.location`} render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Location</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                              )} />
                              <FormField control={form.control} name={`siblingsList.${index}.education`} render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Education/Emp</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                              )} />
                              <FormField control={form.control} name={`siblingsList.${index}.classLevel`} render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Class</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                              )} />
                              <FormField control={form.control} name={`siblingsList.${index}.age`} render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Age</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                              )} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => appendSibling({ name: "", nickname: "", location: "", education: "", classLevel: "", age: "" })} className="mt-2 text-primary border-primary/20 hover:bg-primary/5"><Plus className="h-4 w-4 mr-2" /> Add Sibling</Button>
                    </div>
                    <FormField control={form.control} name="siblingsElsewhere" render={({ field }) => (
                      <FormItem><FormLabel>Siblings admitted elsewhere</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
                    )} />
                    <div className="space-y-2">
                      <Label>Other Relatives</Label>
                      <div className="space-y-4">
                        {otherRelativesFields.map((field, index) => (
                          <div key={field.id} className="border rounded-md p-4 bg-background relative shadow-sm space-y-3">
                            <div className="flex justify-between items-center">
                              <h4 className="text-sm font-medium text-muted-foreground">Relative {index + 1}</h4>
                              {otherRelativesFields.length > 1 && (
                                <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteOtherRelativeIndex(index)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                              <FormField control={form.control} name={`otherRelativesList.${index}.name`} render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                              )} />
                              <FormField control={form.control} name={`otherRelativesList.${index}.relationship`} render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Relationship</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                              )} />
                              <FormField control={form.control} name={`otherRelativesList.${index}.location`} render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Location</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                              )} />
                              <FormField control={form.control} name={`otherRelativesList.${index}.phone`} render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Phone</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                              )} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => appendOtherRelative({ name: "", relationship: "", location: "", phone: "" })} className="mt-2 text-primary border-primary/20 hover:bg-primary/5"><Plus className="h-4 w-4 mr-2" /> Add Relative</Button>
                    </div>
                    <Card className="p-4 border shadow-sm mt-4">
                      <div className="space-y-4">
                        <Label className="uppercase text-xs font-semibold text-muted-foreground">Contact with Family</Label>
                        <div className="grid grid-cols-1 gap-4">
                          <FormField control={form.control} name="contactWithFamily" render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Is there any contact with family?</FormLabel>
                              <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-row space-x-4">
                                  <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                                  <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                                </RadioGroup>
                              </FormControl>
                            </FormItem>
                          )} />
                          {form.watch("contactWithFamily") === "Yes" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                              <FormField control={form.control} name="contactWithFamilyWhom" render={({ field }) => (<FormItem><FormLabel>If yes, with whom:</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                              <FormField control={form.control} name="contactWithFamilyLastVisit" render={({ field }) => (<FormItem><FormLabel>Date of last visit (or how long ago)?</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            </div>
                          )}
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <FormField control={form.control} name="homeOnHolidays" render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Does child go home on school holidays?</FormLabel>
                              <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-row space-x-4">
                                  <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                                  <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                                </RadioGroup>
                              </FormControl>
                            </FormItem>
                          )} />
                          <div className="space-y-3">
                            <FormField control={form.control} name="familyVisits" render={({ field }) => (
                              <FormItem className="space-y-3">
                                <FormLabel>Does family visit?</FormLabel>
                                <FormControl>
                                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-row space-x-4">
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                                  </RadioGroup>
                                </FormControl>
                              </FormItem>
                            )} />
                            {form.watch("familyVisits") === "Yes" && (
                              <FormField control={form.control} name="familyVisitFrequency" render={({ field }) => (<FormItem><FormLabel>If yes, who, and how often?</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            )}
                          </div>
                        </div>
                        <Separator />
                        <FormField control={form.control} name="caregiverPreference" render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Does the child express a preference for a caregiver?</FormLabel>
                            <FormDescription>(Hint: Do not directly ask the child. Use child-friendly methodologies like drawing or storytelling.)</FormDescription>
                            <FormControl>
                              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-row space-x-4">
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                              </RadioGroup>
                            </FormControl>
                          </FormItem>
                        )} />
                        {form.watch("caregiverPreference") === "Yes" && (
                          <FormField control={form.control} name="caregiverPreferenceDetails" render={({ field }) => (
                            <FormItem><FormLabel>Please explain preference</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
                          )} />
                        )}
                      </div>
                    </Card>
                  </CardContent><CardFooter className="flex justify-between"><Button type="button" variant="outline" onClick={() => setActiveTab('admission')}><ArrowLeft className="mr-2 h-4 w-4" /> Previous</Button><Button type="button" onClick={() => handleNext('wellbeing')}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button></CardFooter></Card>
              </TabsContent>

              <TabsContent value="wellbeing" className="space-y-4 pt-4">
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Health & Wellbeing</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="healthGrowth" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Is the child growing appropriately for his/her age?</FormLabel>
                        <FormDescription>For example, is he/she walking, speaking, developing self-help skills? (Describe physical skills and needs, intellectual skills and needs, social skills and needs.)</FormDescription>
                        <FormControl><Textarea {...field} className="min-h-[80px]" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="healthHistory" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Any history of medical issues/hospitalization? Frequency? (Explain and attach records.)</FormLabel>
                        <FormControl><Textarea {...field} className="min-h-[80px]" /></FormControl>
                      </FormItem>
                    )} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <FormField control={form.control} name="healthCurrentStatus" render={({ field }) => (
                          <FormItem className="space-y-4 rounded-md border p-4">
                            <FormLabel>Current Health Status</FormLabel>
                            <FormControl>
                              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Good" /></FormControl><FormLabel className="font-normal">Good</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Fair" /></FormControl><FormLabel className="font-normal">Fair</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Poor" /></FormControl><FormLabel className="font-normal">Poor</FormLabel></FormItem>
                              </RadioGroup>
                            </FormControl>
                            {(form.watch("healthCurrentStatus") === "Fair" || form.watch("healthCurrentStatus") === "Poor") && (
                              <FormField control={form.control} name="healthCurrentDetails" render={({ field }) => (<FormItem><FormLabel>Specify details/issues:</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            )}
                          </FormItem>
                        )} />
                      </div>
                      <div className="space-y-3">
                        <FormField control={form.control} name="healthChronicStatus" render={({ field }) => (
                          <FormItem className="space-y-4 rounded-md border p-4">
                            <FormLabel>Any chronic health conditions?</FormLabel>
                            <FormControl>
                              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                              </RadioGroup>
                            </FormControl>
                            {form.watch("healthChronicStatus") === "Yes" && (
                              <FormField control={form.control} name="healthChronicDetails" render={({ field }) => (<FormItem><FormLabel>Specify:</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            )}
                          </FormItem>
                        )} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <FormField control={form.control} name="healthMedsStatus" render={({ field }) => (
                          <FormItem className="space-y-4 rounded-md border p-4">
                            <FormLabel>Currently on any medication?</FormLabel>
                            <FormControl>
                              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                              </RadioGroup>
                            </FormControl>
                            {form.watch("healthMedsStatus") === "Yes" && (
                              <FormField control={form.control} name="healthMedsDetails" render={({ field }) => (<FormItem><FormLabel>Specify:</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            )}
                          </FormItem>
                        )} />
                      </div>
                      <div className="space-y-3">
                        <FormField control={form.control} name="healthAllergyStatus" render={({ field }) => (
                          <FormItem className="space-y-4 rounded-md border p-4">
                            <FormLabel>Any allergy?</FormLabel>
                            <FormControl>
                              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-wrap">
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                              </RadioGroup>
                            </FormControl>
                            {form.watch("healthAllergyStatus") === "Yes" && (
                              <FormField control={form.control} name="healthAllergyDetails" render={({ field }) => (<FormItem><FormLabel>Specify:</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            )}
                          </FormItem>
                        )} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <FormField control={form.control} name="healthImmunizationStatus" render={({ field }) => (
                        <FormItem className="space-y-4 rounded-md border p-4">
                          <FormLabel>Has the child been fully immunized?</FormLabel>
                          <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-wrap">
                              <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                            </RadioGroup>
                          </FormControl>
                          {form.watch("healthImmunizationStatus") === "No" && (
                            <FormField control={form.control} name="healthImmunizationReason" render={({ field }) => (<FormItem><FormLabel>If no, what is the reason?</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                          )}
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="healthFeeding" render={({ field }) => (<FormItem><FormLabel>Feeding routine and special needs:</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                  </CardContent></Card>
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><School className="h-5 w-5" /> Education</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    {/* Previous School */}
                    <div className="space-y-4 border p-4 rounded-md">
                      <FormField control={form.control} name="educationPreviousStatus" render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="font-semibold">Previously attended any school?</FormLabel>
                          <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-wrap">
                              <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )} />
                      {form.watch("educationPreviousStatus") === "Yes" && (
                        <div className="space-y-4 pl-2 border-l-2 ml-1">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="educationPreviousType" render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel className="text-xs uppercase text-muted-foreground">Type</FormLabel>
                                <FormControl>
                                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-wrap">
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Public" /></FormControl><FormLabel className="font-normal">Public</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Private" /></FormControl><FormLabel className="font-normal">Private</FormLabel></FormItem>
                                  </RadioGroup>
                                </FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="educationPreviousMode" render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel className="text-xs uppercase text-muted-foreground">Mode</FormLabel>
                                <FormControl>
                                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-wrap">
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Day" /></FormControl><FormLabel className="font-normal">Day</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Boarding" /></FormControl><FormLabel className="font-normal">Boarding</FormLabel></FormItem>
                                  </RadioGroup>
                                </FormControl>
                              </FormItem>
                            )} />
                          </div>
                          <FormField control={form.control} name="educationPreviousNameLocation" render={({ field }) => (
                            <FormItem><FormLabel>Name and location of school</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                          )} />
                        </div>
                      )}
                    </div>

                    {/* Current School */}
                    <div className="space-y-4 border p-4 rounded-md">
                      <FormField control={form.control} name="educationCurrentStatus" render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="font-semibold">Child currently attending school?</FormLabel>
                          <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-wrap">
                              <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )} />
                      {form.watch("educationCurrentStatus") === "Yes" && (
                        <div className="space-y-4 pl-2 border-l-2 ml-1">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="educationCurrentType" render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel className="text-xs uppercase text-muted-foreground">Type</FormLabel>
                                <FormControl>
                                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-wrap">
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Public" /></FormControl><FormLabel className="font-normal">Public</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Private" /></FormControl><FormLabel className="font-normal">Private</FormLabel></FormItem>
                                  </RadioGroup>
                                </FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="educationCurrentMode" render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel className="text-xs uppercase text-muted-foreground">Mode</FormLabel>
                                <FormControl>
                                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-wrap">
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Day" /></FormControl><FormLabel className="font-normal">Day</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Boarding" /></FormControl><FormLabel className="font-normal">Boarding</FormLabel></FormItem>
                                  </RadioGroup>
                                </FormControl>
                              </FormItem>
                            )} />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="educationCurrentNameLocation" render={({ field }) => (
                              <FormItem><FormLabel>Name and location of school</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="educationCurrentLevel" render={({ field }) => (
                              <FormItem><FormLabel>Current education level (ECD/Class/Form/Vocational/Tertiary)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                            )} />
                          </div>
                        </div>
                      )}
                    </div>

                    <FormField control={form.control} name="educationPerformance" render={({ field }) => (
                      <FormItem><FormLabel>Attendance, performance, extracurricular activity, and behavior</FormLabel><FormDescription>(Hint: Contact school directly.)</FormDescription><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl></FormItem>
                    )} />
                  </CardContent></Card>
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" /> Psychosocial & Emotional Wellbeing</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    {/* Friends */}
                    <div className="space-y-4 border p-4 rounded-md">
                      <Label className="text-sm font-semibold uppercase text-muted-foreground">Peer Friendships</Label>
                      <FormField control={form.control} name="psychoFriendsActivities" render={({ field }) => (
                        <FormItem><FormLabel>Who are the child’s friends? What kinds of things do they do together? How often do they interact?</FormLabel><FormControl><Textarea {...field} className="min-h-[80px]" /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="psychoFriendsViews" render={({ field }) => (
                        <FormItem><FormLabel>What are the child’s views of these peer friendships?</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="psychoFriendQuality" render={({ field }) => (
                          <FormItem><FormLabel>Quality of friendships (encourage positive/negative behavior)?</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="psychoFriendAge" render={({ field }) => (
                          <FormItem><FormLabel>Are friends older, younger, or same age?</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />
                      </div>
                    </div>

                    {/* Attachment */}
                    <div className="space-y-4 border p-4 rounded-md">
                      <Label className="text-sm font-semibold uppercase text-muted-foreground">Caregiver Attachment</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="font-medium underline">Current Caregiver</Label>
                          <FormField control={form.control} name="psychoCaregiverAttachmentLevel" render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel>Level of Attachment</FormLabel>
                              <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-wrap">
                                  <FormItem className="flex items-center space-x-1"><FormControl><RadioGroupItem value="High" /></FormControl><FormLabel className="font-normal">High</FormLabel></FormItem>
                                  <FormItem className="flex items-center space-x-1"><FormControl><RadioGroupItem value="Medium" /></FormControl><FormLabel className="font-normal">Medium</FormLabel></FormItem>
                                  <FormItem className="flex items-center space-x-1"><FormControl><RadioGroupItem value="Low" /></FormControl><FormLabel className="font-normal">Low</FormLabel></FormItem>
                                </RadioGroup>
                              </FormControl>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="psychoCaregiverAttachmentDesc" render={({ field }) => (
                            <FormItem><FormLabel>Describe the relationship</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
                          )} />
                        </div>
                        <div className="space-y-3">
                          <Label className="font-medium underline">Previous Primary Caregiver</Label>
                          <FormField control={form.control} name="psychoPrevCaregiverAttachmentLevel" render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel>Level of Attachment</FormLabel>
                              <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-wrap">
                                  <FormItem className="flex items-center space-x-1"><FormControl><RadioGroupItem value="High" /></FormControl><FormLabel className="font-normal">High</FormLabel></FormItem>
                                  <FormItem className="flex items-center space-x-1"><FormControl><RadioGroupItem value="Medium" /></FormControl><FormLabel className="font-normal">Medium</FormLabel></FormItem>
                                  <FormItem className="flex items-center space-x-1"><FormControl><RadioGroupItem value="Low" /></FormControl><FormLabel className="font-normal">Low</FormLabel></FormItem>
                                </RadioGroup>
                              </FormControl>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="psychoPrevCaregiverAttachmentDesc" render={({ field }) => (
                            <FormItem><FormLabel>Describe the relationship</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
                          )} />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">(Hint: Ask child open-ended questions about his/her relationships; observe who the child spends time with; ask caregivers who they spend time with.)</p>
                    </div>

                    {/* Behavior / Risks */}
                    <div className="space-y-4 border p-4 rounded-md">
                      <FormField control={form.control} name="psychoRisks" render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel className="text-base">Does the child exhibit any of the following?</FormLabel>
                            <FormDescription>(Hint: Observe, ask caregivers, ask other children. Describe examples of the child’s reactions to situations.)</FormDescription>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {["Self-harm", "Known history of abuse", "Inappropriate sexual behavior", "Drug and/or substance abuse", "Displays potential symptoms of abuse", "Displays signs of emotional distress", "Exhibits risk", "Any unexplained recent change in behavior"].map((item) => (
                              <FormField key={item} control={form.control} name="psychoRisks" render={({ field }) => {
                                return (
                                  <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...(field.value || []), item])
                                            : field.onChange(field.value?.filter((value) => value !== item))
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">{item}</FormLabel>
                                  </FormItem>
                                )
                              }} />
                            ))}
                          </div>
                        </FormItem>
                      )} />
                    </div>

                    {/* Routine & Independence */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="psychoRoutine" render={({ field }) => (<FormItem><FormLabel>Daily routine:</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="psychoIndependence" render={({ field }) => (<FormItem><FormLabel>Degree of independence</FormLabel><FormDescription>(what can the child do for himself/herself and what help does the child need?)</FormDescription><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                    </div>

                    {/* Likes/Dislikes Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="psychoLikes" render={({ field }) => (<FormItem><FormLabel>Likes</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="psychoDislikes" render={({ field }) => (<FormItem><FormLabel>Dislikes</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="psychoFears" render={({ field }) => (<FormItem><FormLabel>Fears</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="psychoSkills" render={({ field }) => (<FormItem><FormLabel>Skills/strengths</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>
                  </CardContent><CardFooter className="flex justify-between"><Button type="button" variant="outline" onClick={() => setActiveTab('family')}><ArrowLeft className="mr-2 h-4 w-4" /> Previous</Button><Button type="button" onClick={() => handleNext('conclusion')}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button></CardFooter></Card>
              </TabsContent>

              <TabsContent value="conclusion" className="space-y-4 pt-4">
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Child Perspective on Reintegration</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            <span className="font-bold">Caution:</span> This information should be attained later in the process. Do not make promises about reunification. Use age-appropriate means to gather information.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 border p-4 rounded-md">
                      <FormField control={form.control} name="reintegrationPreferenceStatus" render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="font-semibold block break-words">Does the child express a preference for reunification/placement?</FormLabel>
                          <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-wrap">
                              <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Unsure" /></FormControl><FormLabel className="font-normal">Unsure</FormLabel></FormItem>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )} />
                      {form.watch("reintegrationPreferenceStatus") === "Yes" && (
                        <FormField control={form.control} name="reintegrationPreferenceDetails" render={({ field }) => (<FormItem><FormLabel>Specify:</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                      )}
                    </div>

                    <div className="space-y-4 border p-4 rounded-md">
                      <FormField control={form.control} name="reintegrationConcernsStatus" render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="font-semibold block break-words">Does the child express concerns about reunification/placement?</FormLabel>
                          <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-wrap">
                              <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )} />
                      {form.watch("reintegrationConcernsStatus") === "Yes" && (
                        <FormField control={form.control} name="reintegrationConcernsDetails" render={({ field }) => (<FormItem><FormLabel>If yes, specify:</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                      )}
                    </div>
                  </CardContent></Card>
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><CheckSquare className="h-5 w-5" /> Assessment Conclusion</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="assessmentStatus" render={({ field }) => (
                      <FormItem><FormLabel>Assessment Status</FormLabel><Select onValueChange={field.onChange} value={field.value || "Pending"}><FormControl><SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Pending">Pending (Draft)</SelectItem><SelectItem value="In Progress">In Progress</SelectItem><SelectItem value="Completed">Completed</SelectItem></SelectContent></Select></FormItem>
                    )} />
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="assessmentStrengths" render={({ field }) => (
                        <FormItem><FormLabel>Strengths & Resources</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="assessmentNeeds" render={({ field }) => (
                        <FormItem><FormLabel>Needs / Concerns</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="assessmentObservations" render={({ field }) => (
                        <FormItem><FormLabel>Additional Observations</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="assessmentGoals" render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>Things to be achieved</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl></FormItem>
                      )} />
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 border p-4 rounded">
                        <h3 className="font-semibold">Caseworker</h3>
                        <FormField control={form.control} name="caseworkerName" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="caseworkerSignDate" render={({ field }) => (<FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                      </div>
                      <div className="space-y-4 border p-4 rounded">
                        <h3 className="font-semibold">Case Manager</h3>
                        <FormField control={form.control} name="managerName" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="managerSignDate" render={({ field }) => (<FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                      </div>
                    </div>
                  </CardContent><CardFooter className="flex justify-start"><Button type="button" variant="outline" onClick={() => setActiveTab('wellbeing')}><ArrowLeft className="mr-2 h-4 w-4" /> Previous</Button></CardFooter></Card>
              </TabsContent>

              {activeTab === "conclusion" && (
                <div className="flex justify-end gap-4 mt-6">
                  <Button type="button" variant="outline" onClick={() => navigate("/clients")}>Cancel</Button>
                  <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Record"}</Button>
                </div>
              )}
            </Tabs>
          </form>
        </Form>
        <AlertDialog open={deleteIndex !== null} onOpenChange={(open) => !open && setDeleteIndex(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone. This will permanently remove this placement record.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                if (deleteIndex !== null) {
                  removeHistory(deleteIndex);
                  setDeleteIndex(null);
                }
              }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={deletePersonIndex !== null} onOpenChange={(open) => !open && setDeletePersonIndex(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Person?</AlertDialogTitle>
              <AlertDialogDescription>This will remove this person from the list and shift subsequent entries up.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                if (deletePersonIndex !== null) {
                  const current = form.getValues();
                  for (let i = deletePersonIndex; i < preAdmissionCount; i++) {
                    // @ts-ignore
                    form.setValue(`preAdmissionPerson${i}Name`, current[`preAdmissionPerson${i + 1}Name`]);
                    // @ts-ignore
                    form.setValue(`preAdmissionPerson${i}Rel`, current[`preAdmissionPerson${i + 1}Rel`]);
                  }
                  // @ts-ignore
                  form.setValue(`preAdmissionPerson${preAdmissionCount}Name`, "");
                  // @ts-ignore
                  form.setValue(`preAdmissionPerson${preAdmissionCount}Rel`, "");

                  setPreAdmissionCount(c => c - 1);
                  setDeletePersonIndex(null);
                }
              }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
          <AlertDialog open={deleteSiblingIndex !== null} onOpenChange={(open) => !open && setDeleteSiblingIndex(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone. This will permanently remove this sibling record.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  if (deleteSiblingIndex !== null) {
                    removeSibling(deleteSiblingIndex);
                    setDeleteSiblingIndex(null);
                  }
                }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </AlertDialog>
        <AlertDialog open={deleteOtherRelativeIndex !== null} onOpenChange={(open) => !open && setDeleteOtherRelativeIndex(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone. This will permanently remove this relative record.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                if (deleteOtherRelativeIndex !== null) {
                  removeOtherRelative(deleteOtherRelativeIndex);
                  setDeleteOtherRelativeIndex(null);
                }
              }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default RegisterClient;
