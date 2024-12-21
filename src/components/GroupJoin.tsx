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
        .eq('join_code', groupCode.trim())
        .single();

      if (groupError) {
        console.error('Error checking group:', groupError);
        throw new Error("Invalid group code");
      }

      if (!group) {
        throw new Error("Invalid group code");
      }

      // Check if user is already a member
      const { data: existingMembership, error: membershipError } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', session.user.id)
        .single();

      if (existingMembership) {
        throw new Error("You're already a member of this group");
      }

      if (membershipError && membershipError.code !== 'PGRST116') { // PGRST116 means no rows returned
        console.error('Error checking membership:', membershipError);
        throw new Error("Failed to check group membership");
      }

      // Then join the group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: session.user.id
        });

      if (joinError) {
        console.error('Error joining group:', joinError);
        throw new Error("Failed to join group");
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