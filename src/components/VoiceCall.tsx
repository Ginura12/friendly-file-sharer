import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Video, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserSelector } from "./UserSelector";

interface VoiceCallProps {
  userId: string;
}

export const VoiceCall = ({ userId }: VoiceCallProps) => {
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
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
        async (payload) => {
          setCallStatus(payload.new.status);
          
          if (payload.new.status === 'active' && payload.new.caller_id !== userId) {
            // Answer the call
            await setupWebRTC();
          } else if (payload.new.status === 'ended') {
            cleanupWebRTC();
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
      cleanupWebRTC();
    };
  }, [callId, userId, toast]);

  const setupWebRTC = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setLocalStream(stream);

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnection.current = pc;

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      // Handle ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          // Send ICE candidate to peer through Supabase
          await supabase.from('calls').update({
            ice_candidate: JSON.stringify(event.candidate)
          }).eq('id', callId);
        }
      };

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to access media devices: " + error.message,
        variant: "destructive",
      });
    }
  };

  const cleanupWebRTC = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setCallId(null);
    setCallStatus(null);
  };

  const startCall = async () => {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a user to call",
        variant: "destructive",
      });
      return;
    }

    try {
      await setupWebRTC();
      
      const { data, error } = await supabase
        .from('calls')
        .insert({
          caller_id: userId,
          receiver_id: selectedUserId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      setCallId(data.id);
      setCallStatus('pending');
      
      toast({
        title: "Calling...",
        description: "Waiting for user to accept",
      });
    } catch (error: any) {
      cleanupWebRTC();
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const acceptCall = async () => {
    if (!callId) return;

    try {
      const { error } = await supabase
        .from('calls')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .eq('id', callId);

      if (error) throw error;

      await setupWebRTC();
      
      toast({
        title: "Call Accepted",
        description: "Connected to call",
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

      cleanupWebRTC();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <User className="h-4 w-4" />
            Select User
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a User to Call</DialogTitle>
          </DialogHeader>
          <UserSelector
            currentUserId={userId}
            onUserSelect={(id) => {
              setSelectedUserId(id);
              toast({
                title: "User Selected",
                description: "You can now start the call",
              });
            }}
          />
        </DialogContent>
      </Dialog>

      <div className="flex gap-2">
        {!callStatus || callStatus === 'ended' ? (
          <Button
            onClick={startCall}
            variant="outline"
            className="gap-2 transition-all duration-300 hover:scale-105 hover:bg-green-500 hover:text-white"
            disabled={!selectedUserId}
          >
            <Video className="h-4 w-4" />
            Start Video Call
          </Button>
        ) : callStatus === 'pending' && callId ? (
          <div className="flex gap-2">
            <Button
              onClick={acceptCall}
              variant="outline"
              className="gap-2 transition-all duration-300 hover:scale-105 hover:bg-green-500 hover:text-white"
            >
              <Phone className="h-4 w-4" />
              Accept Call
            </Button>
            <Button
              onClick={endCall}
              variant="outline"
              className="gap-2 transition-all duration-300 hover:scale-105 hover:bg-red-500 hover:text-white"
            >
              <PhoneOff className="h-4 w-4" />
              Decline Call
            </Button>
          </div>
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

      {(localStream || remoteStream) && (
        <div className="grid grid-cols-2 gap-4">
          {localStream && (
            <video
              autoPlay
              playsInline
              muted
              ref={(video) => {
                if (video) video.srcObject = localStream;
              }}
              className="w-full rounded-lg border"
            />
          )}
          {remoteStream && (
            <video
              autoPlay
              playsInline
              ref={(video) => {
                if (video) video.srcObject = remoteStream;
              }}
              className="w-full rounded-lg border"
            />
          )}
        </div>
      )}
    </div>
  );
};