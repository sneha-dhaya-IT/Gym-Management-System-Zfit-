"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface BarChartProps {
  data: Array<{ name: string; value: number }>
  title?: string
  color?: string
}

export function CustomBarChart({ data, title = "Chart", color = "#AAFF69" }: BarChartProps) {
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
          <XAxis
            dataKey="name"
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
          />
          <Tooltip
            formatter={(value) => [value, 'Count']}
            labelStyle={{ color: '#000' }}
            contentStyle={{ 
              backgroundColor: '#202022', 
              border: '1px solid #404040',
              borderRadius: '8px',
              color: '#ffffff'
            }}
          />
          <Bar
            dataKey="value"
            fill={color}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}