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
        .select('user_id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking expert user status:', error);
        return;
      }
      
      setIsExpertUser(!!data);
    } catch (error) {
      console.error('Error checking expert user status:', error);
      setIsExpertUser(false);
    }
  };

  const handleGroupSelect = async (groupId) => {
    // This function will be called when a group is selected
    console.log('Group selected:', groupId);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <GroupSelector session={session} onGroupSelect={handleGroupSelect} />
        {!isExpertUser && <GroupJoin session={session} />}
      </div>
      {isExpertUser && (
        <div className="mt-4">
          <GroupManagement session={session} isSpecialUser={true} />
        </div>
      )}
    </div>
  );
};