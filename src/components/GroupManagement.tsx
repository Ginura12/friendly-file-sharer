import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GroupDetails } from "@/components/GroupDetails";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";

export const GroupManagement = ({ session, isSpecialUser }) => {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [newGroupId, setNewGroupId] = useState(null);
  const { toast } = useToast();

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      // Start a Supabase transaction by creating the group first
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: groupName.trim(),
          description: description.trim(),
          created_by: session.user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add the creator as a group member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: session.user.id
        });

      if (memberError) throw memberError;

      // Add the creator as a group admin
      const { error: adminError } = await supabase
        .from('group_admins')
        .insert({
          group_id: groupData.id,
          user_id: session.user.id
        });

      if (adminError) throw adminError;

      toast({
        title: "Success",
        description: "Group created successfully",
      });
      
      // Set the new group ID to trigger the GroupDetails dialog
      setNewGroupId(groupData.id);
      
      setGroupName("");
      setDescription("");
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
    }
  };

  if (!isSpecialUser) return null;

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="gap-2 transition-all duration-300 hover:scale-105"
          >
            <UserPlus className="h-4 w-4" />
            Create Group
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <form onSubmit={createGroup} className="space-y-4">
            <div>
              <Input
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="mb-2"
              />
              <Input
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">Create Group</Button>
          </form>
        </DialogContent>
      </Dialog>

      {newGroupId && <GroupDetails groupId={newGroupId} />}
    </>
  );
};