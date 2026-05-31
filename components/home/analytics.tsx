"use client"

import React, { useMemo, useState } from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  ArrowUpRight,
  CalendarIcon,
  Loader2,
  ReceiptText,
  Table2,
  UtensilsCrossed,
  Wallet,
} from "lucide-react"

import { useGetOrders } from "@/features/order/hook"
import { getOrderStatusMeta } from "@/features/order/status"
import { Order } from "@/features/order/type"
import { useGetTables } from "@/features/tables/hook"
import { Table } from "@/features/tables/type"
import { useDishesQuery } from "@/features/dish/hook"
import { Dish } from "@/features/dish/type"
import { useGetAllCategories } from "@/features/categories/hook"
import { Category } from "@/features/categories/type"
import { formattedNumber } from "@/lib/format-vnd"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type RevenuePeriod = "today" | "yesterday" | "last7" | "last30" | "specific"

type DateRange = {
  start: Date
  end: Date
}

const PERIOD_OPTIONS: Array<{ value: RevenuePeriod; label: string }> = [
  { value: "today", label: "Hôm nay" },
  { value: "yesterday", label: "Hôm qua" },
  { value: "last7", label: "Tuần qua" },
  { value: "last30", label: "Tháng qua" },
  { value: "specific", label: "Ngày cụ thể" },
]

const SOURCE_LABELS: Record<string, string> = {
  dine_in: "Tại bàn",
  takeaway: "Mang đi",
  delivery: "Giao hàng",
}

const CATEGORY_COLORS = ["#ff6900", "#f6c387", "#3f2b16", "#ffdcb6", "#f2a86e"]

const startOfDay = (date: Date) => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

