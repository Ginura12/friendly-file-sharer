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
      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="w-full backdrop-blur-sm bg-white/80">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              Friendly File Sharer
            </CardTitle>
            {session && (
              <Link to="/chat">
                <Button variant="outline" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Chat Room
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {!session ? (
              <Auth
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa }}
                theme="light"
                providers={[]}
              />
            ) : (
              <div className="space-y-8">
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