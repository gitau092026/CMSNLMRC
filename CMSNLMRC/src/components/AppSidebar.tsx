import { Home, Users, UserPlus, Heart, MapPin, GraduationCap, MessageCircle, Lightbulb, Settings, Medal, LogOut, Building2, Wallet, Sprout } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home, roles: ["admin", "social_work", "education", "counselling", "empowerment", "housekeeping", "finance", "agriculture", "aftercare", "alumni"] },
  { title: "All Clients", url: "/clients", icon: Users, roles: ["admin", "social_work", "education", "counselling", "empowerment", "housekeeping", "finance", "agriculture"] },
  { title: "Register Client", url: "/register", icon: UserPlus, roles: ["admin", "social_work"] },
  { title: "Aftercare", url: "/aftercare", icon: Heart, roles: ["admin", "social_work", "aftercare"] },
  { title: "Home Visits", url: "/home-visits", icon: MapPin, roles: ["admin", "social_work", "education", "counselling", "empowerment"] },
  { title: "Education", url: "/education", icon: GraduationCap, roles: ["admin", "education"] },
  { title: "Counselling", url: "/counselling", icon: MessageCircle, roles: ["admin", "counselling"] },
  { title: "Empowerment", url: "/empowerment", icon: Lightbulb, roles: ["admin", "empowerment"] },
  { title: "House Keeping", url: "/housekeeping", icon: Building2, roles: ["admin", "housekeeping"] },
  { title: "Finance", url: "/finance", icon: Wallet, roles: ["admin", "finance"] },
  { title: "Agriculture", url: "/agriculture", icon: Sprout, roles: ["admin", "agriculture"] },
  { title: "Manage Users", url: "/users", icon: Settings, roles: ["admin"] },
];

const additionalItems = [
  { title: "Alumni", url: "/alumni", icon: Medal, roles: ["admin", "alumni"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { user, logout } = useAuth();
  
  const userRole = user?.role || "admin";

  // Filter navigation items based on role
  const filteredNavigationItems = navigationItems.filter((item) =>
    item.roles.includes(userRole)
  );

  const filteredAdditionalItems = additionalItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>NAVIGATION</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredAdditionalItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>ADDITIONAL</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdditionalItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {!isCollapsed ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-primary text-primary-foreground">
                <AvatarFallback>
                  {userRole === "admin" ? "AD" : 
                   userRole === "social_work" ? "SW" :
                   userRole === "education" ? "ED" :
                   userRole === "counselling" ? "CN" :
                   userRole === "empowerment" ? "EM" :
                   userRole === "housekeeping" ? "HK" :
                   userRole === "finance" ? "FN" :
                   userRole === "agriculture" ? "AG" :
                   userRole === "aftercare" ? "AC" :
                   userRole === "alumni" ? "AL" : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground">
                  {user?.username || "User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userRole === "admin" ? "Administrator" :
                   userRole === "social_work" ? "Social Work" :
                   userRole === "education" ? "Education" :
                   userRole === "counselling" ? "Counselling" :
                   userRole === "empowerment" ? "Empowerment" :
                   userRole === "housekeeping" ? "House Keeping" :
                   userRole === "finance" ? "Finance" :
                   userRole === "agriculture" ? "Agriculture" :
                   userRole === "aftercare" ? "Aftercare" :
                   userRole === "alumni" ? "Alumni" : "Department"}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-foreground" 
              size="sm"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
              <AvatarFallback>
                {userRole === "admin" ? "AD" : 
                 userRole === "social_work" ? "SW" :
                 userRole === "education" ? "ED" :
                 userRole === "counselling" ? "CN" :
                 userRole === "empowerment" ? "EM" :
                 userRole === "housekeeping" ? "HK" :
                 userRole === "finance" ? "FN" :
                 userRole === "agriculture" ? "AG" :
                 userRole === "aftercare" ? "AC" :
                 userRole === "alumni" ? "AL" : "U"}
              </AvatarFallback>
            </Avatar>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
