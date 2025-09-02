import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import axios from "axios";

/** ===== 서버 DTO 타입 ===== */
type CommentResponse = {
  comment_id: number;
  parent_id: number | null;
  author: string;
  content: string;
  created_at: string; // ISO
};

type SpringPage<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // 0-base
  first: boolean;
  last: boolean;
};

/** ===== 화면용 타입 (무한 중첩) ===== */
type CommentNode = {
  id: number;
  author: string;
  content: string;
  createdAt: string;
  children: CommentNode[];
  showChildren: boolean;
};

type Props = {
  feedId: number;
  pageSize?: number; // 기본 20
};

const api = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true,
});

const FeedComments: React.FC<Props> = ({ feedId, pageSize = 20 }) => {
  /** 리스트 & 페이징 */
  const [roots, setRoots] = useState<CommentNode[]>([]);
  const [page, setPage] = useState(0);
  const [isLast, setIsLast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /** 최신 상태 ref (무한루프/중복 호출 방지) */
  const loadingRef = useRef(false);
  const isLastRef = useRef(false);
  useEffect(() => { isLastRef.current = isLast; }, [isLast]);

  /** 입력 상태 (루트 댓글) */
  const [draft, setDraft] = useState("");

  /** 각 노드별 답글 입력 상태 */
  const [replyOpen, setReplyOpen] = useState<Record<number, boolean>>({});
  const [replyDraft, setReplyDraft] = useState<Record<number, string>>({});

  /** 평면 리스트 → 재귀 트리 */
  const buildTree = (rows: CommentResponse[]): CommentNode[] => {
    const map = new Map<number, CommentNode>();
    const rootArr: CommentNode[] = [];

    // 1) 노드 생성
    for (const r of rows) {
      map.set(r.comment_id, {
        id: r.comment_id,
        author: r.author ?? "익명",
        content: r.content,
        createdAt: r.created_at,
        children: [],
        showChildren: true,
      });
    }

    // 2) 부모-자식 연결
    for (const r of rows) {
      const node = map.get(r.comment_id)!;
      if (r.parent_id == null) rootArr.push(node);
      else {
        const parent = map.get(r.parent_id);
        parent ? parent.children.push(node) : rootArr.push(node);
      }
    }

    // 3) 정렬
    const sortAsc = (a: CommentNode, b: CommentNode) => (a.createdAt > b.createdAt ? 1 : -1);
    const sortDesc = (a: CommentNode, b: CommentNode) => (a.createdAt < b.createdAt ? 1 : -1);
    const sortRec = (nodes: CommentNode[]) => {
      nodes.sort(sortDesc); // 루트 최신순
      for (const n of nodes) {
        n.children.sort(sortAsc); // 자식 오래된순
        sortRec(n.children);
      }
    };
    sortRec(rootArr);

    return rootArr;
  };

  /** 목록 조회 — 의존성 최소화 (feedId, pageSize만) */
  const fetchPage = useCallback(
    async (nextPage: number, replace = false) => {
      if (loadingRef.current) return;
      if (isLastRef.current && !replace) return;

      loadingRef.current = true;
      setLoading(true);
      setErr(null);

      try {
        const res = await api.get<SpringPage<CommentResponse>>(
          `/feed/${feedId}/comments`,
          { params: { page: nextPage, size: pageSize } }
        );

        setIsLast(res.data.last);
        isLastRef.current = res.data.last;

        const tree = buildTree(res.data.content ?? []);
        setRoots((prev) => (replace ? tree : [...prev, ...tree]));
        setPage(nextPage);
      } catch (e) {
        console.error("[comments] fetch error:", e);
        setErr("댓글을 불러오지 못했어요.");
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [feedId, pageSize]
  );

  /** 최초 로드: feedId마다 1회 */
  const initedFor = useRef<number | null>(null);
  useEffect(() => {
    if (initedFor.current === feedId) return;
    initedFor.current = feedId;

    setRoots([]);
    setPage(0);
    setIsLast(false);
    isLastRef.current = false;

    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchPage(0, true);
  }, [feedId]);

  /** 루트 댓글 등록 */
  const addRootComment = async () => {
    const text = draft.trim();
    if (!text) return;
    try {
      await api.post(`/feed/${feedId}/comments`,
        { parentId: null, comment: text },
        { headers: { "Content-Type": "application/json" } }
      );
      setDraft("");
      setRoots([]); setPage(0); setIsLast(false); isLastRef.current = false;
      fetchPage(0, true);
    } catch (e) {
      alert("댓글 등록에 실패했어요.");
      console.error(e);
    }
  };

  /** 답글 입력박스 토글 */
  const toggleReplyBox = (id: number) =>
    setReplyOpen((m) => ({ ...m, [id]: !m[id] }));

  /** 답글 등록 (모든 깊이) */
  const submitReply = async (parentId: number) => {
    const text = (replyDraft[parentId] ?? "").trim();
    if (!text) return;
    try {
      await api.post(`/feed/${feedId}/comments`,
        { parentId, comment: text },
        { headers: { "Content-Type": "application/json" } }
      );
      setReplyDraft((m) => ({ ...m, [parentId]: "" }));
      setReplyOpen((m) => ({ ...m, [parentId]: false }));
      setRoots([]); setPage(0); setIsLast(false); isLastRef.current = false;
      fetchPage(0, true);
    } catch (e) {
      alert("대댓글 등록에 실패했어요.");
      console.error(e);
    }
  };

  /** ✅ 트리 어디든 showChildren 토글하는 재귀 유틸 */
  const toggleShowChildrenInTree = (nodes: CommentNode[], targetId: number): CommentNode[] =>
    nodes.map((n) =>
      n.id === targetId
        ? { ...n, showChildren: !n.showChildren }
        : { ...n, children: toggleShowChildrenInTree(n.children, targetId) }
    );

  /** 전체 루트 댓글 수 */
  const totalCount = useMemo(() => roots.length, [roots]);

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-2 text-sm text-gray-600">{totalCount}개의 댓글</div>

      {/* 새 댓글 작성 (루트) */}
      <div className="mb-6">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full h-28 resize-y rounded-md border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="댓글을 입력하세요"
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={addRootComment}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            댓글 등록
          </button>
        </div>
      </div>

      {err && <div className="mb-2 text-sm text-red-600">{err}</div>}

      {/* 댓글 트리 */}
      <div>
        {roots.map((node) => (
          <CommentNodeView
            key={node.id}
            node={node}
            depth={0}
            replyOpen={replyOpen}
            replyDraft={replyDraft}
            onToggleReplyBox={toggleReplyBox}
            onChangeDraft={(id, v) => setReplyDraft((m) => ({ ...m, [id]: v }))}
            onSubmitReply={submitReply}
            onToggleChildren={(id) =>
              setRoots((prev) => toggleShowChildrenInTree(prev, id))
            }
          />
        ))}
      </div>

      {/* 더 보기 */}
      {!isLast && (
        <div className="mt-4 flex justify-center">
          <button
            disabled={loading}
            onClick={() => fetchPage(page + 1)}
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "불러오는 중…" : "더 보기"}
          </button>
        </div>
      )}
    </div>
  );
};

/** ===== 재귀 렌더링 컴포넌트 ===== */
type NodeViewProps = {
  node: CommentNode;
  depth: number;
  replyOpen: Record<number, boolean>;
  replyDraft: Record<number, string>;
  onToggleReplyBox: (id: number) => void;
  onChangeDraft: (id: number, value: string) => void;
  onSubmitReply: (parentId: number) => void;
  onToggleChildren: (id: number) => void;
};

const CommentNodeView: React.FC<NodeViewProps> = ({
  node,
  depth,
  replyOpen,
  replyDraft,
  onToggleReplyBox,
  onChangeDraft,
  onSubmitReply,
  onToggleChildren,
}) => {
  // Tailwind 동적 클래스 대신 inline style 로 들여쓰기
  const paddingLeft = Math.min(depth, 8) * 16; // 단계당 16px, 최대 8단계

  return (
    <div className="py-6 border-b border-gray-200" style={{ paddingLeft }}>
      {/* 작성자/내용 */}
      <div className="text-sm font-medium text-gray-900">{node.author || "익명"}</div>
      <div className="mt-1 whitespace-pre-line text-gray-800">{node.content}</div>

      {/* 액션 */}
      <div className="mt-2 flex items-center gap-3 text-sm">
        <button
          onClick={() => onToggleReplyBox(node.id)}
          className="text-blue-600 hover:underline"
        >
          {replyOpen[node.id] ? "답글 취소" : "답글 달기"}
        </button>

        {node.children.length > 0 && (
          <button
            onClick={() => onToggleChildren(node.id)}
            className="text-blue-600 hover:underline"
          >
            {node.showChildren ? "대댓글 숨기기" : "대댓글 펼치기"}
          </button>
        )}
      </div>

      {/* 답글 입력 */}
      {replyOpen[node.id] && (
        <div className="mt-4">
          <textarea
            value={replyDraft[node.id] ?? ""}
            onChange={(e) => onChangeDraft(node.id, e.target.value)}
            className="w-full h-24 resize-y rounded-md border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="대댓글을 입력하세요"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => onToggleReplyBox(node.id)}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={() => onSubmitReply(node.id)}
              className="rounded-md bg-gray-800 px-4 py-2 text-white hover:bg-gray-900"
            >
              대댓글 등록
            </button>
          </div>
        </div>
      )}

      {/* 자식 목록 (재귀) */}
      {node.children.length > 0 && node.showChildren && (
        <div className="mt-4 rounded-md bg-gray-100 p-4">
          {node.children.map((child) => (
            <CommentNodeView
              key={child.id}
              node={child}
              depth={depth + 1}
              replyOpen={replyOpen}
              replyDraft={replyDraft}
              onToggleReplyBox={onToggleReplyBox}
              onChangeDraft={onChangeDraft}
              onSubmitReply={onSubmitReply}
              onToggleChildren={onToggleChildren}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedComments;
