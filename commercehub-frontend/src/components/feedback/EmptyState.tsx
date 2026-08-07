import { Box, Typography, Button } from '@mui/material';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2,
        textAlign: 'center',
      }}
    >
      {icon && (
        <Box sx={{ mb: 2, opacity: 0.5, fontSize: 64, color: 'text.secondary' }}>{icon}</Box>
      )}
      <Typography variant="h6" sx={{ color: 'text.secondary' }} gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ color: 'text.disabled', mb: action ? 3 : 0 }}>
          {description}
        </Typography>
      )}
      {action && (
        <Button variant="contained" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Box>
  );
}
