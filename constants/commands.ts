export interface SlashCommand {
  name: string;
  description: string;
  type: 'app' | 'skill';
}

export const COMMANDS: SlashCommand[] = [
  { name: 'clear', description: 'Clear chat messages', type: 'app' },
  { name: 'compact', description: 'Compact context window', type: 'skill' },
  { name: 'cost', description: 'Show session cost', type: 'app' },
  { name: 'commit', description: 'Create a git commit', type: 'skill' },
  { name: 'review-pr', description: 'Review a pull request', type: 'skill' },
  { name: 'simplify', description: 'Simplify recent code', type: 'skill' },
];
