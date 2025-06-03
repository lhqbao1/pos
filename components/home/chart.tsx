"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

interface ChartProps {
    dateCount: number;
};

export function Chart({ dateCount }: ChartProps) {
    const dateList: string[] = []
    const today = new Date()

    for (let i = 0; i < dateCount; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const month = date.getMonth() + 1; // Months are 0-based
        const day = date.getDate();
        dateList.push(`${month}/${day}`);
        // dateList.reverse();
    }

    const chartData = [
        // dateList.map((item) {})
        { month: "January", revenue: 186, cost: 80 },
        { month: "February", revenue: 305, cost: 200 },
        { month: "March", revenue: 237, cost: 120 },
        { month: "April", revenue: 73, cost: 190 },
        { month: "May", revenue: 209, cost: 130 },
        { month: "June", revenue: 214, cost: 140 },
    ]

    const chartConfig = {
        revenue: {
            label: "Revenue",
            color: "#ff6900",
        },
        cost: {
            label: "Cost",
            color: "#333333",
        },
    } satisfies ChartConfig

    return (
        <Card className="border-none shadow-none p-0">
            <CardContent className="p-0">
                <ChartContainer config={chartConfig}>
                    <LineChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                        height={150}
                        width={500}
                    >
                        <CartesianGrid vertical={false} />
                        <YAxis
                            ticks={[0, 50, 100, 200, 300]} // ✅ Specify the y-axis ticks
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            width={30}
                            padding={{ top: 0 }}
                        />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <Line
                            dataKey="revenue"
                            type="monotone"
                            stroke="#ff6900"
                            strokeWidth={3}
                            dot={false}
                            filter="drop-shadow(3px 5px 2px #f0c8ad)"
                        />
                        <Line
                            dataKey="cost"
                            type="monotone"
                            stroke="#333333"
                            strokeWidth={3}
                            dot={false}
                            filter="drop-shadow(3px 5px 2px rgba(0, 0, 0, 0.3))"
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
