import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle, AlertTriangle, Calendar, User, Plus, Edit, Stethoscope, Hospital, ArrowLeft, UserCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Client {
  id: string;
  name: string;
  client_id: string;
  date_of_birth: string | null;
  status: string;
  profile_picture: string | null;
}

interface MedicalRecord {
  id: string;
  client_id: string;
  visit_date: string;
  hospital_name: string;
  reason_for_visit: string;
  diagnosis: string | null;
  treatment_given: string | null;
  medications_prescribed: string | null;
  follow_up_date: string | null;
  doctor_name: string | null;
  notes: string | null;
}

interface MedicalFormData {
  visit_date: string;
  hospital_name: string;
  reason_for_visit: string;
  diagnosis: string;
  treatment_given: string;
  medications_prescribed: string;
  follow_up_date: string;
  doctor_name: string;
  notes: string;
}

const initialFormData: MedicalFormData = {
  visit_date: new Date().toISOString().split('T')[0],
  hospital_name: '',
  reason_for_visit: '',
  diagnosis: '',
  treatment_given: '',
  medications_prescribed: '',
  follow_up_date: '',
  doctor_name: '',
  notes: '',
};

const houseKeepingTasks = [
  { id: 1, area: "Dormitory A", task: "General Cleaning", status: "Completed", assignedTo: "Mary Wanjiru", date: "2025-10-07", time: "09:00 AM" },
  { id: 2, area: "Kitchen", task: "Deep Cleaning", status: "In Progress", assignedTo: "John Kimani", date: "2025-10-07", time: "10:00 AM" },
  { id: 3, area: "Bathrooms", task: "Sanitization", status: "Pending", assignedTo: "Grace Achieng", date: "2025-10-07", time: "02:00 PM" },
  { id: 4, area: "Common Area", task: "Maintenance Check", status: "Completed", assignedTo: "Peter Omondi", date: "2025-10-06", time: "03:00 PM" },
];

