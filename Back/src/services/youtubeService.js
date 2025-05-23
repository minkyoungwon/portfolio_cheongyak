import axios from "axios";
import { YOUTUBE_API_KEY } from "../config/config.js";


// 현재 사용 안함
export async function fetchYoutubeVideos(query = "청약", maxResults = 8) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults}&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;
  
  const response = await axios.get(url);
  return response.data.items.map(item => ({
    id: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnail: item.snippet.thumbnails.medium.url,
    upload_date: item.snippet.publishedAt,
    //upload_date: item.snippet.upload_date,
  }));
}
