"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUpdateCategory } from "@/features/categories/hook";
import { Category } from "@/features/categories/type";

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tên danh mục tối thiểu 2 ký tự.")
    .max(80, "Tên danh mục tối đa 80 ký tự."),
  description: z.string().trim().max(250, "Mô tả tối đa 250 ký tự.").optional(),
  sortOrder: z.coerce.number().int().min(0, "Thứ tự phải >= 0."),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const slugify = (value: string) =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const mapCategoryToFormValues = (category: Category): FormValues => ({
  name: category.name ?? "",
  description: category.description ?? "",
  sortOrder: category.sortOrder ?? 0,
  isActive: category.isActive ?? true,
});

type Props = {
  category: Category;
  trigger: React.ReactNode;
  onUpdated?: () => Promise<void> | void;
};

const EditCategoryDrawer = ({ category, trigger, onUpdated }: Props) => {
  const [open, setOpen] = React.useState(false);
  const { mutateAsync: updateCategory, isLoading } = useUpdateCategory();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: mapCategoryToFormValues(category),
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset(mapCategoryToFormValues(category));
  }, [category, form, open]);

  const onSubmit = async (values: FormValues) => {
    if (!category.documentId) {
      toast.error("Không tìm thấy mã danh mục để cập nhật.");
      return;
    }

    try {
      await updateCategory({
        documentId: category.documentId,
        payload: {
          name: values.name,
          slug: slugify(values.name),
          description: values.description || undefined,
          sortOrder: values.sortOrder,
          isActive: values.isActive,
        },
      });

      toast.success("Cập nhật danh mục thành công.");
      setOpen(false);
      await onUpdated?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Cập nhật danh mục thất bại.";
      toast.error(message);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>

      <DrawerContent className="w-full sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>Cập nhật danh mục</DrawerTitle>
          <DrawerDescription>
            Chỉnh sửa thông tin danh mục và áp dụng ngay cho bộ lọc/menu.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên danh mục</FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: Món chính" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Mô tả ngắn (không bắt buộc)"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thứ tự hiển thị</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 rounded-xl border p-3">
                    <FormControl>
                      <Checkbox
                        className="size-5 border-[#d2b394] data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white"
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                      />
                    </FormControl>
                    <FormLabel className="mb-0 cursor-pointer">
                      Kích hoạt danh mục
                    </FormLabel>
                    {field.value && (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Đã bật
                      </span>
                    )}
                  </FormItem>
                )}
              />

              <DrawerFooter className="px-0 pb-0">
                <Button
                  type="submit"
                  className="bg-secondary text-white hover:bg-secondary/90 hover:text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang cập nhật
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </Button>
                <DrawerClose asChild>
                  <Button type="button" variant="outline" disabled={isLoading}>
                    Hủy
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </form>
          </Form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default EditCategoryDrawer;
