import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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

    fetchMessages();

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
      .select('*, profiles:sender_id(username, email, avatar_url)')
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
      <div className="flex items-center justify-center h-screen animate-fade-in">
        <Card className="w-full max-w-md transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-6">
            <p className="text-center">Please log in to access the chat.</p>
            <Link to="/" className="block mt-4">
              <Button 
                variant="outline" 
                className="w-full gap-2 transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 animate-fade-in">
      <Card className="max-w-4xl mx-auto transition-all duration-300 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Chat Room
          </CardTitle>
          <Link to="/">
            <Button 
              variant="outline" 
              className="gap-2 transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <MessageList messages={messages} session={session} />
          <MessageInput
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleImageUpload={handleImageUpload}
            sendMessage={sendMessage}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Chat;