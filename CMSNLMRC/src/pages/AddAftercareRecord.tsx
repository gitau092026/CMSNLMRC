import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const completionStatusOptions = [
  { value: 'in progress', label: 'In Progress' },
  { value: 'internship', label: 'Internship' },
  { value: 'employed', label: 'Employed' },
  { value: 'relapse', label: 'Relapse' },
  { value: 'absconded', label: 'Absconded' },
  { value: 'attachment', label: 'Attachment' },
];

const placementTypeOptions = [
  { value: 'vocational_training', label: 'Vocational Training' },
  { value: 'apprenticeship', label: 'Apprenticeship' },
];

const AddAftercareRecord = () => {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const [searchParams] = useSearchParams();
  const recordId = searchParams.get('edit');
  const isEditMode = !!recordId;
  
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clientName, setClientName] = useState("");
  const [formData, setFormData] = useState({
    institution_workshop: "",
    placement_course: "",
    contact_person: "",
    contact_phone: "",
    placement_date: "",
    completion_date: "",
    placement_location: "",
    placement_fees: "",
    placement_type: "",
    placement_type_details: "",
    completion_status: "in progress",
    notes: ""
  });

  useEffect(() => {
    if (clientId) {
      fetchClientName();
    }
    if (recordId) {
      fetchRecord();
    }
  }, [clientId, recordId]);

  const fetchClientName = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('name')
        .eq('id', clientId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setClientName(data.name);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch client details",
        variant: "destructive"
      });
    }
  };

  const fetchRecord = async () => {
    try {
      const { data, error } = await supabase
        .from('aftercare_records')
        .select('*')
        .eq('id', recordId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setFormData({
          institution_workshop: data.institution_workshop || "",
          placement_course: data.placement_course || "",
          contact_person: data.contact_person || "",
          contact_phone: data.contact_phone || "",
          placement_date: data.placement_date || "",
          completion_date: data.completion_date || "",
          placement_location: data.placement_location || "",
          placement_fees: data.placement_fees?.toString() || "",
          placement_type: data.placement_type || "",
          placement_type_details: data.placement_type_details || "",
          completion_status: data.completion_status || "in progress",
          notes: data.notes || ""
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch record details",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.institution_workshop.trim()) {
      toast({
        title: "Validation Error",
        description: "Institution/Workshop is required",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();

      const recordData = {
        institution_workshop: formData.institution_workshop.trim(),
        placement_course: formData.placement_course.trim() || null,
        contact_person: formData.contact_person.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        placement_date: formData.placement_date || null,
        completion_date: formData.completion_date || null,
        placement_location: formData.placement_location.trim() || null,
        placement_fees: formData.placement_fees ? parseFloat(formData.placement_fees) : null,
        placement_type: formData.placement_type || null,
        placement_type_details: formData.placement_type_details.trim() || null,
        completion_status: formData.completion_status,
        notes: formData.notes.trim() || null,
      };

      if (isEditMode) {
        const { error } = await supabase
          .from('aftercare_records')
          .update(recordData)
          .eq('id', recordId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Aftercare record updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('aftercare_records')
          .insert({
            ...recordData,
            client_id: clientId,
            created_by: userData?.user?.id
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Aftercare record added successfully"
        });
      }

      navigate('/aftercare');
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

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <div className="relative bg-gradient-primary h-24 flex items-center px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20"
            onClick={() => navigate('/aftercare')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              {isEditMode ? 'Edit Placement Record' : 'Add Placement Record'}
            </h1>
            {clientName && (
              <p className="text-white/80 text-sm">For: {clientName}</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Placement Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="institution_workshop">Institution/Workshop *</Label>
                <Input
                  id="institution_workshop"
                  value={formData.institution_workshop}
                  onChange={(e) => setFormData({ ...formData, institution_workshop: e.target.value })}
                  placeholder="Enter institution or workshop name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="placement_course">Placement Course/Class</Label>
                <Input
                  id="placement_course"
                  value={formData.placement_course}
                  onChange={(e) => setFormData({ ...formData, placement_course: e.target.value })}
                  placeholder="Enter course or class name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="placement_type">Placement Type</Label>
                <Select
                  value={formData.placement_type}
                  onValueChange={(value) => setFormData({ ...formData, placement_type: value, placement_type_details: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select placement type" />
                  </SelectTrigger>
                  <SelectContent>
                    {placementTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.placement_type && (
                <div className="space-y-2">
                  <Label htmlFor="placement_type_details">
                    {formData.placement_type === 'vocational_training' ? 'Vocational Training Details' : 'Apprenticeship Details'}
                  </Label>
                  <Textarea
                    id="placement_type_details"
                    value={formData.placement_type_details}
                    onChange={(e) => setFormData({ ...formData, placement_type_details: e.target.value })}
                    placeholder={formData.placement_type === 'vocational_training' 
                      ? "Enter vocational training details (e.g., trade, duration, curriculum)" 
                      : "Enter apprenticeship details (e.g., trade, mentor, duration)"}
                    rows={3}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person Name</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="Enter contact person's name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Person Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="placement_location">Placement Location</Label>
                <Input
                  id="placement_location"
                  value={formData.placement_location}
                  onChange={(e) => setFormData({ ...formData, placement_location: e.target.value })}
                  placeholder="Enter placement location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="placement_fees">Placement Fees</Label>
                <Input
                  id="placement_fees"
                  type="number"
                  value={formData.placement_fees}
                  onChange={(e) => setFormData({ ...formData, placement_fees: e.target.value })}
                  placeholder="Enter fees amount"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="placement_date">Placement Date</Label>
                  <Input
                    id="placement_date"
                    type="date"
                    value={formData.placement_date}
                    onChange={(e) => setFormData({ ...formData, placement_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="completion_date">Completion Date</Label>
                  <Input
                    id="completion_date"
                    type="date"
                    value={formData.completion_date}
                    onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="completion_status">Completion Status *</Label>
                <Select
                  value={formData.completion_status}
                  onValueChange={(value) => setFormData({ ...formData, completion_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {completionStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about the placement"
                  rows={4}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/aftercare')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : isEditMode ? "Update Record" : "Save Record"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddAftercareRecord;
