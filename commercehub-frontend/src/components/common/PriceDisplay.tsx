import { Typography, type TypographyProps } from '@mui/material';
import { formatCurrency } from '@/utils/formatters';

interface PriceDisplayProps {
  amount: number | string | null | undefined;
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
  const numeric = typeof amount === 'number' ? amount : Number(amount);
  const safe = Number.isFinite(numeric) ? numeric : 0;
  return (
    <Typography variant={variant} sx={{ color, fontWeight }}>
      {formatCurrency(safe, currency)}
    </Typography>
  );
}
