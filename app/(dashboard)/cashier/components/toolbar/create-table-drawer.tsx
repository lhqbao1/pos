"use client"

import React from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useCreateTable } from "@/features/tables/hook"

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

const defaultValues: FormValues = {
  tableNumber: "",
  displayName: "",
  type: "Normal",
  table_status: "Empty",
  capacity: 4,
  zone: "",
  note: "",
  is_active: true,
}

type Props = {
  onCreated?: () => Promise<void> | void
  trigger?: React.ReactNode
}

const CreateTableDrawer = ({ onCreated, trigger }: Props) => {
  const [open, setOpen] = React.useState(false)
  const { mutateAsync: createTable, isLoading } = useCreateTable()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await createTable({
        tableNumber: values.tableNumber.trim(),
        displayName: values.displayName?.trim() || undefined,
        type: values.type,
        table_status: values.table_status,
        occupied_since: values.table_status === "Using" ? new Date().toISOString() : null,
        last_cleared_at: values.table_status === "Empty" ? new Date().toISOString() : null,
        capacity: values.capacity,
        zone: values.zone?.trim() || undefined,
        note: values.note?.trim() || undefined,
        is_active: values.is_active,
      })

      toast.success("Tạo bàn thành công.")
      form.reset(defaultValues)
      setOpen(false)
      await onCreated?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tạo bàn thất bại."
      toast.error(message)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            className="h-11 rounded-2xl border-[#e4d1ba] bg-white text-[#6f4b2a] shadow-sm hover:bg-[#fff5e9] hover:text-[#5d3e24]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo bàn
          </Button>
        )}
      </DrawerTrigger>

      <DrawerContent className="w-full">
        <DrawerHeader>
          <DrawerTitle>Tạo bàn mới</DrawerTitle>
          <DrawerDescription>Tạo bàn để sử dụng ngay trong màn hình thu ngân.</DrawerDescription>
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
                    <FormLabel className="mb-0 cursor-pointer">Kích hoạt bàn ngay</FormLabel>
                  </FormItem>
                )}
              />

              <DrawerFooter className="px-0 pb-0">
                <Button type="submit" className="bg-secondary text-white hover:bg-secondary/90 hover:text-white" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo
                    </>
                  ) : (
                    "Tạo bàn"
                  )}
                </Button>
                <DrawerClose asChild>
                  <Button type="button" variant="outline">
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

export default CreateTableDrawer
