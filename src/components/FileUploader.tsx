import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Upload } from "lucide-react";

export const FileUploader = ({ session }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [userGroupId, setUserGroupId] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (session?.user) {
      fetchUserGroup();
    }
  }, [session?.user]);

  const fetchUserGroup = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('group_id')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      setUserGroupId(data?.group_id);
    } catch (error) {
      console.error('Error fetching user group:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !session?.user) return;

    try {
      setUploading(true);

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${session.user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(filePath);

      // Save file metadata to database
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
          url: publicUrl,
          user_id: session.user.id,
          group_id: userGroupId
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      setSelectedFile(null);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-white/50 rounded-xl backdrop-blur-sm border border-white/60 shadow-lg transition-all duration-300 hover:shadow-xl">
      <Input
        type="file"
        onChange={handleFileSelect}
        className="cursor-pointer transition-all duration-300 hover:border-primary file:mr-4 file:py-2 file:px-4 
          file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground 
          hover:file:bg-primary/90 file:transition-all file:duration-300 hover:file:scale-105"
      />
      <Button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="w-full gap-2 transition-all duration-300 hover:scale-105 group bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary"
      >
        <Upload className="h-4 w-4 transition-transform group-hover:rotate-12" />
        {uploading ? (
          <span className="animate-pulse">Uploading...</span>
        ) : (
          "Upload File"
        )}
      </Button>
    </div>
  );
};