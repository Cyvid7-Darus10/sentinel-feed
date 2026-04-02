import type { Story } from './types';

export interface Topic {
  readonly id: string;
  readonly label: string;
  readonly color: string;
}

export const TOPICS: readonly Topic[] = [
  { id: 'security', label: 'SECURITY', color: '#f87171' },
  { id: 'ai', label: 'AI / ML', color: '#c084fc' },
  { id: 'systems', label: 'SYSTEMS', color: '#60a5fa' },
  { id: 'dev', label: 'DEV', color: '#4ade80' },
  { id: 'tools', label: 'TOOLS', color: '#fbbf24' },
  { id: 'general', label: 'GENERAL', color: '#94a3b8' },
];

export function categorizeTopic(story: Story): string {
  const text =
    `${story.title} ${story.description ?? ''} ${story.tags.join(' ')}`.toLowerCase();

  if (story.tags.includes('netsec')) return 'security';

  if (
    /secur|vulnerab|leak|exploit|cve|breach|privacy|malware|ransomware|phishing|auth[oz]/.test(
      text
    )
  )
    return 'security';

  if (
    /\bai\b|machine.?learn|deep.?learn|neural|llm|gpt|claude|gemini|copilot|diffusion|openai|anthropic|chatbot/.test(
      text
    )
  )
    return 'ai';

  if (
    /compiler|kernel|linux|database|postgres|redis|sqlite|memory\b|cpu\b|gpu\b|assembly|filesystem|syscall|operating.?system|quantum/.test(
      text
    )
  )
    return 'systems';

  if (story.tags.includes('devops')) return 'tools';

  if (
    /docker|k8s|kubernetes|ci\/?cd|deploy|aws|cloud|devops|terraform|vercel|netlify|monitoring|sre|nginx|infra/.test(
      text
    )
  )
    return 'tools';

  const langKeywords =
    /\brust\b|\bgo\b|\bgolang\b|python|typescript|javascript|c\+\+|ocaml|zig|kotlin|swift|\bjava\b|ruby|php|react|vue|svelte|angular|css|html|frontend|backend|framework|library|api\b|sdk\b|npm\b|crate/;
  if (langKeywords.test(text)) return 'dev';

  const langTags = [
    'typescript',
    'javascript',
    'python',
    'go',
    'rust',
    'c++',
    'java',
    'swift',
    'kotlin',
    'ruby',
    'php',
  ];
  if (langTags.some((t) => story.tags.includes(t))) return 'dev';

  return 'general';
}

export function categorizeStories(
  stories: readonly Story[]
): Record<string, Story[]> {
  const result: Record<string, Story[]> = {};
  for (const topic of TOPICS) {
    result[topic.id] = [];
  }
  for (const story of stories) {
    const topicId = categorizeTopic(story);
    result[topicId].push(story);
  }
  for (const topic of TOPICS) {
    result[topic.id].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }
  return result;
}
