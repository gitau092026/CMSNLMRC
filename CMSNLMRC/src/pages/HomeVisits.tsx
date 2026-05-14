import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Plus, Edit, Trash2, FileText, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const HomeVisits = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [clientsWithVisits, setClientsWithVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
    fetchClientsWithVisits();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .or('status.ilike.active,status.eq.Complete')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fetchClientsWithVisits = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('home_visits')
        .select(`
          client_id,
          clients (
            id,
            name,
            client_id
          )
        `);

      if (error) throw error;
      
      // Fetch full client details for each client with visits
      const clientMap = new Map();
      data?.forEach((visit: any) => {
        if (visit.clients) {
          const clientId = visit.clients.id;
          if (!clientMap.has(clientId)) {
            clientMap.set(clientId, {
              ...visit.clients,
              visitCount: 0
            });
          }
          clientMap.get(clientId).visitCount += 1;
        }
      });
      
      const clientIds = Array.from(clientMap.keys());
      
      if (clientIds.length > 0) {
        const { data: fullClientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .in('id', clientIds);
        
        if (clientsError) throw clientsError;
        
        const enrichedClients = fullClientsData?.map(client => ({
          ...client,
          visitCount: clientMap.get(client.id)?.visitCount || 0
        }));
        
        setClientsWithVisits(enrichedClients || []);
      } else {
        setClientsWithVisits([]);
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

  const handleAddHomeVisit = () => {
    if (selectedClient) {
      navigate(`/home-visits/add?clientId=${selectedClient}`);
    } else {
      navigate('/home-visits/add');
    }
  };

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <div className="relative bg-gradient-primary h-24 flex items-center px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Home Visits</h1>
          <p className="text-sm sm:text-base text-white/90">Home Visit Records</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* Add New Home Visit Section */}
        <Card className="border-t-4 border-t-orange-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>Add New Home Visit</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Optionally select a client here, or select on the next page
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
              <div className="flex-1 space-y-2">
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a client..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    {clients.length === 0 ? (
                      <SelectItem value="none" disabled>No active clients found</SelectItem>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.client_id})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-sm font-medium">Select Active Client</p>
              </div>
              <Button 
                className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
                onClick={handleAddHomeVisit}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Home Visit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Clients with Home Visit Records */}
        <Card className="border-t-4 border-t-orange-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>Clients with Home Visit Records</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Click on a client to view all their home visit reports
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-muted-foreground py-8">
                Loading clients...
              </div>
            ) : clientsWithVisits.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No clients with home visits found. Add your first home visit above.
              </div>
            ) : (
              <div className="space-y-3">
                {clientsWithVisits.map((client) => {
                  const getInitials = (name: string) => {
                    return name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);
                  };

                  const calculateAge = (dob: string) => {
                    if (!dob) return null;
                    const birthDate = new Date(dob);
                    const today = new Date();
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const monthDiff = today.getMonth() - birthDate.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                      age--;
                    }
                    return age;
                  };

                  const age = calculateAge(client.date_of_birth);

                  return (
                    <div 
                      key={client.id} 
                      className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/home-visits/client/${client.id}`)}
                    >
                      <Avatar className="h-12 w-12 bg-orange-500 text-white">
                        <AvatarFallback className="bg-orange-500 text-white font-semibold">
                          {getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">
                          {client.name}
                        </h3>
                      </div>

                      {age && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{age} years</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{client.visitCount}</span>
                      </div>

                      <Badge 
                        className={
                          client.status?.toLowerCase() === 'active'
                            ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20"
                            : "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 border-gray-500/20"
                        }
                      >
                        {client.status || 'Active'}
                      </Badge>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/home-visits/client/${client.id}`);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        VIEW REPORT
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomeVisits;
