import { useRouter } from 'expo-router';
import { ListItem } from './ui/ListItem';
import type { Project } from '../lib/types';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  return (
    <ListItem
      icon="folder-outline"
      title={project.name}
      subtitle={project.path}
      onPress={() => router.push(`/(tabs)/projects/${project.id}`)}
    />
  );
}
