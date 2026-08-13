/**
 * DashboardCharts — the recharts-dependent half of the Dashboard page,
 * split out and lazy-loaded from Dashboard.tsx. Dashboard is NOT
 * route-lazy (it's the post-login landing page), so recharts (~120KB
 * gzipped, its own vendor-charts chunk) was previously in the critical
 * path of every login. Isolating it here means the KPI cards / recent
 * jobs table / everything above the fold paints before recharts even
 * starts downloading.
 */
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { formatMoneyCompact } from '../lib/format'

const JOB_STATUS_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6b7280', '#ef4444']

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card-2)', border: '1px solid var(--bd-md)', borderRadius: 8, padding: '10px 14px', boxShadow: 'var(--shadow-md)' }}>
      <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ fontSize: 12, color: p.color, fontWeight: 600, marginBottom: 2 }}>
          {p.name}: {p.dataKey === 'revenue' ? formatMoneyCompact(p.value, 0) : p.value}
        </div>
      ))}
    </div>
  )
}

export function RevenueAreaChart({ data }: { data: Array<{ month: string; revenue: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={260} minWidth={0}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#635bff" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#635bff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: 'var(--t4)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatMoneyCompact(v, 0)}
          domain={[0, 'auto']}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#635bff"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#gradRevenue)"
          dot={false}
          activeDot={{ r: 4, fill: '#635bff' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function JobStatusPieChart({ data }: { data: Array<{ name: string; value: number }> }) {
  const rows = data.length > 0 ? data : [{ name: 'No data', value: 1 }]
  return (
    <ResponsiveContainer width="100%" height={180} minWidth={0}>
      <PieChart>
        <Pie
          data={rows}
          cx="50%"
          cy="50%"
          innerRadius={52}
          outerRadius={72}
          paddingAngle={5}
          dataKey="value"
          strokeWidth={2}
          stroke="var(--bg-card)"
        >
          {rows.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={JOB_STATUS_COLORS[index % JOB_STATUS_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'var(--bg-card-2)',
            border: '1px solid var(--bd-md)',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
