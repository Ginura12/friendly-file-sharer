import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export const FileReplies = ({ fileId, session }) => {
  const [replies, setReplies] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchReplies();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('public:file_replies')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'file_replies', filter: `file_id=eq.${fileId}` },
        (payload) => {
          fetchReplies();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fileId]);

  const fetchReplies = async () => {
    try {
      const { data, error } = await supabase
        .from('file_replies')
        .select(`
          *,
          profiles:user_id (
            username
          )
        `)
        .eq('file_id', fileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReplies(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch replies",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (replyId) => {
    try {
      const { error } = await supabase
        .from('file_replies')
        .delete()
        .eq('id', replyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reply deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete reply",
        variant: "destructive",
      });
    }
  };

  if (replies.length === 0) return null;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">Replies</h4>
      <div className="space-y-3">
        {replies.map((reply) => (
          <div 
            key={reply.id} 
            className="p-3 bg-gray-50 rounded-lg space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  {reply.profiles?.username || 'Anonymous'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                </span>
              </div>
              {session?.user?.id === reply.user_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(reply.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-700">{reply.reply}</p>
          </div>
        ))}
      </div>
    </div>
  );
};