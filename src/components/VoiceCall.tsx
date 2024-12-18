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
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserSelector } from "./UserSelector";
import { VideoStream } from "./VideoStream";
import { WebRTCService } from "@/services/webRTCService";
import { useCallState } from "@/hooks/useCallState";
import { CallNotification } from "./CallNotification";

interface VoiceCallProps {
  userId: string;
}

export const VoiceCall = ({ userId }: VoiceCallProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const webRTCService = useRef<WebRTCService>(new WebRTCService());
  const { toast } = useToast();
  const { callStatus, setCallStatus } = useCallState(callId, userId);

  const handleAcceptCall = async (incomingCallId: string) => {
    setCallId(incomingCallId);
    await acceptCall();
  };

  const handleDeclineCall = async (incomingCallId: string) => {
    setCallId(incomingCallId);
    await endCall();
  };

  useEffect(() => {
    return () => {
      webRTCService.current.cleanup();
    };
  }, []);

  const setupWebRTC = async () => {
    try {
      const stream = await webRTCService.current.initialize();
      setLocalStream(stream);

      webRTCService.current.onTrack((stream) => {
        setRemoteStream(stream);
      });

      webRTCService.current.onIceCandidate(async (candidate) => {
        if (callId) {
          await supabase
            .from('calls')
            .update({ ice_candidate: candidate })
            .eq('id', callId);
        }
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to access media devices: " + error.message,
        variant: "destructive",
      });
    }
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
      
      const offer = await webRTCService.current.createOffer();
      
      const { data, error } = await supabase
        .from('calls')
        .insert({
          caller_id: userId,
          receiver_id: selectedUserId,
          status: 'pending',
          offer_sdp: offer
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
      webRTCService.current.cleanup();
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
      await setupWebRTC();

      const { data: callData } = await supabase
        .from('calls')
        .select('offer_sdp')
        .eq('id', callId)
        .single();

      if (callData?.offer_sdp) {
        const answer = await webRTCService.current.handleOffer(callData.offer_sdp);

        await supabase
          .from('calls')
          .update({
            status: 'active',
            started_at: new Date().toISOString(),
            answer_sdp: answer
          })
          .eq('id', callId);
      }
      
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

      webRTCService.current.cleanup();
      setLocalStream(null);
      setRemoteStream(null);
      setCallId(null);
      setCallStatus(null);
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
      <CallNotification
        userId={userId}
        onAcceptCall={handleAcceptCall}
        onDeclineCall={handleDeclineCall}
      />

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <User className="h-4 w-4" />
            Select User
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select a User to Call</DialogTitle>
            <DialogDescription>
              Choose a user from the list below to start a video call.
            </DialogDescription>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[600px]">
          {localStream && (
            <div className="relative w-full h-full min-h-[300px]">
              <VideoStream stream={localStream} muted className="absolute inset-0" />
            </div>
          )}
          {remoteStream && (
            <div className="relative w-full h-full min-h-[300px]">
              <VideoStream stream={remoteStream} className="absolute inset-0" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
