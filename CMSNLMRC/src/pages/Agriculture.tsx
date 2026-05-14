import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sprout, Leaf, Droplet, Sun, Calendar, Plus, TrendingUp, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const agricultureProjects = [
  { id: 1, name: "Vegetable Garden", type: "Crop Farming", participants: 8, status: "Active", plantingDate: "2025-09-15", harvestDate: "2025-12-15" },
  { id: 2, name: "Poultry Project", type: "Livestock", participants: 5, status: "Active", startDate: "2025-08-01", production: "150 eggs/week" },
  { id: 3, name: "Fruit Orchard", type: "Crop Farming", participants: 6, status: "Growing", plantingDate: "2025-07-01", harvestDate: "2026-01-01" },
  { id: 4, name: "Herb Garden", type: "Crop Farming", participants: 4, status: "Active", plantingDate: "2025-09-20", harvestDate: "2025-11-20" },
];

const Agriculture = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-success/20 text-success border-success/30";
      case "Growing":
        return "bg-blue-100 text-blue-600 border-blue-300 dark:bg-blue-950 dark:text-blue-400";
      case "Harvesting":
        return "bg-orange-100 text-orange-600 border-orange-300 dark:bg-orange-950 dark:text-orange-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <div className="relative bg-gradient-to-r from-green-600 to-lime-600 h-24 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 flex items-center gap-2">
            <Sprout className="h-8 w-8" />
            Agriculture Program
          </h1>
          <p className="text-sm sm:text-base text-white/90">Farming projects and sustainable agriculture training</p>
        </div>
        <Button className="relative bg-white text-green-600 hover:bg-green-50">
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-t-4 border-t-green-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Sprout className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">4</p>
                  <p className="text-sm text-muted-foreground">ACTIVE PROJECTS</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">23</p>
                  <p className="text-sm text-muted-foreground">PARTICIPANTS</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">2</p>
                  <p className="text-sm text-muted-foreground">READY TO HARVEST</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Leaf className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">85%</p>
                  <p className="text-sm text-muted-foreground">SUCCESS RATE</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-lime-50 dark:from-green-950 dark:to-lime-950">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500 rounded-lg">
                  <Droplet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Irrigation System</p>
                  <p className="text-sm text-muted-foreground">Fully operational</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500 rounded-lg">
                  <Sun className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Weather Status</p>
                  <p className="text-sm text-muted-foreground">Favorable conditions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Next Harvest</p>
                  <p className="text-sm text-muted-foreground">Nov 20, 2025</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Agriculture Projects</CardTitle>
            <p className="text-sm text-muted-foreground">Active farming initiatives and training programs</p>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader className="bg-gradient-to-r from-green-600 to-lime-600">
                  <TableRow>
                    <TableHead className="text-white font-semibold">PROJECT NAME</TableHead>
                    <TableHead className="text-white font-semibold">TYPE</TableHead>
                    <TableHead className="text-white font-semibold">PARTICIPANTS</TableHead>
                    <TableHead className="text-white font-semibold">STATUS</TableHead>
                    <TableHead className="text-white font-semibold">START DATE</TableHead>
                    <TableHead className="text-white font-semibold">HARVEST/PRODUCTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agricultureProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Sprout className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{project.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-green-500 text-green-600">
                          {project.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-600" />
                          <span>{project.participants} clients</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(project.status)} border`}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-green-600" />
                          <span>{"plantingDate" in project ? project.plantingDate : project.startDate}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {"harvestDate" in project ? project.harvestDate : project.production}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Agriculture;
