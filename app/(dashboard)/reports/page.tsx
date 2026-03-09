/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Users,
  Music,
  TrendingUp,
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
import { toast } from "sonner";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#e83e8c",
  "#20c997",
];

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("7days");
  const [loading, setLoading] = useState(true);

  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [productData, setProductData] = useState<any[]>([]);

  const [summary, setSummary] = useState({
    totalRevenue: 0,
    roomRevenue: 0,
    serviceRevenue: 0,
    totalSessions: 0,
  });

  // 1. HÀM TÍNH TOÁN KHOẢNG THỜI GIAN (START DATE & END DATE)
  const getDateRange = (range: string) => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    if (range === "today") {
    } else if (range === "7days") {
      start.setDate(now.getDate() - 6);
    } else if (range === "thisMonth") {
      start.setDate(1);
    } else if (range === "all") {
      return null;
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  };

  useEffect(() => {
    fetchReportsData();
  }, [timeRange]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange(timeRange);

      let url = "/reports/revenue";
      if (dateRange) {
        url += `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      }

      const res = await api.get(url);
      const data = res.data?.data || res.data;

      setSummary({
        totalRevenue: data.netTotal || 0,
        roomRevenue: data.roomTotal || 0,
        serviceRevenue: data.service || 0,
        totalSessions: data.totalInvoices || 0,
      });

      setRevenueData(data.revenueByDate || []);
      setProductData(data.topProducts || []);
    } catch (error) {
      toast.error("Không thể tải dữ liệu báo cáo!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (revenueData.length === 0 && productData.length === 0) {
      return toast.error("Không có dữ liệu để xuất Excel!");
    }

    try {
      const wb = XLSX.utils.book_new();

      const summarySheetData = [
        {
          "Khoảng thời gian":
            timeRange === "today"
              ? "Hôm nay"
              : timeRange === "7days"
                ? "7 ngày qua"
                : timeRange === "thisMonth"
                  ? "Tháng này"
                  : "Toàn thời gian",
          "Tổng Doanh Thu (VNĐ)": summary.totalRevenue,
          "Tiền Giờ Hát (VNĐ)": summary.roomRevenue,
          "Tiền Dịch Vụ (VNĐ)": summary.serviceRevenue,
          "Tổng Lượt Mở Phòng": summary.totalSessions,
        },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summarySheetData);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Tổng Quan");

      const revenueSheetData = revenueData.map((item) => ({
        Ngày: item.date,
        "Tiền Giờ Hát (VNĐ)": item.roomFee,
        "Tiền Dịch Vụ (VNĐ)": item.serviceFee,
        "Tổng Thu Ngày (VNĐ)": item.roomFee + item.serviceFee,
      }));
      const wsRevenue = XLSX.utils.json_to_sheet(revenueSheetData);
      XLSX.utils.book_append_sheet(wb, wsRevenue, "Doanh Thu Theo Ngày");

      const productSheetData = productData.map((item, index) => ({
        Top: index + 1,
        "Tên Dịch Vụ": item.name,
        "Doanh Thu Mang Lại (VNĐ)": item.value,
      }));
      const wsProduct = XLSX.utils.json_to_sheet(productSheetData);
      XLSX.utils.book_append_sheet(wb, wsProduct, "Top Dịch Vụ Bán Chạy");

      XLSX.writeFile(wb, `Bao_Cao_Doanh_Thu_${new Date().getTime()}.xlsx`);
      toast.success("Đã xuất file Excel thành công!");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xuất Excel!");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground dark:bg-slate-800 dark:text-white dark:border-slate-700"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            disabled={loading}
          >
            <option className="dark:bg-slate-800 dark:text-white" value="today">
              Hôm nay
            </option>
            <option className="dark:bg-slate-800 dark:text-white" value="7days">
              7 ngày qua
            </option>
            <option
              className="dark:bg-slate-800 dark:text-white"
              value="thisMonth"
            >
              Tháng này
            </option>
            <option className="dark:bg-slate-800 dark:text-white" value="all">
              Toàn thời gian
            </option>
          </select>

          <Button
            variant="outline"
            className="border-input text-foreground"
            onClick={handleExportExcel}
          >
            <Download className="w-4 h-4 mr-2" /> Xuất Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : (
        <>
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
                <p className="text-xs mt-2 flex items-center gap-1 opacity-90">
                  Cập nhật theo thời gian thực
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tiền Dịch vụ (Menu)
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
                    ? Math.round(
                        (summary.serviceRevenue / summary.totalRevenue) * 100,
                      )
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
                    ? Math.round(
                        (summary.roomRevenue / summary.totalRevenue) * 100,
                      )
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
                  <CalendarDays className="w-3 h-3" /> Theo khoảng thời gian
                  chọn
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Biểu đồ Doanh thu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  {revenueData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Chưa có dữ liệu giao dịch trong khoảng thời gian này.
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
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                        />
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
        </>
      )}
    </div>
  );
}
