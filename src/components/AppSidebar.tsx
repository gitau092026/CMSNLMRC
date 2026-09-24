import { Home, Users, UserPlus, Heart, MapPin, GraduationCap, MessageCircle, Lightbulb, Settings, Medal, LogOut, ClipboardList, FileText, StickyNote } from "lucide-react";
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
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home, roles: ["admin", "social_work", "education", "counselling", "empowerment", "aftercare", "alumni", "intern_social_work", "intern_counselling"] },
  { title: "All Clients", url: "/clients", icon: Users, roles: ["admin", "social_work", "education", "counselling", "empowerment", "intern_social_work", "intern_counselling"] },
  { title: "Client Assessment", url: "/register", icon: UserPlus, roles: ["admin", "social_work", "counselling"] },
  { title: "Admission Form", url: "/admission", icon: FileText, roles: ["admin", "social_work", "counselling"] },
  { title: "Case Plans", url: "/case-plans", icon: ClipboardList, roles: ["admin", "social_work"] },
  { title: "Aftercare", url: "/aftercare", icon: Heart, roles: ["admin", "social_work", "aftercare", "counselling"] },
  { title: "Reintegration Plans", url: "/reintegration-plans", icon: MapPin, roles: ["admin", "social_work", "education", "counselling", "empowerment", "intern_social_work"] },
  { title: "Education", url: "/education", icon: GraduationCap, roles: ["admin", "education", "social_work", "counselling"] },
  { title: "Counselling", url: "/counselling", icon: MessageCircle, roles: ["admin", "counselling", "intern_counselling"] },
  { title: "SOAP Notes", url: "/soap-notes", icon: StickyNote, roles: ["admin", "counselling"] },
  { title: "Empowerment", url: "/empowerment", icon: Lightbulb, roles: ["admin", "empowerment"] },
  { title: "Manage Users", url: "/users", icon: Settings, roles: ["admin"] },
];

const additionalItems = [
  { title: "Alumni", url: "/alumni", icon: Medal, roles: ["admin", "alumni", "counselling", "intern_social_work", "intern_counselling"] },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
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
      <SidebarHeader className="border-b border-sidebar-border/50 h-14 flex items-center justify-center px-4">
        {!isCollapsed && <span className="font-bold text-xl text-primary tracking-tight">CMSNLMRC</span>}
        {isCollapsed && <span className="font-bold text-xl text-primary tracking-tight">C</span>}
      </SidebarHeader>
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
                      onClick={() => setOpenMobile(false)}
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
                        onClick={() => setOpenMobile(false)}
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
                            userRole === "aftercare" ? "AC" :
                              userRole === "alumni" ? "AL" :
                                userRole === "intern_social_work" ? "IS" :
                                  userRole === "intern_counselling" ? "IC" : "U"}
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
                            userRole === "aftercare" ? "Aftercare" :
                              userRole === "alumni" ? "Alumni" :
                                userRole === "intern_social_work" ? "Intern - Social Work" :
                                  userRole === "intern_counselling" ? "Intern - Counselling" : "Department"}
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
                          userRole === "aftercare" ? "AC" :
                            userRole === "alumni" ? "AL" :
                              userRole === "intern_social_work" ? "IS" :
                                userRole === "intern_counselling" ? "IC" : "U"}
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

