# Hướng dẫn sử dụng tính năng Avatar và Comments

## Tổng quan

Đã cập nhật hệ thống để hiển thị avatar và tên hiển thị của user trong:

- Comments (bình luận)
- Header (khi đăng nhập)

## Các thay đổi đã thực hiện

### 1. Backend Changes

#### CommentDTO (DTOs/CommentDTO.cs)

- Thêm `DisplayName`: Tên hiển thị của user
- Thêm `AvatarUrl`: URL avatar của user

#### CommentController (Controllers/CommentController.cs)

- Cập nhật `MapToCommentResponseDTO()` để trả về `DisplayName` và `AvatarUrl`
- Sử dụng `comment.User.DisplayName ?? comment.User.Email` làm fallback

### 2. Frontend Changes

#### Hook mới (hooks/useUserProfile.jsx)

- `useUserProfile()`: Hook để quản lý thông tin profile user
- Tự động fetch profile khi component mount
- Cung cấp `updateProfile()` để cập nhật profile

#### Header (components/common/Header.jsx)

- Sử dụng `useUserProfile()` hook
- Hiển thị avatar user từ `profile.avatarUrl`
- Fallback về `userImg` mặc định nếu không có avatar

#### Comments (pages/MoviePlayer.jsx)

- Hiển thị avatar user trong mỗi comment
- Hiển thị `displayName` thay vì `username`
- Layout mới với avatar bên trái, tên và thời gian bên phải
- Fallback về avatar mặc định nếu không có avatar

#### AccountPage (pages/AccountPage.jsx)

- Tích hợp với `useUserProfile()` hook
- Tự động cập nhật profile khi có thay đổi
- Đồng bộ với Header khi cập nhật avatar

## Cách sử dụng

### 1. Hiển thị Avatar trong Comments

- Mỗi comment sẽ hiển thị avatar user (nếu có)
- Avatar được hiển thị dạng tròn bên trái tên user
- Nếu không có avatar, hiển thị avatar mặc định

### 2. Hiển thị Avatar trong Header

- Khi user đăng nhập, header sẽ hiển thị avatar user
- Nếu không có avatar, hiển thị avatar mặc định
- Avatar được cập nhật tự động khi user thay đổi

### 3. Cập nhật Profile

- User có thể cập nhật avatar và thông tin trong trang Account
- Thay đổi sẽ được phản ánh ngay lập tức trong Header và Comments

## Cấu trúc dữ liệu

### Comment Response

```json
{
  "id": 1,
  "userId": 1,
  "username": "user@example.com",
  "displayName": "John Doe",
  "avatarUrl": "https://my-movie-app.s3.amazonaws.com/avatars/avatar.jpg",
  "commentText": "Great movie!",
  "timestamp": "2024-01-15T10:30:00Z",
  "replies": []
}
```

### Profile Response

```json
{
  "id": 1,
  "email": "user@example.com",
  "displayName": "John Doe",
  "gender": "Nam",
  "avatarUrl": "https://my-movie-app.s3.amazonaws.com/avatars/avatar.jpg",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

## Lưu ý

1. **Fallback**: Nếu không có avatar, hệ thống sẽ hiển thị avatar mặc định
2. **Performance**: Hook `useUserProfile` chỉ fetch profile một lần khi mount
3. **Sync**: Khi cập nhật profile, Header và Comments sẽ tự động cập nhật
4. **Error Handling**: Có xử lý lỗi khi load avatar không thành công
5. **Responsive**: Layout comment responsive trên mobile và desktop

## Migration

Để sử dụng tính năng này, cần chạy migration để thêm các trường mới vào database:

```bash
cd Movie_BE
dotnet ef database update
```

Các trường mới được thêm vào bảng `AspNetUsers`:

- `DisplayName` (string, nullable)
- `Gender` (string, nullable)
- `AvatarUrl` (string, nullable)
