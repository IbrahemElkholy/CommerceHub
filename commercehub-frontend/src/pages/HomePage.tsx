import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useProducts } from '@/features/products/hooks/useProducts';
import { ProductCard } from '@/features/products/components/ProductCard';
import { ROUTES } from '@/constants/routes';

export function HomePage() {
  const navigate = useNavigate();

  const { data: featuredProducts, isLoading } = useProducts({
    page: 0,
    size: 8,
    sort: 'createdAt,desc',
    status: 'ACTIVE',
  });

  return (
    <>
      <Helmet>
        <title>CommerceHub — Modern Commerce Platform</title>
      </Helmet>

      <Box
        sx={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          color: '#fff',
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              variant="h2"
              gutterBottom
              sx={{ fontWeight: 800, fontSize: { xs: '2rem', md: '3.5rem' } }}
            >
              Commerce. Reimagined.
            </Typography>
            <Typography
              variant="h5"
              sx={{ opacity: 0.8, mb: 4, maxWidth: 560, fontSize: { xs: '1rem', md: '1.25rem' } }}
            >
              Discover thousands of products. Fast shipping. Secure checkout.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                color="secondary"
                onClick={() => navigate(ROUTES.PRODUCTS)}
                sx={{ fontWeight: 700 }}
              >
                Shop Now
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate(ROUTES.REGISTER)}
                sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}
              >
                Create Account
              </Button>
            </Box>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            New Arrivals
          </Typography>
          <Button onClick={() => navigate(ROUTES.PRODUCTS)}>View All</Button>
        </Box>

        <Grid container spacing={2}>
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                  <ProductCard loading />
                </Grid>
              ))
            : featuredProducts?.data.content.map((product) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={product.id}>
                  <ProductCard product={product} />
                </Grid>
              ))}
        </Grid>
      </Container>

      <Box sx={{ bgcolor: 'action.hover', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            {[
              { title: 'Free Shipping', desc: 'On all orders over $50', icon: '🚚' },
              { title: 'Secure Payment', desc: 'Your payment is protected', icon: '🔒' },
              { title: 'Easy Returns', desc: '30-day return policy', icon: '↩️' },
              { title: '24/7 Support', desc: 'We\'re here to help', icon: '💬' },
            ].map((item) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.title}>
                <Card variant="outlined" sx={{ textAlign: 'center', height: '100%' }}>
                  <CardContent>
                    <Typography sx={{ fontSize: 36, mb: 1 }}>{item.icon}</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{item.title}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{item.desc}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </>
  );
}
