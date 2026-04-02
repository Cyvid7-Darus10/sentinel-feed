export type SourceId =
  | 'hackernews'
  | 'github-trending'
  | 'lobsters'
  | 'devto';

export interface Story {
  readonly id: string;
  readonly source: SourceId;
  readonly title: string;
  readonly url: string;
  readonly score: number | null;
  readonly author: string | null;
  readonly description: string | null;
  readonly tags: readonly string[];
  readonly summary: string | null;
  readonly relevant: boolean;
  readonly fetchedAt: string;
  readonly publishedAt: string | null;
}

export interface SourceStatus {
  readonly name: string;
  readonly lastFetchAt: string | null;
  readonly lastFetchCount: number;
  readonly status: 'healthy' | 'degraded' | 'error';
  readonly errorMessage: string | null;
  readonly totalStoriesToday: number;
}

export interface SourceHealth {
  readonly sources: Record<string, SourceStatus>;
  readonly updatedAt: string;
}

export interface FetchResult {
  readonly source: SourceId;
  readonly stories: readonly Story[];
  readonly error: string | null;
}
