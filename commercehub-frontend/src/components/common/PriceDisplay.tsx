import { Typography, type TypographyProps } from '@mui/material';
import { formatCurrency } from '@/utils/formatters';

interface PriceDisplayProps {
  amount: number;
  currency?: string;
  variant?: TypographyProps['variant'];
  color?: TypographyProps['color'];
  fontWeight?: number | string;
}

export function PriceDisplay({
  amount,
  currency = 'USD',
  variant = 'body1',
  color,
  fontWeight,
}: PriceDisplayProps) {
  return (
    <Typography variant={variant} sx={{ color, fontWeight }}>
      {formatCurrency(amount, currency)}
    </Typography>
  );
}
