import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { GroupDetails } from "@/components/GroupDetails";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Rate limiting configuration
const RATE_LIMIT = 50; // requests per minute
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds

export const GroupSelector = ({ session, onGroupSelect }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [requestCount, setRequestCount] = useState(0);
  const [lastReset, setLastReset] = useState(Date.now());
  const { toast } = useToast();

  useEffect(() => {
    fetchGroups();
    
    // Reset rate limit counter every minute
    const intervalId = setInterval(() => {
      setRequestCount(0);
      setLastReset(Date.now());
    }, RATE_LIMIT_WINDOW);

    return () => clearInterval(intervalId);
  }, []);

  const checkRateLimit = () => {
    if (Date.now() - lastReset > RATE_LIMIT_WINDOW) {
      setRequestCount(1);
      setLastReset(Date.now());
      return true;
    }

    if (requestCount >= RATE_LIMIT) {
      toast({
        title: "Rate Limit Exceeded",
        description: "Please wait a moment before making more requests.",
        variant: "destructive",
      });
      return false;
    }

    setRequestCount(prev => prev + 1);
    return true;
  };

  const fetchGroups = async () => {
    if (!checkRateLimit()) return;

    try {
      // First fetch groups where user is a member
      const { data: memberGroups, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', session.user.id);

      if (memberError) throw memberError;

      // Then fetch the actual group details
      const groupIds = memberGroups.map(mg => mg.group_id);
      
      if (groupIds.length > 0) {
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('*')
          .in('id', groupIds);

        if (groupsError) throw groupsError;
        setGroups(groupsData || []);
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error",
        description: "Failed to fetch groups. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleGroupSelect = async (groupId) => {
    if (!checkRateLimit()) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ group_id: groupId })
        .eq('id', session.user.id);

      if (error) throw error;

      setSelectedGroup(groupId);
      onGroupSelect(groupId);
      
      toast({
        title: "Success",
        description: "Group updated successfully",
      });
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        title: "Error",
        description: "Failed to update group",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Select value={selectedGroup} onValueChange={handleGroupSelect}>
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Select Group" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>No Group</SelectItem>
          {groups.map((group) => (
            <SelectItem key={group.id} value={group.id}>
              {group.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedGroup && <GroupDetails groupId={selectedGroup} />}
    </>
  );
};