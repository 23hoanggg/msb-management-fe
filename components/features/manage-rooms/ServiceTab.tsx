/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coffee, Minus, Plus, CheckCheck } from "lucide-react";

interface ServiceTabProps {
  products: any[];
  pendingItems: any[];
  servedItems: any[];
  totalServiceFee: number;
  onAddOrder: (productId: string, qty?: number) => void;
  onReduceOrder: (productId: string, qty?: number) => void;
  onCustomQuantity: (item: any) => void;
  onServeAll: () => void;
}

export default function ServiceTab({
  products,
  pendingItems,
  servedItems,
  totalServiceFee,
  onAddOrder,
  onReduceOrder,
  onCustomQuantity,
  onServeAll,
}: ServiceTabProps) {
  return (
    <div className="grid grid-cols-12 gap-6 w-full h-full min-h-0">
      {/* CỘT TRÁI: THEO DÕI PHỤC VỤ */}
      <Card className="col-span-12 lg:col-span-5 flex flex-col min-h-0 border-2 border-primary/20 bg-muted/20">
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="flex items-center gap-2 mb-4">
            <Coffee className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-lg text-foreground">
              Theo dõi phục vụ
            </h3>
          </div>

          <div className="space-y-6">
            {/* DANH SÁCH CHỜ */}
            {pendingItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-red-500"></span>
                  <h4 className="text-sm font-bold text-red-600 uppercase tracking-wider">
                    Lượt gọi đang chờ
                  </h4>
                </div>
                <div className="space-y-2">
                  {pendingItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3 rounded-lg border bg-card border-red-200 shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                      <div className="flex-1 pl-2">
                        <p className="font-bold text-foreground">
                          {item.product.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.priceAtTime.toLocaleString()}đ
                        </p>
                      </div>
                      <div className="flex items-center gap-1 mx-2 bg-muted rounded-md p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded text-muted-foreground hover:text-red-500"
                          onClick={() => onReduceOrder(item.product.id, 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span
                          className="font-bold text-base w-6 text-center cursor-pointer text-foreground"
                          onClick={() => onCustomQuantity(item)}
                        >
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded text-muted-foreground hover:text-green-600"
                          onClick={() => onAddOrder(item.product.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={onServeAll}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-11 shadow-md shrink-0"
                >
                  <CheckCheck className="w-5 h-5 mr-2" /> Xác nhận đã mang đồ
                </Button>
              </div>
            )}

            {/* DANH SÁCH ĐÃ PHỤC VỤ */}
            {servedItems.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                  <h4 className="text-sm font-bold text-green-700 dark:text-green-500 uppercase tracking-wider">
                    Đã phục vụ xong
                  </h4>
                </div>
                <div className="space-y-2">
                  {servedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-2 rounded-lg border bg-muted/50 border-border"
                    >
                      <div className="flex-1 pl-1">
                        <p className="font-medium text-foreground">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.priceAtTime.toLocaleString()}đ
                        </p>
                      </div>
                      <div className="flex items-center gap-1 mx-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={() => onReduceOrder(item.product.id, 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span
                          className="font-semibold text-sm w-6 text-center cursor-pointer text-foreground"
                          onClick={() => onCustomQuantity(item)}
                        >
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={() => onAddOrder(item.product.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="bg-card border-t p-4 flex justify-between font-bold shrink-0 rounded-b-xl">
          <span className="text-foreground">Tiền dịch vụ (Tạm tính):</span>
          <span className="text-primary">
            {totalServiceFee.toLocaleString()}đ
          </span>
        </div>
      </Card>

      {/* CỘT PHẢI: THỰC ĐƠN */}
      <Card className="col-span-12 lg:col-span-7 flex flex-col min-h-0 border-none shadow-md">
        <div className="pb-4 border-b bg-card rounded-t-xl shrink-0 p-6">
          <h3 className="text-xl font-semibold leading-none tracking-tight text-foreground">
            Thực đơn
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-muted/20 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {products.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer bg-card hover:border-primary shadow-sm hover:shadow-md border border-transparent transition-all overflow-hidden"
                onClick={() => onAddOrder(product.id, 1)}
              >
                <CardContent className="p-4 text-center space-y-3">
                  <div className="relative h-24 bg-muted/50 rounded-xl flex items-center justify-center overflow-hidden shadow-inner w-full">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-4xl">
                        {product.name.toLowerCase().includes("bia")
                          ? "🍺"
                          : product.name.toLowerCase().includes("nước")
                            ? "🥤"
                            : "🍉"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p
                      className="font-bold text-foreground line-clamp-1"
                      title={product.name}
                    >
                      {product.name}
                    </p>
                    <p className="text-sm text-primary font-bold">
                      {product.price.toLocaleString()}đ
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
