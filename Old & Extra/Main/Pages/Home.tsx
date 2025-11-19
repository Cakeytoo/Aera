import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  History, 
  Settings, 
  Plus, 
  Upload,
  Sparkles
} from "lucide-react";
import { useUser } from "@stackframe/react";

export default function App() {
  const navigate = useNavigate();
  const user = useUser();
  
  // If user is not logged in, redirect to sign in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Eisa's AI</h1>
          <p className="text-muted-foreground mb-6">Please sign in to continue</p>
          <Button onClick={() => navigate("/auth/sign-in")}>Sign In</Button>
        </div>
      </div>
    );
  }

  const handleStartChat = () => {
    navigate("/Chat");
  };
  
  const handleImportFile = () => {
    // Stubbed for now - will be implemented later
    console.log("Import file functionality coming soon");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Eisa's AI</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.profileImageUrl || undefined} alt={user.displayName || "User"} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {(user.displayName || user.primaryEmail || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {user.displayName || user.primaryEmail}
            </span>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card p-4">
          <nav className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-left font-normal hover:bg-accent hover:text-accent-foreground"
              onClick={() => navigate("/Chat")}
            >
              <MessageSquare className="mr-3 h-4 w-4" />
              Chat
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start text-left font-normal hover:bg-accent hover:text-accent-foreground"
              onClick={() => navigate("/History")}
            >
              <History className="mr-3 h-4 w-4" />
              History
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start text-left font-normal hover:bg-accent hover:text-accent-foreground"
              onClick={() => navigate("/Settings")}
            >
              <Settings className="mr-3 h-4 w-4" />
              Settings
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="mx-auto max-w-4xl">
            {/* Hero Section */}
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  Welcome to Eisa's AI
                </h2>
                <p className="text-lg text-muted-foreground">
                  Your intelligent AI assistant for conversations and insights
                </p>
              </div>

              {/* Action Cards */}
              <div className="grid gap-6 md:grid-cols-2 mt-12">
                <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-border bg-card">
                  <CardContent className="p-6" onClick={handleStartChat}>
                    <div className="flex flex-col items-center space-y-4">
                      <div className="rounded-full bg-primary p-3">
                        <Plus className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-xl font-semibold text-foreground">
                          Start a New Chat
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Begin a conversation with our AI assistant
                        </p>
                      </div>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        Get Started
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-border bg-card">
                  <CardContent className="p-6" onClick={handleImportFile}>
                    <div className="flex flex-col items-center space-y-4">
                      <div className="rounded-full bg-secondary p-3">
                        <Upload className="h-6 w-6 text-secondary-foreground" />
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-xl font-semibold text-foreground">
                          Import File
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Upload documents for analysis and discussion
                        </p>
                      </div>
                      <Button 
                        variant="secondary" 
                        className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                      >
                        Upload File
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}