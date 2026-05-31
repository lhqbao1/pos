"use client"

import React from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useUpdateTable } from "@/features/tables/hook"
import { Table } from "@/features/tables/type"

const tableTypeOptions = ["Normal", "Vip"] as const
const tableStatusOptions = ["Empty", "Using", "Reserved", "Cleaning", "Disabled"] as const

const formSchema = z.object({
  tableNumber: z.string().trim().min(1, "Số bàn là bắt buộc."),
  displayName: z.string().trim().max(80, "Tên hiển thị tối đa 80 ký tự.").optional(),
  type: z.enum(tableTypeOptions),
  table_status: z.enum(tableStatusOptions),
  capacity: z.coerce.number().int().min(1, "Sức chứa tối thiểu là 1."),
  zone: z.string().trim().max(80, "Khu vực tối đa 80 ký tự.").optional(),
  note: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự.").optional(),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

const mapTableToFormValues = (table: Table | null): FormValues => ({
  tableNumber: table?.tableNumber ?? "",
  displayName: table?.displayName ?? "",
  type: table?.type ?? "Normal",
  table_status: table?.table_status ?? "Empty",
  capacity: table?.capacity ?? 4,
  zone: table?.zone ?? "",
  note: table?.note ?? "",
  is_active: table?.is_active ?? true,
})

type Props = {
  table: Table | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: (updatedTable: Table) => void
}

const EditTableDrawer = ({ table, open, onOpenChange, onUpdated }: Props) => {
  const { mutateAsync: updateTable, isLoading } = useUpdateTable()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: mapTableToFormValues(table),
  })

  React.useEffect(() => {
    if (!open) return
    form.reset(mapTableToFormValues(table))
  }, [open, table, form])

  const onSubmit = async (values: FormValues) => {
    if (!table?.documentId) {
      toast.error("Không tìm thấy mã bàn để cập nhật.")
      return
    }

    const nextStatus = values.table_status
    const occupiedSince =
      nextStatus === "Using"
        ? table.occupied_since ?? new Date().toISOString()
        : null
    const lastClearedAt =
      nextStatus === "Empty"
        ? new Date().toISOString()
        : nextStatus === "Using"
          ? null
          : table.last_cleared_at ?? null

    try {
      const response = await updateTable({
        documentId: table.documentId,
        payload: {
          tableNumber: values.tableNumber.trim(),
          displayName: values.displayName?.trim() || undefined,
          type: values.type,
          table_status: nextStatus,
          capacity: values.capacity,
          zone: values.zone?.trim() || undefined,
          note: values.note?.trim() || undefined,
          is_active: values.is_active,
          occupied_since: occupiedSince,
          last_cleared_at: lastClearedAt,
        },
      })

      toast.success("Cập nhật bàn thành công.")
      onOpenChange(false)

      const updatedTable = response?.data as Table | undefined
      if (updatedTable) {
        onUpdated?.(updatedTable)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cập nhật bàn thất bại."
      toast.error(message)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="w-full">
        <DrawerHeader>
          <DrawerTitle>Cập nhật bàn</DrawerTitle>
          <DrawerDescription>
            Chỉnh sửa thông tin bàn đang chọn để áp dụng ngay trong màn hình thu ngân.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="tableNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số bàn</FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: A1, B2, VIP-01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên hiển thị</FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: Bàn sân vườn 1" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loại bàn</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn loại bàn" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tableTypeOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="table_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trạng thái</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tableStatusOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sức chứa</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Khu vực</FormLabel>
                      <FormControl>
                        <Input placeholder="Ví dụ: Tầng 1" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ghi chú</FormLabel>
                    <FormControl>
                      <Input placeholder="Ghi chú thêm (không bắt buộc)" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 rounded-xl border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    </FormControl>
                    <FormLabel className="mb-0 cursor-pointer">Kích hoạt bàn</FormLabel>
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
  )
}

export default EditTableDrawer
