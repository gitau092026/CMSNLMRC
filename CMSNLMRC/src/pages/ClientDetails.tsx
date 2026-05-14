import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Calendar,
  Phone,
  MapPin,
  FileText,
  Edit,
  ArrowLeft,
  Cake,
  UserCircle,
  Users,
  GraduationCap,
  Shield,
  Heart,
  Home,
} from "lucide-react";

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
}

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchClientDetails();
    }
  }, [id]);

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
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
        return "bg-primary/20 text-primary border-primary/30";
      case "Escape":
        return "bg-red-100 text-red-600 border-red-300 dark:bg-red-950 dark:text-red-400";
      case "Voluntary Discharge":
        return "bg-purple-100 text-purple-600 border-purple-300 dark:bg-purple-950 dark:text-purple-400";
      case "Early Reintegration":
        return "bg-blue-100 text-blue-600 border-blue-300 dark:bg-blue-950 dark:text-blue-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background w-full overflow-x-hidden">
        <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 h-24 flex items-center px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <h1 className="relative text-2xl sm:text-3xl font-bold text-white">Client Details</h1>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          <Card className="border-border">
            <CardContent className="p-8 text-center text-muted-foreground">
              Loading client details...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background w-full overflow-x-hidden">
        <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 h-24 flex items-center px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <h1 className="relative text-2xl sm:text-3xl font-bold text-white">Client Details</h1>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          <Card className="border-border">
            <CardContent className="p-8 text-center text-muted-foreground">
              Client not found
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 h-24 flex items-center px-4 sm:px-6 lg:px-8">
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

      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Client Header Card */}
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{client.name}</h2>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {client.client_id}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge className={`${getStatusColor(client.status)} border px-4 py-2`}>
                  <span className="inline-block w-2 h-2 rounded-full bg-current mr-2" />
                  {client.status}
                </Badge>
                <Button onClick={() => navigate(`/register?clientId=${client.id}&mode=edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Cake className="h-4 w-4" />
                  <span className="text-sm font-medium">Age</span>
                </div>
                <p className="text-lg font-semibold text-foreground">{client.age} years</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Date of Birth</span>
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {client.date_of_birth ? new Date(client.date_of_birth).toLocaleDateString() : 'Not specified'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Gender</span>
                </div>
                <p className="text-lg font-semibold text-foreground">{client.gender || 'Not specified'}</p>
              </div>

              {client.nickname && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">Nickname</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">{client.nickname}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Admission Date</span>
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {client.admission_date ? new Date(client.admission_date).toLocaleDateString() : 'Not specified'}
                </p>
              </div>

              {client.admission_type && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Admission Type</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">{client.admission_type}</p>
                </div>
              )}

              {client.intake_number && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Intake Number</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">{client.intake_number}</p>
                </div>
              )}

              {client.police_ob_number && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Police OB Number</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">{client.police_ob_number}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Admission Details */}
        {(client.admission_type_details || client.street_name || client.partner_name) && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-blue-500" />
                Admission Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {client.admission_type_details && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">Admission Details</span>
                    </div>
                    <p className="text-foreground">{client.admission_type_details}</p>
                  </div>
                )}

                {client.street_name && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm font-medium">Street Name</span>
                    </div>
                    <p className="text-foreground">{client.street_name}</p>
                  </div>
                )}

                {client.street_duration && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">Street Duration</span>
                    </div>
                    <p className="text-foreground">{client.street_duration}</p>
                  </div>
                )}

                {client.partner_name && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">Partner Organization</span>
                    </div>
                    <p className="text-foreground">{client.partner_name}</p>
                  </div>
                )}

                {client.partner_contact_person && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">Partner Contact Person</span>
                    </div>
                    <p className="text-foreground">{client.partner_contact_person}</p>
                  </div>
                )}

                {client.partner_contact && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm font-medium">Partner Contact</span>
                    </div>
                    <p className="text-foreground">{client.partner_contact}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Family Information */}
        {(client.family_composition || client.mother_name || client.father_name || client.guardian_name) && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Family Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {client.family_composition && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">Family Composition</span>
                  </div>
                  <p className="text-foreground">{client.family_composition}</p>
                </div>
              )}

              {client.siblings_info && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">Siblings Information</span>
                  </div>
                  <p className="text-foreground">{client.siblings_info}</p>
                </div>
              )}

              {client.mother_name && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Mother's Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {client.mother_status && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <p className="text-foreground">{client.mother_status}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Name</span>
                      <p className="text-foreground">{client.mother_name}</p>
                    </div>
                    {client.mother_location && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Location</span>
                        <p className="text-foreground">{client.mother_location}</p>
                      </div>
                    )}
                    {client.mother_contact && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Contact</span>
                        <p className="text-foreground">{client.mother_contact}</p>
                      </div>
                    )}
                    {client.mother_occupation && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Occupation</span>
                        <p className="text-foreground">{client.mother_occupation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {client.father_name && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Father's Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {client.father_status && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <p className="text-foreground">{client.father_status}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Name</span>
                      <p className="text-foreground">{client.father_name}</p>
                    </div>
                    {client.father_location && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Location</span>
                        <p className="text-foreground">{client.father_location}</p>
                      </div>
                    )}
                    {client.father_contact && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Contact</span>
                        <p className="text-foreground">{client.father_contact}</p>
                      </div>
                    )}
                    {client.father_occupation && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Occupation</span>
                        <p className="text-foreground">{client.father_occupation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {client.guardian_name && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Guardian's Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {client.guardian_status && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <p className="text-foreground">{client.guardian_status}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Name</span>
                      <p className="text-foreground">{client.guardian_name}</p>
                    </div>
                    {client.guardian_location && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Location</span>
                        <p className="text-foreground">{client.guardian_location}</p>
                      </div>
                    )}
                    {client.guardian_contact && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Contact</span>
                        <p className="text-foreground">{client.guardian_contact}</p>
                      </div>
                    )}
                    {client.guardian_occupation && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Occupation</span>
                        <p className="text-foreground">{client.guardian_occupation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Education Information */}
        {(client.education_level || client.school_name) && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                Education Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {client.education_level && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span className="text-sm font-medium">Education Level</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground">{client.education_level}</p>
                  </div>
                )}

                {client.school_name && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span className="text-sm font-medium">School Name</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground">{client.school_name}</p>
                  </div>
                )}

                {client.level_reached && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span className="text-sm font-medium">Level Reached</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground">{client.level_reached}</p>
                  </div>
                )}

                {client.education_status && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span className="text-sm font-medium">Education Status</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground">{client.education_status}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rescue Details */}
        {client.rescue_details && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Rescue Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{client.rescue_details}</p>
            </CardContent>
          </Card>
        )}

        {/* Additional Notes */}
        {client.notes && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Additional Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{client.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => navigate(`/home-visits?clientId=${client.id}`)}
              >
                <Home className="h-6 w-6" />
                <span>Schedule Home Visit</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
              >
                <GraduationCap className="h-6 w-6" />
                <span>View Education Records</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
              >
                <Users className="h-6 w-6" />
                <span>Counselling History</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Created: {new Date(client.created_at).toLocaleString()}</p>
              <p>Client ID: {client.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDetails;