const HouseKeeping = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("tasks");
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogClientId, setDialogClientId] = useState<string>('');
  const [formData, setFormData] = useState<MedicalFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "medical") {
      fetchActiveClients();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedClient) {
      fetchMedicalRecords(selectedClient.id);
    }
  }, [selectedClient]);

  const fetchActiveClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, client_id, date_of_birth, status, profile_picture')
      .or('status.ilike.active,status.eq.Complete')
      .order('name');

    if (error) {
      toast.error('Failed to fetch clients');
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  const fetchMedicalRecords = async (clientId: string) => {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('client_id', clientId)
      .order('visit_date', { ascending: false });

    if (error) {
      toast.error('Failed to fetch medical records');
    } else {
      setMedicalRecords(data || []);
    }
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleInputChange = (field: keyof MedicalFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const clientId = selectedClient?.id || dialogClientId;
    
    if (!clientId || !formData.hospital_name || !formData.reason_for_visit) {
      toast.error('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('medical_records').insert({
      client_id: clientId,
      visit_date: formData.visit_date,
      hospital_name: formData.hospital_name,
      reason_for_visit: formData.reason_for_visit,
      diagnosis: formData.diagnosis || null,
      treatment_given: formData.treatment_given || null,
      medications_prescribed: formData.medications_prescribed || null,
      follow_up_date: formData.follow_up_date || null,
      doctor_name: formData.doctor_name || null,
      notes: formData.notes || null,
      created_by: user?.id,
    });

    if (error) {
      toast.error('Failed to save medical record');
    } else {
      toast.success('Medical record saved successfully');
      setDialogOpen(false);
      setFormData(initialFormData);
      setDialogClientId('');
      if (selectedClient) {
        fetchMedicalRecords(selectedClient.id);
      }
    }
    setSubmitting(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-success/20 text-success border-success/30";
      case "In Progress":
        return "bg-blue-100 text-blue-600 border-blue-300 dark:bg-blue-950 dark:text-blue-400";
      case "Pending":
        return "bg-orange-100 text-orange-600 border-orange-300 dark:bg-orange-950 dark:text-orange-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <div className="relative bg-gradient-to-r from-blue-600 to-cyan-600 h-24 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            House Keeping
          </h1>
          <p className="text-sm sm:text-base text-white/90">Facility maintenance and client health tracking</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="medical" className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Medical Records
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-t-4 border-t-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">2</p>
                      <p className="text-sm text-muted-foreground">COMPLETED</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">1</p>
                      <p className="text-sm text-muted-foreground">IN PROGRESS</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">1</p>
                      <p className="text-sm text-muted-foreground">PENDING</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-purple-500">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <User className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">4</p>
                      <p className="text-sm text-muted-foreground">STAFF ASSIGNED</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tasks Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">House Keeping Tasks</CardTitle>
                  <p className="text-sm text-muted-foreground">Daily facility maintenance and cleaning schedule</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-blue-600 to-cyan-600">
                      <TableRow>
                        <TableHead className="text-white font-semibold">AREA</TableHead>
                        <TableHead className="text-white font-semibold">TASK</TableHead>
                        <TableHead className="text-white font-semibold">STATUS</TableHead>
                        <TableHead className="text-white font-semibold">ASSIGNED TO</TableHead>
                        <TableHead className="text-white font-semibold">DATE</TableHead>
                        <TableHead className="text-white font-semibold">TIME</TableHead>
                        <TableHead className="text-white font-semibold">ACTIONS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {houseKeepingTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{task.area}</span>
                            </div>
                          </TableCell>
                          <TableCell>{task.task}</TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(task.status)} border`}>
                              {task.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-600" />
                              <span>{task.assignedTo}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <span>{task.date}</span>
                            </div>
                          </TableCell>
                          <TableCell>{task.time}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medical" className="space-y-6">
            {selectedClient ? (
              <>
                <div className="flex items-center justify-between">
                  <Button variant="ghost" onClick={() => setSelectedClient(null)} className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Clients
                  </Button>
                  <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Hospital Visit
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={selectedClient.profile_picture || undefined} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                          {getInitials(selectedClient.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-xl">{selectedClient.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Age: {calculateAge(selectedClient.date_of_birth)} | ID: {selectedClient.client_id}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Hospital className="h-5 w-5 text-blue-600" />
                      Hospital Visit Records
                    </h3>
                    
                    {medicalRecords.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No medical records found for this client.</p>
                    ) : (
                      <div className="space-y-4">
                        {medicalRecords.map((record) => (
                          <Card key={record.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-semibold text-lg">{record.hospital_name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    <Calendar className="h-3 w-3 inline mr-1" />
                                    {new Date(record.visit_date).toLocaleDateString()}
                                    {record.doctor_name && ` | Dr. ${record.doctor_name}`}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-blue-600 border-blue-300">
                                  Visit
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Reason for Visit:</p>
                                  <p className="font-medium">{record.reason_for_visit}</p>
                                </div>
                                {record.diagnosis && (
                                  <div>
                                    <p className="text-muted-foreground">Diagnosis:</p>
                                    <p className="font-medium">{record.diagnosis}</p>
                                  </div>
                                )}
                                {record.treatment_given && (
                                  <div>
                                    <p className="text-muted-foreground">Treatment Given:</p>
                                    <p className="font-medium">{record.treatment_given}</p>
                                  </div>
                                )}
                                {record.medications_prescribed && (
                                  <div>
                                    <p className="text-muted-foreground">Medications:</p>
                                    <p className="font-medium">{record.medications_prescribed}</p>
                                  </div>
                                )}
                                {record.follow_up_date && (
                                  <div>
                                    <p className="text-muted-foreground">Follow-up Date:</p>
                                    <p className="font-medium">{new Date(record.follow_up_date).toLocaleDateString()}</p>
                                  </div>
                                )}
                                {record.notes && (
                                  <div className="md:col-span-2">
                                    <p className="text-muted-foreground">Notes:</p>
                                    <p className="font-medium">{record.notes}</p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-blue-600" />
                      Active Clients - Medical Records
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Select a client to view or add medical records</p>
                  </div>
                  <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medical Record
                  </Button>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-center py-8 text-muted-foreground">Loading clients...</p>
                  ) : clients.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No active clients found.</p>
                  ) : (
                    <div className="space-y-2">
                      {clients.map((client) => (
                        <div
                          key={client.id}
                          onClick={() => setSelectedClient(client)}
                          className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={client.profile_picture || undefined} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {getInitials(client.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Age: {calculateAge(client.date_of_birth)} | ID: {client.client_id}
                            </p>
                          </div>
                          <Badge className="bg-success/20 text-success border-success/30">
                            {client.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Medical Record Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hospital className="h-5 w-5 text-blue-600" />
              Add Hospital Visit Record
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!selectedClient && (
              <div className="space-y-2">
                <Label>Select Client *</Label>
                <Select value={dialogClientId} onValueChange={setDialogClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} ({client.client_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Visit Date *</Label>
                <Input
                  type="date"
                  value={formData.visit_date}
                  onChange={(e) => handleInputChange('visit_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Hospital Name *</Label>
                <Input
                  value={formData.hospital_name}
                  onChange={(e) => handleInputChange('hospital_name', e.target.value)}
                  placeholder="Enter hospital name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason for Visit *</Label>
              <Textarea
                value={formData.reason_for_visit}
                onChange={(e) => handleInputChange('reason_for_visit', e.target.value)}
                placeholder="Describe the reason for the hospital visit"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Doctor Name</Label>
              <Input
                value={formData.doctor_name}
                onChange={(e) => handleInputChange('doctor_name', e.target.value)}
                placeholder="Enter doctor's name"
              />
            </div>

            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Textarea
                value={formData.diagnosis}
                onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                placeholder="Enter diagnosis"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Treatment Given</Label>
              <Textarea
                value={formData.treatment_given}
                onChange={(e) => handleInputChange('treatment_given', e.target.value)}
                placeholder="Describe treatment given"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Medications Prescribed</Label>
              <Textarea
                value={formData.medications_prescribed}
                onChange={(e) => handleInputChange('medications_prescribed', e.target.value)}
                placeholder="List medications prescribed"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Follow-up Date</Label>
              <Input
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => handleInputChange('follow_up_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional notes"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                {submitting ? 'Saving...' : 'Save Record'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HouseKeeping;