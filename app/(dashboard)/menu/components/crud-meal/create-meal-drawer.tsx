"use client"

import React from "react"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ImagePlus, Loader2, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreateDish, useUpdateDish, useUploadDishImage } from "@/features/dish/hook"
import { Dish, DishPayload } from "@/features/dish/type"
import { useGetAllCategories } from "@/features/categories/hook"
import { Category } from "@/features/categories/type"

const formSchema = z.object({
  name: z.string().trim().min(2, "Tên món tối thiểu 2 ký tự."),
  sku: z.string().trim().max(50, "SKU tối đa 50 ký tự.").optional(),
  description: z.string().trim().max(500, "Mô tả tối đa 500 ký tự.").optional(),
  price: z.coerce.number().min(0, "Giá bán phải >= 0."),
  vipPrice: z.coerce.number().min(0, "Giá VIP phải >= 0."),
  costPrice: z.coerce.number().min(0, "Giá vốn phải >= 0."),
  rating: z.coerce.number().min(0, "Rating phải >= 0").max(5, "Rating tối đa 5."),
  sold: z.coerce.number().int().min(0, "Số lượng bán phải >= 0."),
  sortOrder: z.coerce.number().int().min(0, "Thứ tự phải >= 0."),
  categoryDocumentId: z.string().optional(),
  isActive: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

type Props = {
  mode?: "create" | "edit"
  dish?: Dish
  onSaved?: () => Promise<void> | void
  trigger?: React.ReactNode
}

const slugify = (value: string) =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

const resolveStrapiImageUrl = (url?: string) => {
  if (!url) return null
  if (url.startsWith("http://") || url.startsWith("https://")) return url

  const baseUrl = (process.env.NEXT_PUBLIC_STRAPI_URL || "").replace(/\/$/, "")
  if (!baseUrl) return url
  return `${baseUrl}${url}`
}

const extractUploadedImageId = (payload: unknown): number | undefined => {
  if (Array.isArray(payload)) {
    return typeof payload[0]?.id === "number" ? payload[0].id : undefined
  }

  if (payload && typeof payload === "object") {
    const maybePayload = payload as { data?: Array<{ id?: number }> }
    return typeof maybePayload.data?.[0]?.id === "number" ? maybePayload.data?.[0]?.id : undefined
  }

  return undefined
}

const buildDefaultValues = (dish?: Dish): FormValues => ({
  name: dish?.name ?? "",
  sku: dish?.sku ?? "",
  description: dish?.description ?? "",
  price: dish?.price ?? 0,
  vipPrice: dish?.vipPrice ?? 0,
  costPrice: dish?.costPrice ?? 0,
  rating: dish?.rating ?? 0,
  sold: dish?.sold ?? 0,
  sortOrder: dish?.sortOrder ?? 0,
  categoryDocumentId: dish?.category?.documentId ?? undefined,
  isActive: dish?.isActive ?? true,
})

const CreateMealDrawer = ({ mode = "create", dish, onSaved, trigger }: Props) => {
  const [open, setOpen] = React.useState(false)
  const isEditMode = mode === "edit"

  const { mutateAsync: createDish, isLoading: isCreating } = useCreateDish()
  const { mutateAsync: updateDish, isLoading: isUpdating } = useUpdateDish()
  const { mutateAsync: uploadDishImage, isLoading: isUploadingImage } = useUploadDishImage()
  const { data: categoriesResponse } = useGetAllCategories()

  const categories: Category[] = Array.isArray(categoriesResponse?.data)
    ? categoriesResponse.data.filter((category: Category) => Boolean(category.documentId))
    : []

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: buildDefaultValues(dish),
  })

  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [removeImage, setRemoveImage] = React.useState(false)
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(resolveStrapiImageUrl(dish?.image?.url))
  const objectUrlRef = React.useRef<string | null>(null)

  const resetImageStates = React.useCallback((sourceDish?: Dish) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }

    setImageFile(null)
    setRemoveImage(false)
    setImagePreviewUrl(resolveStrapiImageUrl(sourceDish?.image?.url))
  }, [])

  React.useEffect(() => {
    if (!open) {
      form.reset(buildDefaultValues(dish))
      resetImageStates(dish)
    }
  }, [dish, form, open, resetImageStates])

  React.useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  const isSubmitting = isCreating || isUpdating || isUploadingImage

  const handleSelectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh hợp lệ.")
      return
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
    }

    const nextPreviewUrl = URL.createObjectURL(selectedFile)
    objectUrlRef.current = nextPreviewUrl

    setImageFile(selectedFile)
    setRemoveImage(false)
    setImagePreviewUrl(nextPreviewUrl)
  }

  const handleRemoveImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }

    setImageFile(null)
    setImagePreviewUrl(null)
    setRemoveImage(true)
  }

  const onSubmit = async (values: FormValues) => {
    try {
      let imageValue: number | null | undefined = undefined

      if (imageFile) {
        const uploadResult = await uploadDishImage(imageFile)
        const uploadedImageId = extractUploadedImageId(uploadResult)

        if (!uploadedImageId) {
          throw new Error("Upload ảnh thất bại, không lấy được image id.")
        }

        imageValue = uploadedImageId
      } else if (removeImage) {
        imageValue = null
      }

      const payload: DishPayload = {
        name: values.name,
        slug: slugify(values.name),
        sku: values.sku || undefined,
        description: values.description || undefined,
        price: values.price,
        vipPrice: values.vipPrice,
        costPrice: values.costPrice,
        rating: values.rating,
        sold: values.sold,
        sortOrder: values.sortOrder,
        isActive: values.isActive,
        category: values.categoryDocumentId || undefined,
        ...(imageValue !== undefined ? { image: imageValue } : {}),
      }

      if (isEditMode) {
        if (!dish?.documentId) {
          throw new Error("Không tìm thấy mã món ăn để cập nhật.")
        }
        await updateDish({
          documentId: dish.documentId,
          payload,
        })
        toast.success("Cập nhật món ăn thành công.")
      } else {
        await createDish(payload)
        toast.success("Tạo món ăn thành công.")
      }

      setOpen(false)
      if (!isEditMode) {
        form.reset(buildDefaultValues())
      }
      resetImageStates()
      await onSaved?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lưu món ăn thất bại."
      toast.error(message)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>
        {trigger ?? (
          <Button className="h-11 rounded-2xl bg-primary px-5 text-primary-foreground shadow-[0_10px_18px_rgba(194,123,55,0.28)] transition hover:opacity-95">
            <Plus className="mr-2 h-4 w-4" />
            Thêm món
          </Button>
        )}
      </DrawerTrigger>

      <DrawerContent className="w-full">
        <DrawerHeader>
          <DrawerTitle>{isEditMode ? "Cập nhật món ăn" : "Thêm món ăn"}</DrawerTitle>
          <DrawerDescription>
            {isEditMode
              ? "Chỉnh sửa thông tin món ăn và lưu lại."
              : "Tạo món ăn mới để hiển thị trên thực đơn."}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên món</FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: Cơm gà xối mỡ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryDocumentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Danh mục</FormLabel>
                    <Select
                      value={field.value ?? "__none__"}
                      onValueChange={(value) => field.onChange(value === "__none__" ? undefined : value)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Không chọn danh mục</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.documentId} value={category.documentId ?? ""}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-xl border p-3">
                <p className="mb-2 text-sm font-medium">Ảnh món ăn</p>
                {imagePreviewUrl ? (
                  <div className="mb-3 relative h-36 w-full overflow-hidden rounded-lg border bg-[#f8f8f8]">
                    <Image
                      src={imagePreviewUrl}
                      alt={form.watch("name") || "Preview món ăn"}
                      fill
                      sizes="(max-width: 768px) 100vw, 420px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="mb-3 flex h-36 w-full items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                    Chưa có ảnh món ăn
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center rounded-full border bg-white px-3 py-2 text-sm font-medium hover:bg-[#fff8ef]">
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Chọn ảnh
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleSelectImage}
                    />
                  </label>

                  {imagePreviewUrl ? (
                    <Button type="button" variant="outline" onClick={handleRemoveImage}>
                      <X className="mr-2 h-4 w-4" />
                      Gỡ ảnh
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá bán</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vipPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá VIP</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá vốn</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="Mã món (không bắt buộc)" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Input placeholder="Mô tả ngắn" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-2">
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" min={0} max={5} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Đã bán</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
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
                      <FormLabel>Thứ tự</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 rounded-xl border p-3">
                    <FormControl>
                      <Checkbox
                        className="size-5 border-[#d2b394] data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white"
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    </FormControl>
                    <FormLabel className="mb-0 cursor-pointer">Kích hoạt món ăn</FormLabel>
                  </FormItem>
                )}
              />

              <DrawerFooter className="px-0 pb-0">
                <Button type="submit" className="bg-secondary hover:bg-secondary/90" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu
                    </>
                  ) : isEditMode ? (
                    "Lưu thay đổi"
                  ) : (
                    "Tạo món ăn"
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

export default CreateMealDrawer
