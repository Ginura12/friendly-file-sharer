import { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "@/components/FileUploader";
import { FileList } from "@/components/FileList";
import { HeaderActions } from "@/components/HeaderActions";
import { GroupManagementSection } from "@/components/GroupManagementSection";

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
                <HeaderActions session={session} />
              </div>
            </div>
            {session && <GroupManagementSection session={session} />}
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