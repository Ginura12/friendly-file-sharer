import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const GroupJoin = ({ session }) => {
  const [groupCode, setGroupCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First, verify the group exists
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id')
        .eq('join_code', groupCode)
        .single();

      if (groupError || !group) {
        throw new Error("Invalid group code");
      }

      // Then join the group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: session.user.id
        });

      if (joinError) {
        if (joinError.code === '23505') { // Unique violation
          throw new Error("You're already a member of this group");
        }
        throw joinError;
      }

      toast({
        title: "Success",
        description: "Successfully joined the group!",
      });
      setGroupCode("");
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join group",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleJoinGroup} className="flex gap-2">
      <Input
        placeholder="Enter group code"
        value={groupCode}
        onChange={(e) => setGroupCode(e.target.value)}
        className="max-w-[200px]"
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Joining..." : "Join Group"}
      </Button>
    </form>
  );
};