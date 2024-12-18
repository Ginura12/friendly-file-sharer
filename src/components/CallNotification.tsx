import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";

interface CallNotificationProps {
  userId: string;
  onAcceptCall: (callId: string) => void;
  onDeclineCall: (callId: string) => void;
}

export const CallNotification = ({ userId, onAcceptCall, onDeclineCall }: CallNotificationProps) => {
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel('incoming-calls')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new.status === 'pending') {
            toast({
              title: "Incoming Call",
              description: (
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={() => onAcceptCall(payload.new.id)}
                    variant="outline"
                    className="gap-2 transition-all duration-300 hover:scale-105 hover:bg-green-500 hover:text-white"
                  >
                    <Phone className="h-4 w-4" />
                    Accept
                  </Button>
                  <Button
                    onClick={() => onDeclineCall(payload.new.id)}
                    variant="outline"
                    className="gap-2 transition-all duration-300 hover:scale-105 hover:bg-red-500 hover:text-white"
                  >
                    <PhoneOff className="h-4 w-4" />
                    Decline
                  </Button>
                </div>
              ),
              duration: 10000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onAcceptCall, onDeclineCall, toast]);

  return null;
};