const endOfDay = (date: Date) => {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const resolveReportRange = (
  period: RevenuePeriod,
  specificDate: Date | undefined,
): DateRange => {
  const today = new Date()

  if (period === "yesterday") {
    const date = addDays(today, -1)
    return { start: startOfDay(date), end: endOfDay(date) }
  }

  if (period === "last7") {
    return { start: startOfDay(addDays(today, -6)), end: endOfDay(today) }
  }

  if (period === "last30") {
    return { start: startOfDay(addDays(today, -29)), end: endOfDay(today) }
  }

  if (period === "specific") {
    const date = specificDate ?? today
    return { start: startOfDay(date), end: endOfDay(date) }
  }

  return { start: startOfDay(today), end: endOfDay(today) }
}

const resolveOrderTimestamp = (order: Order) => {
  const fallback = order.updatedAt ?? order.createdAt
  const source = order.paid_time ?? order.closed_at ?? fallback
  if (!source) return null

  const parsed = new Date(source)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const resolveOrderTotal = (order: Order) => Math.max(0, order.total_amount ?? 0)

const isDashboardOrder = (order: Order) =>
  order.order_status !== "active" && order.order_status !== "empty"

const isRevenueOrder = (order: Order) =>
  order.order_status === "paid" || order.order_status === "outstanding"

const getPercentChange = (current: number, previous: number) => {
  if (previous === 0) {
    if (current === 0) return 0
    return 100
  }

  return ((current - previous) / previous) * 100
}

const formatPercent = (value: number) => {
  const absolute = Math.abs(value).toFixed(1)
  return `${absolute}%`
}

const formatRangeLabel = (range: DateRange) => {
  return `${format(range.start, "dd/MM/yyyy")} - ${format(range.end, "dd/MM/yyyy")}`
}

const DashboardSkeleton = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-[#ead8c4] bg-white p-4 shadow-sm"
        >
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-8 w-32" />
          <Skeleton className="mt-3 h-3 w-40" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="xl:col-span-8 rounded-2xl border border-[#ead8c4] bg-white p-4">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="mt-3 h-64 w-full" />
      </div>
      <div className="xl:col-span-4 rounded-2xl border border-[#ead8c4] bg-white p-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-3 h-64 w-full" />
      </div>
    </div>
  </div>
)

const Analytics = () => {
  const [period, setPeriod] = useState<RevenuePeriod>("today")
  const [specificDate, setSpecificDate] = useState<Date>(new Date())

  const {
    data: ordersResponse,
    isLoading: isOrdersLoading,
    isFetching: isOrdersFetching,
  } = useGetOrders()
  const {
    data: tablesResponse,
    isLoading: isTablesLoading,
    isFetching: isTablesFetching,
  } = useGetTables()
  const {
    data: dishesResponse,
    isLoading: isDishesLoading,
    isFetching: isDishesFetching,
  } = useDishesQuery({ page: 1, pageSize: 1000, sort: "sold:desc" })
  const {
    data: categoriesResponse,
    isLoading: isCategoriesLoading,
    isFetching: isCategoriesFetching,
  } = useGetAllCategories()

  const orders: Order[] = ordersResponse?.data ?? []
  const tables: Table[] = tablesResponse?.data ?? []
  const dishes: Dish[] = dishesResponse?.data ?? []
  const categories: Category[] = categoriesResponse?.data ?? []

  const range = useMemo(
    () => resolveReportRange(period, specificDate),
    [period, specificDate],
  )

  const previousRange = useMemo(() => {
    const rangeDurationMs = range.end.getTime() - range.start.getTime()
    const previousEnd = new Date(range.start.getTime() - 1)
    const previousStart = new Date(previousEnd.getTime() - rangeDurationMs)

    return { start: previousStart, end: previousEnd }
  }, [range.end, range.start])

  const rangeOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!isDashboardOrder(order)) return false
      const timestamp = resolveOrderTimestamp(order)
      if (!timestamp) return false
      return timestamp >= range.start && timestamp <= range.end
    })
  }, [orders, range.end, range.start])

  const previousRangeOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!isDashboardOrder(order)) return false
      const timestamp = resolveOrderTimestamp(order)
      if (!timestamp) return false
      return timestamp >= previousRange.start && timestamp <= previousRange.end
    })
  }, [orders, previousRange.end, previousRange.start])

  const rangeRevenueOrders = useMemo(
    () => rangeOrders.filter(isRevenueOrder),
    [rangeOrders],
  )
  const previousRangeRevenueOrders = useMemo(
    () => previousRangeOrders.filter(isRevenueOrder),
    [previousRangeOrders],
  )

  const totalOrders = rangeOrders.length
  const totalRevenue = rangeRevenueOrders.reduce(
    (sum, order) => sum + resolveOrderTotal(order),
    0,
  )

  const previousTotalOrders = previousRangeOrders.length
  const previousTotalRevenue = previousRangeRevenueOrders.reduce(
    (sum, order) => sum + resolveOrderTotal(order),
    0,
  )

  const ordersChange = getPercentChange(totalOrders, previousTotalOrders)
  const revenueChange = getPercentChange(totalRevenue, previousTotalRevenue)

  const tableSummary = useMemo(() => {
    const total = tables.length
    const inUse = tables.filter((table) => table.table_status === "Using").length

    return { total, inUse }
  }, [tables])

  const chartData = useMemo(() => {
    const bucket = new Map<string, { date: string; revenue: number; orders: number }>()
    const cursor = new Date(range.start)

    while (cursor <= range.end) {
      const key = format(cursor, "yyyy-MM-dd")
      bucket.set(key, {
        date: format(cursor, "dd/MM"),
        revenue: 0,
        orders: 0,
      })
      cursor.setDate(cursor.getDate() + 1)
    }

    rangeRevenueOrders.forEach((order) => {
      const timestamp = resolveOrderTimestamp(order)
      if (!timestamp) return

      const key = format(timestamp, "yyyy-MM-dd")
      const current = bucket.get(key)
      if (!current) return

      current.revenue += resolveOrderTotal(order)
      current.orders += 1
    })

    return Array.from(bucket.values())
  }, [range.end, range.start, rangeRevenueOrders])

  const tableStatusData = useMemo(() => {
    const stats = {
      Empty: 0,
      Using: 0,
      Reserved: 0,
      Cleaning: 0,
      Disabled: 0,
    }

    tables.forEach((table) => {
      if (table.table_status in stats) {
        stats[table.table_status as keyof typeof stats] += 1
      }
    })

    return [
      { label: "Trống", value: stats.Empty },
      { label: "Đang dùng", value: stats.Using },
      { label: "Đặt trước", value: stats.Reserved },
      { label: "Đang dọn", value: stats.Cleaning },
      { label: "Ngưng dùng", value: stats.Disabled },
    ]
  }, [tables])

  const topCategoryData = useMemo(() => {
    const categoryMap = new Map<
      string,
      { name: string; sold: number; dishCount: number }
    >()

    categories.forEach((category) => {
      categoryMap.set(category.name, {
        name: category.name,
        sold: 0,
        dishCount: 0,
      })
    })

    dishes.forEach((dish) => {
      const categoryName = dish.category?.name ?? "Chưa phân loại"
      const current = categoryMap.get(categoryName) ?? {
        name: categoryName,
        sold: 0,
        dishCount: 0,
      }

      current.sold += Math.max(0, dish.sold ?? 0)
      current.dishCount += 1
      categoryMap.set(categoryName, current)
    })

    const source = Array.from(categoryMap.values())
    const hasSoldData = source.some((item) => item.sold > 0)

    return source
      .map((item, index) => ({
        name: item.name,
        value: hasSoldData ? item.sold : item.dishCount,
        fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }))
      .filter((item) => item.value > 0)
      .sort((left, right) => right.value - left.value)
      .slice(0, 5)
  }, [categories, dishes])

  const sourceDistribution = useMemo(() => {
    const stats = {
      dine_in: 0,
      takeaway: 0,
      delivery: 0,
    }

    rangeOrders.forEach((order) => {
      const source = order.source ?? "dine_in"
      if (source in stats) {
        stats[source as keyof typeof stats] += 1
      }
    })

    const total = rangeOrders.length || 1

    return [
      { key: "dine_in", label: SOURCE_LABELS.dine_in, value: stats.dine_in },
      { key: "takeaway", label: SOURCE_LABELS.takeaway, value: stats.takeaway },
      { key: "delivery", label: SOURCE_LABELS.delivery, value: stats.delivery },
    ].map((item) => ({
      ...item,
      percent: Math.round((item.value / total) * 1000) / 10,
    }))
  }, [rangeOrders])

  const recentOrders = useMemo(() => {
    return [...rangeOrders]
      .sort((left, right) => {
        const leftTime = resolveOrderTimestamp(left)?.getTime() ?? 0
        const rightTime = resolveOrderTimestamp(right)?.getTime() ?? 0
        return rightTime - leftTime
      })
      .slice(0, 8)
  }, [rangeOrders])

  const isInitialLoading =
    (isOrdersLoading && !ordersResponse) ||
    (isTablesLoading && !tablesResponse) ||
    (isDishesLoading && !dishesResponse) ||
    (isCategoriesLoading && !categoriesResponse)

  const isBackgroundFetching =
    !isInitialLoading &&
    (isOrdersFetching ||
      isTablesFetching ||
      isDishesFetching ||
      isCategoriesFetching)

  if (isInitialLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="relative col-span-4 space-y-4">
      {isBackgroundFetching ? (
        <div className="pointer-events-none absolute inset-0 z-20 rounded-2xl bg-white/55">
          <div className="sticky top-2 mx-auto mt-2 w-fit rounded-full border border-[#e6d4be] bg-white px-4 py-2 text-sm font-semibold text-[#6f4b2a] shadow-sm">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang cập nhật dữ liệu...
            </span>
          </div>
        </div>
      ) : null}

      <Card className="border-[#ead8c4] bg-white shadow-sm">
        <CardContent className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b7757]">
              Báo cáo doanh thu
            </p>
            <h3 className="mt-1 text-lg font-bold text-[#4a2f18]">
              Phân tích theo mốc thời gian
            </h3>
            <p className="mt-1 text-sm text-[#8b6b4c]">
              Khoảng dữ liệu: {formatRangeLabel(range)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={period}
              onValueChange={(value) => setPeriod(value as RevenuePeriod)}
            >
              <SelectTrigger className="w-[190px] border-[#e3cfb8] bg-white text-[#4a2f18]">
                <SelectValue placeholder="Chọn mốc thời gian" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {period === "specific" ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#e3cfb8] bg-white text-[#4a2f18] hover:bg-[#fff4e5] hover:text-[#4a2f18]"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(specificDate, "PPP", { locale: vi })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={specificDate}
                    onSelect={(date) => {
                      if (!date) return
                      setSpecificDate(date)
                    }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-[#ead8c4] bg-white shadow-sm">
          <CardContent className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-primary p-2 text-primary-foreground">
                <ReceiptText className="h-4 w-4 text-secondary" />
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                  ordersChange >= 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700",
                )}
              >
                <ArrowUpRight
                  className={cn(
                    "h-3.5 w-3.5",
                    ordersChange < 0 ? "rotate-90" : "",
                  )}
                />
                {formatPercent(ordersChange)}
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9b7757]">
              Tổng đơn
            </p>
            <p className="mt-1 text-3xl font-bold text-[#4a2f18]">{totalOrders}</p>
            <p className="mt-1 text-xs text-[#9b7757]">
              So với kỳ trước: {previousTotalOrders} đơn
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#ead8c4] bg-white shadow-sm">
          <CardContent className="px-4 py-4">
            <div className="rounded-lg bg-primary p-2 text-primary-foreground w-fit">
              <Table2 className="h-4 w-4 text-secondary" />
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9b7757]">
              Bàn đang dùng
            </p>
            <p className="mt-1 text-3xl font-bold text-[#4a2f18]">
              {tableSummary.inUse}/{tableSummary.total}
            </p>
            <p className="mt-1 text-xs text-[#9b7757]">Cập nhật theo trạng thái bàn hiện tại</p>
          </CardContent>
        </Card>

        <Card className="border-[#ead8c4] bg-white shadow-sm">
          <CardContent className="px-4 py-4">
            <div className="rounded-lg bg-primary p-2 text-primary-foreground w-fit">
              <UtensilsCrossed className="h-4 w-4 text-secondary" />
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9b7757]">
              Món ăn
            </p>
            <p className="mt-1 text-3xl font-bold text-[#4a2f18]">{dishes.length}</p>
            <p className="mt-1 text-xs text-[#9b7757]">
              {categories.length} danh mục đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#ead8c4] bg-white shadow-sm">
          <CardContent className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-primary p-2 text-primary-foreground">
                <Wallet className="h-4 w-4 text-secondary" />
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                  revenueChange >= 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700",
                )}
              >
                <ArrowUpRight
                  className={cn(
                    "h-3.5 w-3.5",
                    revenueChange < 0 ? "rotate-90" : "",
                  )}
                />
                {formatPercent(revenueChange)}
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9b7757]">
              Doanh thu
            </p>
            <p className="mt-1 text-3xl font-bold text-secondary">
              {formattedNumber(totalRevenue)}
            </p>
            <p className="mt-1 text-xs text-[#9b7757]">
              So với kỳ trước: {formattedNumber(previousTotalRevenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="border-[#ead8c4] bg-white shadow-sm xl:col-span-8">
          <CardHeader className="pb-1">
            <CardTitle className="text-lg text-[#4a2f18]">
              Biểu đồ doanh thu theo ngày
            </CardTitle>
            <p className="text-xs text-[#9b7757]">Theo bộ lọc thời gian đang chọn</p>
          </CardHeader>
          <CardContent className="h-[280px] pt-2">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(value: number, name) => {
                      if (name === "revenue") return [formattedNumber(value), "Doanh thu"]
                      return [value, "Số đơn"]
                    }}
                    labelFormatter={(label) => `Ngày ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="revenue"
                    stroke="#ff6900"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#ead8c4] bg-[#fffaf4] text-sm text-[#9b7757]">
                Không có doanh thu trong khoảng thời gian này.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#ead8c4] bg-white shadow-sm xl:col-span-4">
          <CardHeader className="pb-1">
            <CardTitle className="text-lg text-[#4a2f18]">
              Top danh mục nổi bật
            </CardTitle>
            <p className="text-xs text-[#9b7757]">
              Theo số lượng bán hoặc số món trong danh mục
            </p>
          </CardHeader>
          <CardContent className="h-[280px] pt-2">
            {topCategoryData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topCategoryData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {topCategoryData.map((item) => (
                      <Cell key={item.name} fill={item.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}`, "Giá trị"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#ead8c4] bg-[#fffaf4] text-sm text-[#9b7757]">
                Chưa có dữ liệu danh mục.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="border-[#ead8c4] bg-white shadow-sm xl:col-span-8">
          <CardHeader className="pb-1">
            <CardTitle className="text-lg text-[#4a2f18]">Tình trạng bàn</CardTitle>
            <p className="text-xs text-[#9b7757]">Số lượng bàn theo từng trạng thái</p>
          </CardHeader>
          <CardContent className="h-[240px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tableStatusData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number) => [value, "Số bàn"]} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#ff6900" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-[#ead8c4] bg-white shadow-sm xl:col-span-4">
          <CardHeader className="pb-1">
            <CardTitle className="text-lg text-[#4a2f18]">Loại đơn hàng</CardTitle>
            <p className="text-xs text-[#9b7757]">Phân bổ theo nguồn đơn</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {sourceDistribution.map((item) => (
              <div key={item.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#4a2f18]">{item.label}</p>
                  <p className="text-sm font-semibold text-[#6f4b2a]">
                    {item.value} đơn ({item.percent}%)
                  </p>
                </div>
                <Progress
                  value={item.percent}
                  max={100}
                  className="bg-[#f4ebdf]"
                  indicatorColor="bg-secondary"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#ead8c4] bg-white shadow-sm">
        <CardHeader className="pb-1">
          <CardTitle className="text-lg text-[#4a2f18]">
            Đơn hàng gần đây trong kỳ
          </CardTitle>
          <p className="text-xs text-[#9b7757]">Hiển thị tối đa 8 đơn mới nhất</p>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-[#eedecb] text-left text-xs uppercase tracking-[0.14em] text-[#9b7757]">
                  <th className="px-3 py-3">Mã đơn</th>
                  <th className="px-3 py-3">Bàn</th>
                  <th className="px-3 py-3">Khách hàng</th>
                  <th className="px-3 py-3">Thời gian</th>
                  <th className="px-3 py-3">Trạng thái</th>
                  <th className="px-3 py-3 text-right">Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length ? (
                  recentOrders.map((order) => {
                    const statusMeta = getOrderStatusMeta(order.order_status)
                    const orderTime = resolveOrderTimestamp(order)
                    const tableName =
                      order.table_id?.displayName ??
                      (order.table_id?.tableNumber
                        ? `Bàn ${order.table_id.tableNumber}`
                        : "-")

                    return (
                      <tr
                        key={order.documentId ?? order.order_no ?? `${tableName}-${order.id}`}
                        className="border-b border-[#f4e8d9] text-sm text-[#3f2b16] last:border-0"
                      >
                        <td className="px-3 py-3 font-medium">
                          {order.order_no ?? order.documentId ?? "-"}
                        </td>
                        <td className="px-3 py-3">{tableName}</td>
                        <td className="px-3 py-3">
                          {order.customer_name?.trim() || "Khách lẻ"}
                        </td>
                        <td className="px-3 py-3">
                          {orderTime
                            ? format(orderTime, "HH:mm:ss dd/MM/yyyy")
                            : "-"}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
                              statusMeta.badgeClassName,
                            )}
                          >
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-secondary">
                          {formattedNumber(resolveOrderTotal(order))}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-sm text-[#9b7757]"
                    >
                      Không có đơn hàng trong khoảng thời gian đã chọn.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Analytics
