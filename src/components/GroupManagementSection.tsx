import { useState, useEffect } from "react";
import { GroupSelector } from "@/components/GroupSelector";
import { GroupManagement } from "@/components/GroupManagement";
import { GroupJoin } from "@/components/GroupJoin";
import { supabase } from "@/integrations/supabase/client";

export const GroupManagementSection = ({ session }) => {
  const [isExpertUser, setIsExpertUser] = useState(false);

  useEffect(() => {
    checkExpertUser();
  }, [session]);

  const checkExpertUser = async () => {
    if (!session?.user) return;
    
    try {
      const { data, error } = await supabase
        .from('expert_users')
        .select()
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;
      setIsExpertUser(!!data);
    } catch (error) {
      console.error('Error checking expert user status:', error);
      setIsExpertUser(false);
    }
  };

  const handleGroupSelect = (groupId) => {
    // Refresh the file list when group changes
    // The FileList component will handle filtering by group
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <GroupSelector session={session} onGroupSelect={handleGroupSelect} />
      <div className="flex gap-2 items-center">
        <GroupJoin session={session} />
        {isExpertUser && (
          <GroupManagement session={session} isSpecialUser={true} />
        )}
      </div>
    </div>
  );
};