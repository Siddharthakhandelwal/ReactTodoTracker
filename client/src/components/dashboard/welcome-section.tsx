
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type WelcomeSectionProps = {
  username: string;
  progress: number;
  avatar?: string;
};

import { Progress } from "@/components/ui/progress";

export function WelcomeSection({ username, progress, avatar }: WelcomeSectionProps) {
  return (
    <div className="flex flex-col gap-4 p-6 bg-card rounded-lg">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={avatar || "/default-avatar.png"} alt={username} />
          <AvatarFallback>
            {username?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Welcome back, {username}!</h2>
          <div className="text-sm text-muted-foreground">
            You've completed {progress}% of your career goals
          </div>
        </div>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
