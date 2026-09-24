
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
    User,
    Calendar,
    MapPin,
    Phone,
    Edit,
    ArrowRight,
    ClipboardList,
    Clock,
    Briefcase,
    Users,
    FileText,
    ArrowLeft,
    Cake,
    UserCircle,
    GraduationCap,
    Shield,
    Heart,
    Home,
    ChevronDown,
    AlertTriangle,
    BookOpen,
    Download,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Client {
    id: string;
    name: string;
    client_id: string;
    age: number;
    gender: string;
    date_of_birth: string | null;
    nickname: string | null;
    admission_type: string | null;
    admission_type_details: string | null;
    street_name: string | null;
    street_duration: string | null;
    partner_name: string | null;
    partner_contact_person: string | null;
    partner_contact: string | null;
    admission_date: string;
    intake_number: string | null;
    police_ob_number: string | null;
    status: string;
    family_composition: string | null;
    siblings_info: string | null;
    mother_status: string | null;
    mother_name: string | null;
    mother_location: string | null;
    mother_contact: string | null;
    mother_occupation: string | null;
    father_status: string | null;
    father_name: string | null;
    father_location: string | null;
    father_contact: string | null;
    father_occupation: string | null;
    guardian_status: string | null;
    guardian_name: string | null;
    guardian_location: string | null;
    guardian_contact: string | null;
    guardian_occupation: string | null;
    education_level: string | null;
    school_name: string | null;
    level_reached: string | null;
    education_status: string | null;
    profile_picture: string | null;
    rescue_details: string | null;
    contact: string;
    address: string;
    notes: string;
    created_at: string;
    aftercare_records?: AftercareRecord[];
    file_no?: string | null;
    admitted_category?: string | null;
    referring_officer?: string | null;
    home_district?: string | null;
    nearest_school?: string | null;
    parents?: {
        id: string;
        first_name: string;
        last_name: string;
        relationship: string;
        phone_primary: string | null;
        occupation: string | null;
    }[];
    rescue_committal_date?: string | null;
    rescue_location?: string | null;
    rescue_dispatch_officer?: string | null;
}

interface AftercareRecord {
    id: string;
    institution_workshop: string;
    placement_course: string | null;
    contact_person: string | null;
    contact_phone: string | null;
    placement_date: string | null;
    completion_date: string | null;
    placement_location: string | null;
    placement_fees: number | null;
    placement_type: string | null;
    placement_type_details: string | null;
    completion_status: string;
    notes: string | null;
}

const safeJsonParse = (input: any) => {
    if (!input) return { notes: "", assessmentData: null };

    let parsed = input;

    if (typeof input === 'string') {
        try {
            parsed = JSON.parse(input);
        } catch (e) {
            try {
                // Attempt to clean unescaped newlines/tabs which are common
                const cleaned = input.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
                parsed = JSON.parse(cleaned);
            } catch (e2) {
                // If it still fails but looks like our data, suppress it
                if (input.includes('"assessmentData"')) {
                    return { notes: "", assessmentData: null };
                }
                return { notes: input, assessmentData: null };
            }
        }
    }

    if (typeof parsed === 'object' && parsed !== null) {
        if ('notes' in parsed || 'assessmentData' in parsed) {
            return {
                notes: parsed.notes || "",
                assessmentData: parsed.assessmentData || {}
            };
        }
        // Fallback: If it's a structured object from Admission Form, treat it as assessmentData
        return { notes: "", assessmentData: parsed };
    }

    return { notes: String(input), assessmentData: null };
};

const ClientDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);

    const { notes: actualNotes, assessmentData } = client ? safeJsonParse(client.notes) : { notes: "", assessmentData: null };

    useEffect(() => {
        if (id) {
            fetchClientDetails();

            // Subscribe to realtime changes
            const channel = supabase
                .channel('client-details-changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'clients',
                        filter: `id=eq.${id}`
                    },
                    (payload) => {
                        console.log('Realtime update received:', payload);
                        fetchClientDetails();
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'aftercare_records',
                        filter: `client_id=eq.${id}`
                    },
                    (payload) => {
                        console.log('Realtime aftercare update received:', payload);
                        fetchClientDetails();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [id]);

    const fetchClientDetails = async () => {
        try {
            // Don't set loading to true on refetches to avoid flickering
            if (!client) setLoading(true);

            const { data, error } = await supabase
                .from('clients')
                .select(`
                    *,
                    aftercare_records (*)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setClient(data);
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Active":
                return "bg-success/20 text-success border-success/30";
            case "Graduated":
            case "Complete":
                return "bg-primary/20 text-primary border-primary/30";
            case "Escape":
                return "bg-red-100 text-red-600 border-red-300 dark:bg-red-950 dark:text-red-400";
            case "Voluntary Discharge":
                return "bg-purple-100 text-purple-600 border-purple-300 dark:bg-purple-950 dark:text-purple-400";
            case "Early Reintegration":
                return "bg-blue-100 text-blue-600 border-blue-300 dark:bg-blue-950 dark:text-blue-400";
            case "Alumni - Awaiting Placement":
                return "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-400";
            case "Alumni - Placed":
                return "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-400";
            default:
                return "bg-muted text-muted-foreground";
        }
    };

    const formatSiblingsInfo = (info: string | undefined | null) => {
        if (!info) return '';
        try {
            const parsed = JSON.parse(info);
            if (Array.isArray(parsed)) {
                return parsed.map((s: any) => {
                    const parts = [];
                    if (s.name) parts.push(s.name);
                    const details = [];
                    if (s.age) details.push(`${s.age}y`);
                    if (s.sex) details.push(s.sex);
                    if (details.length > 0) parts.push(`(${details.join(', ')})`);
                    if (s.schoolStatus) parts.push(`- ${s.schoolStatus}`);
                    return parts.join(' ');
                }).join('; ');
            }
            return info;
        } catch {
            return info;
        }
    };

    const handleExportPDF = async () => {
        if (!client) return;
        
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        let startY = 20;
        
        // --- Header Setup ---
        try {
            const logoUrl = '/mwangaza_logo.png';
            const img = new Image();
            img.src = logoUrl;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            if (img.width) {
                const imgWidth = 30;
                const imgHeight = (img.height * imgWidth) / img.width;
                const imgX = (pageWidth - imgWidth) / 2;
                doc.addImage(img, 'PNG', imgX, 10, imgWidth, imgHeight);
                startY = 10 + imgHeight + 8;
            }
        } catch (error) {
            console.error("Error adding logo to PDF", error);
        }
        
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text("Client Profile Details", pageWidth / 2, startY, { align: "center" });
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, startY + 6, { align: "center" });
        
        // Helper to cleanly handle lists and text formatting
        const cleanVal = (val: any): string => {
            if (Array.isArray(val)) return val.join(', ');
            return String(val || '');
        };

        const addSectionTable = (title: string, data: any[]) => {
           if (data.length === 0) return;
           
           const formattedBody: any[] = [];
           let currentRow: any[] = [];
           
           data.forEach((row) => {
               const label = row[0];
               const val = cleanVal(row[1]);
               const isLong = val.length > 65 || val.includes('\n');
               
               if (isLong) {
                   if (currentRow.length > 0) {
                       currentRow.push('', '');
                       formattedBody.push(currentRow);
                       currentRow = [];
                   }
                   formattedBody.push([
                       { content: label, styles: { fontStyle: 'bold' } }, 
                       { content: val, colSpan: 3 }
                   ]);
               } else {
                   currentRow.push({ content: label, styles: { fontStyle: 'bold' } }, val);
                   if (currentRow.length === 4) {
                       formattedBody.push(currentRow);
                       currentRow = [];
                   }
               }
           });
           
           if (currentRow.length > 0) {
               currentRow.push('', '');
               formattedBody.push(currentRow);
           }
           
           autoTable(doc, {
               startY: finalY + 10,
               head: [[{ content: title, colSpan: 4, styles: { halign: 'left' } }]],
               body: formattedBody,
               theme: 'grid',
               headStyles: { fillColor: [63, 81, 181] },
               columnStyles: { 
                   0: { cellWidth: 40, fillColor: [240, 244, 248] }, 
                   2: { cellWidth: 40, fillColor: [240, 244, 248] } 
               },
           });
           finalY = (doc as any).lastAutoTable.finalY;
        };

        const addWideTable = (title: string, head: string[], body: string[][]) => {
            if (body.length === 0) return;
            autoTable(doc, {
                startY: finalY + 10,
                head: [[{ content: title, colSpan: head.length, styles: { fillColor: [63, 81, 181], textColor: 255 } }], head],
                body,
                theme: 'grid',
                headStyles: { fillColor: [100, 130, 200] },
            });
            finalY = (doc as any).lastAutoTable.finalY;
        };

        let finalY = startY + 12;

        // ---- Basic Info ----
        const basicInfoData = [
            ['Name', client.name],
            ['Client ID', client.client_id],
            ['Status', client.status],
            ['Age', `${client.age} years`],
            ['Gender', client.gender],
            ['Date of Birth', client.date_of_birth ? new Date(client.date_of_birth).toLocaleDateString() : 'N/A'],
            ...(client.nickname ? [['Nickname', client.nickname]] : []),
            ...(client.intake_number ? [['Intake Number', client.intake_number]] : []),
            ...(client.police_ob_number ? [['Police OB Number', client.police_ob_number]] : []),
            ['Admission Date', new Date(client.admission_date).toLocaleDateString()],
            ...(assessmentData?.religion ? [['Religion', assessmentData.religion]] : []),
            ...(assessmentData?.ethnicity ? [['Ethnicity', assessmentData.ethnicity]] : []),
            ...(assessmentData?.ethnicCommunity ? [['Ethnic Community', assessmentData.ethnicCommunity]] : []),
            ...(assessmentData?.healthCondition ? [['Health Condition', assessmentData.healthCondition]] : []),
            ...(assessmentData?.hobbies ? [['Hobbies', assessmentData.hobbies]] : []),
            ...(assessmentData?.drugsAbused ? [['Drugs Abused', assessmentData.drugsAbused]] : []),
        ];
        addSectionTable('Basic Information', basicInfoData);

        // ---- Extended Biographical Details ----
        const bioData: any[] = [
            ...(assessmentData?.admissionAge ? [['Admission Age', assessmentData.admissionAge]] : []),
            ...(assessmentData?.birthRegistered ? [['Birth Registered', assessmentData.birthRegistered]] : []),
            ...(assessmentData?.birthRegistrationNumber ? [['Birth Reg No.', assessmentData.birthRegistrationNumber]] : []),
            ...(assessmentData?.placeOfBirth ? [['Place of Birth', assessmentData.placeOfBirth]] : []),
            ...(assessmentData?.placeOfBirthCounty ? [['Place of Birth (County)', assessmentData.placeOfBirthCounty]] : []),
            ...(assessmentData?.placeOfBirthSubCounty ? [['Place of Birth (Sub-County)', assessmentData.placeOfBirthSubCounty]] : []),
            ...(assessmentData?.placeOfBirthVillage ? [['Place of Birth (Village)', assessmentData.placeOfBirthVillage]] : []),
            ...(assessmentData?.height ? [['Height', assessmentData.height]] : []),
            ...(assessmentData?.weight ? [['Weight', assessmentData.weight]] : []),
            ...(assessmentData?.complexion ? [['Complexion', assessmentData.complexion]] : []),
            ...(assessmentData?.distinguishingFeatures ? [['Distinguishing Features', assessmentData.distinguishingFeatures]] : []),
            ...(assessmentData?.languages ? [['Languages', assessmentData.languages]] : []),
        ];
        addSectionTable('Extended Biographical Details', bioData);

        // ---- Admission Details ----
        const admissionData: any[] = [
            ['Admission Form', assessmentData?.otherAdmissionForms || 'Standard'],
            ...(client.admission_type ? [['Admission Type', client.admission_type]] : []),
            ...(client.admission_type_details ? [['Admission Details', client.admission_type_details]] : []),
            ...(assessmentData?.currentCarePlacementType ? [['Current Care Placement', assessmentData.currentCarePlacementType]] : []),
            ...(assessmentData?.currentCarePlacementOther ? [['Current Care Placement (Other)', assessmentData.currentCarePlacementOther]] : []),
            ...(client.partner_name ? [['Partner Name', client.partner_name]] : []),
            ...(client.partner_contact_person ? [['Contact Person', client.partner_contact_person]] : []),
            ...(client.partner_contact ? [['Contact Phone', client.partner_contact]] : []),
            ...(client.street_name ? [['Street Base/Name', client.street_name]] : []),
            ...(client.street_duration ? [['Duration on Street', client.street_duration]] : []),
            ...(assessmentData?.committalOrderNo ? [['Committal Order No', assessmentData.committalOrderNo]] : []),
            ...(assessmentData?.placementOrderNo ? [['Placement Order No', assessmentData.placementOrderNo]] : []),
            ...(assessmentData?.committalDate ? [['Date of Committal', assessmentData.committalDate]] : []),
            ...(assessmentData?.dcsSubcounty ? [['DCS Sub-County', assessmentData.dcsSubcounty]] : []),
            ...(client.referring_officer ? [['Referring Officer', client.referring_officer]] : []),
            ...(client.home_district ? [['Home District', client.home_district]] : []),
            ...(client.nearest_school ? [['Nearest School', client.nearest_school]] : []),
            ...(assessmentData?.referralSource ? [['Referral Source', assessmentData.referralSource]] : []),
            ...(assessmentData?.referralDate ? [['Referral Date', assessmentData.referralDate]] : []),
        ];
        addSectionTable('Admission Details', admissionData);

        // ---- Pre-Admission & Vulnerability ----
        const preAdmData: any[] = [
            ...(assessmentData?.preAdmissionLiving ? [['Living Situation', assessmentData.preAdmissionLiving]] : []),
            ...(assessmentData?.preAdmissionPerson1Name ? [['Primary Contact Name', assessmentData.preAdmissionPerson1Name]] : []),
            ...(assessmentData?.preAdmissionPerson1Rel ? [['Relationship', assessmentData.preAdmissionPerson1Rel]] : []),
            ...(assessmentData?.preAdmissionPhone ? [['Phone', assessmentData.preAdmissionPhone]] : []),
            ...(assessmentData?.preAdmissionIsCCI ? [['In CCI?', assessmentData.preAdmissionIsCCI]] : []),
            ...(assessmentData?.preAdmissionCCIDetails ? [['CCI Details', assessmentData.preAdmissionCCIDetails]] : []),
            ...(assessmentData?.vulnerabilityType ? [['Vulnerability Type', assessmentData.vulnerabilityType]] : []),
            ...(assessmentData?.vulnerabilityLocationStreet ? [['Vulnerability Location (Street)', assessmentData.vulnerabilityLocationStreet]] : []),
            ...(assessmentData?.vulnerabilityLocationSeparation ? [['Vulnerability Location (Separation)', assessmentData.vulnerabilityLocationSeparation]] : []),
            ...(assessmentData?.vulnerabilityOther ? [['Other Vulnerability', assessmentData.vulnerabilityOther]] : []),
        ];
        addSectionTable('Pre-Admission & Vulnerability', preAdmData);

        // ---- Residential & Home Details (From Admission Form) ----
        if (assessmentData?.homeDetails || assessmentData?.residentialDetails) {
            const homeData: any[] = [];
            if (assessmentData.homeDetails) {
                if (assessmentData.homeDetails.county) homeData.push(['Home County', assessmentData.homeDetails.county]);
                if (assessmentData.homeDetails.subCounty) homeData.push(['Home Sub-County', assessmentData.homeDetails.subCounty]);
                if (assessmentData.homeDetails.location) homeData.push(['Home Location', assessmentData.homeDetails.location]);
                if (assessmentData.homeDetails.subLocation) homeData.push(['Home Sub-Location', assessmentData.homeDetails.subLocation]);
                if (assessmentData.homeDetails.village) homeData.push(['Home Village', assessmentData.homeDetails.village]);
                if (assessmentData.homeDetails.address) homeData.push(['Home Address', assessmentData.homeDetails.address]);
            }
            if (assessmentData.residentialDetails) {
                if (assessmentData.residentialDetails.placeBeforeStreet) homeData.push(['Place Lived Before Street', assessmentData.residentialDetails.placeBeforeStreet]);
                if (assessmentData.residentialDetails.reasonForStreet) homeData.push(['Reason for Street Life', assessmentData.residentialDetails.reasonForStreet]);
            }
            addSectionTable('Home / Rural Particulars & Residential Details', homeData);
        }

        // ---- Education Information ----
        const eduData: any[] = [
            ...(client.education_level ? [['Education Level', client.education_level]] : []),
            ...(client.school_name ? [['School Name', client.school_name]] : []),
            ...(client.level_reached ? [['Level Reached', client.level_reached]] : []),
            ...(client.education_status ? [['Education Status', client.education_status]] : []),
            ...(assessmentData?.educationCurrentStatus ? [['Current Status', assessmentData.educationCurrentStatus]] : []),
            ...(assessmentData?.educationCurrentType ? [['Current Type', assessmentData.educationCurrentType]] : []),
            ...(assessmentData?.educationCurrentMode ? [['Current Mode', assessmentData.educationCurrentMode]] : []),
            ...(assessmentData?.educationCurrentNameLocation ? [['Current Name & Location', assessmentData.educationCurrentNameLocation]] : []),
            ...(assessmentData?.educationCurrentLevel ? [['Current Level', assessmentData.educationCurrentLevel]] : []),
            ...(assessmentData?.educationPerformance ? [['Performance', assessmentData.educationPerformance]] : []),
            ...(assessmentData?.educationPreviousStatus ? [['Previous Status', assessmentData.educationPreviousStatus]] : []),
            ...(assessmentData?.educationPreviousType ? [['Previous Type', assessmentData.educationPreviousType]] : []),
            ...(assessmentData?.educationPreviousMode ? [['Previous Mode', assessmentData.educationPreviousMode]] : []),
            ...(assessmentData?.educationPreviousNameLocation ? [['Previous Name & Location', assessmentData.educationPreviousNameLocation]] : []),
        ];
        
        if (assessmentData?.schoolInfo) {
            if (assessmentData.schoolInfo.typeOfSchool) eduData.push(['Type of School', assessmentData.schoolInfo.typeOfSchool]);
            if (assessmentData.schoolInfo.schoolLocation) eduData.push(['School Location', assessmentData.schoolInfo.schoolLocation]);
            if (assessmentData.schoolInfo.classForm) eduData.push(['Class/Form', assessmentData.schoolInfo.classForm]);
            if (assessmentData.schoolInfo.likedSchool) eduData.push(['Liked School', assessmentData.schoolInfo.likedSchool]);
            if (assessmentData.schoolInfo.favoriteSubject) eduData.push(['Favorite Subject', assessmentData.schoolInfo.favoriteSubject]);
            if (assessmentData.schoolInfo.skillPrior) eduData.push(['Skill/Trade Prior', assessmentData.schoolInfo.skillPrior]);
            if (assessmentData.schoolInfo.interestBackToSchool) eduData.push(['Interest to go back to school', assessmentData.schoolInfo.interestBackToSchool]);
        }
        
        addSectionTable('Education Information', eduData);

        // ---- Referral & Admission History ----
        const referralData: any[] = [
            ...(assessmentData?.referrerName ? [['Referred By', assessmentData.referrerName]] : []),
            ...(assessmentData?.referrerTitle ? [['Referrer Title', assessmentData.referrerTitle]] : []),
            ...(assessmentData?.referrerRelationship ? [['Referrer Relationship', assessmentData.referrerRelationship]] : []),
            ...(assessmentData?.referrerContact ? [['Referrer Contact', assessmentData.referrerContact]] : []),
            ...(assessmentData?.referrerLocation ? [['Referrer Location', assessmentData.referrerLocation]] : []),
            ...(assessmentData?.currentCareProviderName ? [['Current Care Provider', assessmentData.currentCareProviderName]] : []),
            ...(assessmentData?.currentCareProviderPhone ? [['Provider Phone', assessmentData.currentCareProviderPhone]] : []),
            ...(assessmentData?.currentCareProviderReg ? [['Provider Reg No', assessmentData.currentCareProviderReg]] : []),
            ...(assessmentData?.reasonsForAdmission ? [['Reasons for Admission', [
                ...(Array.isArray(assessmentData.reasonsForAdmissionList) ? assessmentData.reasonsForAdmissionList : []),
                assessmentData.reasonsForAdmissionOther,
                assessmentData.reasonsForAdmission
            ].filter(Boolean).join(', ')]] : []),
            ...(assessmentData?.historyOfPlacements ? [['History of Placements', assessmentData.historyOfPlacements]] : []),
            ...(assessmentData?.vulnerabilityStats ? [['Vulnerability Status', assessmentData.vulnerabilityStats]] : []),
        ];
        addSectionTable('Referral & Admission History', referralData);

        // ---- Family Information ----
        const familyData: any[] = [
            ...(client.family_composition ? [['Family Composition', client.family_composition]] : []),
            ...(assessmentData?.parentsLivingTogether ? [['Parents Living Together', assessmentData.parentsLivingTogether]] : []),
            ...(assessmentData?.contactWithFamily ? [['Contact With Family', assessmentData.contactWithFamily]] : []),
            ...(assessmentData?.contactWithFamilyWhom ? [['Contact With Whom', assessmentData.contactWithFamilyWhom]] : []),
            ...(assessmentData?.familyVisitFrequency ? [['Visit Frequency', assessmentData.familyVisitFrequency]] : []),
            ...(client.father_name ? [['Father Name', client.father_name]] : []),
            ...(client.father_status ? [['Father Status', client.father_status]] : []),
            ...(client.father_occupation ? [['Father Occupation', client.father_occupation]] : []),
            ...(client.father_contact ? [['Father Contact', client.father_contact]] : []),
            ...(client.father_location ? [['Father Location', client.father_location]] : []),
            ...(client.mother_name ? [['Mother Name', client.mother_name]] : []),
            ...(client.mother_status ? [['Mother Status', client.mother_status]] : []),
            ...(client.mother_occupation ? [['Mother Occupation', client.mother_occupation]] : []),
            ...(client.mother_contact ? [['Mother Contact', client.mother_contact]] : []),
            ...(client.mother_location ? [['Mother Location', client.mother_location]] : []),
            ...(client.guardian_name ? [['Guardian Name', client.guardian_name]] : []),
            ...(client.guardian_status ? [['Guardian Status', client.guardian_status]] : []),
            ...(client.guardian_occupation ? [['Guardian Occupation', client.guardian_occupation]] : []),
            ...(client.guardian_contact ? [['Guardian Contact', client.guardian_contact]] : []),
            ...(client.guardian_location ? [['Guardian Location', client.guardian_location]] : []),
            
            // Extended details from notes payload
            ...(assessmentData?.parentsMaritalStatus ? [['Parents Marital Status', assessmentData.parentsMaritalStatus]] : []),
            ...(assessmentData?.fatherDetails?.type ? [['Father Type', assessmentData.fatherDetails.type]] : []),
            ...(assessmentData?.fatherDetails?.religion ? [['Father Religion', assessmentData.fatherDetails.religion]] : []),
            ...(assessmentData?.fatherDetails?.ethnicCommunity ? [['Father Ethnicity', assessmentData.fatherDetails.ethnicCommunity]] : []),
            ...(assessmentData?.motherDetails?.type ? [['Mother Type', assessmentData.motherDetails.type]] : []),
            ...(assessmentData?.motherDetails?.religion ? [['Mother Religion', assessmentData.motherDetails.religion]] : []),
            ...(assessmentData?.motherDetails?.ethnicCommunity ? [['Mother Ethnicity', assessmentData.motherDetails.ethnicCommunity]] : []),
            ...(assessmentData?.guardianDetails?.type ? [['Guardian Type', assessmentData.guardianDetails.type === 'Other' ? assessmentData.guardianDetails.typeOther : assessmentData.guardianDetails.type]] : []),
            ...(assessmentData?.guardianDetails?.ethnicCommunity ? [['Guardian Ethnicity', assessmentData.guardianDetails.ethnicCommunity]] : []),
            
            ...(assessmentData?.familyEconomicStatus ? [['Family Economic Status', assessmentData.familyEconomicStatus]] : []),
            ...(assessmentData?.peopleLivingWithChild ? [['People Living With Child', assessmentData.peopleLivingWithChild]] : []),
        ];
        if (client.parents && client.parents.length > 0) {
            client.parents.forEach(p => {
                familyData.push([`${p.relationship} Name`, `${p.first_name} ${p.last_name}`]);
                if (p.phone_primary) familyData.push([`${p.relationship} Phone`, p.phone_primary]);
                if (p.occupation) familyData.push([`${p.relationship} Occupation`, p.occupation]);
            });
        }
        addSectionTable('Family Information', familyData);

        // Siblings table
        if (client.siblings_info) {
            try {
                const parsed = JSON.parse(client.siblings_info);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const sibRows = parsed.map((s: any) => [
                        s.name || '-', 
                        s.sex || '-', 
                        s.age || '-', 
                        s.schoolStatus || '-'
                    ]);
                    addWideTable('Siblings', ['Name', 'Sex', 'Age', 'Status/School'], sibRows);
                } else if (typeof client.siblings_info === 'string' && client.siblings_info.trim() !== '') {
                    addSectionTable('Siblings', [['Details', client.siblings_info]]);
                }
            } catch (e) {
                if (client.siblings_info.trim() !== '') {
                    addSectionTable('Siblings', [['Details', client.siblings_info]]);
                }
            }
        } else if (assessmentData?.siblingsList && assessmentData.siblingsList.length > 0) {
            const sibRows = assessmentData.siblingsList.map((s: any) => [
                s.name + (s.nickname ? ` (${s.nickname})` : ''),
                s.age || '',
                s.location || '',
                [s.education, s.classLevel].filter(Boolean).join(' - '),
            ]);
            addWideTable('Siblings', ['Name/Nickname', 'Age', 'Location', 'Education'], sibRows);
        } else if (assessmentData?.siblings) {
            addSectionTable('Siblings', [['Siblings Info', assessmentData.siblings]]);
        }

        // Other Relatives
        if (assessmentData?.otherRelativesList && assessmentData.otherRelativesList.length > 0) {
            const relRows = assessmentData.otherRelativesList.map((r: any) => [r.name || '', r.relationship || '', r.phone || '', r.location || '']);
            addWideTable('Other Relatives', ['Name', 'Relationship', 'Contact', 'Location'], relRows);
        }

        // ---- Rescue Details ----
        const rescueData: any[] = [
            ...(client.rescue_committal_date ? [['Date', new Date(client.rescue_committal_date).toLocaleDateString()]] : []),
            ...(client.rescue_location ? [['Location', client.rescue_location]] : []),
            ...(client.rescue_dispatch_officer ? [['Officer', client.rescue_dispatch_officer]] : []),
            ...(client.rescue_details ? [['Details', client.rescue_details]] : []),
        ];
        addSectionTable('Rescue Details', rescueData);

        // ---- Health & Wellbeing ----
        if (assessmentData) {
            const healthData: any[] = [
                ...(assessmentData.healthCurrentStatus ? [['Current Health Status', assessmentData.healthCurrentStatus]] : []),
                ...(assessmentData.healthCurrentDetails ? [['Current Health Details', assessmentData.healthCurrentDetails]] : []),
                ...(assessmentData.healthCurrent ? [['Current Health', assessmentData.healthCurrent]] : []),
                ...(assessmentData.healthChronicStatus ? [['Chronic Condition Status', assessmentData.healthChronicStatus]] : []),
                ...(assessmentData.healthChronicDetails ? [['Chronic Condition Details', assessmentData.healthChronicDetails]] : []),
                ...(assessmentData.healthChronic ? [['Chronic Conditions', assessmentData.healthChronic]] : []),
                ...(assessmentData.healthHistory ? [['Medical History', assessmentData.healthHistory]] : []),
                ...(assessmentData.healthMedsStatus ? [['On Medication', assessmentData.healthMedsStatus]] : []),
                ...(assessmentData.healthMedsDetails ? [['Medication Details', assessmentData.healthMedsDetails]] : []),
                ...(assessmentData.healthMeds ? [['Medications', assessmentData.healthMeds]] : []),
                ...(assessmentData.healthAllergyStatus ? [['Has Allergies', assessmentData.healthAllergyStatus]] : []),
                ...(assessmentData.healthAllergyDetails ? [['Allergy Details', assessmentData.healthAllergyDetails]] : []),
                ...(assessmentData.healthAllergies ? [['Allergies', assessmentData.healthAllergies]] : []),
                ...(assessmentData.healthImmunizationStatus ? [['Fully Immunized', assessmentData.healthImmunizationStatus]] : []),
                ...(assessmentData.healthImmunizationReason ? [['Immunization Reason', assessmentData.healthImmunizationReason]] : []),
                ...(assessmentData.healthImmunization ? [['Immunization', assessmentData.healthImmunization]] : []),
                ...(assessmentData.healthFeeding ? [['Feeding & Nutrition', assessmentData.healthFeeding]] : []),
                ...(assessmentData.healthGrowth ? [['Growth & Development', assessmentData.healthGrowth]] : []),
            ];
            addSectionTable('Health & Wellbeing', healthData);

            // Functional Assessment
            const funcData: any[] = [
                ...(assessmentData.hasVisionDifficulty ? [['Vision Difficulty', assessmentData.hasVisionDifficulty]] : []),
                ...(assessmentData.hasHearingDifficulty ? [['Hearing Difficulty', assessmentData.hasHearingDifficulty]] : []),
                ...(assessmentData.hasMobilityDifficulty ? [['Mobility Difficulty', assessmentData.hasMobilityDifficulty]] : []),
                ...(assessmentData.hasCognitiveDifficulty ? [['Cognitive Difficulty', assessmentData.hasCognitiveDifficulty]] : []),
                ...(assessmentData.hasSelfCareDifficulty ? [['Self-Care Difficulty', assessmentData.hasSelfCareDifficulty]] : []),
                ...(assessmentData.hasCommDifficulty ? [['Communication Difficulty', assessmentData.hasCommDifficulty]] : []),
            ];
            addSectionTable('Functional Assessment', funcData);

            // ---- Psychosocial & Emotional Wellbeing ----
            const psychoData: any[] = [
                ...(assessmentData.psychoFriendsActivities ? [['Friends & Activities', assessmentData.psychoFriendsActivities]] : []),
                ...(assessmentData.psychoFriendsViews ? [['Views on Friendships', assessmentData.psychoFriendsViews]] : []),
                ...(assessmentData.psychoFriendQuality ? [['Quality of Friendships', assessmentData.psychoFriendQuality]] : []),
                ...(assessmentData.psychoFriendAge ? [['Age of Friends', assessmentData.psychoFriendAge]] : []),
                ...(assessmentData.psychoCaregiverAttachmentLevel ? [['Current Caregiver Attachment Level', assessmentData.psychoCaregiverAttachmentLevel]] : []),
                ...(assessmentData.psychoCaregiverAttachmentDesc ? [['Current Caregiver Relationship', assessmentData.psychoCaregiverAttachmentDesc]] : []),
                ...(assessmentData.psychoPrevCaregiverAttachmentLevel ? [['Previous Caregiver Attachment Level', assessmentData.psychoPrevCaregiverAttachmentLevel]] : []),
                ...(assessmentData.psychoPrevCaregiverAttachmentDesc ? [['Previous Caregiver Relationship', assessmentData.psychoPrevCaregiverAttachmentDesc]] : []),
                ...(assessmentData.psychoLikes ? [['Likes', assessmentData.psychoLikes]] : []),
                ...(assessmentData.psychoDislikes ? [['Dislikes', assessmentData.psychoDislikes]] : []),
                ...(assessmentData.psychoFears ? [['Fears', assessmentData.psychoFears]] : []),
                ...(assessmentData.psychoSkills ? [['Skills/Talents', assessmentData.psychoSkills]] : []),
                ...(assessmentData.psychoRoutine ? [['Daily Routine', assessmentData.psychoRoutine]] : []),
                ...(assessmentData.psychoIndependence ? [['Level of Independence', assessmentData.psychoIndependence]] : []),
                ...(assessmentData.psychoRisks && assessmentData.psychoRisks.length > 0 ? [['Identified Risks', cleanVal(assessmentData.psychoRisks)]] : []),
            ];
            addSectionTable('Psychosocial & Emotional Wellbeing', psychoData);

            // ---- Assessment Conclusion ----
            const conclusionData: any[] = [
                [['Assessment Status', client.status === 'Active' && assessmentData.assessmentStatus !== 'Approved' ? 'In Progress' : (assessmentData.assessmentStatus || "Pending")]],
                ...(assessmentData.reintegrationPreference ? [['Child\'s Preference', assessmentData.reintegrationPreference]] : []),
                ...(assessmentData.reintegrationPreferenceStatus ? [['Preference Status', assessmentData.reintegrationPreferenceStatus]] : []),
                ...(assessmentData.reintegrationConcerns ? [['Reintegration Concerns', assessmentData.reintegrationConcerns]] : []),
                ...(assessmentData.reintegrationConcernsStatus ? [['Concerns Status', assessmentData.reintegrationConcernsStatus]] : []),
                ...(assessmentData.assessmentStrengths ? [['Strengths & Resources', assessmentData.assessmentStrengths]] : []),
                ...(assessmentData.assessmentNeeds ? [['Needs & Concerns', assessmentData.assessmentNeeds]] : []),
                ...(assessmentData.assessmentGoals ? [['Recommended Goals', assessmentData.assessmentGoals]] : []),
                ...(assessmentData.assessmentObservations ? [['Other Observations', assessmentData.assessmentObservations]] : []),
                ...(assessmentData.caseworkerName ? [['Caseworker', assessmentData.caseworkerName]] : []),
                ...(assessmentData.caseworkerSignDate ? [['Caseworker Sign Date', assessmentData.caseworkerSignDate]] : []),
                ...(assessmentData.managerName ? [['Case Manager', assessmentData.managerName]] : []),
                ...(assessmentData.managerSignDate ? [['Manager Sign Date', assessmentData.managerSignDate]] : []),
            ];
            addSectionTable('Assessment Conclusion', conclusionData);
        }

        // ---- General Notes ----
        if (actualNotes && !actualNotes.trim().startsWith('{')) {
            addSectionTable('Additional / General Notes', [['Notes', actualNotes]]);
        }
        
        // ---- Official Signatures ----
        if (assessmentData?.officialSignatures) {
            const signatureData: any[] = [];
            if (assessmentData.officialSignatures.socialWorker?.name) {
                signatureData.push(['Social Worker Name', assessmentData.officialSignatures.socialWorker.name]);
                signatureData.push(['Social Worker Sign Date', assessmentData.officialSignatures.socialWorker.date || 'N/A']);
            }
            if (assessmentData.officialSignatures.headOfRehab?.name) {
                signatureData.push(['Head of Rehab Name', assessmentData.officialSignatures.headOfRehab.name]);
                signatureData.push(['Head of Rehab Sign Date', assessmentData.officialSignatures.headOfRehab.date || 'N/A']);
            }
            if (assessmentData.officialSignatures.director?.name) {
                signatureData.push(['Director Name', assessmentData.officialSignatures.director.name]);
                signatureData.push(['Director Sign Date', assessmentData.officialSignatures.director.date || 'N/A']);
            }
            addSectionTable('For Official Use Only (Signatures)', signatureData);
        }

        // ---- Aftercare & Placement Records ----
        if (client.aftercare_records && client.aftercare_records.length > 0) {
            client.aftercare_records.forEach((record, index) => {
                const aftercareData: any[] = [
                    ['Institution/Workshop', record.institution_workshop || 'N/A'],
                    ...(record.placement_course ? [['Course/Class', record.placement_course]] : []),
                    ...(record.placement_type ? [['Placement Type', record.placement_type.replace('_', ' ')]] : []),
                    ...(record.placement_location ? [['Location', record.placement_location]] : []),
                    ...(record.contact_person ? [['Contact Person', record.contact_person]] : []),
                    ...(record.contact_phone ? [['Contact Phone', record.contact_phone]] : []),
                    ...(record.placement_date ? [['Placement Date', new Date(record.placement_date).toLocaleDateString()]] : []),
                    ...(record.completion_date ? [['Completion Date', new Date(record.completion_date).toLocaleDateString()]] : []),
                    ...(record.placement_fees ? [['Placement Fees', `KSh ${record.placement_fees.toLocaleString()}`]] : []),
                    ['Status', record.completion_status || 'N/A'],
                    ...(record.placement_type_details ? [['Details', record.placement_type_details]] : []),
                    ...(record.notes ? [['Notes', record.notes]] : []),
                ];
                addSectionTable(`Placement Record ${index + 1}`, aftercareData);
            });
        }

        doc.save(`${client.name.replace(/\s+/g, '_')}_Details.pdf`);

        toast({
            title: "PDF Exported",
            description: "Client details have been exported to PDF successfully.",
        });
    };






    if (loading) {
        return (
            <div className="min-h-screen bg-background w-full">
                <div className="sticky top-14 z-10 shadow-md bg-gradient-to-r from-purple-600 to-blue-600 h-24 flex items-center px-4 sm:px-6 lg:px-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <h1 className="relative text-2xl sm:text-3xl font-bold text-white">Client Details</h1>
                </div>
                <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-4">
                    {/* Header Card Skeleton */}
                    <Card className="border-border">
                        <CardContent className="p-3 sm:p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 sm:gap-4">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-0.5">
                                        <Skeleton className="h-6 w-48" />
                                        <Skeleton className="h-5 w-24" />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                                    <Skeleton className="h-9 w-24" />
                                    <Skeleton className="h-9 w-24" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Basic Info Skeleton */}
                    <Card className="border-border">
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 sm:gap-6">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="space-y-0.5">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-6 w-full" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="min-h-screen bg-background w-full">
                <div className="sticky top-14 z-10 shadow-md bg-gradient-to-r from-purple-600 to-blue-600 h-24 flex items-center px-4 sm:px-6 lg:px-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <h1 className="relative text-2xl sm:text-3xl font-bold text-white">Client Details</h1>
                </div>
                <div className="p-4 sm:p-6 lg:p-8">
                    <Card className="border-border">
                        <CardContent className="p-4 sm:p-8 text-center text-muted-foreground">
                            Client not found
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background w-full">
            {/* Header */}
            <div className="sticky top-14 z-10 shadow-md bg-gradient-to-r from-purple-600 to-blue-600 h-24 flex items-center px-4 sm:px-6 lg:px-8">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="relative flex items-center gap-4 w-full">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="text-white hover:bg-white/20"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Client Details</h1>
                </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-4">
                {/* Client Header Card */}
                <Card className="border-border">
                    <CardContent className="p-3 sm:p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-sm">
                                    <AvatarImage src={client.profile_picture} alt={client.name} className="object-cover" />
                                    <AvatarFallback className="bg-primary/10">
                                        <User className="h-8 w-8 text-primary" />
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground tracking-tight">{client.name}</h2>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-medium">
                                            {client.client_id}
                                        </Badge>
                                        <Badge className={`${getStatusColor(client.status)} border px-3 py-0.5 text-xs font-semibold shadow-sm`}>
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
                                            {client.status === 'Complete' ? 'Alumni' :
                                                client.status === 'Alumni - Awaiting Placement' ? 'Completed Rehabilitation' :
                                                    client.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 w-full md:w-auto mt-2 md:mt-0">
                                <Button size="sm" variant="outline" onClick={handleExportPDF} className="flex-1 md:flex-none">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export PDF
                                </Button>
                                <Button size="sm" onClick={() => navigate(`/register?clientId=${client.id}&mode=edit`)} className="flex-1 md:flex-none">
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Basic Information */}
                <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="py-3 px-4 border-b border-primary/20 bg-primary/10">
                        <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                            <User className="h-5 w-5 text-primary" />
                            Basic Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Age</span><p className="text-sm font-medium text-foreground">{client.age} years</p></div>
                            <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gender</span><p className="text-sm font-medium text-foreground">{client.gender}</p></div>
                            <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">DOB</span><p className="text-sm font-medium text-foreground">{new Date(client.date_of_birth).toLocaleDateString()}</p></div>
                            {client.nickname && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nickname</span><p className="text-sm font-medium text-foreground">{client.nickname}</p></div>}
                            {client.intake_number && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Intake Number</span><p className="text-sm font-medium text-foreground">{client.intake_number}</p></div>}
                            {client.police_ob_number && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Police OB Number</span><p className="text-sm font-medium text-foreground">{client.police_ob_number}</p></div>}
                            {assessmentData?.religion && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Religion</span><p className="text-sm font-medium text-foreground">{assessmentData.religion}</p></div>}
                            {assessmentData?.ethnicity && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ethnicity</span><p className="text-sm font-medium text-foreground">{assessmentData.ethnicity}</p></div>}
                            {assessmentData?.ethnicCommunity && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ethnic Community</span><p className="text-sm font-medium text-foreground">{assessmentData.ethnicCommunity}</p></div>}
                            {assessmentData?.healthCondition && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Health Condition</span><p className="text-sm font-medium text-foreground">{assessmentData.healthCondition}</p></div>}
                            {assessmentData?.hobbies && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hobbies</span><p className="text-sm font-medium text-foreground">{assessmentData.hobbies}</p></div>}
                            {assessmentData?.drugsAbused && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Drugs Abused</span><p className="text-sm font-medium text-foreground">{assessmentData.drugsAbused}</p></div>}
                            <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admission Date</span><p className="text-sm font-medium text-foreground">{new Date(client.admission_date).toLocaleDateString()}</p></div>
                        </div>
                    </CardContent>
                </Card>

                {/* Extended Biographical Details */}
                {(assessmentData && (
                    assessmentData.birthRegistered ||
                    assessmentData.placeOfBirthCounty ||
                    assessmentData.height ||
                    assessmentData.weight ||
                    assessmentData.complexion ||
                    assessmentData.distinguishingFeatures ||
                    assessmentData.languages ||
                    assessmentData.admissionAge
                )) && (
                        <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="py-3 px-4 border-b border-primary/20 bg-primary/10">
                                <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Extended Biographical Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {assessmentData.birthRegistered && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Birth Registered</span><p className="text-sm font-medium text-foreground">{assessmentData.birthRegistered}</p></div>}
                                    {assessmentData.birthRegistrationNumber && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Birth Registration No.</span><p className="text-sm font-medium text-foreground">{assessmentData.birthRegistrationNumber}</p></div>}
                                    {assessmentData.placeOfBirth && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Place of Birth</span><p className="text-sm font-medium text-foreground">{assessmentData.placeOfBirth}</p></div>}
                                    {assessmentData.birthRegistrationNumber && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Birth Registration No.</span><p className="text-sm font-medium text-foreground">{assessmentData.birthRegistrationNumber}</p></div>}
                                    {assessmentData.placeOfBirthCounty && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Place of Birth (County)</span><p className="text-sm font-medium text-foreground">{assessmentData.placeOfBirthCounty}</p></div>}
                                    {assessmentData.placeOfBirthSubCounty && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Place of Birth (Sub-County)</span><p className="text-sm font-medium text-foreground">{assessmentData.placeOfBirthSubCounty}</p></div>}
                                    {assessmentData.placeOfBirthVillage && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Place of Birth (Village)</span><p className="text-sm font-medium text-foreground">{assessmentData.placeOfBirthVillage}</p></div>}
                                    {assessmentData.admissionAge && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admission Age</span><p className="text-sm font-medium text-foreground">{assessmentData.admissionAge}</p></div>}
                                    {assessmentData.height && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Height</span><p className="text-sm font-medium text-foreground">{assessmentData.height}</p></div>}
                                    {assessmentData.weight && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Weight</span><p className="text-sm font-medium text-foreground">{assessmentData.weight}</p></div>}
                                    {assessmentData.complexion && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Complexion</span><p className="text-sm font-medium text-foreground">{assessmentData.complexion}</p></div>}
                                    {assessmentData.distinguishingFeatures && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Distinguishing Features</span><p className="text-sm font-medium text-foreground">{assessmentData.distinguishingFeatures}</p></div>}
                                    {assessmentData.languages && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Languages</span><p className="text-sm font-medium text-foreground">{assessmentData.languages}</p></div>}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                {/* Home / Rural Particulars & Residential Details */}
                {(assessmentData?.homeDetails || assessmentData?.residentialDetails) && (
                    <Card className="border-secondary/20 shadow-sm hover:shadow-md transition-shadow duration-200 mb-6">
                        <CardHeader className="py-3 px-4 border-b border-secondary/20 bg-secondary/10">
                            <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                                <Home className="h-5 w-5 text-secondary" />
                                Home / Rural Particulars & Residential Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {assessmentData?.homeDetails?.county && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Home County</span><p className="text-sm font-medium text-foreground">{assessmentData.homeDetails.county}</p></div>}
                                {assessmentData?.homeDetails?.subCounty && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Home Sub-County</span><p className="text-sm font-medium text-foreground">{assessmentData.homeDetails.subCounty}</p></div>}
                                {assessmentData?.homeDetails?.location && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Home Location</span><p className="text-sm font-medium text-foreground">{assessmentData.homeDetails.location}</p></div>}
                                {assessmentData?.homeDetails?.subLocation && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Home Sub-Location</span><p className="text-sm font-medium text-foreground">{assessmentData.homeDetails.subLocation}</p></div>}
                                {assessmentData?.homeDetails?.village && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Home Village</span><p className="text-sm font-medium text-foreground">{assessmentData.homeDetails.village}</p></div>}
                                {assessmentData?.homeDetails?.address && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Home Address</span><p className="text-sm font-medium text-foreground">{assessmentData.homeDetails.address}</p></div>}
                                
                                {assessmentData?.residentialDetails?.placeBeforeStreet && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Place Lived Before Street</span><p className="text-sm font-medium text-foreground">{assessmentData.residentialDetails.placeBeforeStreet}</p></div>}
                                {assessmentData?.residentialDetails?.reasonForStreet && <div className="space-y-1 sm:col-span-2"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reason for Street Life</span><p className="text-sm font-medium text-foreground">{assessmentData.residentialDetails.reasonForStreet}</p></div>}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Admission Details */}
                <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="py-3 px-4 border-b border-primary/20 bg-primary/10">
                        <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                            <Calendar className="h-5 w-5 text-primary" />
                            Admission Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admission Form</span><p className="text-sm font-medium text-foreground">{assessmentData?.otherAdmissionForms || "Standard"}</p></div>
                            {client.admission_type && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admission Type</span><p className="text-sm font-medium text-foreground">{client.admission_type}</p></div>}
                            {client.admission_type_details && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admission Details</span><p className="text-sm font-medium text-foreground">{client.admission_type_details}</p></div>}
                            {assessmentData?.currentCarePlacementType && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current Placement</span><p className="text-sm font-medium text-foreground">{assessmentData.currentCarePlacementType}</p></div>}
                            {assessmentData?.currentCarePlacementOther && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current Placement (Other)</span><p className="text-sm font-medium text-foreground">{assessmentData.currentCarePlacementOther}</p></div>}

                            {/* Partner Details */}
                            {(client.partner_name || client.partner_contact_person || client.partner_contact) && (
                                <>
                                    {client.partner_name && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Partner Name</span><p className="text-sm font-medium text-foreground">{client.partner_name}</p></div>}
                                    {client.partner_contact_person && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact Person</span><p className="text-sm font-medium text-foreground">{client.partner_contact_person}</p></div>}
                                    {client.partner_contact && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact Phone</span><p className="text-sm font-medium text-foreground">{client.partner_contact}</p></div>}
                                </>
                            )}

                            {/* Street Details */}
                            {(client.street_name || client.street_duration) && (
                                <>
                                    {client.street_name && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Street Base/Name</span><p className="text-sm font-medium text-foreground">{client.street_name}</p></div>}
                                    {client.street_duration && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Duration on Street</span><p className="text-sm font-medium text-foreground">{client.street_duration}</p></div>}
                                </>
                            )}

                            {/* Court Details */}
                            {(assessmentData?.committalOrderNo || assessmentData?.placementOrderNo || assessmentData?.committalDate || assessmentData?.admissionOrderIssued === "Yes") && (
                                <>
                                    {assessmentData?.committalOrderNo && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Committal Order No</span><p className="text-sm font-medium text-foreground">{assessmentData.committalOrderNo}</p></div>}
                                    {assessmentData?.placementOrderNo && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Placement Order No</span><p className="text-sm font-medium text-foreground">{assessmentData.placementOrderNo}</p></div>}
                                    {assessmentData?.committalDate && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date of Committal</span><p className="text-sm font-medium text-foreground">{assessmentData.committalDate}</p></div>}
                                </>
                            )}

                            {/* DCS Details */}
                            {assessmentData?.dcsSubcounty && (
                                <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">DCS Sub-County</span><p className="text-sm font-medium text-foreground">{assessmentData.dcsSubcounty}</p></div>
                            )}

                            <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referring Officer</span><p className="text-sm font-medium text-foreground">{client.referring_officer || "N/A"}</p></div>
                            <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Home District</span><p className="text-sm font-medium text-foreground">{client.home_district || "N/A"}</p></div>
                            <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nearest School</span><p className="text-sm font-medium text-foreground">{client.nearest_school || "N/A"}</p></div>
                            {assessmentData?.referralSource && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referral Source</span><p className="text-sm font-medium text-foreground">{assessmentData.referralSource}</p></div>}
                            {assessmentData?.referralDate && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referral Date</span><p className="text-sm font-medium text-foreground">{assessmentData.referralDate}</p></div>}

                            {/* Referrer Details */}
                            {assessmentData?.referrerName && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referrer Name</span><p className="text-sm font-medium text-foreground">{assessmentData.referrerName}</p></div>}
                            {assessmentData?.referrerTitle && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referrer Title</span><p className="text-sm font-medium text-foreground">{assessmentData.referrerTitle}</p></div>}
                            {assessmentData?.referrerRelationship && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referrer Relationship</span><p className="text-sm font-medium text-foreground">{assessmentData.referrerRelationship}</p></div>}
                            {assessmentData?.referrerContact && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referrer Contact</span><p className="text-sm font-medium text-foreground">{assessmentData.referrerContact}</p></div>}
                            {assessmentData?.referrerLocation && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referrer Location</span><p className="text-sm font-medium text-foreground">{assessmentData.referrerLocation}</p></div>}
                        </div>
                    </CardContent>
                </Card>

                {/* Pre-Admission & Vulnerability */}
                {assessmentData && (
                    assessmentData.preAdmissionLiving || assessmentData.preAdmissionPerson1Name || 
                    assessmentData.preAdmissionPerson1Rel || assessmentData.preAdmissionPhone || 
                    assessmentData.preAdmissionIsCCI || assessmentData.preAdmissionCCIDetails || 
                    assessmentData.vulnerabilityType || assessmentData.vulnerabilityLocationStreet || 
                    assessmentData.vulnerabilityLocationSeparation || assessmentData.vulnerabilityOther
                ) && (
                    <Card className="border-secondary/20 shadow-sm hover:shadow-md transition-shadow duration-200 mb-6">
                        <CardHeader className="py-3 px-4 border-b border-secondary/20 bg-secondary/10">
                            <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                                <Home className="h-5 w-5 text-secondary" />
                                Pre-Admission & Vulnerability
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {assessmentData?.preAdmissionLiving && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Living Situation</span><p className="text-sm font-medium text-foreground">{assessmentData.preAdmissionLiving}</p></div>}
                            {assessmentData?.preAdmissionPerson1Name && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Primary Contact Name</span><p className="text-sm font-medium text-foreground">{assessmentData.preAdmissionPerson1Name}</p></div>}
                            {assessmentData?.preAdmissionPerson1Rel && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Relationship</span><p className="text-sm font-medium text-foreground">{assessmentData.preAdmissionPerson1Rel}</p></div>}
                            {assessmentData?.preAdmissionPhone && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</span><p className="text-sm font-medium text-foreground">{assessmentData.preAdmissionPhone}</p></div>}
                            {assessmentData?.preAdmissionIsCCI && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">In CCI?</span><p className="text-sm font-medium text-foreground">{assessmentData.preAdmissionIsCCI}</p></div>}
                            {assessmentData?.preAdmissionCCIDetails && <div className="space-y-1 sm:col-span-2"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CCI Details</span><p className="text-sm font-medium text-foreground">{assessmentData.preAdmissionCCIDetails}</p></div>}
                            {assessmentData?.vulnerabilityType && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vulnerability Type</span><p className="text-sm font-medium text-foreground">{assessmentData.vulnerabilityType}</p></div>}
                            {assessmentData?.vulnerabilityLocationStreet && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location (Street)</span><p className="text-sm font-medium text-foreground">{assessmentData.vulnerabilityLocationStreet}</p></div>}
                            {assessmentData?.vulnerabilityLocationSeparation && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location (Separation)</span><p className="text-sm font-medium text-foreground">{assessmentData.vulnerabilityLocationSeparation}</p></div>}
                            {assessmentData?.vulnerabilityOther && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Other Vulnerability</span><p className="text-sm font-medium text-foreground">{assessmentData.vulnerabilityOther}</p></div>}
                        </div>
                    </CardContent>
                </Card>
                )}

                {/* Education Information */}
                <Card className="border-secondary/20 shadow-sm hover:shadow-md transition-shadow duration-200 mb-6">
                    <CardHeader className="py-3 px-4 border-b border-secondary/20 bg-secondary/10">
                        <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                            <BookOpen className="h-5 w-5 text-secondary" />
                            Education Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {client.education_level && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Education Level</span><p className="text-sm font-medium text-foreground">{client.education_level}</p></div>}
                            {client.school_name && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">School Name</span><p className="text-sm font-medium text-foreground">{client.school_name}</p></div>}
                            {client.level_reached && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Level Reached</span><p className="text-sm font-medium text-foreground">{client.level_reached}</p></div>}
                            {client.education_status && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Education Status</span><p className="text-sm font-medium text-foreground">{client.education_status}</p></div>}
                            {assessmentData?.educationCurrentStatus && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current Status</span><p className="text-sm font-medium text-foreground">{assessmentData.educationCurrentStatus}</p></div>}
                            {assessmentData?.educationCurrentType && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current Type</span><p className="text-sm font-medium text-foreground">{assessmentData.educationCurrentType}</p></div>}
                            {assessmentData?.educationCurrentMode && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current Mode</span><p className="text-sm font-medium text-foreground">{assessmentData.educationCurrentMode}</p></div>}
                            {assessmentData?.educationCurrentNameLocation && <div className="space-y-1 sm:col-span-2"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current Name & Location</span><p className="text-sm font-medium text-foreground">{assessmentData.educationCurrentNameLocation}</p></div>}
                            {assessmentData?.educationCurrentLevel && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current Level</span><p className="text-sm font-medium text-foreground">{assessmentData.educationCurrentLevel}</p></div>}
                            {assessmentData?.educationPerformance && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Performance</span><p className="text-sm font-medium text-foreground">{assessmentData.educationPerformance}</p></div>}
                            {assessmentData?.educationPreviousStatus && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Previous Status</span><p className="text-sm font-medium text-foreground">{assessmentData.educationPreviousStatus}</p></div>}
                            {assessmentData?.educationPreviousType && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Previous Type</span><p className="text-sm font-medium text-foreground">{assessmentData.educationPreviousType}</p></div>}
                            {assessmentData?.educationPreviousMode && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Previous Mode</span><p className="text-sm font-medium text-foreground">{assessmentData.educationPreviousMode}</p></div>}
                            {assessmentData?.educationPreviousNameLocation && <div className="space-y-1 sm:col-span-2"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Previous Name & Location</span><p className="text-sm font-medium text-foreground">{assessmentData.educationPreviousNameLocation}</p></div>}
                            
                            {assessmentData?.schoolInfo?.typeOfSchool && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type of School</span><p className="text-sm font-medium text-foreground">{assessmentData.schoolInfo.typeOfSchool}</p></div>}
                            {assessmentData?.schoolInfo?.schoolLocation && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">School Location</span><p className="text-sm font-medium text-foreground">{assessmentData.schoolInfo.schoolLocation}</p></div>}
                            {assessmentData?.schoolInfo?.classForm && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Class/Form</span><p className="text-sm font-medium text-foreground">{assessmentData.schoolInfo.classForm}</p></div>}
                            {assessmentData?.schoolInfo?.likedSchool && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Liked School</span><p className="text-sm font-medium text-foreground">{assessmentData.schoolInfo.likedSchool}</p></div>}
                            {assessmentData?.schoolInfo?.favoriteSubject && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Favorite Subject</span><p className="text-sm font-medium text-foreground">{assessmentData.schoolInfo.favoriteSubject}</p></div>}
                            {assessmentData?.schoolInfo?.skillPrior && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skill/Trade Prior</span><p className="text-sm font-medium text-foreground">{assessmentData.schoolInfo.skillPrior}</p></div>}
                            {assessmentData?.schoolInfo?.interestBackToSchool && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Interest back to school</span><p className="text-sm font-medium text-foreground">{assessmentData.schoolInfo.interestBackToSchool}</p></div>}
                        </div>
                    </CardContent>
                </Card>
                {/* Family Information */}
                {(
                    (client.parents && client.parents.length > 0) ||
                    client.father_name ||
                    client.mother_name ||
                    client.guardian_name ||
                    (assessmentData && (
                        (assessmentData.siblingsList && assessmentData.siblingsList.length > 0) ||
                        assessmentData.familyEconomicStatus ||
                        assessmentData.homeAssessmentDone
                    ))
                ) && (
                        <Card className="border-secondary/20 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="py-3 px-4 border-b border-secondary/20 bg-secondary/10">
                                <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                                    <Users className="h-5 w-5 text-secondary" />
                                    Family Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-6">
                                    {/* Parent/Guardian Info */}
                                    <div className="space-y-6">
                                        {/* Father */}
                                        {(client.father_name || client.father_status) && (
                                            <div>
                                                <h4 className="text-xs font-bold uppercase tracking-wide text-secondary mb-3 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Father's Details
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-md border border-secondary/20 bg-secondary/5">
                                                    {client.father_name && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</span><p className="text-sm font-medium text-foreground">{client.father_name}</p></div>}
                                                    {client.father_status && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</span><p className="text-sm font-medium text-foreground">{client.father_status}</p></div>}
                                                    {client.father_occupation && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Occupation</span><p className="text-sm font-medium text-foreground">{client.father_occupation}</p></div>}
                                                    {client.father_contact && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</span><p className="text-sm font-medium text-foreground">{client.father_contact}</p></div>}
                                                    {client.father_location && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</span><p className="text-sm font-medium text-foreground">{client.father_location}</p></div>}
                                                    {assessmentData?.fatherDetails?.type && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Father Type</span><p className="text-sm font-medium text-foreground">{assessmentData.fatherDetails.type}</p></div>}
                                                    {assessmentData?.fatherDetails?.religion && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Religion</span><p className="text-sm font-medium text-foreground">{assessmentData.fatherDetails.religion}</p></div>}
                                                    {assessmentData?.fatherDetails?.ethnicCommunity && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ethnic Community</span><p className="text-sm font-medium text-foreground">{assessmentData.fatherDetails.ethnicCommunity}</p></div>}
                                                </div>
                                            </div>
                                        )}

                                        {/* Mother */}
                                        {(client.mother_name || client.mother_status) && (
                                            <div>
                                                <h4 className="text-xs font-bold uppercase tracking-wide text-secondary mb-3 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Mother's Details
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-md border border-secondary/20 bg-secondary/5">
                                                    {client.mother_name && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</span><p className="text-sm font-medium text-foreground">{client.mother_name}</p></div>}
                                                    {client.mother_status && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</span><p className="text-sm font-medium text-foreground">{client.mother_status}</p></div>}
                                                    {client.mother_occupation && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Occupation</span><p className="text-sm font-medium text-foreground">{client.mother_occupation}</p></div>}
                                                    {client.mother_contact && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</span><p className="text-sm font-medium text-foreground">{client.mother_contact}</p></div>}
                                                    {client.mother_location && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</span><p className="text-sm font-medium text-foreground">{client.mother_location}</p></div>}
                                                    {assessmentData?.motherDetails?.type && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mother Type</span><p className="text-sm font-medium text-foreground">{assessmentData.motherDetails.type}</p></div>}
                                                    {assessmentData?.motherDetails?.religion && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Religion</span><p className="text-sm font-medium text-foreground">{assessmentData.motherDetails.religion}</p></div>}
                                                    {assessmentData?.motherDetails?.ethnicCommunity && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ethnic Community</span><p className="text-sm font-medium text-foreground">{assessmentData.motherDetails.ethnicCommunity}</p></div>}
                                                </div>
                                            </div>
                                        )}

                                        {/* Guardian */}
                                        {(client.guardian_name || client.guardian_status) && (
                                            <div>
                                                <h4 className="text-xs font-bold uppercase tracking-wide text-secondary mb-3 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Guardian's Details
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-md border border-secondary/20 bg-secondary/5">
                                                    {client.guardian_name && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</span><p className="text-sm font-medium text-foreground">{client.guardian_name}</p></div>}
                                                    {client.guardian_status && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</span><p className="text-sm font-medium text-foreground">{client.guardian_status}</p></div>}
                                                    {client.guardian_occupation && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Occupation</span><p className="text-sm font-medium text-foreground">{client.guardian_occupation}</p></div>}
                                                    {client.guardian_contact && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</span><p className="text-sm font-medium text-foreground">{client.guardian_contact}</p></div>}
                                                    {client.guardian_location && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</span><p className="text-sm font-medium text-foreground">{client.guardian_location}</p></div>}
                                                    {assessmentData?.guardianDetails?.type && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Guardian Type</span><p className="text-sm font-medium text-foreground">{assessmentData.guardianDetails.type === "Other" ? assessmentData.guardianDetails.typeOther : assessmentData.guardianDetails.type}</p></div>}
                                                    {assessmentData?.guardianDetails?.ethnicCommunity && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ethnic Community</span><p className="text-sm font-medium text-foreground">{assessmentData.guardianDetails.ethnicCommunity}</p></div>}
                                                    {client.family_composition && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Family Composition</span><p className="text-sm font-medium text-foreground">{client.family_composition}</p></div>}
                                                    {assessmentData?.parentsMaritalStatus && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parents Marital Status</span><p className="text-sm font-medium text-foreground">{assessmentData.parentsMaritalStatus}</p></div>}
                                                    {client.siblings_info && <div className="space-y-1 sm:col-span-2 md:col-span-3"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Siblings Info</span><p className="text-sm font-medium text-foreground">{formatSiblingsInfo(client.siblings_info)}</p></div>}
                                                    {assessmentData?.parentsLivingTogether && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parents Living Together</span><p className="text-sm font-medium text-foreground">{assessmentData.parentsLivingTogether}</p></div>}
                                                    {assessmentData?.contactWithFamily && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact With Family</span><p className="text-sm font-medium text-foreground">{assessmentData.contactWithFamily}</p></div>}
                                                    {assessmentData?.contactWithFamilyWhom && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact With Whom</span><p className="text-sm font-medium text-foreground">{assessmentData.contactWithFamilyWhom}</p></div>}
                                                    {assessmentData?.familyVisitFrequency && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visit Frequency</span><p className="text-sm font-medium text-foreground">{assessmentData.familyVisitFrequency}</p></div>}
                                                </div>
                                            </div>
                                        )}


                                        {/* Parents Array (Fallback) */}
                                        {client.parents && client.parents.map((parent) => (
                                            <div key={parent.id}>
                                                <h4 className="text-xs font-bold uppercase tracking-wide text-secondary mb-3 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> {parent.relationship}
                                                </h4>
                                                <div className="overflow-hidden rounded-md border border-secondary/20">
                                                    <table className="w-full text-sm text-left">
                                                        <tbody className="divide-y divide-secondary/10">
                                                            <tr className="hover:bg-secondary/5">
                                                                <td className="px-4 py-3 font-semibold text-muted-foreground w-1/3 sm:w-1/4 bg-secondary/5">Name</td>
                                                                <td className="px-4 py-3 font-medium">{parent.first_name} {parent.last_name}</td>
                                                            </tr>
                                                            {parent.phone_primary && (
                                                                <tr className="hover:bg-secondary/5">
                                                                    <td className="px-4 py-3 font-semibold text-muted-foreground bg-secondary/5">Phone</td>
                                                                    <td className="px-4 py-3 font-medium">{parent.phone_primary}</td>
                                                                </tr>
                                                            )}
                                                            {parent.occupation && (
                                                                <tr className="hover:bg-secondary/5">
                                                                    <td className="px-4 py-3 font-semibold text-muted-foreground bg-secondary/5">Occupation</td>
                                                                    <td className="px-4 py-3 font-medium">{parent.occupation}</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Siblings & Household */}
                                    <div className="space-y-6">
                                        {((assessmentData?.siblingsList && assessmentData.siblingsList.length > 0) || assessmentData?.siblings) && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold uppercase tracking-wide text-secondary ml-1">Siblings</h4>
                                                <div className="overflow-x-auto rounded-md border border-secondary/20">
                                                    <table className="w-full text-sm text-left min-w-[500px]">
                                                        <thead className="bg-secondary/10 text-secondary border-b border-secondary/20">
                                                            <tr>
                                                                <th className="px-4 py-3 font-semibold text-left">Name / Nickname</th>
                                                                <th className="px-4 py-3 font-semibold text-left">Age</th>
                                                                <th className="px-4 py-3 font-semibold text-left">Location</th>
                                                                <th className="px-4 py-3 font-semibold text-left">Education</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-secondary/10">
                                                            {assessmentData.siblingsList?.map((sib: any, i: number) => (
                                                                <tr key={i} className="hover:bg-secondary/5">
                                                                    <td className="px-4 py-3 font-medium">
                                                                        {sib.name}
                                                                        {sib.nickname && <span className="text-muted-foreground ml-1">({sib.nickname})</span>}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-muted-foreground">{sib.age}</td>
                                                                    <td className="px-4 py-3 text-muted-foreground">{sib.location}</td>
                                                                    <td className="px-4 py-3 text-muted-foreground">
                                                                        {sib.education}
                                                                        {sib.classLevel && sib.education && " - "}
                                                                        {sib.classLevel}
                                                                        {!sib.education && sib.classLevel && sib.classLevel}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {!assessmentData.siblingsList?.length && assessmentData.siblings && (
                                                                <tr>
                                                                    <td colSpan={4} className="px-4 py-3 text-muted-foreground whitespace-pre-wrap">{assessmentData.siblings}</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {assessmentData?.otherRelativesList && assessmentData.otherRelativesList.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold uppercase tracking-wide text-secondary ml-1">Other Relatives</h4>
                                                <div className="overflow-x-auto rounded-md border border-secondary/20">
                                                    <table className="w-full text-sm text-left min-w-[500px]">
                                                        <thead className="bg-secondary/10 text-secondary border-b border-secondary/20">
                                                            <tr>
                                                                <th className="px-4 py-3 font-semibold text-left">Name</th>
                                                                <th className="px-4 py-3 font-semibold text-left">Relationship</th>
                                                                <th className="px-4 py-3 font-semibold text-left">Contact</th>
                                                                <th className="px-4 py-3 font-semibold text-left">Location</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-secondary/10">
                                                            {assessmentData.otherRelativesList.map((rel: any, i: number) => (
                                                                <tr key={i} className="hover:bg-secondary/5">
                                                                    <td className="px-4 py-3 font-medium">{rel.name}</td>
                                                                    <td className="px-4 py-3 text-muted-foreground">{rel.relationship}</td>
                                                                    <td className="px-4 py-3 text-muted-foreground">{rel.phone}</td>
                                                                    <td className="px-4 py-3 text-muted-foreground">{rel.location}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {assessmentData?.peopleLivingWithChild && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold uppercase tracking-wide text-secondary ml-1">People Living with Child</h4>
                                                <div className="overflow-hidden rounded-md border border-secondary/20">
                                                    <table className="w-full text-sm text-left">
                                                        <tbody>
                                                            <tr className="hover:bg-secondary/5">
                                                                <td className="px-4 py-3 font-medium whitespace-pre-wrap">{assessmentData.peopleLivingWithChild}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {assessmentData?.familyEconomicStatus && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold uppercase tracking-wide text-secondary ml-1">Family Economic Status</h4>
                                                <div className="overflow-hidden rounded-md border border-secondary/20">
                                                    <table className="w-full text-sm text-left">
                                                        <tbody>
                                                            <tr className="hover:bg-secondary/5">
                                                                <td className="px-4 py-3 font-medium whitespace-pre-wrap">{assessmentData.familyEconomicStatus}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                {/* Rescue Details */}
                {(client.rescue_committal_date || client.rescue_location || client.rescue_dispatch_officer) && (
                    <Card className="border-red-500/20 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <CardHeader className="py-3 px-4 border-b border-red-500/20 bg-red-500/10">
                            <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                Rescue Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</span><p className="text-sm font-medium text-foreground">{client.rescue_committal_date ? new Date(client.rescue_committal_date).toLocaleDateString() : 'N/A'}</p></div>
                                <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</span><p className="text-sm font-medium text-foreground">{client.rescue_location || 'N/A'}</p></div>
                                <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Officer</span><p className="text-sm font-medium text-foreground">{client.rescue_dispatch_officer || 'N/A'}</p></div>
                                {client.rescue_details && <div className="space-y-1 sm:col-span-2"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rescue Details</span><p className="text-sm font-medium text-foreground">{client.rescue_details}</p></div>}
                            </div>
                        </CardContent>
                    </Card>
                )}




                {/* Referral & Admission History */}
                {assessmentData && (
                    assessmentData.referrerName ||
                    assessmentData.reasonsForAdmission ||
                    (assessmentData.reasonsForAdmissionList && assessmentData.reasonsForAdmissionList.length > 0) ||
                    assessmentData.historyOfPlacements ||
                    (assessmentData.historyPlacementsData && assessmentData.historyPlacementsData.length > 0) ||
                    assessmentData.committalOrderNo ||
                    assessmentData.currentCareProviderName ||
                    assessmentData.vulnerabilityStats ||
                    (assessmentData.otherAdmissionForms && assessmentData.otherAdmissionForms.length > 0)
                ) && (
                        <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="py-3 px-4 border-b border-primary/20 bg-primary/10">
                                <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                                    <Shield className="h-5 w-5 text-primary" />
                                    Referral & Admission History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {assessmentData.committalOrderNo && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Committal Order No</span><p className="text-sm font-medium text-foreground">{assessmentData.committalOrderNo}</p></div>}
                                    {assessmentData.committalDate && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Committal Date</span><p className="text-sm font-medium text-foreground">{assessmentData.committalDate}</p></div>}
                                    {assessmentData.referrerName && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referred By (Name)</span><p className="text-sm font-medium text-foreground">{assessmentData.referrerName}</p></div>}
                                    {assessmentData.referrerTitle && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referrer Title</span><p className="text-sm font-medium text-foreground">{assessmentData.referrerTitle}</p></div>}
                                    {assessmentData.referrerRelationship && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referrer Relationship</span><p className="text-sm font-medium text-foreground">{assessmentData.referrerRelationship}</p></div>}
                                    {assessmentData.referrerContact && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referrer Contact</span><p className="text-sm font-medium text-foreground">{assessmentData.referrerContact}</p></div>}
                                    {assessmentData.currentCareProviderName && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current Care Provider</span><p className="text-sm font-medium text-foreground">{assessmentData.currentCareProviderName}</p></div>}
                                    {assessmentData.currentCareProviderPhone && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Provider Phone</span><p className="text-sm font-medium text-foreground">{assessmentData.currentCareProviderPhone}</p></div>}
                                    {assessmentData.currentCareProviderReg && <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Provider Reg No</span><p className="text-sm font-medium text-foreground">{assessmentData.currentCareProviderReg}</p></div>}
                                    {assessmentData.reasonsForAdmission && (
                                        <div className="space-y-1 sm:col-span-2 md:col-span-3 lg:col-span-4">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reasons for Admission</span>
                                            <p className="text-sm font-medium text-foreground whitespace-pre-wrap">
                                                {[
                                                    ...(Array.isArray(assessmentData.reasonsForAdmissionList) ? assessmentData.reasonsForAdmissionList : []),
                                                    assessmentData.reasonsForAdmissionOther,
                                                    assessmentData.reasonsForAdmission
                                                ].filter(Boolean).join(', ')}
                                            </p>
                                        </div>
                                    )}
                                    {assessmentData.historyOfPlacements && (
                                        <div className="space-y-1 sm:col-span-2 md:col-span-3 lg:col-span-4">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">History of Placements</span>
                                            <p className="text-sm font-medium text-foreground whitespace-pre-wrap mb-2">{assessmentData.historyOfPlacements}</p>
                                            {assessmentData.historyPlacementsData && assessmentData.historyPlacementsData.length > 0 && (
                                                <div className="space-y-1">
                                                    {assessmentData.historyPlacementsData.map((h: any, i: number) => (
                                                        <div key={i} className="text-sm bg-muted/10 p-2 rounded border border-primary/10">
                                                            <span className="font-semibold">{h.type}</span> <span className="text-muted-foreground text-xs ml-1">{h.from} - {h.to}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {assessmentData.vulnerabilityStats && (
                                        <div className="space-y-1 sm:col-span-2 md:col-span-3 lg:col-span-4">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vulnerability Status/Stats</span>
                                            <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{assessmentData.vulnerabilityStats}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                {/* Health & Wellbeing */}
                {assessmentData && (
                    assessmentData.healthCurrent || assessmentData.healthCurrentStatus || 
                    assessmentData.healthChronic || assessmentData.healthChronicStatus || 
                    assessmentData.healthHistory || assessmentData.healthMeds || 
                    assessmentData.healthMedsStatus || assessmentData.healthAllergies || 
                    assessmentData.healthAllergyStatus || assessmentData.healthImmunization || 
                    assessmentData.healthImmunizationStatus || assessmentData.healthFeeding || 
                    assessmentData.healthGrowth || assessmentData.hasVisionDifficulty || 
                    assessmentData.hasHearingDifficulty || assessmentData.hasMobilityDifficulty || 
                    assessmentData.hasCognitiveDifficulty || assessmentData.hasSelfCareDifficulty || 
                    assessmentData.hasCommDifficulty
                ) && (
                        <Card className="border-red-500/20 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="py-3 px-4 border-b border-red-500/20 bg-red-500/10">
                                <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                                    <Heart className="h-5 w-5 text-red-500" />
                                    Health & Wellbeing
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-6">
                                    {/* Health Status Group */}
                                    {(assessmentData.healthCurrent || assessmentData.healthCurrentStatus || assessmentData.healthChronic || assessmentData.healthChronicStatus || assessmentData.healthHistory) && (
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wide text-secondary mb-3 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Health Status
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-md border border-secondary/20 bg-secondary/5">
                                                {/* Current Health */}
                                                {(assessmentData.healthCurrent || assessmentData.healthCurrentStatus) && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current Health</span>
                                                        <div className="text-sm font-medium text-foreground">
                                                            {assessmentData.healthCurrentStatus && <div className="mb-1 text-primary">{assessmentData.healthCurrentStatus}</div>}
                                                            {assessmentData.healthCurrentDetails && <div className="whitespace-pre-wrap">{assessmentData.healthCurrentDetails}</div>}
                                                            {assessmentData.healthCurrent && <div className="whitespace-pre-wrap mt-1">{assessmentData.healthCurrent}</div>}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Chronic Conditions */}
                                                {(assessmentData.healthChronic || assessmentData.healthChronicStatus) && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Chronic Conditions</span>
                                                        <div className="text-sm font-medium text-foreground">
                                                            {assessmentData.healthChronicStatus && <div className="mb-1 text-primary">{assessmentData.healthChronicStatus}</div>}
                                                            {assessmentData.healthChronicDetails && <div className="whitespace-pre-wrap">{assessmentData.healthChronicDetails}</div>}
                                                            {assessmentData.healthChronic && <div className="whitespace-pre-wrap mt-1">{assessmentData.healthChronic}</div>}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Medical History */}
                                                {assessmentData.healthHistory && (
                                                    <div className="space-y-1 sm:col-span-2 md:col-span-3">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Past Medical History</span>
                                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{assessmentData.healthHistory}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Medical Care Group */}
                                    {(assessmentData.healthMeds || assessmentData.healthMedsStatus || assessmentData.healthAllergies || assessmentData.healthAllergyStatus || assessmentData.healthImmunization || assessmentData.healthImmunizationStatus) && (
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wide text-secondary mb-3 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Medical Care & Needs
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-md border border-secondary/20 bg-secondary/5">
                                                {/* Medications */}
                                                {(assessmentData.healthMeds || assessmentData.healthMedsStatus) && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Medication</span>
                                                        <div className="text-sm font-medium text-foreground">
                                                            {assessmentData.healthMedsStatus && <div className="mb-1 font-semibold">On Meds: {assessmentData.healthMedsStatus}</div>}
                                                            {assessmentData.healthMedsDetails && <div className="whitespace-pre-wrap">{assessmentData.healthMedsDetails}</div>}
                                                            {assessmentData.healthMeds && <div className="whitespace-pre-wrap mt-1">{assessmentData.healthMeds}</div>}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Allergies */}
                                                {(assessmentData.healthAllergies || assessmentData.healthAllergyStatus) && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Allergies</span>
                                                        <div className="text-sm font-medium text-foreground">
                                                            {assessmentData.healthAllergyStatus && <div className="mb-1 font-semibold">Has Allergies: {assessmentData.healthAllergyStatus}</div>}
                                                            {assessmentData.healthAllergyDetails && <div className="whitespace-pre-wrap">{assessmentData.healthAllergyDetails}</div>}
                                                            {assessmentData.healthAllergies && <div className="whitespace-pre-wrap mt-1">{assessmentData.healthAllergies}</div>}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Immunization */}
                                                {(assessmentData.healthImmunization || assessmentData.healthImmunizationStatus) && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Immunization</span>
                                                        <div className="text-sm font-medium text-foreground">
                                                            {assessmentData.healthImmunizationStatus && <div className="mb-1 font-semibold">Fully Immunized: {assessmentData.healthImmunizationStatus === 'No' ? 'No' : 'Yes'}</div>}
                                                            {assessmentData.healthImmunizationReason && <div className="whitespace-pre-wrap text-muted-foreground">Reason: {assessmentData.healthImmunizationReason}</div>}
                                                            {assessmentData.healthImmunization && <div className="whitespace-pre-wrap mt-1">{assessmentData.healthImmunization}</div>}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Development Group */}
                                    {(assessmentData.healthFeeding || assessmentData.healthGrowth) && (
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wide text-secondary mb-3 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Development
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-md border border-secondary/20 bg-secondary/5">
                                                {/* Feeding */}
                                                {assessmentData.healthFeeding && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Feeding & Nutrition</span>
                                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{assessmentData.healthFeeding}</p>
                                                    </div>
                                                )}
                                                {/* Growth */}
                                                {assessmentData.healthGrowth && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Growth & Development</span>
                                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{assessmentData.healthGrowth}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Functional Assessment Group */}
                                    {(assessmentData.hasVisionDifficulty || assessmentData.hasHearingDifficulty || assessmentData.hasMobilityDifficulty || assessmentData.hasCognitiveDifficulty || assessmentData.hasSelfCareDifficulty || assessmentData.hasCommDifficulty) && (
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wide text-secondary mb-3 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Functional Assessment
                                            </h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 p-4 rounded-md border border-secondary/20 bg-secondary/5">
                                                <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vision</span><p className="text-sm font-medium text-foreground">{assessmentData.hasVisionDifficulty || "N/A"}</p></div>
                                                <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hearing</span><p className="text-sm font-medium text-foreground">{assessmentData.hasHearingDifficulty || "N/A"}</p></div>
                                                <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mobility</span><p className="text-sm font-medium text-foreground">{assessmentData.hasMobilityDifficulty || "N/A"}</p></div>
                                                <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cognitive</span><p className="text-sm font-medium text-foreground">{assessmentData.hasCognitiveDifficulty || "N/A"}</p></div>
                                                <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Self-care</span><p className="text-sm font-medium text-foreground">{assessmentData.hasSelfCareDifficulty || "N/A"}</p></div>
                                                <div className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Communication</span><p className="text-sm font-medium text-foreground">{assessmentData.hasCommDifficulty || "N/A"}</p></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                {/* Psychosocial */}
                {assessmentData && (
                    assessmentData.psychoFriendsActivities ||
                    assessmentData.psychoFriendsViews ||
                    assessmentData.psychoFriendQuality ||
                    assessmentData.psychoFriendAge ||
                    (assessmentData.psychoRisks && assessmentData.psychoRisks.length > 0) ||
                    assessmentData.psychoCaregiverAttachmentLevel ||
                    assessmentData.psychoCaregiverAttachmentDesc ||
                    assessmentData.psychoPrevCaregiverAttachmentLevel ||
                    assessmentData.psychoPrevCaregiverAttachmentDesc ||
                    assessmentData.psychoLikes ||
                    assessmentData.psychoDislikes ||
                    assessmentData.psychoFears ||
                    assessmentData.psychoSkills ||
                    assessmentData.psychoRoutine ||
                    assessmentData.psychoIndependence
                ) && (
                        <Card className="border-secondary/20 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="py-3 px-4 border-b border-secondary/20 bg-secondary/10">
                                <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                                    <User className="h-5 w-5 text-secondary" />
                                    Psychosocial & Emotional Wellbeing
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-6">
                                    {/* Social & Behavioral Group */}
                                    {(assessmentData.psychoFriendsActivities || assessmentData.psychoFriendsViews || assessmentData.psychoFriendQuality || assessmentData.psychoFriendAge || assessmentData.psychoCaregiverAttachmentLevel || assessmentData.psychoCaregiverAttachmentDesc || assessmentData.psychoPrevCaregiverAttachmentLevel || assessmentData.psychoPrevCaregiverAttachmentDesc) && (
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wide text-secondary mb-3 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Social & Behavioral
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-md border border-secondary/20 bg-secondary/5">
                                                {assessmentData.psychoFriendsActivities && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Friends & Activities</span>
                                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{assessmentData.psychoFriendsActivities}</p>
                                                    </div>
                                                )}
                                                {assessmentData.psychoFriendsViews && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Views on Friendships</span>
                                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{assessmentData.psychoFriendsViews}</p>
                                                    </div>
                                                )}
                                                {assessmentData.psychoFriendQuality && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quality of Friendships</span>
                                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{assessmentData.psychoFriendQuality}</p>
                                                    </div>
                                                )}
                                                {assessmentData.psychoFriendAge && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Age of Friends</span>
                                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{assessmentData.psychoFriendAge}</p>
                                                    </div>
                                                )}
                                                {(assessmentData.psychoCaregiverAttachmentLevel || assessmentData.psychoCaregiverAttachmentDesc) && (
                                                    <div className="space-y-1 sm:col-span-2">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current Caregiver Attachment</span>
                                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap">
                                                            {assessmentData.psychoCaregiverAttachmentLevel && <span className="font-semibold block">Level: {assessmentData.psychoCaregiverAttachmentLevel}</span>}
                                                            {assessmentData.psychoCaregiverAttachmentDesc}
                                                        </p>
                                                    </div>
                                                )}
                                                {(assessmentData.psychoPrevCaregiverAttachmentLevel || assessmentData.psychoPrevCaregiverAttachmentDesc) && (
                                                    <div className="space-y-1 sm:col-span-2">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Previous Caregiver Attachment</span>
                                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap">
                                                            {assessmentData.psychoPrevCaregiverAttachmentLevel && <span className="font-semibold block">Level: {assessmentData.psychoPrevCaregiverAttachmentLevel}</span>}
                                                            {assessmentData.psychoPrevCaregiverAttachmentDesc}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Personal Identity Group */}
                                    {(assessmentData.psychoLikes || assessmentData.psychoDislikes || assessmentData.psychoFears) && (
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wide text-secondary mb-3 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Personal Identity
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-md border border-secondary/20 bg-secondary/5">
                                                {assessmentData.psychoLikes && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Likes</span>
                                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{assessmentData.psychoLikes}</p>
                                                    </div>
                                                )}
                                                {assessmentData.psychoDislikes && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dislikes</span>
                                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{assessmentData.psychoDislikes}</p>
                                                    </div>
                                                )}
                                                {assessmentData.psychoFears && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fears</span>
                                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{assessmentData.psychoFears}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Life Skills & Risks Group */}
                                    {(assessmentData.psychoSkills || assessmentData.psychoRoutine || assessmentData.psychoIndependence || (assessmentData.psychoRisks && assessmentData.psychoRisks.length > 0)) && (
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wide text-secondary mb-3 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Life Skills & Risks
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-md border border-secondary/20 bg-secondary/5">
                                                {assessmentData.psychoSkills && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills / Talents</span>
                                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{assessmentData.psychoSkills}</p>
                                                    </div>
                                                )}
                                                {assessmentData.psychoRoutine && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Daily Routine</span>
                                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{assessmentData.psychoRoutine}</p>
                                                    </div>
                                                )}
                                                {assessmentData.psychoIndependence && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Level of Independence</span>
                                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{assessmentData.psychoIndependence}</p>
                                                    </div>
                                                )}
                                                {(assessmentData.psychoRisks && assessmentData.psychoRisks.length > 0) && (
                                                    <div className="space-y-1 sm:col-span-2 p-3 bg-rose-50 border border-rose-100 rounded-md">
                                                        <span className="text-xs font-bold uppercase tracking-wide text-rose-600 flex items-center gap-1">
                                                            <AlertTriangle className="h-3 w-3" /> Identified Risks
                                                        </span>
                                                        <p className="text-sm font-medium text-rose-700 mt-1">
                                                            {Array.isArray(assessmentData.psychoRisks) ? assessmentData.psychoRisks.join(', ') : assessmentData.psychoRisks}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                {/* Assessment & Conclusion */}
                {assessmentData && (
                    assessmentData.assessmentStrengths ||
                    assessmentData.assessmentNeeds ||
                    assessmentData.assessmentGoals ||
                    assessmentData.assessmentObservations ||
                    assessmentData.reintegrationPreference ||
                    assessmentData.reintegrationPreferenceStatus ||
                    assessmentData.reintegrationConcerns ||
                    assessmentData.reintegrationConcernsStatus ||
                    assessmentData.assessmentStatus
                ) && (
                        <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="py-3 px-4 border-b border-primary/20 bg-primary/10">
                                <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                                    <ClipboardList className="h-5 w-5 text-primary" />
                                    Assessment Conclusion
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-6">
                                    {/* Status & Preference Group */}
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wide text-secondary mb-3 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Status & Preference
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-md border border-secondary/20 bg-secondary/5">
                                            <div className="space-y-1">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Child's Preference</span>
                                                <p className="text-sm font-medium text-foreground">{assessmentData.reintegrationPreference || "Not recorded"}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assessment Status</span>
                                                <div>
                                                    <Badge className="font-medium" variant={assessmentData.assessmentStatus === 'Approved' ? 'default' : 'secondary'}>
                                                        {client.status === 'Active' && assessmentData.assessmentStatus !== 'Approved' ? 'In Progress' : (assessmentData.assessmentStatus || "Pending")}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Assessment Analysis Group */}
                                    {(assessmentData.assessmentStrengths || assessmentData.assessmentNeeds || assessmentData.assessmentGoals || assessmentData.assessmentObservations) && (
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wide text-secondary mb-3 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Assessment Analysis
                                            </h4>
                                            <div className="grid grid-cols-1 gap-4 p-4 rounded-md border border-secondary/20 bg-secondary/5">
                                                {assessmentData.assessmentStrengths && (
                                                    <div className="space-y-1 p-3 bg-green-50 border border-green-100 rounded-md">
                                                        <span className="text-xs font-bold uppercase tracking-wide text-green-700">Strengths & Resources</span>
                                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap mt-1">{assessmentData.assessmentStrengths}</p>
                                                    </div>
                                                )}
                                                {assessmentData.assessmentNeeds && (
                                                    <div className="space-y-1 p-3 bg-rose-50 border border-rose-100 rounded-md">
                                                        <span className="text-xs font-bold uppercase tracking-wide text-rose-700">Needs & Concerns</span>
                                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap mt-1">{assessmentData.assessmentNeeds}</p>
                                                    </div>
                                                )}
                                                {assessmentData.assessmentGoals && (
                                                    <div className="space-y-1 p-3 bg-blue-50 border border-blue-100 rounded-md">
                                                        <span className="text-xs font-bold uppercase tracking-wide text-blue-700">Recommended Goals</span>
                                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap mt-1">{assessmentData.assessmentGoals}</p>
                                                    </div>
                                                )}
                                                {assessmentData.assessmentObservations && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Other Observations</span>
                                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{assessmentData.assessmentObservations}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Signatures Group */}
                                    {(assessmentData.caseworkerName || assessmentData.managerName) && (
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wide text-secondary mb-3 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Signatures
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-md border border-secondary/20 bg-secondary/5">
                                                {assessmentData.caseworkerName && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Caseworker</span>
                                                        <p className="text-sm font-bold text-foreground">{assessmentData.caseworkerName}</p>
                                                        {assessmentData.caseworkerSignDate && <p className="text-xs text-muted-foreground">Signed: {assessmentData.caseworkerSignDate}</p>}
                                                    </div>
                                                )}
                                                {assessmentData.managerName && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Case Manager</span>
                                                        <p className="text-sm font-bold text-foreground">{assessmentData.managerName}</p>
                                                        {assessmentData.managerSignDate && <p className="text-xs text-muted-foreground">Signed: {assessmentData.managerSignDate}</p>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                {/* For Official Use Only */}
                {assessmentData?.officialSignatures && (
                    <Card className="border-secondary/20 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <CardHeader className="py-3 px-4 border-b border-secondary/20 bg-secondary/10">
                            <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                                <ClipboardList className="h-5 w-5 text-secondary" />
                                For Official Use Only
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {assessmentData.officialSignatures.socialWorker?.name && (
                                    <div className="p-4 rounded-md border border-secondary/20 bg-secondary/5">
                                        <h4 className="text-xs font-bold uppercase tracking-wide text-secondary mb-2 flex items-center gap-2">
                                            Social Worker
                                        </h4>
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</span>
                                            <p className="text-sm font-medium text-foreground">{assessmentData.officialSignatures.socialWorker.name}</p>
                                        </div>
                                        <div className="space-y-1 mt-2">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</span>
                                            <p className="text-sm font-medium text-foreground">{assessmentData.officialSignatures.socialWorker.date || "N/A"}</p>
                                        </div>
                                    </div>
                                )}
                                {assessmentData.officialSignatures.headOfRehab?.name && (
                                    <div className="p-4 rounded-md border border-secondary/20 bg-secondary/5">
                                        <h4 className="text-xs font-bold uppercase tracking-wide text-secondary mb-2 flex items-center gap-2">
                                            Head of Rehab / Principal
                                        </h4>
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</span>
                                            <p className="text-sm font-medium text-foreground">{assessmentData.officialSignatures.headOfRehab.name}</p>
                                        </div>
                                        <div className="space-y-1 mt-2">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</span>
                                            <p className="text-sm font-medium text-foreground">{assessmentData.officialSignatures.headOfRehab.date || "N/A"}</p>
                                        </div>
                                    </div>
                                )}
                                {assessmentData.officialSignatures.director?.name && (
                                    <div className="p-4 rounded-md border border-secondary/20 bg-secondary/5">
                                        <h4 className="text-xs font-bold uppercase tracking-wide text-secondary mb-2 flex items-center gap-2">
                                            Director
                                        </h4>
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</span>
                                            <p className="text-sm font-medium text-foreground">{assessmentData.officialSignatures.director.name}</p>
                                        </div>
                                        <div className="space-y-1 mt-2">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</span>
                                            <p className="text-sm font-medium text-foreground">{assessmentData.officialSignatures.director.date || "N/A"}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* General/Additional Notes */}
                {actualNotes && !actualNotes.trim().startsWith('{') && (
                    <Card className="border-secondary/20 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <CardHeader className="py-3 px-4 border-b border-secondary/20 bg-secondary/10">
                            <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                                <FileText className="h-5 w-5 text-secondary" />
                                Additional / General Notes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="overflow-x-auto rounded-md border border-secondary/20">
                                <table className="w-full text-sm text-left min-w-[300px]">
                                    <tbody>
                                        <tr className="hover:bg-secondary/5">
                                            <td className="px-4 py-4 font-medium whitespace-pre-wrap text-foreground break-words">{actualNotes}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}



                {/* Aftercare Records */}
                {client.aftercare_records && client.aftercare_records.length > 0 && (
                    <Card className="border-secondary/20 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <CardHeader className="py-3 px-4 border-b border-secondary/20 bg-secondary/10">
                            <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                                <Briefcase className="h-5 w-5 text-secondary" />
                                Aftercare & Placement Records
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-4">
                                {client.aftercare_records.map((record, index) => (
                                    <div key={record.id} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-sm text-secondary uppercase tracking-wide flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Placement {index + 1}
                                            </h4>
                                            <Badge className="bg-rose-100 text-rose-700 border-rose-300 shadow-none hover:bg-rose-200 transition-colors">
                                                {record.completion_status}
                                            </Badge>
                                        </div>

                                        <div className="overflow-x-auto rounded-md border border-secondary/20">
                                                <table className="w-full text-sm text-left min-w-[500px]">
                                                    <tbody className="divide-y divide-secondary/10">
                                                        {/* Row 1: Institution & Course */}
                                                        <tr className="hover:bg-secondary/5">
                                                            <td className="px-4 py-3 font-semibold text-muted-foreground w-1/3 sm:w-1/4 bg-secondary/5">Institution/Workshop</td>
                                                            <td className="px-4 py-3 font-medium">{record.institution_workshop}</td>
                                                        </tr>
                                                    {record.placement_course && (
                                                        <tr className="hover:bg-secondary/5">
                                                            <td className="px-4 py-3 font-semibold text-muted-foreground bg-secondary/5">Course/Class</td>
                                                            <td className="px-4 py-3 font-medium">{record.placement_course}</td>
                                                        </tr>
                                                    )}

                                                    {/* Row 2: Type & Location */}
                                                    {record.placement_type && (
                                                        <tr className="hover:bg-secondary/5">
                                                            <td className="px-4 py-3 font-semibold text-muted-foreground bg-secondary/5">Placement Type</td>
                                                            <td className="px-4 py-3 font-medium capitalize">{record.placement_type.replace('_', ' ')}</td>
                                                        </tr>
                                                    )}
                                                    {record.placement_location && (
                                                        <tr className="hover:bg-secondary/5">
                                                            <td className="px-4 py-3 font-semibold text-muted-foreground bg-secondary/5">Location</td>
                                                            <td className="px-4 py-3 font-medium">{record.placement_location}</td>
                                                        </tr>
                                                    )}

                                                    {/* Row 3: Contact Info */}
                                                    {record.contact_person && (
                                                        <tr className="hover:bg-secondary/5">
                                                            <td className="px-4 py-3 font-semibold text-muted-foreground bg-secondary/5">Contact Person</td>
                                                            <td className="px-4 py-3 font-medium">{record.contact_person}</td>
                                                        </tr>
                                                    )}
                                                    {record.contact_phone && (
                                                        <tr className="hover:bg-secondary/5">
                                                            <td className="px-4 py-3 font-semibold text-muted-foreground bg-secondary/5">Contact Phone</td>
                                                            <td className="px-4 py-3 font-medium">{record.contact_phone}</td>
                                                        </tr>
                                                    )}

                                                    {/* Row 4: Dates & Fees */}
                                                    {record.placement_date && (
                                                        <tr className="hover:bg-secondary/5">
                                                            <td className="px-4 py-3 font-semibold text-muted-foreground bg-secondary/5">Placement Date</td>
                                                            <td className="px-4 py-3 font-medium">{new Date(record.placement_date).toLocaleDateString()}</td>
                                                        </tr>
                                                    )}
                                                    {record.completion_date && (
                                                        <tr className="hover:bg-secondary/5">
                                                            <td className="px-4 py-3 font-semibold text-muted-foreground bg-secondary/5">Completion Date</td>
                                                            <td className="px-4 py-3 font-medium">{new Date(record.completion_date).toLocaleDateString()}</td>
                                                        </tr>
                                                    )}
                                                    {record.placement_fees && (
                                                        <tr className="hover:bg-secondary/5">
                                                            <td className="px-4 py-3 font-semibold text-muted-foreground bg-secondary/5">Placement Fees</td>
                                                            <td className="px-4 py-3 font-medium">KSh {record.placement_fees.toLocaleString()}</td>
                                                        </tr>
                                                    )}

                                                    {/* Details & Notes */}
                                                    {record.placement_type_details && (
                                                        <tr className="hover:bg-secondary/5">
                                                            <td className="px-4 py-3 font-semibold text-muted-foreground bg-secondary/5 align-top">Details</td>
                                                            <td className="px-4 py-3 font-medium whitespace-pre-wrap">{record.placement_type_details}</td>
                                                        </tr>
                                                    )}
                                                    {record.notes && (
                                                        <tr className="hover:bg-secondary/5">
                                                            <td className="px-4 py-3 font-semibold text-muted-foreground bg-secondary/5 align-top">Notes</td>
                                                            <td className="px-4 py-3 font-medium whitespace-pre-wrap">{record.notes}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

            </div>

</div>
    );
};

export default ClientDetails;
