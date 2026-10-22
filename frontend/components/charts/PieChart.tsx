"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface PieChartProps {
  data: Array<{ name: string; value: number }>
  title?: string
  colors?: string[]
}

const DEFAULT_COLORS = ['#AAFF69', '#202022', '#A0A0A0', '#404040', '#ffffff', '#666666']

export function CustomPieChart({ data, title = "Distribution", colors = DEFAULT_COLORS }: PieChartProps) {
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [value, 'Count']} 
            contentStyle={{ 
              backgroundColor: '#202022', 
              border: '1px solid #404040',
              borderRadius: '8px',
              color: '#ffffff'
            }}
          />
          <Legend 
            wrapperStyle={{ color: '#A0A0A0' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}