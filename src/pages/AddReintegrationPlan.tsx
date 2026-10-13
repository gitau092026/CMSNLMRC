import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  User,
  Calendar,
  MapPin,
  GraduationCap,
  Home,
  AlertCircle,
  Lightbulb,
  ClipboardList,
  Save,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AddReintegrationPlan = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialClientId = searchParams.get("clientId");
  const visitId = searchParams.get("visitId");
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);

  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(initialClientId || "");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    disabilityStatus: "",
    dateOfExit: "",
    assessmentReport: "",
    keyContacts: "",
    reintegrationPlans: "",
    proposedCaregivers: "",
    caregiverRelationship: "",
    caregiverContacts: "",
    natureOfReintegration: "",
    village: "",
    subcounty: "",
    county: "",
    reintegrationRecommendations: "",
    coursePlacementPlans: "",
    caseworkerName: "",
    familyInterventions: "",
    aftercareFollowupPlan: ""
  });

  useEffect(() => {
    fetchClients();
    if (visitId) {
      fetchVisitData();
    }
  }, []);

  const fetchVisitData = async () => {
    try {
      const { data, error } = await supabase
        .from('home_visits')
        .select('*')
        .eq('id', visitId)
        .single();

      if (error) throw error;

      if (data) {
        setIsEditMode(true);
        setSelectedClientId(data.client_id);
        setFormData({
          visitDate: data.visit_date,
          disabilityStatus: data.disability_status || "",
          dateOfExit: data.date_of_exit || "",
          assessmentReport: data.assessment_report || "",
          keyContacts: data.key_contacts || "",
          reintegrationPlans: data.reintegration_plans || "",
          proposedCaregivers: data.proposed_caregivers || "",
          caregiverRelationship: data.caregiver_relationship || "",
          caregiverContacts: data.caregiver_contacts || "",
          natureOfReintegration: data.nature_of_reintegration || "",
          village: data.village || "",
          subcounty: data.subcounty || "",
          county: data.county || "",
          reintegrationRecommendations: data.reintegration_recommendations || "",
          coursePlacementPlans: data.course_placement_plans || "",
          caseworkerName: data.caseworker_name || "",
          familyInterventions: data.family_interventions || "",
          aftercareFollowupPlan: data.aftercare_followup_plan || ""
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (selectedClientId && clients.length > 0) {
      const client = clients.find(c => c.id === selectedClientId);
      setSelectedClient(client);
    }
  }, [selectedClientId, clients]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .or('status.ilike.active,status.eq.Complete')
        .order('name');

      if (clientsError) throw clientsError;

      // Fetch clients who already have a reintegration plan
      const { data: visitsData, error: visitsError } = await supabase
        .from('home_visits')
        .select('client_id');

      if (visitsError) throw visitsError;

      const visitedIds = new Set(visitsData?.map((v: any) => v.client_id) || []);

      // Filter out clients with plans unless editing an existing plan or passed as initial client
      const availableClients = (clientsData || []).filter((c: any) => {
        if (visitId || initialClientId === c.id) return true;
        return !visitedIds.has(c.id);
      });

      setClients(availableClients);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate client selection (only for new visits)
    if (!isEditMode && !selectedClientId) {
      toast({
        title: "No Client Selected",
        description: "Please select a client first.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!formData.assessmentReport || !formData.caseworkerName || !formData.natureOfReintegration) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Assessment Report, Caseworker Name, and Nature of Reintegration).",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const baseVisitData = {
        visit_date: formData.visitDate,
        visited_by: user?.id,
        disability_status: formData.disabilityStatus,
        date_of_exit: formData.dateOfExit || null,
        assessment_report: formData.assessmentReport,
        key_contacts: formData.keyContacts,
        reintegration_plans: formData.reintegrationPlans,
        proposedCaregivers: formData.proposedCaregivers,
        caregiver_relationship: formData.caregiverRelationship,
        caregiver_contacts: formData.caregiverContacts,
        nature_of_reintegration: formData.natureOfReintegration,
        village: formData.village,
        subcounty: formData.subcounty,
        county: formData.county,
        reintegration_recommendations: formData.reintegrationRecommendations,
        course_placement_plans: formData.coursePlacementPlans,
        caseworker_name: formData.caseworkerName,
        family_interventions: formData.familyInterventions,
        aftercare_followup_plan: formData.aftercareFollowupPlan
      };

      let error;
      if (isEditMode && visitId) {
        // Update existing visit (don't include client_id)
        const result = await supabase
          .from('home_visits')
          .update(baseVisitData)
          .eq('id', visitId);
        error = result.error;
      } else {
        // Insert new visit (include client_id)
        const result = await supabase
          .from('home_visits')
          .insert({ ...baseVisitData, client_id: selectedClientId });
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: isEditMode ? "Reintegration plan updated successfully." : "Reintegration plan saved successfully.",
      });

      navigate("/reintegration-plans");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    navigate("/reintegration-plans");
  };

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="sticky top-14 z-10 shadow-md bg-gradient-primary h-24 flex items-center px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            {isEditMode ? "Edit Reintegration Plan" : "Add Reintegration Plan"}
          </h1>
          <p className="text-sm sm:text-base text-white/90">
            {selectedClient ? `Client: ${selectedClient.name}` : 'Select a client to begin'}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection Section */}
          <Card className="border-t-4 border-t-orange-500">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>{isEditMode ? "Client Information" : "Select Client"}</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                {isEditMode ? "Client assigned to this plan" : "Choose the client for this reintegration plan"}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Active Client <span className="text-destructive">*</span>
                </label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId} disabled={isEditMode}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    {loading ? (
                      <SelectItem value="loading" disabled>Loading clients...</SelectItem>
                    ) : clients.length === 0 ? (
                      <SelectItem value="none" disabled>No eligible clients (all have plans)</SelectItem>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.client_id})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Client Information Section - Only shown when client is selected */}
          {selectedClient && (
            <Card className="border-t-4 border-t-orange-500">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <CardTitle>Client Information</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Complete client profile and current status
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Client Profile Card */}
                <div className="bg-secondary/50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 bg-orange-500">
                        <AvatarFallback className="text-white text-xl">
                          {selectedClient.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-semibold">{selectedClient.name}</h3>
                        <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                          <span>{selectedClient.age || 'N/A'} years old</span>
                          <span>•</span>
                          <span>{selectedClient.gender || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20">
                      {selectedClient.status || 'ACTIVE'}
                    </Badge>
                  </div>
                </div>

                {/* Client Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500 rounded-lg">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">ADMISSION DATE</p>
                          <p className="font-semibold">
                            {selectedClient.admission_date
                              ? new Date(selectedClient.admission_date).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500 rounded-lg">
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">ADMISSION TYPE</p>
                          <p className="font-semibold">{selectedClient.admission_type || 'N/A'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500 rounded-lg">
                          <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">EDUCATION LEVEL</p>
                          <p className="font-semibold">{selectedClient.education_level || 'N/A'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500 rounded-lg">
                          <Home className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">CLIENT ID</p>
                          <p className="font-semibold">{selectedClient.client_id || 'N/A'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Visit Information Section */}
          <Card className="border-t-4 border-t-purple-500">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                <CardTitle>Reintegration Plan Information</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Complete the comprehensive reintegration plan assessment
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Visit Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h3>Basic Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Visit Date <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="date"
                      value={formData.visitDate}
                      onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Name of Caseworker <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={formData.caseworkerName}
                      onChange={(e) => setFormData({ ...formData, caseworkerName: e.target.value })}
                      placeholder="Enter caseworker name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Disability Status</label>
                    <Input
                      value={formData.disabilityStatus}
                      onChange={(e) => setFormData({ ...formData, disabilityStatus: e.target.value })}
                      placeholder="Enter disability status if applicable"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date of Exit</label>
                    <Input
                      type="date"
                      value={formData.dateOfExit}
                      onChange={(e) => setFormData({ ...formData, dateOfExit: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Assessment Report */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <FileText className="h-5 w-5 text-orange-600" />
                  <h3>Assessment Report</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Reintegration Plan Assessment Report/Feedback <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    placeholder="Enter detailed assessment report and feedback..."
                    value={formData.assessmentReport}
                    onChange={(e) => setFormData({ ...formData, assessmentReport: e.target.value })}
                    rows={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Key Contacts</label>
                  <Textarea
                    placeholder="Enter key contacts information..."
                    value={formData.keyContacts}
                    onChange={(e) => setFormData({ ...formData, keyContacts: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              {/* Reintegration Plans */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Home className="h-5 w-5 text-teal-600" />
                  <h3>Reintegration Plans</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Client&apos;s Reintegration Plans Summary</label>
                  <Textarea
                    placeholder="Enter reintegration plans summary..."
                    value={formData.reintegrationPlans}
                    onChange={(e) => setFormData({ ...formData, reintegrationPlans: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Proposed Caregivers</label>
                    <Input
                      value={formData.proposedCaregivers}
                      onChange={(e) => setFormData({ ...formData, proposedCaregivers: e.target.value })}
                      placeholder="Names of caregivers"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Caregiver Relationship</label>
                    <Input
                      value={formData.caregiverRelationship}
                      onChange={(e) => setFormData({ ...formData, caregiverRelationship: e.target.value })}
                      placeholder="Relationship to client"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Caregiver Contacts</label>
                    <Input
                      value={formData.caregiverContacts}
                      onChange={(e) => setFormData({ ...formData, caregiverContacts: e.target.value })}
                      placeholder="Contact information"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Nature of Reintegration <span className="text-destructive">*</span></label>
                  <Select
                    value={formData.natureOfReintegration}
                    onValueChange={(value) => setFormData({ ...formData, natureOfReintegration: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select nature of reintegration..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card z-50">
                      <SelectItem value="Primary family">Primary family</SelectItem>
                      <SelectItem value="Kinship">Kinship</SelectItem>
                      <SelectItem value="Supported independent living">Supported independent living</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Place of Reintegration */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  <h3>Place of Reintegration</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Village</label>
                    <Input
                      value={formData.village}
                      onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                      placeholder="Enter village"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subcounty</label>
                    <Input
                      value={formData.subcounty}
                      onChange={(e) => setFormData({ ...formData, subcounty: e.target.value })}
                      placeholder="Enter subcounty"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">County</label>
                    <Input
                      value={formData.county}
                      onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                      placeholder="Enter county"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Reintegration Recommendations</label>
                  <Textarea
                    placeholder="Any other recommendations for reintegration..."
                    value={formData.reintegrationRecommendations}
                    onChange={(e) => setFormData({ ...formData, reintegrationRecommendations: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              {/* Education Plans */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <GraduationCap className="h-5 w-5 text-green-600" />
                  <h3>Education & Training</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Course/School Placement Plans</label>
                  <Textarea
                    placeholder="Enter course or school placement plans..."
                    value={formData.coursePlacementPlans}
                    onChange={(e) => setFormData({ ...formData, coursePlacementPlans: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>

              {/* Family Interventions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <User className="h-5 w-5 text-pink-600" />
                  <h3>Family Support</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Proposed Interventions for Family/Household Members
                  </label>
                  <Textarea
                    placeholder="e.g., Referrals, Linkages, Empowerment programs, etc..."
                    value={formData.familyInterventions}
                    onChange={(e) => setFormData({ ...formData, familyInterventions: e.target.value })}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Include referrals, linkages, empowerment programs, and other support interventions
                  </p>
                </div>
              </div>

              {/* Aftercare Follow-up */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  <h3>Aftercare Plan</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Individual Aftercare Follow-up Plan</label>
                  <Textarea
                    placeholder="Enter the individual aftercare follow-up plan..."
                    value={formData.aftercareFollowupPlan}
                    onChange={(e) => setFormData({ ...formData, aftercareFollowupPlan: e.target.value })}
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Detail the follow-up schedule, monitoring activities, and support systems to be put in place
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Reintegration Plan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReintegrationPlan;