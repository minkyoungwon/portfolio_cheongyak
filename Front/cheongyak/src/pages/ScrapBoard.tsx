import { useEffect, useState } from "react";
import { useScrapStore } from "../hooks/useScrapStore";
import { fetchYoutubeVideos } from "../utils/youtubeApi";
import ScrapList from "../components/ScrapList";
import { sendNewVideoNotification } from "../utils/notificationApi";
import { useAuthStore } from "../hooks/useAuthStore";

export default function ScrapBoard() {
  const setScraps = useScrapStore((state) => state.setScraps);
  const scraps = useScrapStore((state) => state.scraps);
  const scrappedIds = useScrapStore((state) => state.scrappedIds);
  const loadScrapsFromSupabase = useScrapStore((state) => state.loadScrapsFromSupabase);
  const { user } = useAuthStore();

  const [query, setQuery] = useState("아영이네");
  const [loading, setLoading] = useState(false);
  const [showScrappedOnly, setShowScrappedOnly] = useState(false);
  // 비디오 타입 정의
  interface Video {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    upload_date: string;
    isShorts?: boolean;
  }

  const [lastSearchResult, setLastSearchResult] = useState<Video[]>([]);
  const [showNotifyButton, setShowNotifyButton] = useState(false);
  const [notifying, setNotifying] = useState(false);

  // const [filterType, setFilterType] = useState<"all" | "shorts" | "regular">("all"); 빌드전에는 이렇게 썼는데
  // const filterType = "all"; // 오류가 난다면 고정값으로 깔끔하게
  // 이렇게 수정
  const [filterType] = useState<"all" | "shorts" | "regular">("all");
  // // 🔍 쇼츠 / 일반 영상 필터링
  const visibleScraps = scraps.filter((item) => {
    if (filterType === "shorts") return item.isShorts === true;
    if (filterType === "regular") return item.isShorts === false;
    return true;
  });

  // 🔍 검색 핸들링
  const handleSearch = async () => {
    setLoading(true);
    try {
      const videos = await fetchYoutubeVideos(query) as Video[];
      
      // 이전 검색 결과와 비교하여 새 동영상이 있는지 확인
      // id 값에 타입을 명시해달라고 하는데 
      const isNewVideos = videos.some((video: Video) => {
        return !lastSearchResult.some((lastVideo: Video) => lastVideo.id === video.id);
      });
      
      // 관리자만 새 동영상 알림 버튼 표시
      setShowNotifyButton(isNewVideos && user?.role === "admin");
      setLastSearchResult(videos);
      setScraps(videos);
    } catch (error) {
      console.error("유튜브 영상 불러오기 실패", error);
    } finally {
      setLoading(false);
    }
  };

  // 새 동영상 알림 전송
  const sendNotification = async () => {
    if (!lastSearchResult.length) return;
    
    setNotifying(true);
    try {
      // 가장 최근 동영상에 대해 알림 전송
      const latestVideo = lastSearchResult[0];
      await sendNewVideoNotification(latestVideo, user?.id);
      
      alert("새 동영상 알림이 성공적으로 전송되었습니다.");
      setShowNotifyButton(false);
    } catch (error) {
      console.error("알림 전송 실패:", error);
      alert("알림 전송 시 오류가 발생했습니다.");
    } finally {
      setNotifying(false);
    }
  };

  // ✅ 최초 진입 시 데이터 로딩
  useEffect(() => {
    handleSearch();
    loadScrapsFromSupabase();
  }, []);

  return (
    <div className="p-8 text-gray-800 bg-gradient-to-br from-purple-50 via-white to-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold mb-6">유튜브 청약 영상 검색</h2>

      {/* 🔍 검색창 */}
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="px-4 py-2 text-black rounded w-full max-w-md"
          placeholder="검색어를 입력하세요 (예: 청약, LH, 신혼부부)"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 font-semibold text-white"
        >
          검색
        </button>
        
        {showNotifyButton && (
          <button
            onClick={sendNotification}
            disabled={notifying}
            className={`px-4 py-2 ${notifying ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'} rounded font-semibold text-white`}
          >
            {notifying ? '알림 전송 중...' : '새 동영상 알림 보내기'}
          </button>
        )}
      </div>

      {/* 🎛️ 필터 버튼
      <div className="mb-4 text-white flex gap-2">
        <button
          onClick={() => setFilterType("all")}
          className={`px-4 py-2 rounded font-semibold ${filterType === "all" ? "bg-blue-600" : "bg-gray-400"}`}
        >
          전체 보기
        </button>
        <button
          onClick={() => setFilterType("shorts")}
          className={`px-4 py-2 rounded font-semibold ${filterType === "shorts" ? "bg-red-500" : "bg-gray-400"}`}
        >
          쇼츠만 보기
        </button>
        <button
          onClick={() => setFilterType("regular")}
          className={`px-4 py-2 rounded font-semibold ${filterType === "regular" ? "bg-green-600" : "bg-gray-400"}`}
        >
          일반영상만 보기
        </button>
      </div> */}

      {/* 💾 스크랩 필터 버튼 */}
      <div className="mb-4 text-white">
        <button
          onClick={() => setShowScrappedOnly((prev) => !prev)}
          className="px-4 py-2 bg-purple-500 rounded hover:bg-purple-600 font-semibold"
        >
          {showScrappedOnly ? "전체 보기" : "스크랩한 영상만 보기"}
        </button>
      </div>

      {/* 📌 현재 상태 출력 */}
      <p className="mb-2 text-sm text-black-900">
        현재 보기 모드:
        <span
          className={`ml-2 px-2 py-1 rounded text-sm font-bold ${showScrappedOnly ? "bg-yellow-400 text-black" : "bg-blue-500 text-white"
            }`}
        >
          {showScrappedOnly ? "스크랩한 영상만 보기" : "전체 영상 보기"}
        </span>
      </p>

      {/* ⏳ 로딩 */}
      {loading && <p>⏳ 영상 불러오는 중...</p>}

      {/* 😢 결과 없음 */}
      {!loading && scraps.length === 0 && (
        <p className="text-red-300">😢 관련된 영상을 찾을 수 없습니다.</p>
      )}

      {/* ✅ 영상 리스트 */}
      {!loading && (
        <ScrapList
          filterIds={
            showScrappedOnly
              ? visibleScraps.filter((v) => scrappedIds.has(v.id)).map((v) => v.id)
              : visibleScraps.map((v) => v.id)
          }
        />
      )}
    </div>
  );
}
