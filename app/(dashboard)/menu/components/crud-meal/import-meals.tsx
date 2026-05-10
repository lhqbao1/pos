"use client";

import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ImportSummary = {
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  categoriesCreated: number;
  errors: Array<{ rowNumber: number; message: string }>;
};

type ImportResponse = {
  message: string;
  summary?: ImportSummary;
};

type Props = {
  onImported?: () => Promise<void> | void;
};

const ImportMeals = ({ onImported }: Props) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);
  const [summary, setSummary] = React.useState<ImportSummary | null>(null);

  const handleImport = async () => {
    if (!file || isImporting) return;

    setIsImporting(true);
    setSummary(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import/dishes", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as ImportResponse;

      if (!response.ok) {
        throw new Error(data.message || "Import thất bại.");
      }

      if (data.summary) {
        setSummary(data.summary);
      }

      await queryClient.invalidateQueries({ queryKey: ["dish"] });
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      await onImported?.();

      toast.success("Import món ăn thành công.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import thất bại.";
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-11 rounded-2xl border-[#e4d1ba] bg-white text-[#6f4b2a] shadow-sm hover:bg-[#fff5e9] hover:text-[#5d3e24]"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Import Excel/JSON
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import thực đơn từ file</DialogTitle>
          <DialogDescription>
            Hỗ trợ file <code>.xlsx</code>, <code>.xls</code>, <code>.json</code>. Dòng trống sẽ tự bỏ qua.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-dashed border-[#e2d0ba] bg-[#fffbf6] p-4">
            <p className="text-sm font-semibold text-[#6b4526]">Cột bắt buộc</p>
            <p className="mt-1 text-xs text-[#8a6545]">name, price</p>
            <p className="mt-2 text-sm font-semibold text-[#6b4526]">Cột khuyến nghị</p>
            <p className="mt-1 text-xs text-[#8a6545]">
              category, vipPrice, costPrice, sku, description, rating, sold, isActive, sortOrder
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium">
              <a
                href="/templates/dishes-import-example.xlsx"
                download
                className="text-[#9a5f2b] underline underline-offset-2"
              >
                Tải file mẫu Excel (.xlsx)
              </a>
              <a
                href="/templates/dishes-import-example.json"
                download
                className="text-[#9a5f2b] underline underline-offset-2"
              >
                Tải file mẫu JSON
              </a>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="import-menu-file" className="text-sm font-medium">
              Chọn file dữ liệu
            </label>
            <Input
              id="import-menu-file"
              type="file"
              accept=".xlsx,.xls,.json"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setFile(nextFile);
                setSummary(null);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Khi trùng <code>sku</code> hoặc tên món, hệ thống sẽ ưu tiên cập nhật thay vì tạo mới.
            </p>
          </div>

          {summary && (
            <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
              <p className="text-sm font-semibold">Kết quả import</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <p>Tổng dòng: {summary.totalRows}</p>
                <p>Tạo mới: {summary.created}</p>
                <p>Cập nhật: {summary.updated}</p>
                <p>Bỏ qua: {summary.skipped}</p>
                <p>Category mới: {summary.categoriesCreated}</p>
                <p>Lỗi: {summary.errors.length}</p>
              </div>
              {summary.errors.length > 0 && (
                <div className="max-h-40 overflow-auto rounded-md border bg-white p-2 text-xs">
                  {summary.errors.slice(0, 10).map((error, index) => (
                    <p key={`${error.rowNumber}-${index}`}>
                      Dòng {error.rowNumber}: {error.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleImport}
            disabled={!file || isImporting}
            className="bg-secondary text-white hover:bg-secondary/90 hover:text-white"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang import
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4" />
                Bắt đầu import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportMeals;
