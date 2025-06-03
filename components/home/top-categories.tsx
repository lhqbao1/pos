"use client"

import { TrendingUp } from "lucide-react"
import { Pie, PieChart, Sector, Tooltip } from "recharts"
import { PieSectorDataItem } from "recharts/types/polar/Pie"

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
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
    { dish: "Giò heo nướng", visitors: 275, fill: "#ff6900", id: 1 },
    { dish: "Heineken bạc lon", visitors: 200, fill: "#ffeee1", id: 2 },
    { dish: "Sài gòn larger", visitors: 187, fill: "#333333", id: 3 },
    { dish: "Tiger bạc", visitors: 173, fill: "#fdcea2", id: 4 },
]

const chartConfig = chartData.reduce((acc, item) => {
    acc[item.dish] = {
        label: item.dish,
        color: item.fill,
    };
    return acc;
}, {} as Record<string, { label: string; color: string }>);


export function TopCategories() {
    return (
        <Card className="flex flex-col border-none shadow-none p-0 h-full justify-center items-center">
            <CardHeader className="items-start w-full p-0 flex flex-col gap-1.5">
                <CardTitle className="text-lg">Top Categories</CardTitle>
                <CardDescription className="text-xs">Last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 h-full">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square h-full"
                >
                    <PieChart
                        margin={{ top: 5, right: 5, bottom: 5, left: 5 }
                        }
                    >
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel indicator="line" className="min-w-[170px]" />}

                        />
                        <Pie
                            data={chartData}
                            dataKey="visitors"
                            nameKey="dish"
                            label
                            labelLine
                            innerRadius={40}     // Smaller = thicker donut
                            outerRadius={70}     // Larger = thicker donut                            
                            paddingAngle={3}
                            strokeWidth={0}
                            activeIndex={0}
                            cornerRadius={5}
                        />
                        <ChartLegend
                            content={<ChartLegendContent nameKey="dish" />}
                            className="flex-wrap gap-2 [&>*]:justify-center mt-10"
                        />

                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
