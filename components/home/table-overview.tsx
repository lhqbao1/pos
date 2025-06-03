"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts"

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
import SelectPeriod from "./select-period"

const chartData = [
    { date: "2/3", table: 11 },
    { date: "3/3", table: 22 },
    { date: "4/3", table: 30 },
    { date: "5/3", table: 73 },
    { date: "6/3", table: 120 },
    { date: "7/3", table: 111 },
]

const chartConfig = {
    table: {
        label: "Table Amount",
        color: "green"
    }
} satisfies ChartConfig

export function TableOverview() {
    const maxValue = Math.max(...chartData.map((item) => item.table))


    return (
        <Card className="border-none shadow-none p-0 gap-4">
            <CardHeader className="p-0">
                <div className="flex flex-row justify-between">
                    <div className="flex flex-col gap-1.5">
                        <CardTitle className="text-lg">Table Overview</CardTitle>
                        <CardDescription className="text-xs">Last 7 days</CardDescription>
                    </div>
                    <SelectPeriod />
                </div>
            </CardHeader>
            <CardContent className="p-0 h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                        <BarChart
                            accessibilityLayer
                            data={chartData}
                            margin={{
                                top: 0,
                            }}
                        >
                            <CartesianGrid vertical={false} />
                            <YAxis
                                ticks={[0, 10, 50, 100, 150]} // ✅ Specify the y-axis ticks
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                width={40}
                                padding={{ top: 0 }}
                            />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                tickMargin={5}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(0, 3)}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel separator="-" hideIndicator className="flex flex-row gap-2 px-2 min-w-[120px]" />}
                            />
                            <Bar dataKey="table" fill="#fff3e6" radius={10} width={50} barSize={40}>
                                <LabelList
                                    position="top"
                                    offset={12}
                                    className="fill-foreground"
                                    fontSize={10}
                                />
                                {chartData.map((item) => {
                                    if (item.table === maxValue) {
                                        return (
                                            <Cell key={3} fill="#ff6900" />
                                        )
                                    }
                                    return (
                                        <Cell key={3} fill="#fff3e6" />
                                    )
                                })}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </ResponsiveContainer>

            </CardContent>
        </Card>
    )
}
