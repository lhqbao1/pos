# Import món ăn từ Excel/JSON

## 1) Cấu hình môi trường

Thêm biến trong `.env` hoặc `.env.local`:

```env
NEXT_PUBLIC_STRAPI_URL=https://your-project.strapiapp.com
STRAPI_API_TOKEN=your-strapi-api-token
```

`STRAPI_API_TOKEN` cần quyền trên các collection:
- `Dish`: create, update, find
- `Category`: create, find

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
