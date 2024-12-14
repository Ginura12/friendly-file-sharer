import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePlus, Send } from "lucide-react";

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sendMessage: (e: React.FormEvent) => void;
}

export const MessageInput = ({
  newMessage,
  setNewMessage,
  handleImageUpload,
  sendMessage,
}: MessageInputProps) => {
  return (
    <form onSubmit={sendMessage} className="flex gap-2 animate-fade-in">
      <Input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 transition-all duration-300 focus:ring-2 focus:ring-primary/50"
      />
      <div className="relative">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="image-upload"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => document.getElementById("image-upload")?.click()}
          className="transition-all duration-300 hover:scale-105"
        >
          <ImagePlus className="h-4 w-4" />
        </Button>
      </div>
      <Button 
        type="submit"
        className="gap-2 transition-all duration-300 hover:scale-105"
      >
        <Send className="h-4 w-4" />
        Send
      </Button>
    </form>
  );
};