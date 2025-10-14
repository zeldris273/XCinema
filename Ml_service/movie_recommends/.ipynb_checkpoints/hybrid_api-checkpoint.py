from fastapi import FastAPI
import pandas as pd
import pickle

app = FastAPI(title="Hybrid Movie Recommendation API", version="1.0")

# === Load model đã lưu ===
with open("recommend_model.pkl", "rb") as f:
    model_data = pickle.load(f)

svd_model = model_data["svd_model"]
vectorizer = model_data["vectorizer"]
cosine_sim = model_data["cosine_sim"]
movies = model_data["movies"]

# ✅ Đọc ratings
ratings = pd.read_csv("ratings.csv")

# Nếu cột trong ratings là MediaId, đổi tên thành Id cho đồng nhất
if "MediaId" in ratings.columns:
    ratings.rename(columns={"MediaId": "Id"}, inplace=True)

@app.get("/recommend/{user_id}")
def recommend_movies(user_id: int, top_n: int = 10):
    """
    API gợi ý phim kết hợp Collaborative Filtering + Content-Based
    """
    try:
        # === 1️⃣ CF: Dự đoán rating cho tất cả phim ===
        all_movie_ids = movies["Id"].unique()
        cf_preds = {mid: svd_model.predict(user_id, mid).est for mid in all_movie_ids}

        # === 2️⃣ Content-Based: lấy phim user đã rate cao ===
        user_movies = ratings[ratings["UserId"] == user_id]
        if user_movies.empty:
            return {"error": f"User {user_id} chưa có rating nào."}

        top_rated = user_movies.sort_values("RatingValue", ascending=False).head(3)
        content_scores = {}

        for mid in top_rated["Id"]:
            idx = movies.index[movies["Id"] == mid].tolist()
            if idx:
                sim_scores = list(enumerate(cosine_sim[idx[0]]))
                for i, score in sim_scores:
                    movie_id = int(movies.iloc[i]["Id"])
                    content_scores[movie_id] = content_scores.get(movie_id, 0) + score

        # === 3️⃣ Kết hợp điểm CF + Content-Based ===
        hybrid_scores = {}
        for mid in all_movie_ids:
            hybrid_scores[mid] = 0.7 * cf_preds[mid] + 0.3 * content_scores.get(mid, 0)

        # === 4️⃣ Lấy Top N phim ===
        recommendations = sorted(hybrid_scores.items(), key=lambda x: x[1], reverse=True)[:top_n]

        # === 5️⃣ Trả kết quả về ===
        result = []
        for mid, score in recommendations:
            title = movies.loc[movies["Id"] == mid, "Title"].values
            title = title[0] if len(title) > 0 else "Unknown"
            result.append({
                "Id": int(mid),
                "Title": title,
                "PredictedScore": round(float(score), 3)
            })

        return {"UserId": user_id, "Recommendations": result}

    except Exception as e:
        return {"error": f"Lỗi trong quá trình gợi ý: {str(e)}"}



@app.get("/similar/{movie_id}")
def recommend_similar_movies(movie_id: int, top_n: int = 10):
    """Gợi ý phim tương tự với phim đang xem"""
    try:
        # Tìm index của phim hiện tại
        idx_list = movies.index[movies["Id"] == movie_id].tolist()
        if not idx_list:
            return {"error": f"Không tìm thấy phim có Id = {movie_id}"}
        idx = idx_list[0]

        # Lấy điểm tương đồng (cosine similarity)
        sim_scores = list(enumerate(cosine_sim[idx]))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

        # Lấy top_n phim tương tự (bỏ chính nó)
        sim_scores = sim_scores[1:top_n + 1]

        recommendations = []
        for i, score in sim_scores:
            rec_id = int(movies.iloc[i]["Id"])
            rec_title = movies.iloc[i]["Title"]
            recommendations.append({
                "Id": rec_id,
                "Title": rec_title,
                "Similarity": round(float(score), 3)
            })

        return {"BaseMovieId": movie_id, "Recommendations": recommendations}

    except Exception as e:
        return {"error": f"Lỗi khi gợi ý phim tương tự: {str(e)}"}

