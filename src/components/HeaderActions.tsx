import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageCircle, LogOut, LogIn, Settings } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { UserProfile } from "@/components/UserProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const HeaderActions = ({ session }) => {
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  if (!session) {
    return (
      <Link to="/auth" className="animate-fade-in">
        <Button 
          variant="outline" 
          className="gap-2 transition-all duration-300 hover:scale-105 hover:bg-primary hover:text-white"
        >
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Login / Sign Up</span>
        </Button>
      </Link>
    );
  }

  return (
    <>
      <Link to="/chat" className="animate-fade-in">
        <Button 
          variant="outline" 
          className="group gap-2 transition-all duration-300 hover:scale-105 hover:bg-primary hover:text-white"
        >
          <MessageCircle className="h-4 w-4 transition-transform group-hover:rotate-12" />
          <span className="hidden sm:inline">Chat Room</span>
        </Button>
      </Link>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 transition-all duration-300 hover:scale-105"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Profile Settings</SheetTitle>
          </SheetHeader>
          <UserProfile session={session} />
        </SheetContent>
      </Sheet>
      <Button 
        variant="outline"
        onClick={handleLogout}
        className="gap-2 transition-all duration-300 hover:scale-105 hover:bg-destructive hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Logout</span>
      </Button>
    </>
  );
};