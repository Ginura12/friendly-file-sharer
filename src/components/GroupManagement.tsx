import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Copy } from "lucide-react";

export const GroupManagement = ({ session, isSpecialUser }) => {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [newGroupId, setNewGroupId] = useState(null);
  const [managedGroups, setManagedGroups] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isSpecialUser) {
      fetchManagedGroups();
    }
  }, [isSpecialUser]);

  const fetchManagedGroups = async () => {
    try {
      const { data: groups, error } = await supabase
        .from('groups')
        .select('*')
        .eq('created_by', session.user.id);

      if (error) throw error;
      setManagedGroups(groups || []);
    } catch (error) {
      console.error('Error fetching managed groups:', error);
      toast({
        title: "Error",
        description: "Failed to fetch managed groups",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Success",
        description: "Copied to clipboard!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy text",
        variant: "destructive",
      });
    }
  };

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
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
      
      setNewGroupId(groupData.id);
      setGroupName("");
      setDescription("");
      fetchManagedGroups();
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

      {managedGroups.length > 0 && (
        <div className="mt-4 space-y-4">
          <h3 className="text-lg font-semibold">Managed Groups</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {managedGroups.map((group) => (
              <Card key={group.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {group.description && (
                    <p className="text-sm text-gray-500 mb-2">{group.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {group.join_code}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(group.join_code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {newGroupId && <GroupDetails groupId={newGroupId} />}
    </>
  );
};