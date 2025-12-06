# MoviePlayer Frontend

## Creator

Nguyen Van Hieu - 2280600964
Nguyen Duc Trung - 2280603448

## Overview

The MoviePlayer frontend is a React-based application designed to provide users with a seamless media playback experience for movies and TV series. It supports video streaming with HLS (HTTP Live Streaming), episode navigation, and an interactive comment system where users can add, reply to, edit, and delete comments on specific movies or TV series episodes. The application is styled with Tailwind CSS for a modern and responsive design. This project focuses on the `MoviePlayer` component, which integrates video playback, episode selection (for TV series), and a comment section with nested replies.

## Features

- **Video Playback**:

  - Supports HLS streaming using the `hls.js` library for adaptive bitrate streaming.
  - Custom video controls including play/pause, seek bar, quality selection, and full-screen mode.
  - Displays current time and duration of the video.
  - Auto-hides controls during playback for an immersive experience.

- **Movie and TV Series Navigation**:

  - Displays a scrollable list of movies and TV series.
  - Allows users to switch between episodes with a single click.
  - Highlights the currently selected episode.

- **Comment System**:

  - Users can add comments to a movie or a specific episode of a TV series.
  - Supports nested replies to comments, creating a threaded comment structure.
  - Users can edit or delete their own comments.
  - Comments are displayed with timestamps and usernames.

- **Rating**:

  - Users can rate movies based on quality using `react-circular-progressbar`.

- **Add to Watch List**:

  - Users can add films they like to a watch list.

- **Search**:

  - Search for the movie the user wants

- **Responsive Design**:

  - Built with Tailwind CSS for a modern, responsive UI.
  - Optimized for both desktop and mobile devices.

## Technologies Used

- **React (v19.0.0)**: For building the user interface and managing component state.
- **React Router (v7.3.0)**: For handling navigation and URL parameters (e.g., `id`, `title`, `episodeNumber`).
- **HLS.js (v1.6.2)**: For streaming HLS video content with quality switching.
- **Axios (v1.8.3)**: For making API requests to the backend (e.g., fetching video URLs, episodes, and comments).
- **SweetAlert2 (v11.17.2)**: For displaying alerts (e.g., session expiration).
- **Tailwind CSS (v4.0.14)**: For styling the application with a utility-first approach.
- **Redux Toolkit (v2.6.1)**: For managing state with `react-redux` (v9.2.0).
- **React Icons (v5.5.0)**: For adding customizable icons.
- **Moment (v2.30.1)**: For handling date and time formatting (e.g., timestamps).
- **React Circular Progressbar (v2.2.0)**: For displaying rating progress bars.
- **JWT Decode (v4.0.0)**: For decoding JWT tokens (if authentication is implemented).

## Installation and Setup

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

### Steps

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/zeldris273/Movie_FE.git
   cd Movie_FE
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

   This will install all required packages, including:

   - `react@19.0.0`, `react-dom@19.0.0`, `react-router-dom@7.3.0`
   - `hls.js@1.6.2`
   - `axios@1.8.3`
   - `sweetalert2@11.17.2`
   - `tailwindcss@4.0.14`, `@tailwindcss/vite@4.0.14`
   - `@reduxjs/toolkit@2.6.1`, `react-redux@9.2.0`
   - `react-icons@5.5.0`
   - `moment@2.30.1`
   - `react-circular-progressbar@2.2.0`
   - `jwt-decode@4.0.0`

3. **To run**:

   ```bash
   npm run dev
   ```

4.

Step 1 — Tạo môi trường ảo
Windows:
python -m venv venv
venv\Scripts\activate

macOS/Linux:
python3 -m venv venv
source venv/bin/activate

Step 2 — Cài đặt thư viện cần thiết

Dùng đúng versions để tránh lỗi NumPy / Surprise:

pip install fastapi uvicorn pandas "numpy<2" "scikit-learn<1.4" "scikit-surprise==1.1.3"

Step 3 — Chạy API
Nếu file nằm tại movie_recommends/hybrid_api.py:
uvicorn movie_recommends.hybrid_api:app --reload

Nếu bạn chạy từ cùng thư mục chứa file:
uvicorn hybrid_api:app --reload

API chạy tại:

http://localhost:8000

## Usage

1. **Video Playback**:

   - Click the play button to start the video.
   - Use the seek bar to jump to a specific time.
   - Select video quality from the settings menu (three dots).
   - Toggle full-screen mode using the full-screen button.

2. **Episode Navigation**:

   - For TV series, scroll through the episode list and click an episode to switch.
   - The current episode is highlighted in yellow.

3. **Comments**:

   - Enter a comment in the input field and click "Post" to add it.
   - Click "Reply" on a comment to add a nested reply.
   - If the comment belongs to the current user (`currentUserId=1`), a menu (three dots) will appear, allowing you to edit or delete the comment.

4. **Search**:

   - Search for the movie the user wants

5. **Rating**:

   - Rate movies using the circular progress bar interface.

6. **Add to Watch List**:

   - Add desired films to your watch list (pending full implementation).
