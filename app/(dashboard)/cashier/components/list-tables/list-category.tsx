"use client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAllCategories } from "@/features/categories/hook";
import { useGetDishesByCategory } from "@/features/dish/hook";
import React, { useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { Category } from "@/features/categories/type";
import { Dish } from "@/features/dish/type";
import {
  AlertCircle,
  ArrowLeft,
  RefreshCcw,
  UtensilsCrossed,
} from "lucide-react";
import { formattedNumber } from "@/lib/format-vnd";
import { useAtom } from "jotai";
import { tableNumberAtom } from "@/lib/atom/table/tables";
import {
  useGetTableByTableNumber,
  useUpdateTableStatus,
} from "@/features/tables/hook";
import { useCreateOrder, useGetOrderByTable } from "@/features/order/hook";
import { toast } from "sonner";
import {
  useCreateOrderItem,
  useGetOrderItemsWithTable,
  useUpdateOrderItemQuantity,
} from "@/features/order-items/hook";
import { OrderItem } from "@/features/order-items/type";
import { isOrderClosed } from "@/features/order/status";
import { STRAPI_BASE_URL } from "@/lib/strapi-client";

const ListCategory = () => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const tableSessionStartRef = useRef<Record<string, string>>({});

  const [currentTable] = useAtom(tableNumberAtom);

  // Fetch categories
  const {
    data,
    isInitialLoading,
    isFetching: isCategoriesFetching,
    isError,
    refetch: refetchCategories,
  } = useGetAllCategories();

  // Fetch dishes by selected category
  const {
    data: dishesData,
    isInitialLoading: isDishesInitialLoading,
    isFetching: isDishesFetching,
    isError: dishesError,
    refetch: refetchDishes,
  } = useGetDishesByCategory(selectedCategory);

  // Fetch current table data
  const { data: currentTableData } = useGetTableByTableNumber(currentTable);
  const currentTableRecord = currentTableData?.data?.[0];

  // Fetch order by table document id
  const { data: orderByTableData } = useGetOrderByTable(
    currentTableRecord?.documentId,
  );
  const orderByTableItems = orderByTableData?.data ?? [];

  // Fetch order items by table number
  const { data: orderItemsByTableData } =
    useGetOrderItemsWithTable(currentTable);
  const orderItemsByTable = orderItemsByTableData?.data ?? [];

  //Activate create order mutation
  const { mutate: createOrder } = useCreateOrder();

  // Activate update table status mutation
  const { mutate: updateTableStatus } = useUpdateTableStatus();

  // Activate create order item
  const { mutate: createOrderItem } = useCreateOrderItem();

  // Activate update order item quantity
  const { mutate: updateOrderItemQuantity } = useUpdateOrderItemQuantity();

  const categorySkeleton = (
    <div className="grid grid-cols-6 justify-between gap-5">
      {Array.from({ length: 12 }).map((_, index) => (
        <Card key={index} className="pb-0 gap-2 pt-3">
          <CardHeader className="py-0 text-center">
            <Skeleton className="h-4 w-20 mx-auto" />
          </CardHeader>
          <CardContent className="p-0">
            <Skeleton className="w-full h-[150px] rounded-bl-xl rounded-br-xl" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const dishSkeleton = (
    <div className="pt-2">
      <Skeleton className="h-10 w-10 rounded-md" />
      <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 16 }).map((_, index) => (
          <Card
            key={index}
            className="w-full max-w-[220px] overflow-hidden rounded-2xl border border-[#eadfce] bg-white py-0 shadow-sm"
          >
            <CardContent className="p-3">
              <Skeleton className="aspect-square w-full rounded-xl" />
            </CardContent>
            <CardHeader className="px-3 pt-0 pb-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="mt-2 h-4 w-20" />
            </CardHeader>
            <CardFooter className="px-3 pb-4 pt-0">
              <Skeleton className="h-4 w-16" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );

  if (
    (isInitialLoading && !data) ||
    (isCategoriesFetching && !selectedCategory)
  )
    return categorySkeleton;
  if (isError) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-red-500 font-medium">
          Không tải được danh mục.
        </p>
        <Button
          onClick={() => refetchCategories()}
          className="bg-secondary text-white hover:bg-secondary/90 hover:text-white"
        >
          Tải lại danh mục
        </Button>
      </div>
    );
  }

  const handleClickCategoryCard = (categoryName: string) => {
    setSelectedCategory(categoryName);
  };

  const getOrderItemDocumentId = (item: OrderItem) =>
    item.documentId ?? (typeof item.id === "number" ? String(item.id) : "");

  const ChooseMeal = (dish: Dish) => {
    if (!currentTable) {
      toast.error("Vui lòng chọn bàn trước khi chọn món ăn");
      return;
    }

    if (!currentTableRecord?.documentId) {
      toast.error("Không tìm thấy thông tin bàn hiện tại");
      return;
    }

    //Get current order by table
    const currentOrderIndex = orderByTableItems.length - 1;
    const currentOrder =
      currentOrderIndex >= 0 ? orderByTableItems[currentOrderIndex] : undefined;

    //Check if table is empty or not, if yes change the status to Using
    if (currentTableRecord.table_status === "Empty") {
      const sessionStartedAt =
        currentTableRecord.occupied_since ??
        tableSessionStartRef.current[currentTableRecord.documentId] ??
        new Date().toISOString();

      tableSessionStartRef.current[currentTableRecord.documentId] = sessionStartedAt;

      updateTableStatus({
        table_id: currentTableRecord.documentId,
        table_status: "Using",
        occupied_since: sessionStartedAt,
        last_cleared_at: null,
      });
    }

    //Check if order already exists for this table
    if (!currentOrder || isOrderClosed(currentOrder.order_status)) {
      createOrder(
        {
          table_id: currentTableRecord.documentId,
          order_status: "active",
          is_paid: false,
        },
        {
          onSuccess: (order) => {
            const tableName = currentTableRecord.tableNumber;
            // Create order item after creating order
            createOrderItem({
              dish_id: dish.documentId ?? "",
              order_id: order.data.documentId,
              quantity: 1,
              price_at_order: tableName.includes("vip")
                ? (dish.price ?? 0)
                : (dish.vipPrice ?? 0), // Ensure price is a number, fallback to 0 if undefined
            });
            toast.success("Gọi món thành công", {
              // 👈 Change the color here
              description: (
                <span className="text-green-500 !text-xs">
                  Bạn đã đặt món thành công
                </span>
              ),
              icon: <AlertCircle className="text-green-500 size-5 stroke-2" />, // 👈 Your custom icon with custom color
              className:
                "!bg-green-100 !text-green-500 !font-bold !text-[15px]", // 👈 Customize the background and text color here!
            });
          },
        },
      );

      // If order exists and is not paid, create order item
    }
    // Check if order exists and is active
    else if (currentOrder.order_status === "active") {
      let isDishExists = false;
      let currentOrderItem = {} as OrderItem;

      for (let i = 0; i < orderItemsByTable.length; i++) {
        const dishId =
          typeof orderItemsByTable[i].dish_id === "string"
            ? orderItemsByTable[i].dish_id
            : orderItemsByTable[i].dish_id?.documentId;

        if (dishId === dish.documentId) {
          isDishExists = true;
          currentOrderItem = orderItemsByTable[i];
          break;
        }
      }
      if (isDishExists === true) {
        const orderItemId = getOrderItemDocumentId(currentOrderItem);

        if (!orderItemId) {
          toast.error("Không tìm thấy mã món trong đơn để cập nhật số lượng");
          return;
        }

        updateOrderItemQuantity({
          id: orderItemId,
          quantity: currentOrderItem?.quantity + 1, // Increase quantity by 1
        });
        toast.success("Cập nhật món thành công", {
          // 👈 Change the color here
          description: (
            <span className="text-green-500 !text-xs">
              Bạn đã cập nhật món thành công
            </span>
          ),
          icon: <AlertCircle className="text-green-500 size-5 stroke-2" />, // 👈 Your custom icon with custom color
          className: "!bg-green-100 !text-green-500 !font-bold !text-[15px]", // 👈 Customize the background and text color here!
        });
      } else {
        createOrderItem(
          {
            dish_id: dish.documentId ?? "",
            order_id: currentOrder?.documentId,
            quantity: 1,
            price_at_order: currentTableRecord.tableNumber.includes("vip")
              ? (dish.price ?? 0)
              : (dish.vipPrice ?? 0), // Ensure price is a number, fallback to 0 if undefined
          },
          {
            onSuccess: () => {
              toast.success("Gọi món thành công", {
                // 👈 Change the color here
                description: (
                  <span className="text-green-500 !text-xs">
                    Bạn đã đặt món thành công
                  </span>
                ),
                icon: (
                  <AlertCircle className="text-green-500 size-5 stroke-2" />
                ), // 👈 Your custom icon with custom color
                className:
                  "!bg-green-100 !text-green-500 !font-bold !text-[15px]", // 👈 Customize the background and text color here!
              });
            },
          },
        );
      }
    }
    // If order exists and is cancelled, show error message
    else {
      toast.error("Đã xảy ra lỗi", {
        // 👈 Change the color here
        description: (
          <span className="text-red-500 !text-xs">Vui lòng thử lại sau</span>
        ),
        icon: <AlertCircle className="text-red-500 size-5 stroke-2" />, // 👈 Your custom icon with custom color
        className: "!bg-red-100 !text-red-500 !font-bold !text-[15px]", // 👈 Customize the background and text color here!
      });
    }

    //Create order item
  };

  if (selectedCategory) {
    if ((isDishesInitialLoading && !dishesData) || isDishesFetching)
      return dishSkeleton;

    if (dishesError) {
      return (
        <div className="pt-2 flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-fit border-[#e4d1ba] bg-white text-[#6f4b2a] hover:bg-[#fff5e9] hover:text-[#5d3e24]"
            onClick={() => setSelectedCategory("")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh mục
          </Button>
          <p className="text-sm text-red-500 font-medium">
            Không tải được danh sách món ăn.
          </p>
          <Button
            onClick={() => refetchDishes()}
            className="bg-secondary text-white hover:bg-secondary/90 hover:text-white w-fit"
          >
            Tải lại món ăn
          </Button>
        </div>
      );
    }

    if (!dishesData?.data?.length) {
      return (
        <div className="pt-2 space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-fit border-[#e4d1ba] bg-white text-[#6f4b2a] hover:bg-[#fff5e9] hover:text-[#5d3e24]"
            onClick={() => setSelectedCategory("")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh mục
          </Button>

          <div className="relative overflow-hidden rounded-3xl border border-[#e8dccc] bg-gradient-to-br from-[#fffaf3] via-[#fff3e4] to-[#fffdf8] p-6">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#ffd8af]/45 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-[#f3c78e]/35 blur-2xl" />

            <div className="relative z-10 flex flex-col items-center gap-5 lg:flex-row">
              <div className="relative h-32 w-32 overflow-hidden rounded-2xl border border-[#efd9bf] bg-white/80 shadow-sm">
                <Image
                  src="/category-food-placeholder.svg"
                  alt="Danh mục trống"
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>

              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#f0d9be] bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a06b38]">
                  <UtensilsCrossed className="h-3.5 w-3.5" />
                  Danh mục trống
                </div>
                <h3 className="mt-3 text-2xl font-bold text-[#4a2f18]">
                  Danh mục này chưa có món ăn
                </h3>
                <p className="mt-2 max-w-lg text-sm text-[#7b5b3e]">
                  Hãy thêm món mới hoặc thử chọn danh mục khác để tiếp tục tạo
                  đơn cho bàn.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                  <Button
                    type="button"
                    className="bg-primary text-primary-foreground hover:opacity-95"
                    onClick={() => setSelectedCategory("")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Chọn danh mục khác
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#e4d1ba] bg-white text-[#6f4b2a] hover:bg-[#fff5e9] hover:text-[#5d3e24]"
                    onClick={() => refetchDishes()}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Tải lại danh mục
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="pt-2">
        <Button
          type="button"
          variant="outline"
          className="border-[#e4d1ba] bg-white text-[#6f4b2a] hover:bg-[#fff5e9] hover:text-[#5d3e24]"
          onClick={() => setSelectedCategory("")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh mục
        </Button>
        <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {dishesData.data.map((dish: Dish, index: number) => {
            const imageUrl = dish?.image?.url
              ? dish.image.url.startsWith("http")
                ? dish.image.url
                : `${STRAPI_BASE_URL}${dish.image.url}`
              : "https://lh3.googleusercontent.com/gps-cs-s/AC9h4np2nCF2_67uvFaXBDH4da5xhtg5FUTqQzLXTk7Ugj2grs9pD0MxUBvct5WKi8tjuF8et82JOJYVb4qlwy_v2HOge4exFAmd4dI8ClzetLa3ltyYXATUHpnuocg3bZ44BhHSJ2hl=s1360-w1360-h1020-rw";

            return (
              <Card
                key={index}
                className="group w-full max-w-[220px] cursor-pointer overflow-hidden rounded-2xl border border-[#eadfce] bg-white py-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                onClick={() => ChooseMeal(dish)}
              >
                <CardContent className="p-3">
                  <Image
                    src={imageUrl}
                    width={320}
                    height={320}
                    alt={dish.name}
                    className="aspect-square w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </CardContent>
                <CardHeader className="px-3 pt-0">
                  <CardTitle className="line-clamp-1 text-base text-[#3f2b16]">
                    {dish.name}
                  </CardTitle>
                  <p className="line-clamp-1 text-xs text-[#8b6a49]">
                    {dish.category?.name ?? "Món ăn"}
                  </p>
                </CardHeader>
                <CardFooter className="px-3 pb-4 pt-0">
                  <p className="text-lg font-bold text-secondary">
                    {formattedNumber(dish?.price ?? 0)} VND
                  </p>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {data.data.map((item: Category, index: number) => {
        return (
          <Card
            key={index}
            onClick={() => handleClickCategoryCard(item.name)}
            className={`cursor-pointer pb-0 gap-2 pt-3 hover:scale-105 transition-transform duration-400 hover:shadow-lg`}
          >
            <CardHeader className="py-0 text-center uppercase font-semibold">
              {item.name}
            </CardHeader>
            <CardContent className="p-0">
              <Image
                src={
                  item?.image?.url
                    ? item.image.url.startsWith("http")
                      ? item.image.url
                      : `${STRAPI_BASE_URL}${item.image.url}`
                    : "/category-food-placeholder.svg"
                }
                width={200}
                height={200}
                alt={item.name}
                className="w-full h-[150px] rounded-bl-xl rounded-br-xl object-cover"
              />
            </CardContent>
          </Card>
        );
      })}
      {/* Show dishes */}
    </div>
  );
};

export default ListCategory;
