"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { dashboardApi } from "@/lib/api"

function monthLabel(year: number, month: number) {
  // month is 1-12
  const d = new Date(year, month - 1, 1)
  return d.toLocaleString("en-US", { month: "short", year: "numeric" }) // "Dec 2025"
}

function toSafeNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function RevenueChart() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: dashboardApi.getStats,
  })

  const monthlyStats = Array.isArray(data?.data?.monthlyStats) ? data.data.monthlyStats : []
  const chartData = monthlyStats.flatMap((item: any) => {
    const year = Number(item?._id?.year)
    const month = Number(item?._id?.month)

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return []
    }

    return [
      {
        month: monthLabel(year, month),
        revenue: toSafeNumber(item?.revenue),
      },
    ]
  })

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Revenue Statistic</CardTitle>
        <p className="text-sm text-gray-600">Revenue</p>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                }}
                formatter={(value: unknown) => [`$${toSafeNumber(value).toLocaleString()}`, "Revenue"]}
              />
              <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
