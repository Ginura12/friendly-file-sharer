import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone, PhoneOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface IncomingCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  call: any;
  callerName: string;
}

type CallStatus = 'pending' | 'calling' | 'connected' | 'ended' | 'rejected';

export const IncomingCallModal = ({ isOpen, onClose, call, callerName }: IncomingCallModalProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setupIncomingCall();
    }
    return () => {
      cleanupCall();
    };
  }, [isOpen]);

  const setupIncomingCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          // Convert RTCIceCandidate to a plain object
          const candidateObj = {
            candidate: event.candidate.candidate,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid,
            usernameFragment: event.candidate.usernameFragment
          };

          await supabase
            .from('calls')
            .update({
              ice_candidate: candidateObj
            })
            .eq('id', call.id);
        }
      };

      setPeerConnection(pc);

      // Set up remote description from offer
      const offer = new RTCSessionDescription({
        type: 'offer',
        sdp: call.offer_sdp
      });
      await pc.setRemoteDescription(offer);

    } catch (error) {
      console.error('Error setting up incoming call:', error);
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
      onClose();
    }
  };

  const acceptCall = async () => {
    if (!peerConnection) return;

    try {
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      await supabase
        .from('calls')
        .update({
          status: 'connected' as CallStatus,
          answer_sdp: answer.sdp,
          started_at: new Date().toISOString()
        })
        .eq('id', call.id);

      // Subscribe to call status changes
      const channel = supabase
        .channel(`call-${call.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'calls',
            filter: `id=eq.${call.id}`
          },
          async (payload) => {
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
      console.error('Error accepting call:', error);
      toast({
        title: "Error",
        description: "Failed to accept call",
        variant: "destructive",
      });
      rejectCall();
    }
  };

  const rejectCall = async () => {
    await supabase
      .from('calls')
      .update({
        status: 'rejected' as CallStatus,
        ended_at: new Date().toISOString()
      })
      .eq('id', call.id);
    cleanupCall();
    onClose();
  };

  const cleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => rejectCall()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Incoming Call from {callerName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-6 p-6">
          <div className="text-lg font-medium">
            {callerName} is calling...
          </div>
          <div className="flex space-x-4">
            <Button
              variant="default"
              size="icon"
              onClick={acceptCall}
              className="rounded-full bg-green-500 hover:bg-green-600"
            >
              <Phone className="h-6 w-6" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={rejectCall}
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