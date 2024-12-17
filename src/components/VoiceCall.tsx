import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface VoiceCallProps {
  userId: string;
  receiverId: string;
}

export const VoiceCall = ({ userId, receiverId }: VoiceCallProps) => {
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
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
          if (payload.new.status === 'ended') {
            toast({
              title: "Call Ended",
              description: "The voice call has ended",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [callId, toast]);

  const startCall = async () => {
    try {
      const { data, error } = await supabase
        .from('calls')
        .insert({
          caller_id: userId,
          receiver_id: receiverId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      setCallId(data.id);
      setCallStatus('pending');
      
      toast({
        title: "Calling...",
        description: "Initiating voice call",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const endCall = async () => {
    if (!callId) return;

    try {
      const { error } = await supabase
        .from('calls')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', callId);

      if (error) throw error;

      setCallStatus('ended');
      setCallId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2">
      {!callStatus || callStatus === 'ended' ? (
        <Button
          onClick={startCall}
          variant="outline"
          className="gap-2 transition-all duration-300 hover:scale-105 hover:bg-green-500 hover:text-white"
        >
          <Phone className="h-4 w-4" />
          Start Call
        </Button>
      ) : (
        <Button
          onClick={endCall}
          variant="outline"
          className="gap-2 transition-all duration-300 hover:scale-105 hover:bg-red-500 hover:text-white"
        >
          <PhoneOff className="h-4 w-4" />
          End Call
        </Button>
      )}
    </div>
  );
};