import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from './EmptyState';

export interface ErrorStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onRetry?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  description,
  actionLabel = 'Try again',
  onRetry,
  icon = 'cloud-offline-outline',
}) => (
  <EmptyState
    icon={icon}
    title={title}
    description={description}
    actionLabel={onRetry ? actionLabel : undefined}
    onAction={onRetry}
    neutral
  />
);
