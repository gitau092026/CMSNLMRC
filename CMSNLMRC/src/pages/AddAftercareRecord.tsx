import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  { value: 'school', label: 'School' },
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
        // Insert the aftercare record
        const { error } = await supabase
          .from('aftercare_records')
          .insert({
            ...recordData,
            client_id: clientId,
            created_by: userData?.user?.id
          });

        if (error) throw error;

        // Update client status to "Alumni - Placed" when aftercare record is added
        const { error: updateError } = await supabase
          .from('clients')
          .update({ status: 'Alumni - Placed' })
          .eq('id', clientId);

        if (updateError) {
          console.error('Failed to update client status:', updateError);
          toast({
            title: "Warning",
            description: "Placement record added, but status update failed",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Success",
            description: "Placement record added and client status updated to 'Alumni - Placed'"
          });
        }
      }

      // Navigate back and force refresh by adding timestamp
      navigate('/aftercare?refresh=' + Date.now());
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
    <div className="p-3 sm:p-4 space-y-3 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-muted shrink-0 h-8 w-8"
          onClick={() => navigate('/aftercare')}
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {isEditMode ? 'Edit Placement Record' : 'Add Placement Record'}
          </h2>
          {clientName && (
            <p className="text-muted-foreground text-xs">For client: {clientName}</p>
          )}
        </div>
      </div>

      <Card className="border-border">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              {/* Left Column */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="institution_workshop" className="text-xs font-semibold">Institution/Workshop *</Label>
                  <Input
                    id="institution_workshop"
                    value={formData.institution_workshop}
                    onChange={(e) => setFormData({ ...formData, institution_workshop: e.target.value })}
                    placeholder="Enter institution or workshop name"
                    className="h-8 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="placement_course" className="text-xs font-semibold">Placement Course/Class</Label>
                  <Input
                    id="placement_course"
                    value={formData.placement_course}
                    onChange={(e) => setFormData({ ...formData, placement_course: e.target.value })}
                    placeholder="Enter course or class name"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="placement_type" className="text-xs font-semibold">Placement Type</Label>
                  <Select
                    value={formData.placement_type}
                    onValueChange={(value) => setFormData({ ...formData, placement_type: value, placement_type_details: "" })}
                  >
                    <SelectTrigger className="h-8 text-sm">
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
                  <div className="space-y-1">
                    <Label htmlFor="placement_type_details" className="text-xs font-semibold">
                      {formData.placement_type === 'vocational_training' 
                        ? 'Vocational Training Details' 
                        : formData.placement_type === 'school'
                        ? 'School Details'
                        : 'Apprenticeship Details'}
                    </Label>
                    <Textarea
                      id="placement_type_details"
                      value={formData.placement_type_details}
                      onChange={(e) => setFormData({ ...formData, placement_type_details: e.target.value })}
                      placeholder={formData.placement_type === 'vocational_training'
                        ? "Enter vocational training details"
                        : formData.placement_type === 'school'
                        ? "Enter school details"
                        : "Enter apprenticeship details"}
                      rows={2}
                      className="min-h-[50px] text-sm py-1"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="placement_location" className="text-xs font-semibold">Placement Location</Label>
                  <Input
                    id="placement_location"
                    value={formData.placement_location}
                    onChange={(e) => setFormData({ ...formData, placement_location: e.target.value })}
                    placeholder="Enter placement location"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="placement_fees" className="text-xs font-semibold">Placement Fees</Label>
                  <Input
                    id="placement_fees"
                    type="number"
                    value={formData.placement_fees}
                    onChange={(e) => setFormData({ ...formData, placement_fees: e.target.value })}
                    placeholder="Enter fees amount"
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="contact_person" className="text-xs font-semibold">Contact Person Name</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="Enter contact name"
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="contact_phone" className="text-xs font-semibold">Contact Person Phone</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      placeholder="Enter phone"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="placement_date" className="text-xs font-semibold">Placement Date</Label>
                    <Input
                      id="placement_date"
                      type="date"
                      value={formData.placement_date}
                      onChange={(e) => setFormData({ ...formData, placement_date: e.target.value })}
                      className="h-8 text-sm py-1"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="completion_date" className="text-xs font-semibold">Completion Date</Label>
                    <Input
                      id="completion_date"
                      type="date"
                      value={formData.completion_date}
                      onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                      className="h-8 text-sm py-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="completion_status" className="text-xs font-semibold">Completion Status *</Label>
                  <Select
                    value={formData.completion_status}
                    onValueChange={(value) => setFormData({ ...formData, completion_status: value })}
                  >
                    <SelectTrigger className="h-8 text-sm">
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

                <div className="space-y-1">
                  <Label htmlFor="notes" className="text-xs font-semibold">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about the placement"
                    rows={formData.placement_type ? 2 : 4}
                    className="min-h-[60px] text-sm py-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t border-border/80">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/aftercare')}
                className="w-full sm:flex-1 h-8 text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-1 h-8 text-sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : isEditMode ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddAftercareRecord;
