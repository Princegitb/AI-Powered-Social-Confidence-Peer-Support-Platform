import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/**
 * TrendChartCard — DESIGN_SYSTEM.md Section 4.3
 * Title + subtitle + smooth area chart with purple gradient fill.
 * Day labels on x-axis, minimal gridlines.
 *
 * Props:
 *   title     — e.g. "Confidence Trend"
 *   subtitle  — e.g. "This week"
 *   data      — array of { name: "Mon", value: 42 }
 *   dataKey   — key in data to chart (default: "value")
 *   className — additional classes
 */
export default function TrendChartCard({
  title,
  subtitle,
  data,
  dataKey = 'value',
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut', delay: 0.1 }}
      className={`card ${className}`}
    >
      <div className="mb-4">
        <h3 className="text-h2">{title}</h3>
        {subtitle && (
          <p className="text-body text-sm mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
            />
            <Tooltip
              contentStyle={{
                background: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 24px rgba(139, 92, 246, 0.12)',
                fontSize: '13px',
              }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="#8B5CF6"
              strokeWidth={2.5}
              fill="url(#purpleGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: '#8B5CF6',
                stroke: '#FFFFFF',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
