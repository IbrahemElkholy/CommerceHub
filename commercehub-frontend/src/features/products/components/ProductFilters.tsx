import {
  Box,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Skeleton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useCategories, useBrands } from '../hooks/useProducts';
import type { ProductFilterParams } from '../types';

interface ProductFiltersProps {
  filters: ProductFilterParams;
  onChange: (filters: Partial<ProductFilterParams>) => void;
  onReset: () => void;
}

export function ProductFilters({ filters, onChange, onReset }: ProductFiltersProps) {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: brands, isLoading: brandsLoading } = useBrands();

  const priceRange: [number, number] = [filters.minPrice ?? 0, filters.maxPrice ?? 5000];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Filters
        </Typography>
        <Button size="small" onClick={onReset}>
          Clear all
        </Button>
      </Box>

      <Accordion defaultExpanded disableGutters elevation={0} variant="outlined" sx={{ mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Category
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {categoriesLoading ? (
            <Skeleton variant="rectangular" height={40} />
          ) : (
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.categoryId ?? ''}
                label="Category"
                onChange={(e) =>
                  onChange({ categoryId: e.target.value ? Number(e.target.value) : undefined })
                }
              >
                <MenuItem value="">All</MenuItem>
                {(categories ?? []).map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded disableGutters elevation={0} variant="outlined" sx={{ mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Brand
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {brandsLoading ? (
            <Skeleton variant="rectangular" height={40} />
          ) : (
            <FormControl fullWidth size="small">
              <InputLabel>Brand</InputLabel>
              <Select
                value={filters.brandId ?? ''}
                label="Brand"
                onChange={(e) =>
                  onChange({ brandId: e.target.value ? Number(e.target.value) : undefined })
                }
              >
                <MenuItem value="">All</MenuItem>
                {(brands ?? []).map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded disableGutters elevation={0} variant="outlined">
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Price Range
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Slider
            value={priceRange}
            min={0}
            max={5000}
            step={10}
            onChange={(_, value) => {
              const [min, max] = value as [number, number];
              onChange({ minPrice: min || undefined, maxPrice: max < 5000 ? max : undefined });
            }}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `$${v}`}
            aria-label="Price range"
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              ${priceRange[0]}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              ${priceRange[1]}
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
