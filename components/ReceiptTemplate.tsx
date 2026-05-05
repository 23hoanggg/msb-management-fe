/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/ReceiptTemplate.tsx
import React, { forwardRef } from "react";

// Định nghĩa dữ liệu đầu vào cho Bill
interface ReceiptProps {
  session: any;
  durationMinutes: number;
  estimatedRoomFee: number;
  servedItems: any[];
  dbSubTotal: number;
  dbDiscountAmount: number;
  dbFinalAmount: number;
}

// 🟢 LÝ THUYẾT: forwardRef giúp thư viện react-to-print tóm được thẻ <div> này để mang đi in
const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptProps>(
  (
    {
      session,
      durationMinutes,
      estimatedRoomFee,
      servedItems,
      dbSubTotal,
      dbDiscountAmount,
      dbFinalAmount,
    },
    ref,
  ) => {
    if (!session) return null;

    return (
      // Khối này bị ẩn trên màn hình thường nhờ class 'hidden', nhưng thư viện in vẫn đọc được
      <div className="hidden">
        <div
          ref={ref}
          className="text-black bg-white p-2 leading-tight font-mono text-sm w-[80mm]"
          style={{ width: "80mm", margin: "0 auto" }}
        >
          {/* Header Quán */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold uppercase mb-1">MUSIC BOX</h1>
            <p className="text-[10px]">Hàm Nghi, Mỹ Đình, Nam Từ Liêm, HN</p>
            <p className="text-[10px] font-bold mt-1">SĐT: 0123.456.789</p>
          </div>

          {/* Tiêu đề & Thông tin bill */}
          <div className="border-b border-dashed border-black mb-3 pb-3">
            <h2 className="text-center text-lg font-bold mb-1">
              HÓA ĐƠN THANH TOÁN
            </h2>
            <p className="text-center text-[10px] mb-4">
              (In lúc: {new Date().toLocaleString("vi-VN")})
            </p>

            <div className="text-xs space-y-1.5">
              <div className="flex justify-between">
                <span>Số phiếu:</span>
                <span>#{session.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>Phòng:</span>
                <span className="font-bold">{session.room.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Giờ vào:</span>
                <span>
                  {new Date(session.startTime).toLocaleString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Giờ ra:</span>
                <span>
                  {session.endTime
                    ? new Date(session.endTime).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      })
                    : "Chưa checkout"}
                </span>
              </div>
            </div>
          </div>

          {/* Bảng sản phẩm */}
          <table className="w-full text-xs mb-4">
            <thead>
              <tr className="border-b border-dashed border-black">
                <th className="text-left py-2 font-bold w-[45%]">Tên món</th>
                <th className="text-center py-2 font-bold w-[15%]">SL</th>
                <th className="text-right py-2 font-bold w-[40%]">T.Tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1.5">Giờ hát ({durationMinutes}p)</td>
                <td className="text-center py-1.5">-</td>
                <td className="text-right py-1.5">
                  {estimatedRoomFee.toLocaleString()}
                </td>
              </tr>
              {servedItems.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-1.5 pr-1 break-words">
                    {item.product.name}
                  </td>
                  <td className="text-center py-1.5">{item.quantity}</td>
                  <td className="text-right py-1.5">
                    {(item.quantity * item.priceAtTime).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tổng tiền */}
          <div className="border-t border-black pt-3 text-xs space-y-2">
            <div className="flex justify-between">
              <span>Tổng tiền hàng:</span>
              <span>{dbSubTotal.toLocaleString()}đ</span>
            </div>

            {dbDiscountAmount > 0 && (
              <div className="flex justify-between">
                <span>Giảm giá:</span>
                <span>- {dbDiscountAmount.toLocaleString()}đ</span>
              </div>
            )}

            <div className="flex justify-between text-[16px] font-bold mt-2 pt-2 border-t border-dashed border-black">
              <span>THỰC THU:</span>
              <span>{dbFinalAmount.toLocaleString()}đ</span>
            </div>
          </div>

          {/* Footer Lời chào */}
          <div className="text-center mt-6 mb-2 text-xs">
            <p className="italic mb-1">Cảm ơn quý khách!</p>
            <p className="italic">Xin hẹn gặp lại</p>
            <p className="mt-4 text-[9px] text-gray-500 font-sans">
              Powered by Music Box POS
            </p>
          </div>
        </div>
      </div>
    );
  },
);

ReceiptTemplate.displayName = "ReceiptTemplate"; // Chuẩn của React cho forwardRef
export default ReceiptTemplate;
