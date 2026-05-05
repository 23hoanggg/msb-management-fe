/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import api from "@/lib/api";
import { toast } from "sonner";

export const useReports = () => {
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

  // HÀM TÍNH TOÁN NGÀY THÁNG
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
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  };

  // GỌI API
  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange(timeRange);
      let url = "/reports/revenue";
      if (dateRange)
        url += `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [timeRange]);

  // XUẤT EXCEL
  const handleExportExcel = () => {
    if (revenueData.length === 0 && productData.length === 0) {
      return toast.error("Không có dữ liệu để xuất Excel!");
    }

    try {
      const wb = XLSX.utils.book_new();

      const timeLabel =
        timeRange === "today"
          ? "Hôm nay"
          : timeRange === "7days"
            ? "7 ngày qua"
            : timeRange === "thisMonth"
              ? "Tháng này"
              : "Toàn thời gian";
      const summarySheetData = [
        {
          "Khoảng thời gian": timeLabel,
          "Tổng Doanh Thu (VNĐ)": summary.totalRevenue,
          "Tiền Giờ Hát (VNĐ)": summary.roomRevenue,
          "Tiền Dịch Vụ (VNĐ)": summary.serviceRevenue,
          "Tổng Lượt Mở Phòng": summary.totalSessions,
        },
      ];
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(summarySheetData),
        "Tổng Quan",
      );

      const revenueSheetData = revenueData.map((item) => ({
        Ngày: item.date,
        "Tiền Giờ Hát (VNĐ)": item.roomFee,
        "Tiền Dịch Vụ (VNĐ)": item.serviceFee,
        "Tổng Thu Ngày (VNĐ)": item.roomFee + item.serviceFee,
      }));
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(revenueSheetData),
        "Doanh Thu Theo Ngày",
      );

      const productSheetData = productData.map((item, index) => ({
        Top: index + 1,
        "Tên Dịch Vụ": item.name,
        "Doanh Thu Mang Lại (VNĐ)": item.value,
      }));
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(productSheetData),
        "Top Dịch Vụ Bán Chạy",
      );

      XLSX.writeFile(wb, `Bao_Cao_Doanh_Thu_${new Date().getTime()}.xlsx`);
      toast.success("Đã xuất file Excel thành công!");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xuất Excel!");
    }
  };

  return {
    states: { timeRange, loading, revenueData, productData, summary },
    setters: { setTimeRange },
    actions: { handleExportExcel },
  };
};
