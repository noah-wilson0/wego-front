import React, { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import chemiQuestionsData from "./data/chemi_questions.json";
import axios from "axios";

// axios 인스턴스: 쿠키 자동 포함
const api = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true, // HttpOnly 쿠키 포함
});

// JSON 데이터 타입 정의
interface QuestionOption { index: number; text: string; }
interface Question { number: number; options: QuestionOption[]; }
interface ChemiQuestionsData {
  meta: { title: string; version: string; };
  questions: Question[];
}

// 메인 페이지에서 가져온 Header 컴포넌트
const Header = ({ activeMenu = "", onMenuClick }: { activeMenu?: string; onMenuClick?: (k: string) => void }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { key: "trip", label: "여행지" },
    { key: "guide", label: "가이드" },
    { key: "feed", label: "피드" },
    { key: "login", label: "로그인" },
  ];

  const handleMenuClick = (menuKey: string) => {
    onMenuClick?.(menuKey);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={() => handleMenuClick("home")} className="text-xl font-bold text-black">
            LOGO
          </button>
        </div>

        <nav className="hidden sm:flex items-center">
          <div className="flex items-center space-x-8 lg:space-x-12">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleMenuClick(item.key)}
                className="text-base font-medium text-black hover:text-blue-600 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        <button
          onClick={() => setIsMenuOpen((v) => !v)}
          className="sm:hidden flex flex-col items-center justify-center w-6 h-6 space-y-1"
        >
          <span className={`block w-5 h-0.5 bg-gray-600 transition-transform duration-200 ${isMenuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
          <span className={`block w-5 h-0.5 bg-gray-600 transition-opacity duration-200 ${isMenuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-gray-600 transition-transform duration-200 ${isMenuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
        </button>
      </div>

      {isMenuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <nav className="px-6 py-4 space-y-4">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleMenuClick(item.key)}
                className="block w-full text-left text-base font-medium text-black hover:text-blue-600 transition-colors py-2"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

// 진행률 바 컴포넌트
const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  const progress = (current / total) * 100;
  return (
    <div className="w-full bg-gray-200 rounded-full h-3 mb-8">
      <div className="bg-purple-500 h-3 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
    </div>
  );
};

// ChemiQuiz 메인 컴포넌트
const ChemiQuiz: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("quiz");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [chemiResult, setChemiResult] = useState<string>("");

  const navigate = useNavigate();
  const location = useLocation();

  // JSON 데이터 로드
  const questionsData = chemiQuestionsData as ChemiQuestionsData;
  const totalQuestions = questionsData.questions.length;
  const currentQuiz = questionsData.questions[currentQuestion];

  // 헤더 메뉴 클릭
  const handleMenuClick = (menu: string) => {
    setCurrentPage(menu);
    console.log(`${menu} 페이지로 이동`);
  };

  // 저장 완료 모달: 확인 → 마이페이지, 취소 → 메인
  const handleSavedModalConfirm = () => {
    setShowSavedModal(false);
    navigate("/mypage");
  };
  const handleSavedModalCancel = () => {
    setShowSavedModal(false);
    navigate("/");
  };

  // URL ?chemi=... 있으면 로그인 후 복귀 케이스 → 저장 시도
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const chemiParam = params.get("chemi");
    if (!chemiParam) return;

    (async () => {
      try {
        // ✅ 문자열을 text/plain으로 전송 (따옴표 문제 방지)
        await api.post("/chemi/me", chemiParam, {
          headers: { "Content-Type": "text/plain" },
        });
        setChemiResult(chemiParam);
        setShowSavedModal(true);
      } catch (e) {
        console.error("케미 저장 실패:", e);
        alert("케미 결과 저장에 실패했습니다.");
        navigate("/");
      }
    })();
  }, [location.search, navigate]);

  // 보기 선택
  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedAnswer(optionIndex);
  };

  // 이전/다음
  const handlePrevious = () => {
    if (currentQuestion === 0) return;
    setCurrentQuestion((q) => q - 1);
    setSelectedAnswer(answers[currentQuestion - 1] ?? null);
  };

  const handleNext = async () => {
    if (selectedAnswer == null) return;

    const nextAnswers = [...answers];
    nextAnswers[currentQuestion] = selectedAnswer;
    setAnswers(nextAnswers);

    // 다음 문제로
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((q) => q + 1);
      setSelectedAnswer(nextAnswers[currentQuestion + 1] ?? null);
      return;
    }

    // 마지막 문제 → 결과 요청
    try {
      const compactNums = nextAnswers.filter((v): v is number => typeof v === "number");
      const payload = { answers: compactNums.map(String) }; // 서버 DTO: ChemiRequest(List<String> answers)

      const chemiRes = await api.post<string>("/chemi/result", payload, {
        headers: { "Content-Type": "application/json" },
        responseType: "text", // 서버가 String 반환
      });

      const result = chemiRes.data;
      setChemiResult(result);

      // 로그인 여부 확인
      try {
        await api.get("/auth/me"); // 200이면 로그인 상태

        // 로그인 상태 → 결과 저장
        try {
          // ✅ 문자열을 text/plain으로 전송 (따옴표 문제 방지)
          await api.post("/chemi/me", result, {
            headers: { "Content-Type": "text/plain" },
          });
          setShowSavedModal(true);
        } catch (saveErr) {
          console.error("케미 저장 실패:", saveErr);
          alert("케미 결과 저장에 실패했습니다.");
          navigate("/");
        }
      } catch {
        // 비로그인 → 로그인 페이지로 이동 (리다이렉트 안전 조립)
        const base = location.pathname + location.search;
        const join = location.search ? "&" : "?";
        const backWithChemi = `${base}${join}chemi=${encodeURIComponent(result)}`;
        navigate(`/login?redirect=${encodeURIComponent(backWithChemi)}`);
      }
    } catch (err) {
      console.error("케미 테스트 완료 처리 실패:", err);
      alert("케미 테스트 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#BB9EF4" }}>
      <Header activeMenu={currentPage} onMenuClick={handleMenuClick} />

      <main className="px-4 py-12">
        {/* 중앙 콘텐츠 박스 */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 min-h-[500px] flex flex-col">
            {/* 진행률 바 */}
            <ProgressBar current={currentQuestion + 1} total={totalQuestions} />

            {/* 질문 섹션 */}
            <div className="flex-1 text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Q{currentQuiz.number}.</h2>
              <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-8">여행 일정을 짤 때 당신은?</h3>

              {/* 예시 설명 문구(원한다면 JSON의 질문문으로 대체하세요) */}
              <div className="space-y-4 mb-8">
                <p className="text-gray-600 text-base">일정표는 필수지! 시간 단위로 짜야 마음이 놓여.</p>
                <p className="text-gray-500 text-sm">그날그날 기분 따라 움직이는 게 여행이지~</p>
              </div>

              {/* 답변 옵션 */}
              <div className="space-y-4 mb-12">
                {currentQuiz.options.map((option) => (
                  <button
                    key={option.index}
                    onClick={() => handleAnswerSelect(option.index)}
                    className={`
                      w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
                      ${selectedAnswer === option.index
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-25"}
                    `}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            </div>

            {/* 네비게이션 버튼 */}
            <div className="flex justify-between gap-4">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200
                  ${currentQuestion === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"}
                `}
              >
                <ChevronLeft className="w-4 h-4" />
                이전
              </button>

              <button
                onClick={handleNext}
                disabled={selectedAnswer === null}
                className={`
                  px-8 py-3 rounded-xl font-medium transition-all duration-200
                  ${selectedAnswer !== null
                    ? "bg-purple-500 text-white hover:bg-purple-600 shadow-lg hover:shadow-xl"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"}
                `}
              >
                {currentQuestion === totalQuestions - 1 ? "완료" : "다음"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 저장 완료 모달 */}
      {showSavedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">케미 결과가 저장되었습니다!</h3>
              <p className="text-gray-600 mb-4">
                당신의 여행 케미: <span className="font-semibold text-purple-600">{chemiResult}</span>
              </p>
              <p className="text-sm text-gray-500">마이페이지로 이동하시겠습니까?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSavedModalCancel}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSavedModalConfirm}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChemiQuiz;
