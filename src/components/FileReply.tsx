import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const FileReply = ({ fileId, session, isSpecialUser }) => {
  const [reply, setReply] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !session?.user) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('file_replies')
        .insert({
          file_id: fileId,
          user_id: session.user.id,
          reply: reply.trim()
        });

      if (error) throw error;

      setReply("");
      toast({
        title: "Success",
        description: "Reply added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add reply",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isSpecialUser) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Add a reply..."
        className="min-h-[100px]"
      />
      <Button 
        type="submit" 
        disabled={isSubmitting || !reply.trim()}
        className="w-full"
      >
        {isSubmitting ? "Submitting..." : "Add Reply"}
      </Button>
    </form>
  );
};