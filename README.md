# 🎬 XCinema - Hệ thống Xem Phim Trực Tuyến và Xem Chung

[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-316192?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)

## 📋 Mục Lục

- [Giới Thiệu](#-giới-thiệu)
- [Thành Viên](#-thành-viên)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Tính Năng Chính](#-tính-năng-chính)
- [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
- [Cài Đặt và Chạy](#-cài-đặt-và-chạy)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [API Documentation](#-api-documentation)
- [Hướng Phát Triển](#-hướng-phát-triển)

---

## 🎯 Giới Thiệu

**XCinema** là một nền tảng xem phim trực tuyến toàn diện, kết hợp công nghệ hiện đại để mang đến trải nghiệm xem phim tuyệt vời cho người dùng. Hệ thống không chỉ cho phép xem phim, phim truyền hình một cách độc lập mà còn cung cấp tính năng **Watch Party** - xem chung với bạn bè từ xa, hoàn toàn đồng bộ.

### 🌟 Điểm Nổi Bật

- **Streaming chất lượng cao** với HLS (HTTP Live Streaming)
- **Watch Party** - Xem phim cùng bạn bè với đồng bộ real-time
- **AI Chatbot** hỗ trợ tìm kiếm và gợi ý phim thông minh
- **Recommendation System** với thuật toán Hybrid (Content-based + Collaborative Filtering)
- **Responsive Design** - Tối ưu cho mọi thiết bị
- **Social Features** - Comment, Rating, Like, Notification

---

## 👥 Thành Viên

| STT | Họ và Tên        | MSSV       |
| --- | ---------------- | ---------- |
| 1   | Nguyễn Văn Hiếu  | 2280600964 |
| 2   | Nguyễn Đức Trung | 2280603448 |

---

## 🛠️ Công Nghệ Sử Dụng

### Backend

- **Framework**: ASP.NET Core 8.0 (Web API)
- **Database**: PostgreSQL 15
- **ORM**: Entity Framework Core 8.0.13
- **Authentication**:
  - JWT Bearer Token
  - OAuth 2.0 (Google, GitHub)
  - ASP.NET Core Identity
- **Real-time Communication**: SignalR
- **Cloud Storage**: AWS S3 + CloudFront CDN
- **APIs**: OpenAI API (Chatbot)
- **Containerization**: Docker & Docker Compose

### Frontend

- **Framework**: React 19.0.0
- **Build Tool**: Vite 6.2.0
- **Routing**: React Router 7.3.0
- **State Management**: Redux Toolkit 2.6.1
- **Styling**: Tailwind CSS 4.0.14
- **Video Player**: HLS.js 1.6.2
- **Real-time**: SignalR Client (@microsoft/signalr 9.0.6)
- **UI Libraries**:
  - React Icons 5.5.0
  - SweetAlert2 11.17.2
  - React Toastify 11.0.5
  - React Circular Progressbar 2.2.0

### Machine Learning Service

- **Framework**: FastAPI
- **Libraries**:
  - Pandas
  - NumPy
  - Scikit-learn
  - Scikit-surprise 1.1.3
- **Algorithm**: Hybrid Recommendation (Content + Collaborative)

---

## ✨ Tính Năng Chính

### 1. 🎥 Quản Lý Phim & TV Series

- Upload và quản lý phim, TV series với đầy đủ metadata
- Hỗ trợ multiple seasons và episodes
- Quản lý actors, genres, ratings
- Tìm kiếm nâng cao với full-text search (PostgreSQL tsvector)
- Export dữ liệu phim

### 2. 🎬 Video Streaming

- HLS Streaming với adaptive bitrate
- Custom video controls (play/pause, seek, volume, fullscreen)
- Quality selector (Auto, 720p, 480p, 360p)
- Episode navigation cho TV series
- Lưu lại vị trí xem (View Log)

### 3. 👥 Watch Party (Xem Chung)

- Tạo phòng xem chung (public/private)
- Đồng bộ video real-time (play, pause, seek)
- Chat trong phòng với avatar và display name
- Scheduled auto-start cho phòng
- **🆕 Auto-end sau 5 giờ** để tối ưu tài nguyên
- Host controls (start/end session, kick viewers)
- Real-time viewer count

### 4. 🤖 AI Chatbot

- Tìm kiếm phim thông minh bằng ngôn ngữ tự nhiên
- Gợi ý phim dựa trên preferences
- Powered by OpenAI API

### 5. 📊 Recommendation System

- **Content-based Filtering**: Dựa trên genres, actors, keywords
- **Collaborative Filtering**: Dựa trên hành vi người dùng tương tự
- **Hybrid Approach**: Kết hợp cả hai phương pháp
- Trending movies/series
- New releases

### 6. 💬 Social Features

- **Comments**:
  - Nested replies (threaded comments)
  - Edit/Delete own comments
  - Like/Dislike comments
  - Real-time updates
- **Ratings**: Rate phim từ 1-10 sao
- **Watch List**: Lưu phim yêu thích
- **Notifications**:
  - Real-time notifications
  - Mark as read/unread
  - Notification history

### 7. 👤 User Management

- Register/Login với email
- OAuth login (Google, GitHub)
- User profile (avatar, display name, bio)
- View history
- Role-based access (Admin, User)

### 8. 🔍 Search & Filter

- Full-text search cho movies/series
- Filter theo genres, year, rating
- Sort by popularity, rating, release date
- Search suggestions

### 9. 🎨 Admin Dashboard

- Quản lý phim, TV series, episodes
- Quản lý actors và genres
- Upload progress tracking
- Statistics và analytics

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│   React SPA     │◄────────┤   ASP.NET Core  │◄────────┤   PostgreSQL    │
│   (Frontend)    │  HTTP   │   Web API       │  EF Core│   Database      │
│                 │ SignalR │   (Backend)     │         │                 │
└────────┬────────┘         └────────┬────────┘         └─────────────────┘
         │                           │
         │                           │
         │                  ┌────────▼────────┐
         │                  │                 │
         │                  │   AWS S3 +      │
         │                  │   CloudFront    │
         │                  │   (Storage)     │
         │                  └─────────────────┘
         │
         │                  ┌─────────────────┐
         └──────────────────►                 │
                  HTTP      │   FastAPI ML    │
                            │   Service       │
                            │   (Python)      │
                            └─────────────────┘
```

### Luồng Dữ Liệu

1. **User Request** → Frontend (React)
2. **API Call** → Backend (ASP.NET Core) via Axios
3. **Authentication** → JWT Token validation
4. **Database Query** → PostgreSQL via Entity Framework
5. **File Storage** → AWS S3 (videos, images)
6. **Content Delivery** → CloudFront CDN
7. **Real-time** → SignalR Hub (Watch Party, Notifications)
8. **ML Recommendations** → FastAPI Service

---

## 🚀 Cài Đặt và Chạy

### Yêu Cầu Hệ Thống

- **Docker & Docker Compose** (khuyến nghị) hoặc:
  - .NET SDK 8.0
  - Node.js 16+ & npm
  - PostgreSQL 15+
  - Python 3.8+ (cho ML service)

### 1️⃣ Chạy với Docker (Khuyến Nghị)

```bash
# Clone repository
git clone https://github.com/zeldris273/XCinema.git
cd xcinema

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f
```

**Services sẽ chạy tại:**

- Frontend: http://localhost
- Backend: http://localhost:5000
- PostgreSQL: localhost:5432

### 2️⃣ Chạy Thủ Công (Development)

#### Backend Setup

```bash
cd Movie_BE

# Restore packages
dotnet restore

# Update database
dotnet ef database update

# Run
dotnet run
```

Backend API: http://localhost:5116

#### Frontend Setup

```bash
cd Movie_FE

# Install dependencies
npm install

# Run dev server
npm run dev
```

Frontend: http://localhost:5173

#### ML Service Setup

```bash
cd Ml_service/movie_recommends

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac

# Run venv
.\venv\Scripts\Activate.ps1  # Windows

# Install dependencies
pip install fastapi uvicorn pandas "numpy<2" "scikit-learn<1.4" "scikit-surprise==1.1.3"

# Run API
uvicorn hybrid_api:app --reload
```

ML API: http://localhost:8000

### 3️⃣ Cấu Hình

#### Backend/Docker Configuration (.env)

Nếu chạy trên local với không Docker thì hãy để file .env ở trong thư mục Backend. Ngược lại hãy để ở thư mục root

```env
## Database configuration

## Xóa đoạn này nếu không dùng docker
POSTGRES_USER=postgres
POSTGRES_PASSWORD=12345
POSTGRES_DB=xcinema

DB_HOST=postgres
DB_PORT=5432
DB_NAME=xcinema
DB_USER=postgres
DB_PASS=12345

## AWS S3 configuration

AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_KEY=
CLOUDFRONT_DOMAIN=d2az2ylwxkh7fk.cloudfront.net

## JWT configuration

JWT_SECRET=SuperSecretKey123!@#$%^&\*()567890
JWt_REFRESH=your-secret-key-for-refresh-token

## Smtp configuration

SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=
SMTP_PORT=587
SMTP_PASSWORD=

## Authentication configuration

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

## Uvicorn configuration

UVICORN_URL=http://localhost:8000

## OpenAI API Key

OPENAI_API_KEY=
```

#### Frontend Configuration (.env)

```env
## Backend API URL

VITE_BACKEND_API_URL=http://localhost:5116
```

---

## 📁 Cấu Trúc Dự Án

```
XCinema/
│
├── Movie_BE/                    # Backend ASP.NET Core
│   ├── Controllers/            # API Controllers
│   │   ├── AuthController.cs
│   │   ├── MovieController.cs
│   │   ├── TvSeriesController.cs
│   │   ├── WatchPartyController.cs
│   │   ├── CommentController.cs
│   │   ├── ChatbotController.cs
│   │   └── ...
│   ├── Models/                 # Entity Models
│   │   ├── Movie.cs
│   │   ├── TvSeries.cs
│   │   ├── User.cs
│   │   ├── Comment.cs
│   │   └── ...
│   ├── DTOs/                   # Data Transfer Objects
│   ├── Services/               # Business Logic
│   │   ├── AuthService.cs
│   │   ├── RoomService.cs
│   │   ├── S3Service.cs
│   │   └── NotificationService.cs
│   ├── Hubs/                   # SignalR Hubs
│   │   └── WatchPartyHub.cs
│   ├── Data/                   # Database Context
│   │   └── MovieDbContext.cs
│   ├── Migrations/             # EF Core Migrations
│   └── Program.cs              # Entry Point
│
├── Movie_FE/                    # Frontend React
│   ├── src/
│   │   ├── components/         # React Components
│   │   │   ├── common/
│   │   │   ├── dashboard/
│   │   │   ├── frame/
│   │   │   └── watch-party/
│   │   ├── pages/              # Page Components
│   │   │   ├── Home.jsx
│   │   │   ├── MoviePlayer.jsx
│   │   │   ├── WatchParty/
│   │   │   └── ...
│   │   ├── store/              # Redux Store
│   │   ├── api/                # API Client
│   │   ├── hooks/              # Custom Hooks
│   │   └── routes/             # Routing
│   ├── package.json
│   └── vite.config.js
│
├── Ml_service/                  # ML Service
│   └── movie_recommends/
│       ├── hybrid_api.py       # FastAPI Recommendation API
│       └── model_train.ipynb   # Model Training
│
├── docker-compose.yml           # Docker Compose Config
└── README.md
```

---

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint                  | Description           |
| ------ | ------------------------- | --------------------- |
| POST   | `/api/auth/register`      | Đăng ký tài khoản     |
| POST   | `/api/auth/login`         | Đăng nhập             |
| POST   | `/api/auth/refresh-token` | Refresh JWT token     |
| GET    | `/api/auth/profile`       | Lấy thông tin profile |
| PUT    | `/api/auth/profile`       | Cập nhật profile      |

### Movie Endpoints

| Method | Endpoint          | Description           |
| ------ | ----------------- | --------------------- |
| GET    | `/api/movie`      | Lấy danh sách phim    |
| GET    | `/api/movie/{id}` | Lấy chi tiết phim     |
| POST   | `/api/movie`      | Thêm phim mới (Admin) |
| PUT    | `/api/movie/{id}` | Cập nhật phim (Admin) |
| DELETE | `/api/movie/{id}` | Xóa phim (Admin)      |

### Watch Party Endpoints

| Method | Endpoint                       | Description                |
| ------ | ------------------------------ | -------------------------- |
| GET    | `/api/watchparty/public-rooms` | Lấy danh sách phòng public |
| GET    | `/api/watchparty/my-rooms`     | Lấy phòng của tôi          |

### SignalR Hub Methods (WatchPartyHub)

| Method         | Description                  |
| -------------- | ---------------------------- |
| `CreateRoom`   | Tạo phòng xem chung          |
| `JoinRoom`     | Tham gia phòng               |
| `StartSession` | Bắt đầu session (Host only)  |
| `EndSession`   | Kết thúc session (Host only) |
| `SyncPlay`     | Đồng bộ play                 |
| `SyncPause`    | Đồng bộ pause                |
| `SyncSeek`     | Đồng bộ seek                 |
| `SendChat`     | Gửi chat message             |

### Recommendation Endpoints (ML Service)

| Method | Endpoint     | Description       |
| ------ | ------------ | ----------------- |
| POST   | `/recommend` | Gợi ý phim hybrid |
| POST   | `/similar`   | Tìm phim tương tự |

---

## 🔮 Hướng Phát Triển

### Tính Năng Mới

- [ ] Mobile App (FLutter)
- [ ] Download offline
- [ ] Subtitle support (multi-language)
- [ ] Picture-in-Picture mode
- [ ] Watch party voice chat
- [ ] Playlist management
- [ ] Advanced analytics dashboard

### Cải Tiến Kỹ Thuật

- [ ] Implement Redis caching
- [ ] Add rate limiting
- [ ] Improve ML recommendation accuracy
- [ ] Add E2E testing (Cypress)
- [ ] Implement CDN for better performance
- [ ] Add monitoring (Prometheus, Grafana)

### Bảo Mật

- [ ] Two-factor authentication
- [ ] Content encryption
- [ ] DRM protection
- [ ] Rate limiting per user
- [ ] CAPTCHA for registration

---

## 📧 Contact

- **Nguyễn Văn Hiếu** - [nvh.27304@gmail.com](mailto:nvh.27304@gmail.com)

Project Link: [https://github.com/zeldris273/XCinema](https://github.com/zeldris273/XCinema)

---

## 🙏 Acknowledgments

- [ASP.NET Core Documentation](https://docs.microsoft.com/aspnet/core)
- [React Documentation](https://reactjs.org/)
- [SignalR Documentation](https://docs.microsoft.com/aspnet/core/signalr)
- [HLS.js](https://github.com/video-dev/hls.js/)
- [Tailwind CSS](https://tailwindcss.com/)

---

<div align="center">
  <p>Made with ❤️ by XCinema Team</p>
  <p>⭐ Star us on GitHub if you like this project!</p>
</div>
