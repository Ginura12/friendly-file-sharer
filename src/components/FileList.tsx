import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { FileReply } from "./FileReply";
import { FileReplies } from "./FileReplies";
import { FilePreview } from "./FilePreview";

export const FileList = ({ session }) => {
  const [files, setFiles] = useState([]);
  const [isSpecialUser, setIsSpecialUser] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (session?.user) {
      checkSpecialUser();
    }
    fetchFiles();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('public:files')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'files' },
        (payload) => {
          fetchFiles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const checkSpecialUser = async () => {
    try {
      const { data, error } = await supabase
        .from('special_users')
        .select()
        .eq('user_id', session.user.id);

      if (error) throw error;
      setIsSpecialUser(data && data.length > 0);
    } catch (error) {
      console.error('Error checking special user status:', error);
      setIsSpecialUser(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch files",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, url: string) => {
    try {
      const filePath = url.split('/').slice(-2).join('/');
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      setSelectedFile(null);
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {selectedFile && (
        <FilePreview file={selectedFile} />
      )}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
          {files.length === 0 ? (
            <p className="text-gray-500 text-center">No files uploaded yet</p>
          ) : (
            <div className="space-y-6">
              {files.map((file) => (
                <div key={file.id} className="space-y-4">
                  <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                    <button 
                      onClick={() => setSelectedFile(file)}
                      className="text-blue-600 hover:underline text-left"
                    >
                      {file.name}
                    </button>
                    <div className="flex items-center gap-2">
                      <a 
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Download
                      </a>
                      {session?.user?.id === file.user_id && (
                        <button
                          onClick={() => handleDelete(file.id, file.url)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="pl-4 space-y-4">
                    <FileReplies fileId={file.id} session={session} />
                    <FileReply 
                      fileId={file.id} 
                      session={session} 
                      isSpecialUser={isSpecialUser}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};