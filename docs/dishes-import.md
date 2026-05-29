# Import món ăn từ Excel/JSON

## 1) Cấu hình môi trường

Thêm biến trong `.env` hoặc `.env.local`:

```env
NEST_API_URL=http://localhost:3002
NEXT_PUBLIC_NEST_API_URL=http://localhost:3002
NEXT_PUBLIC_API_BASE_URL=http://localhost:3002
```

## 2) Cài dependency parser Excel

```bash
npm install
```

Dependency `xlsx` đã được khai báo trong `package.json`.

## 3) Cách dùng trên UI

Trang `Thực đơn` -> bấm `Import Excel/JSON` -> chọn file -> `Bắt đầu import`.

Hệ thống:
- Tự đọc sheet đầu tiên (với file Excel)
- Dòng trống tự bỏ qua
- Nếu trùng `sku` hoặc trùng tên món thì cập nhật
- Nếu chưa có category thì tự tạo mới

## 4) Cột dữ liệu hỗ trợ

Bắt buộc:
- `name`
- `price`

Khuyến nghị:
- `category`
- `vipPrice`
- `costPrice`
- `sku`
- `description`
- `rating`
- `sold`
- `isActive`
- `sortOrder`

File mẫu: `/public/templates/dishes-import-example.json`
