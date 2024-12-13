import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { FileUploader } from "@/components/FileUploader";
import { FileList } from "@/components/FileList";
import { AuthForm } from "@/components/AuthForm";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="w-full backdrop-blur-sm bg-white/80">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Friendly File Sharer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isAuthenticated ? (
              <AuthForm onAuthSuccess={() => setIsAuthenticated(true)} />
            ) : (
              <div className="space-y-8">
                <FileUploader />
                <FileList />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;