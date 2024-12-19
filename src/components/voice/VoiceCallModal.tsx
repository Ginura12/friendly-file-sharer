import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
  session: any;
}

export const VoiceCallModal = ({ isOpen, onClose, receiverId, receiverName, session }: VoiceCallModalProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      initializeCall();
    }
    return () => {
      cleanupCall();
    };
  }, [isOpen]);

  const initializeCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      pc.onicecandidate = async (event) => {
        if (event.candidate && callId) {
          await supabase
            .from('calls')
            .update({
              ice_candidate: event.candidate
            })
            .eq('id', callId);
        }
      };

      setPeerConnection(pc);
      createOffer(pc);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
      onClose();
    }
  };

  const createOffer = async (pc: RTCPeerConnection) => {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const { data: { id } } = await supabase
        .from('calls')
        .insert({
          caller_id: session.user.id,
          receiver_id: receiverId,
          status: 'calling',
          offer_sdp: offer.sdp
        })
        .select('id')
        .single();

      setCallId(id);

      // Subscribe to changes for answer
      const channel = supabase
        .channel(`call-${id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'calls',
            filter: `id=eq.${id}`
          },
          async (payload) => {
            if (payload.new.answer_sdp && pc.currentRemoteDescription === null) {
              const answer = new RTCSessionDescription({
                type: 'answer',
                sdp: payload.new.answer_sdp
              });
              await pc.setRemoteDescription(answer);
            }

            if (payload.new.status === 'ended') {
              cleanupCall();
              onClose();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error creating offer:', error);
      toast({
        title: "Error",
        description: "Failed to initiate call",
        variant: "destructive",
      });
      onClose();
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const endCall = async () => {
    if (callId) {
      await supabase
        .from('calls')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', callId);
    }
    cleanupCall();
    onClose();
  };

  const cleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => endCall()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Call with {receiverName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-6 p-6">
          <div className="text-lg font-medium">
            {remoteStream ? 'Connected' : 'Connecting...'}
          </div>
          <div className="flex space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleMute}
              className={`rounded-full ${isMuted ? 'bg-red-100' : ''}`}
            >
              {isMuted ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={endCall}
              className="rounded-full"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};