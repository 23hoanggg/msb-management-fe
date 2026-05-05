/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Users,
  Music,
  CalendarDays,
  Download,
  Coffee,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// IMPORT CUSTOM HOOK
import { useReports } from "@/hooks/useReports";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#e83e8c",
  "#20c997",
];

// --- DUMB COMPONENT 1: THẺ THỐNG KÊ ---
const SummaryCards = ({ summary }: { summary: any }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <Card className="border-border bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md border-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium opacity-90">
          Tổng Doanh Thu
        </CardTitle>
        <DollarSign className="w-4 h-4 opacity-80" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black">
          {summary.totalRevenue.toLocaleString()}đ
        </div>
        <p className="text-xs mt-2 opacity-90">Cập nhật theo thời gian thực</p>
      </CardContent>
    </Card>

    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Tiền Dịch vụ
        </CardTitle>
        <Coffee className="w-4 h-4 text-orange-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {summary.serviceRevenue.toLocaleString()}đ
        </div>
        <p className="text-xs mt-2 text-muted-foreground">
          Chiếm{" "}
          {summary.totalRevenue
            ? Math.round((summary.serviceRevenue / summary.totalRevenue) * 100)
            : 0}
          % tổng thu
        </p>
      </CardContent>
    </Card>

    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Tiền Giờ hát
        </CardTitle>
        <Music className="w-4 h-4 text-blue-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {summary.roomRevenue.toLocaleString()}đ
        </div>
        <p className="text-xs mt-2 text-muted-foreground">
          Chiếm{" "}
          {summary.totalRevenue
            ? Math.round((summary.roomRevenue / summary.totalRevenue) * 100)
            : 0}
          % tổng thu
        </p>
      </CardContent>
    </Card>

    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Tổng Lượt Mở Phòng
        </CardTitle>
        <Users className="w-4 h-4 text-purple-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {summary.totalSessions} Lượt
        </div>
        <p className="text-xs mt-2 text-muted-foreground flex items-center gap-1">
          <CalendarDays className="w-3 h-3" /> Theo khoảng thời gian chọn
        </p>
      </CardContent>
    </Card>
  </div>
);

// --- DUMB COMPONENT 2: KHỐI BIỂU ĐỒ ---
const DashboardCharts = ({
  revenueData,
  productData,
}: {
  revenueData: any[];
  productData: any[];
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <Card className="lg:col-span-2 border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Biểu đồ Doanh thu</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          {revenueData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Chưa có dữ liệu giao dịch.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value / 1000000}M`}
                />
                <Tooltip
                  formatter={(value: any) =>
                    new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(Number(value))
                  }
                  cursor={{ fill: "transparent" }}
                />
                <Legend />
                <Bar
                  dataKey="roomFee"
                  name="Tiền giờ hát"
                  stackId="a"
                  fill="#3b82f6"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="serviceFee"
                  name="Tiền dịch vụ"
                  stackId="a"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>

    <Card className="border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Dịch vụ bán chạy nhất</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {productData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Chưa có dữ liệu.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {productData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) =>
                    new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(Number(value))
                  }
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
);

// --- MAIN COMPONENT: NGƯỜI QUẢN LÝ ---
export default function ReportsPage() {
  const { states, setters, actions } = useReports();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Báo cáo & Thống kê
          </h2>
          <p className="text-muted-foreground mt-1">
            Tổng quan doanh thu và hiệu suất kinh doanh từ dữ liệu thực tế.
          </p>
        </div>

        <div className="flex gap-2">
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium focus-visible:outline-none text-foreground dark:bg-slate-800 dark:border-slate-700"
            value={states.timeRange}
            onChange={(e) => setters.setTimeRange(e.target.value)}
            disabled={states.loading}
          >
            <option value="today">Hôm nay</option>
            <option value="7days">7 ngày qua</option>
            <option value="thisMonth">Tháng này</option>
            <option value="all">Toàn thời gian</option>
          </select>

          <Button
            variant="outline"
            className="border-input text-foreground"
            onClick={actions.handleExportExcel}
          >
            <Download className="w-4 h-4 mr-2" /> Xuất Excel
          </Button>
        </div>
      </div>

      {/* CONTENT */}
      {states.loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <SummaryCards summary={states.summary} />
          <DashboardCharts
            revenueData={states.revenueData}
            productData={states.productData}
          />
        </>
      )}
    </div>
  );
}
