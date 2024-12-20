import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const GroupSelector = ({ session, onGroupSelect }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error",
        description: "Failed to fetch groups",
        variant: "destructive",
      });
    }
  };

  const handleGroupSelect = async (groupId) => {
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
  );
};