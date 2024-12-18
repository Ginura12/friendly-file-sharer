import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface UserSelectorProps {
  currentUserId: string;
  onUserSelect: (userId: string) => void;
}

export const UserSelector = ({ currentUserId, onUserSelect }: UserSelectorProps) => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .neq('id', currentUserId);

      if (!error && data) {
        setUsers(data);
      }
    };

    fetchUsers();
  }, [currentUserId]);

  return (
    <ScrollArea className="h-[200px] rounded-md border p-4">
      <div className="space-y-2">
        {users.map((user) => (
          <Button
            key={user.id}
            variant="ghost"
            className="w-full justify-start gap-2 hover:bg-accent"
            onClick={() => onUserSelect(user.id)}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url || ''} />
              <AvatarFallback>{user.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
            </Avatar>
            <span>{user.username || 'Anonymous'}</span>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};