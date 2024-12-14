import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MessageListProps {
  messages: any[];
  session: any;
}

export const MessageList = ({ messages, session }: MessageListProps) => {
  return (
    <ScrollArea className="h-[60vh] mb-4 p-4">
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex flex-col animate-fade-in`}
            style={{ 
              animationDelay: `${index * 100}ms`,
              alignItems: message.sender_id === session?.user?.id ? "flex-end" : "flex-start" 
            }}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 transition-all duration-300 hover:shadow-md ${
                message.sender_id === session?.user?.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Avatar className="h-6 w-6 transition-transform duration-300 hover:scale-110">
                  <AvatarImage src={message.profiles?.avatar_url} />
                  <AvatarFallback className="bg-primary/10">
                    {message.profiles?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-semibold">
                    {message.profiles?.username || "Anonymous"}
                  </p>
                  <p className="text-xs opacity-75">
                    {message.profiles?.email || "No email"}
                  </p>
                </div>
              </div>
              {message.content && <p>{message.content}</p>}
              {message.image_url && (
                <img
                  src={message.image_url}
                  alt="Shared image"
                  className="max-w-full rounded-lg mt-2 transition-transform duration-300 hover:scale-105"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};