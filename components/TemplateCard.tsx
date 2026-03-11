import { useRouter } from 'expo-router';
import { ListItem } from './ui/ListItem';
import type { Template } from '../lib/types';

interface TemplateCardProps {
  template: Template;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const router = useRouter();
  return (
    <ListItem
      icon="document-text-outline"
      title={template.name}
      subtitle={template.initial_prompt}
      onPress={() => router.push(`/(tabs)/settings/templates/${template.id}`)}
    />
  );
}
