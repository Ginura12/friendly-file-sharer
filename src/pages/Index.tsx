import { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "@/components/FileUploader";
import { FileList } from "@/components/FileList";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

const Index = () => {
  const [session, setSession] = useState(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <Card className="w-full backdrop-blur-sm bg-white/80 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Friendly File Sharer
            </CardTitle>
            {session && (
              <Link to="/chat">
                <Button 
                  variant="outline" 
                  className="gap-2 transition-all duration-300 hover:scale-105 hover:bg-primary hover:text-white"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat Room
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {!session ? (
              <div className="animate-scale-in">
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
              <div className="space-y-8 animate-fade-in">
                <FileUploader session={session} />
                <FileList session={session} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;