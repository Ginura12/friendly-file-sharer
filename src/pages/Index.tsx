import { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "@/components/FileUploader";
import { FileList } from "@/components/FileList";
import { Button } from "@/components/ui/button";
import { MessageCircle, LogOut, LogIn } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { VoiceCall } from "@/components/VoiceCall";

const Index = () => {
  const [session, setSession] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4 md:p-8 transition-all duration-500">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="w-full backdrop-blur-sm bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl border-t border-white/60">
          <CardHeader className="flex flex-col md:flex-row items-center justify-between p-6 space-y-4 md:space-y-0">
            <div className="flex items-center gap-4">
              <img 
                src="/lovable-uploads/1758877d-8277-4188-b9af-4c9cb01b38cf.png" 
                alt="Logo" 
                className="w-16 h-16 rounded-full border-2 border-primary/20 shadow-lg transition-transform duration-300 hover:scale-105"
              />
              <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent animate-fade-in">
                Friendly File Sharer
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {session ? (
                <>
                  <Link to="/chat" className="animate-fade-in">
                    <Button 
                      variant="outline" 
                      className="group gap-2 transition-all duration-300 hover:scale-105 hover:bg-primary hover:text-white"
                    >
                      <MessageCircle className="h-4 w-4 transition-transform group-hover:rotate-12" />
                      Chat Room
                    </Button>
                  </Link>
                  {session?.user && (
                    <VoiceCall userId={session.user.id} />
                  )}
                  <Button 
                    variant="outline"
                    onClick={handleLogout}
                    className="gap-2 transition-all duration-300 hover:scale-105 hover:bg-destructive hover:text-white"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <Link to="/auth" className="animate-fade-in">
                  <Button 
                    variant="outline" 
                    className="gap-2 transition-all duration-300 hover:scale-105 hover:bg-primary hover:text-white"
                  >
                    <LogIn className="h-4 w-4" />
                    Login / Sign Up
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
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
              <div className="space-y-8">
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
