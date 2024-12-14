import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { ImagePlus, Send } from "lucide-react";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [session, setSession] = useState(null);
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Fetch existing messages
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles:sender_id(username)')
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: "Error fetching messages",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setMessages(data || []);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('files')
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: "Error uploading image",
        description: uploadError.message,
        variant: "destructive",
      });
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('files')
      .getPublicUrl(filePath);

    setImageUrl(publicUrl);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !imageUrl) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        content: newMessage,
        sender_id: session?.user?.id,
        image_url: imageUrl
      });

    if (error) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setNewMessage("");
    setImageUrl(null);
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center">Please log in to access the chat.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Chat Room</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh] mb-4 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col ${
                    message.sender_id === session?.user?.id
                      ? "items-end"
                      : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender_id === session?.user?.id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    <p className="text-sm font-semibold mb-1">
                      {message.profiles?.username || "Anonymous"}
                    </p>
                    {message.content && <p>{message.content}</p>}
                    {message.image_url && (
                      <img
                        src={message.image_url}
                        alt="Shared image"
                        className="max-w-full rounded-lg mt-2"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
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
                onClick={() => document.getElementById("image-upload").click()}
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
            </div>
            <Button type="submit">
              <Send className="h-4 w-4" />
              Send
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Chat;