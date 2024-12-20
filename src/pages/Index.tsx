import { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "@/components/FileUploader";
import { FileList } from "@/components/FileList";
import { Button } from "@/components/ui/button";
import { MessageCircle, LogOut, LogIn, Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { UserProfile } from "@/components/UserProfile";
import { GroupManagement } from "@/components/GroupManagement";
import { GroupSelector } from "@/components/GroupSelector";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Index = () => {
  const [session, setSession] = useState(null);
  const [isSpecialUser, setIsSpecialUser] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        checkSpecialUser(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        checkSpecialUser(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSpecialUser = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('special_users')
        .select()
        .eq('user_id', userId);

      if (error) throw error;
      setIsSpecialUser(data && data.length > 0);
    } catch (error) {
      console.error('Error checking special user status:', error);
      setIsSpecialUser(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const handleGroupSelect = (groupId) => {
    // Refresh the file list when group changes
    // The FileList component will handle filtering by group
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-2 sm:p-4 md:p-8 transition-all duration-500">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">
        <Card className="w-full backdrop-blur-sm bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl border-t border-white/60">
          <CardHeader className="flex flex-col space-y-4 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img 
                  src="/lovable-uploads/1758877d-8277-4188-b9af-4c9cb01b38cf.png" 
                  alt="Logo" 
                  className="w-12 sm:w-16 h-12 sm:h-16 rounded-full border-2 border-primary/20 shadow-lg transition-transform duration-300 hover:scale-105"
                />
                <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent animate-fade-in">
                  Friendly File Sharer
                </CardTitle>
              </div>
              <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2">
                {session ? (
                  <>
                    <Link to="/chat" className="animate-fade-in">
                      <Button 
                        variant="outline" 
                        className="group gap-2 transition-all duration-300 hover:scale-105 hover:bg-primary hover:text-white"
                      >
                        <MessageCircle className="h-4 w-4 transition-transform group-hover:rotate-12" />
                        <span className="hidden sm:inline">Chat Room</span>
                      </Button>
                    </Link>
                    {session?.user && (
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button
                            variant="outline"
                            className="gap-2 transition-all duration-300 hover:scale-105"
                          >
                            <Settings className="h-4 w-4" />
                            <span className="hidden sm:inline">Profile</span>
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>Profile Settings</SheetTitle>
                          </SheetHeader>
                          <UserProfile session={session} />
                        </SheetContent>
                      </Sheet>
                    )}
                    <Button 
                      variant="outline"
                      onClick={handleLogout}
                      className="gap-2 transition-all duration-300 hover:scale-105 hover:bg-destructive hover:text-white"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline">Logout</span>
                    </Button>
                  </>
                ) : (
                  <Link to="/auth" className="animate-fade-in">
                    <Button 
                      variant="outline" 
                      className="gap-2 transition-all duration-300 hover:scale-105 hover:bg-primary hover:text-white"
                    >
                      <LogIn className="h-4 w-4" />
                      <span className="hidden sm:inline">Login / Sign Up</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            {session && (
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <GroupSelector session={session} onGroupSelect={handleGroupSelect} />
                <GroupManagement session={session} isSpecialUser={isSpecialUser} />
              </div>
            )}
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {!session ? (
              <div className="opacity-0 scale-95 animate-scale-in">
                <Auth
                  supabaseClient={supabase}
                  appearance={{ 
                    theme: ThemeSupa,
                    style: {
                      button: {
                        transition: 'all 0.3s ease',
                        transform: 'scale(1)',
                      },
                      anchor: {
                        transition: 'all 0.3s ease',
                      },
                      container: {
                        animation: 'fadeIn 0.5s ease-out',
                      },
                    },
                  }}
                  theme="light"
                  providers={[]}
                />
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-8">
                <div className="animate-fade-in delay-100">
                  <FileUploader session={session} />
                </div>
                <div className="animate-fade-in delay-200">
                  <FileList session={session} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;