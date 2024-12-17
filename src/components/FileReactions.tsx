import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ThumbsUp, ThumbsDown, Heart, Smile, Laugh, Angry } from "lucide-react";

const REACTIONS = [
  { emoji: ThumbsUp, label: "thumbs-up" },
  { emoji: ThumbsDown, label: "thumbs-down" },
  { emoji: Heart, label: "heart" },
  { emoji: Smile, label: "smile" },
  { emoji: Laugh, label: "laugh" },
  { emoji: Angry, label: "angry" },
];

export const FileReactions = ({ fileId, session }) => {
  const [reactions, setReactions] = useState([]);
  const [userReactions, setUserReactions] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchReactions();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('public:file_reactions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'file_reactions', filter: `file_id=eq.${fileId}` },
        () => {
          fetchReactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fileId]);

  const fetchReactions = async () => {
    try {
      const { data, error } = await supabase
        .from('file_reactions')
        .select('*')
        .eq('file_id', fileId);

      if (error) throw error;

      setReactions(data || []);
      setUserReactions(data?.filter(r => r.user_id === session?.user?.id).map(r => r.reaction) || []);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const toggleReaction = async (reaction) => {
    if (!session?.user) {
      toast({
        title: "Error",
        description: "Please sign in to react to files",
        variant: "destructive",
      });
      return;
    }

    try {
      // First check if the reaction already exists
      const { data: existingReaction } = await supabase
        .from('file_reactions')
        .select()
        .eq('file_id', fileId)
        .eq('user_id', session.user.id)
        .eq('reaction', reaction)
        .single();

      if (existingReaction) {
        // Remove reaction if it exists
        const { error: deleteError } = await supabase
          .from('file_reactions')
          .delete()
          .eq('file_id', fileId)
          .eq('user_id', session.user.id)
          .eq('reaction', reaction);

        if (deleteError) throw deleteError;
      } else {
        // Add reaction if it doesn't exist
        const { error: insertError } = await supabase
          .from('file_reactions')
          .insert({
            file_id: fileId,
            user_id: session.user.id,
            reaction
          });

        if (insertError) throw insertError;
      }

      // Fetch updated reactions
      await fetchReactions();
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast({
        title: "Error",
        description: "Failed to update reaction",
        variant: "destructive",
      });
    }
  };

  const getReactionCount = (reactionType) => {
    return reactions.filter(r => r.reaction === reactionType).length;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {REACTIONS.map(({ emoji: EmojiIcon, label }) => {
        const count = getReactionCount(label);
        const hasReacted = userReactions.includes(label);
        
        return (
          <Button
            key={label}
            variant={hasReacted ? "default" : "outline"}
            size="sm"
            onClick={() => toggleReaction(label)}
            className="gap-2 transition-all duration-300 hover:scale-105"
          >
            <EmojiIcon className="h-4 w-4" />
            {count > 0 && <span className="text-xs">{count}</span>}
          </Button>
        );
      })}
    </div>
  );
};