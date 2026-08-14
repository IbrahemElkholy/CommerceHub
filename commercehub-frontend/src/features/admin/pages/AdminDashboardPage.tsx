import { Container, Typography, Grid, Card, CardContent, Box, Skeleton } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { adminService } from '../services/adminService';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { formatCurrency, formatDate } from '@/utils/formatters';

const PIE_COLORS = ['#1a1a2e', '#e94560', '#0f3460', '#16213e', '#e94560', '#4caf50', '#ff9800', '#f44336', '#9c27b0'];

const today = new Date().toISOString().split('T')[0];
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

export function AdminDashboardPage() {
  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: QUERY_KEYS.ANALYTICS.REVENUE({ from: thirtyDaysAgo, to: today }),
    queryFn: () => adminService.getRevenue({ from: thirtyDaysAgo, to: today }),
  });

  const { data: ordersSummary, isLoading: summaryLoading } = useQuery({
    queryKey: QUERY_KEYS.ANALYTICS.ORDERS_SUMMARY,
    queryFn: adminService.getOrdersSummary,
  });

  const { data: topProducts, isLoading: topLoading } = useQuery({
    queryKey: QUERY_KEYS.ANALYTICS.TOP_PRODUCTS,
    queryFn: () => adminService.getTopProducts({ limit: 5 }),
  });

  const totalRevenue = revenue?.reduce((s, d) => s + d.revenue, 0) ?? 0;
  const totalOrders = revenue?.reduce((s, d) => s + d.orderCount, 0) ?? 0;

  return (
    <>
      <Helmet><title>Admin Dashboard — CommerceHub</title></Helmet>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>Dashboard</Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { label: 'Total Revenue (30d)', value: formatCurrency(totalRevenue), loading: revenueLoading },
            { label: 'Total Orders (30d)', value: totalOrders.toString(), loading: revenueLoading },
            { label: 'Top Product', value: topProducts?.[0]?.productName ?? '—', loading: topLoading },
          ].map(({ label, value, loading }) => (
            <Grid size={{ xs: 12, sm: 4 }} key={label}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>{label}</Typography>
                  {loading ? (
                    <Skeleton variant="text" width="60%" height={40} />
                  ) : (
                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{value}</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Revenue (Last 30 Days)</Typography>
                {revenueLoading ? (
                  <Skeleton variant="rectangular" height={280} />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={revenue}>
                      <XAxis dataKey="date" tickFormatter={(d) => formatDate(d)} tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Revenue']} />
                      <Area type="monotone" dataKey="revenue" stroke="#e94560" fill="#e9456020" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Orders by Status</Typography>
                {summaryLoading ? (
                  <Skeleton variant="rectangular" height={280} />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={ordersSummary}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, percent }) =>
                          `${String(name ?? '')} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {ordersSummary?.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Top Selling Products</Typography>
                {topLoading ? (
                  <Skeleton variant="rectangular" height={120} />
                ) : (
                  <Box>
                    {topProducts?.map((p, i) => (
                      <Box key={p.productId} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {i + 1}. {p.productName}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 4 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{p.quantitySold} sold</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(p.revenue)}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
