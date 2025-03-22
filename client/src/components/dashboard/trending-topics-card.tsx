import { TrendingUp, RefreshCw, BookOpen, Twitter } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

type TrendingTopicsProps = {
  userId: string;
};

type Trend = {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'article' | 'post';
  metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
  };
};

async function fetchTrends(subject: string) {
  try {
    const response = await fetch(`/api/career-trends/${encodeURIComponent(subject)}`);
    if (!response.ok) {
      console.error(`API response not ok: ${response.status}`);
      throw new Error('Failed to fetch trends');
    }
    const data = await response.json();
    if (!data.success) {
      console.error('API returned error:', data.message);
      throw new Error(data.message || 'Failed to fetch trends');
    }
    return data.data;
  } catch (error) {
    console.error('Error in fetchTrends:', error);
    throw error;
  }
}

export function TrendingTopicsCard({ userId }: TrendingTopicsProps) {
  const { data: trends = [], isLoading, refetch, error, isError } = useQuery({
    queryKey: ['career-trends', userId],
    queryFn: async () => {
      try {
        const userResponse = await fetch(`/api/user/${userId}`);
        if (!userResponse.ok) throw new Error('Failed to fetch user data');
        const userData = await userResponse.json();
        if (!userData.success) throw new Error('Failed to fetch user data');
        const subject = userData.user?.subjects?.[0] || 'Career Development';
        const trends = await fetchTrends(subject);
        return Array.isArray(trends) ? trends : [];
      } catch (error) {
        console.error('Error fetching trends:', error);
        return [];
      }
    },
    enabled: !!userId,
    refetchInterval: 1000 * 60 * 30, // Refresh every 30 minutes
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          What's Hot
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => refetch()}
          disabled={isLoading}
          title="Refresh trends"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isError ? (
            <p className="text-sm text-red-500 text-center py-4">
              Failed to load trends. Please try again.
            </p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Loading trends...
            </p>
          ) : trends.length > 0 ? (
            trends.map((trend: Trend) => (
              <div key={trend.id} className="bg-accent/50 rounded-lg p-4 hover:bg-accent/70 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2">
                    {trend.type === 'article' ? (
                      <BookOpen className="h-5 w-5 text-primary" />
                    ) : (
                      <Twitter className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium leading-tight">{trend.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{trend.description}</p>
                    <div className="flex flex-col gap-2 mt-2">
                      {trend.type === 'post' && trend.metrics && (
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>♥ {trend.metrics.like_count || 0}</span>
                          <span>🔄 {trend.metrics.retweet_count || 0}</span>
                        </div>
                      )}
                      <a 
                        href={trend.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-primary hover:underline"
                      >
                        {trend.type === 'article' ? 'Read article' : 'View post'} →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No trends available at the moment.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}