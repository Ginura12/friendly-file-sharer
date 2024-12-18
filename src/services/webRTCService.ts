export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  async initialize() {
    try {
      this.peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      return this.localStream;
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      throw error;
    }
  }

  async createOffer() {
    try {
      if (!this.peerConnection) throw new Error('PeerConnection not initialized');
      
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      return JSON.stringify(offer);
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  async handleAnswer(answer: string) {
    try {
      if (!this.peerConnection) throw new Error('PeerConnection not initialized');
      
      const parsedAnswer = JSON.parse(answer);
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(parsedAnswer));
    } catch (error) {
      console.error('Error handling answer:', error);
      throw error;
    }
  }

  async handleOffer(offer: string) {
    try {
      if (!this.peerConnection) throw new Error('PeerConnection not initialized');
      
      const parsedOffer = JSON.parse(offer);
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(parsedOffer));
      
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      
      return JSON.stringify(answer);
    } catch (error) {
      console.error('Error handling offer:', error);
      throw error;
    }
  }

  onTrack(callback: (stream: MediaStream) => void) {
    if (!this.peerConnection) throw new Error('PeerConnection not initialized');
    
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      callback(event.streams[0]);
    };
  }

  onIceCandidate(callback: (candidate: string) => void) {
    if (!this.peerConnection) throw new Error('PeerConnection not initialized');
    
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        callback(JSON.stringify(event.candidate));
      }
    };
  }

  async addIceCandidate(candidate: string) {
    try {
      if (!this.peerConnection) throw new Error('PeerConnection not initialized');
      
      const parsedCandidate = JSON.parse(candidate);
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(parsedCandidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
      throw error;
    }
  }

  cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}