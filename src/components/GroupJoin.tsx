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
    const trimmedCode = groupCode.trim();
    
    if (!trimmedCode) {
      toast({
        title: "Error",
        description: "Please enter a group code",
        variant: "destructive",
      });
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(trimmedCode)) {
      toast({
        title: "Error",
        description: "Invalid group code format",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting to join group with code:', trimmedCode);
      
      // First, verify the group exists
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id, name')
        .eq('join_code', trimmedCode)
        .maybeSingle();

      if (groupError) {
        console.error('Error checking group:', groupError);
        throw new Error("Failed to check group code");
      }

      if (!group) {
        console.log('No group found with code:', trimmedCode);
        throw new Error("Invalid group code. Please check the code and try again.");
      }

      console.log('Found group:', group);

      // Check if user is already a member
      const { data: existingMembership, error: membershipError } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (membershipError && membershipError.code !== 'PGRST116') {
        console.error('Error checking membership:', membershipError);
        throw new Error("Failed to check group membership");
      }

      if (existingMembership) {
        throw new Error("You're already a member of this group");
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
        description: `Successfully joined ${group.name}!`,
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