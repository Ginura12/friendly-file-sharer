import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useCallState = (callId: string | null, userId: string) => {
  const [callStatus, setCallStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!callId) return;

    const channel = supabase
      .channel('call-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `id=eq.${callId}`,
        },
        (payload) => {
          setCallStatus(payload.new.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [callId, userId]);

  return { callStatus, setCallStatus };
};