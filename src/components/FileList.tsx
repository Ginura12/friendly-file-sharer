import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { FileReply } from "./FileReply";
import { FileReplies } from "./FileReplies";
import { FilePreview } from "./FilePreview";
import { FileReactions } from "./FileReactions";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Wifi, WifiOff } from "lucide-react";
import { format } from "date-fns";

export const FileList = ({ session }) => {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [isSpecialUser, setIsSpecialUser] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [offlineFiles, setOfflineFiles] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    if (session?.user) {
      checkSpecialUser();
      fetchFiles();
      fetchOfflineFiles();
    }

    // Subscribe to realtime changes
    const channel = supabase
      .channel('public:files')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'files' },
        (payload) => {
          console.log('Files changed:', payload);
          fetchFiles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    filterFiles();
  }, [searchTerm, filterType, files]);

  const filterFiles = () => {
    let result = [...files];

    // Apply search term filter
    if (searchTerm) {
      result = result.filter(file => 
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== "all") {
      result = result.filter(file => {
        switch (filterType) {
          case "image":
            return file.type.startsWith("image/");
          case "document":
            return file.type.includes("pdf") || 
                   file.type.includes("document") || 
                   file.type.includes("sheet");
          case "other":
            return !file.type.startsWith("image/") && 
                   !file.type.includes("pdf") && 
                   !file.type.includes("document") && 
                   !file.type.includes("sheet");
          default:
            return true;
        }
      });
    }

    setFilteredFiles(result);
  };

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
      console.log('Fetching files...');
      let query = supabase
        .from('files')
        .select('*');
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching files:', error);
        throw error;
      }
      
      console.log('Files fetched:', data);
      setFiles(data || []);
    } catch (error) {
      console.error('Error in fetchFiles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch files",
        variant: "destructive",
      });
    }
  };

  const fetchOfflineFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('offline_files')
        .select('file_id')
        .eq('user_id', session.user.id);

      if (error) throw error;
      setOfflineFiles(data.map(item => item.file_id));
    } catch (error) {
      console.error('Error fetching offline files:', error);
    }
  };

  const toggleOfflineAccess = async (fileId) => {
    try {
      if (offlineFiles.includes(fileId)) {
        // Remove from offline access
        const { error } = await supabase
          .from('offline_files')
          .delete()
          .eq('file_id', fileId)
          .eq('user_id', session.user.id);

        if (error) throw error;

        setOfflineFiles(offlineFiles.filter(id => id !== fileId));
        toast({
          title: "Success",
          description: "File removed from offline access",
        });
      } else {
        // Add to offline access
        const { error } = await supabase
          .from('offline_files')
          .insert({
            file_id: fileId,
            user_id: session.user.id
          });

        if (error) throw error;

        setOfflineFiles([...offlineFiles, fileId]);
        toast({
          title: "Success",
          description: "File marked for offline access",
        });
      }
    } catch (error) {
      console.error('Error toggling offline access:', error);
      toast({
        title: "Error",
        description: "Failed to update offline access",
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
      console.error('Error deleting file:', error);
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
        <div className="animate-scale-in">
          <FilePreview file={selectedFile} />
        </div>
      )}
      <Card className="transition-all duration-300 hover:shadow-xl bg-white/80 backdrop-blur-sm border-t border-white/60 rounded-xl">
        <CardContent className="pt-6">
          <h3 className="text-lg md:text-xl font-semibold mb-4 bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Uploaded Files
          </h3>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:w-2/3"
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="md:w-1/3">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Files</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredFiles.length === 0 ? (
            <p className="text-gray-500 text-center animate-pulse">No files found</p>
          ) : (
            <div className="space-y-6">
              {filteredFiles.map((file) => (
                <div 
                  key={file.id} 
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50/80 rounded-lg transition-all duration-300 group">
                    <div className="flex-1">
                      <button 
                        onClick={() => setSelectedFile(file)}
                        className="text-blue-600 hover:text-blue-800 text-left transition-colors duration-300 flex items-center gap-2 group-hover:translate-x-1 transform"
                      >
                        {file.name}
                      </button>
                      <div className="text-sm text-gray-500 mt-1">
                        {format(new Date(file.created_at), 'PPP')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleOfflineAccess(file.id)}
                        className={`transition-all duration-300 hover:scale-105 ${
                          offlineFiles.includes(file.id) 
                            ? 'text-green-500 hover:text-green-700' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title={offlineFiles.includes(file.id) ? "Remove from offline access" : "Mark for offline access"}
                      >
                        {offlineFiles.includes(file.id) ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                      </button>
                      <a 
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-700 transition-all duration-300 hover:scale-105"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      {session?.user?.id === file.user_id && (
                        <button
                          onClick={() => handleDelete(file.id, file.url)}
                          className="text-red-500 hover:text-red-700 transition-all duration-300 hover:scale-105"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="pl-4 space-y-4">
                    <FileReactions fileId={file.id} session={session} />
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