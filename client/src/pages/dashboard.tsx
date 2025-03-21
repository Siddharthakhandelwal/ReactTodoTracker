import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { GoalsCard } from "@/components/dashboard/goals-card";
import { WhatsNextCard } from "@/components/dashboard/whats-next-card";
import { TrendingTopicsCard } from "@/components/dashboard/trending-topics-card";
import { ThemeToggleCard } from "@/components/dashboard/theme-toggle-card";
import { WelcomeSection } from "@/components/dashboard/welcome-section";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { Menu, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Get userId from localStorage
  const userId = localStorage.getItem('userId') || '1'; // Default to 1 if not found
  
  // Fetch dashboard data from API
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: [`/api/dashboard/${userId}`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/dashboard/${userId}`);
        if (!response.ok) {
          if (response.status === 404) {
            // If profile not found, redirect to survey page
            toast({
              title: "Profile Needed",
              description: "Please complete the survey to personalize your experience.",
            });
            navigate("/survey");
            return null;
          }
          throw new Error('Failed to fetch dashboard data');
        }
        const result = await response.json();
        return result.success ? result.data : null;
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
        return null;
      }
    },
  });

  // Default profile data (used until API data loads)
  const [profile, setProfile] = useState({
    name: "Career Explorer",
    journey: "Getting Started",
    progress: 25,
  });
  
  // Default goals, trends, activities, and next steps
  const [goals, setGoals] = useState([
    { id: "1", title: "Complete career assessment", completed: true, progress: 100 },
    { id: "2", title: "Explore recommended careers", completed: false, progress: 30 },
    { id: "3", title: "Research education pathways", completed: false, progress: 0 },
  ]);
  
  const [whatNext, setWhatNext] = useState({
    course: { title: "Exploring Career Paths" },
    video: { title: "How to Build a Professional Portfolio" },
  });
  
  const [trends, setTrends] = useState([
    { id: "1", name: "Career Planning", primary: true, percentage: 85 },
    { id: "2", name: "Networking", percentage: 72 },
    { id: "3", name: "Resume Building", percentage: 68 },
    { id: "4", name: "Interview Skills", percentage: 65 },
  ]);
  
  const [activities, setActivities] = useState([
    { 
      id: "1", 
      type: "badge" as const, 
      title: "Career Explorer", 
      time: "2 days ago",
      isRecent: true 
    },
    { 
      id: "2", 
      type: "lesson" as const, 
      title: "Introduction to Career Pathways", 
      time: "5 days ago",
      isRecent: true
    },
    { 
      id: "3", 
      type: "course" as const, 
      title: "Career Decision Making", 
      time: "1 week ago",
      isRecent: false 
    },
  ]);
  
  // Update dashboard data when received from API
  useEffect(() => {
    if (dashboardData) {
      setProfile({
        name: dashboardData.username || "Career Explorer",
        journey: "Getting Started",
        progress: dashboardData.progress || 25,
      });
      
      if (dashboardData.goals) {
        setGoals(dashboardData.goals);
      }
      
      if (dashboardData.nextSteps) {
        setWhatNext(dashboardData.nextSteps);
      }
      
      if (dashboardData.trendingTopics) {
        setTrends(dashboardData.trendingTopics);
      }
      
      if (dashboardData.activities) {
        setActivities(dashboardData.activities);
      }
    }
  }, [dashboardData]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        profile={profile}
      />

      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <Button 
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Emerge Career Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 sm:p-6 space-y-6">
          <WelcomeSection username={profile.name} progress={profile.progress} />

          {/* Dashboard Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <GoalsCard goals={goals} userId={parseInt(userId)} />
            <WhatsNextCard course={whatNext.course} video={whatNext.video} />
            <TrendingTopicsCard topics={trends} />
            <RecentActivityCard activities={activities} />
          </div>
        </div>
      </main>
    </div>
  );
}
