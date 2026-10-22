"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface RevenueChartProps {
  data: Array<{ month: string; revenue: number }>
  title?: string
}

export function RevenueChart({ data, title = "Revenue Trend" }: RevenueChartProps) {
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
          <XAxis
            dataKey="month"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#A0A0A0' }}
          />
          <YAxis
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#A0A0A0' }}
            tickFormatter={(value) => `LKR ${value}`}
          />
          <Tooltip
            formatter={(value) => [`LKR ${value}`, 'Revenue']}
            labelStyle={{ color: '#000' }}
            contentStyle={{ 
              backgroundColor: '#202022', 
              border: '1px solid #404040',
              borderRadius: '8px',
              color: '#ffffff'
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#AAFF69"
            strokeWidth={2}
            dot={{ fill: '#AAFF69', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#AAFF69' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}