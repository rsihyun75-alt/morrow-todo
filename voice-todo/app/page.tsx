"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Filter = "all" | "active" | "completed";

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

type SpeechResult = {
  transcript: string;
};

type SpeechResultList = {
  length: number;
  [index: number]: {
    isFinal?: boolean;
    length: number;
    [index: number]: SpeechResult;
  };
};

type SpeechRecognitionEventLike = Event & {
  resultIndex?: number;
  results: SpeechResultList;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const STORAGE_KEY = "voice-todo-items-v1";

const filterLabels: Record<Filter, string> = {
  all: "전체",
  active: "진행 중",
  completed: "완료",
};

function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const speechWindow = window as SpeechRecognitionWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

function createTodo(title: string): Todo {
  const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id,
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  };
}

function formatTime(isoDate: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

function formatToday() {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [interimText, setInterimText] = useState("");
  const [voiceMessage, setVoiceMessage] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const savedTodos = window.localStorage.getItem(STORAGE_KEY);
      if (savedTodos) {
        try {
          const parsedTodos = JSON.parse(savedTodos) as Todo[];
          if (Array.isArray(parsedTodos)) setTodos(parsedTodos);
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }

      setVoiceSupported(Boolean(getSpeechRecognition()));
      setIsHydrated(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [isHydrated, todos]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const completedCount = todos.filter((todo) => todo.completed).length;
  const activeCount = todos.length - completedCount;
  const progress = todos.length ? Math.round((completedCount / todos.length) * 100) : 0;

  const visibleTodos = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return todos.filter((todo) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && !todo.completed) ||
        (filter === "completed" && todo.completed);
      const matchesQuery = !normalizedQuery || todo.title.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query, todos]);

  function handleAddTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;

    setTodos((currentTodos) => [createTodo(title), ...currentTodos]);
    setDraft("");
    setInterimText("");
    setVoiceMessage("");
  }

  function toggleTodo(id: string) {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  }

  function deleteTodo(id: string) {
    setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== id));
  }

  function clearCompleted() {
    setTodos((currentTodos) => currentTodos.filter((todo) => !todo.completed));
  }

  function handleVoiceToggle() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setVoiceSupported(false);
      setVoiceMessage("Chrome 브라우저에서 음성 입력을 사용할 수 있어요.");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "ko-KR";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setIsListening(true);
      setInterimText("");
      setVoiceMessage("듣고 있어요. 해야 할 일을 말해 주세요.");
    };
    recognition.onresult = (event) => {
      let finalText = "";
      let liveText = "";

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) finalText += transcript;
        else liveText += transcript;
      }

      if (finalText.trim()) setDraft(finalText.trim());
      setInterimText(liveText.trim());
    };
    recognition.onerror = (event) => {
      const errorMessage = event.error === "not-allowed"
        ? "마이크 권한이 필요해요. 브라우저 설정에서 허용해 주세요."
        : "음성을 인식하지 못했어요. 다시 한 번 말해 주세요.";
      setVoiceMessage(errorMessage);
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      setInterimText("");
      recognitionRef.current = null;
      setVoiceMessage((currentMessage) =>
        currentMessage.startsWith("듣고 있어요") ? "확인한 뒤 아래 버튼으로 할 일을 저장해 주세요." : currentMessage,
      );
    };

    recognitionRef.current = recognition;
    setVoiceMessage("");
    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceMessage("마이크를 시작하지 못했어요. 잠시 후 다시 눌러 주세요.");
    }
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <div className="app-container">
        <header className="topbar">
          <div className="brand-lockup">
            <div className="brand-mark" aria-hidden="true">말</div>
            <div>
              <p className="brand-name">말해봐</p>
              <p className="brand-subtitle">VOICE TODO</p>
            </div>
          </div>
          <div className="date-stamp">
            <span className="status-dot" aria-hidden="true" />
            {formatToday()}
          </div>
        </header>

        <section className="hero-section" aria-labelledby="page-title">
          <div className="hero-copy">
            <p className="eyebrow">오늘의 작은 시작</p>
            <h1 id="page-title">
              생각난 일은
              <br />
              <em>말하면 바로 남아요.</em>
            </h1>
            <p className="hero-description">
              손을 멈추지 않고, Chrome 음성 인식으로<br className="desktop-break" />
              해야 할 일을 가볍게 기록해 보세요.
            </p>
          </div>

          <div className="progress-summary" aria-label="오늘의 진행률">
            <div className="progress-orbit" style={{ background: `conic-gradient(var(--forest) ${progress * 3.6}deg, #e4dfd6 0deg)` }}>
              <div className="progress-orbit-inner">
                <strong>{progress}%</strong>
                <span>완료</span>
              </div>
            </div>
            <div className="summary-copy">
              <span>오늘의 기록</span>
              <strong>{activeCount > 0 ? `${activeCount}개 남았어요` : "모두 해냈어요"}</strong>
            </div>
          </div>
        </section>

        <section className="capture-card" aria-labelledby="capture-title">
          <div className="capture-heading">
            <div>
              <div className="feature-label"><span aria-hidden="true">✦</span> QUICK CAPTURE</div>
              <h2 id="capture-title">새 할 일 추가</h2>
            </div>
            <span className="browser-badge">Chrome STT</span>
          </div>

          <form className="capture-form" onSubmit={handleAddTodo}>
            <div className={`input-wrap ${isListening ? "is-listening" : ""}`}>
              <span className="input-prefix" aria-hidden="true">↳</span>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="예: 장 보고 저녁에 운동하기"
                aria-label="새 할 일"
                autoComplete="off"
              />
              <button
                className={`voice-button ${isListening ? "is-active" : ""}`}
                type="button"
                onClick={handleVoiceToggle}
                aria-label={isListening ? "음성 인식 멈추기" : "음성으로 할 일 입력하기"}
                aria-pressed={isListening}
                data-testid="voice-button"
              >
                <span aria-hidden="true">{isListening ? "■" : "◉"}</span>
              </button>
            </div>
            <button className="add-button" type="submit" disabled={!draft.trim()}>
              <span>할 일 추가</span>
              <span aria-hidden="true">↗</span>
            </button>
          </form>

          <div className="voice-status" aria-live="polite">
            <span className={`status-pip ${isListening ? "is-listening" : ""}`} aria-hidden="true" />
            <span>
              {isListening
                ? interimText || "듣고 있어요…"
                : voiceMessage || (voiceSupported ? "마이크를 누르고 말해 보세요. 내용은 입력창에서 확인할 수 있어요." : "이 브라우저에서는 음성 입력을 지원하지 않아요.")}
            </span>
          </div>
        </section>

        <section className="todo-section" aria-labelledby="todo-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MY LIST</p>
              <h2 id="todo-title">오늘의 할 일 <span>{todos.length}</span></h2>
            </div>
            <div className="list-stats">
              <span><b>{completedCount}</b> 완료</span>
              <span><b>{activeCount}</b> 진행 중</span>
            </div>
          </div>

          <div className="list-tools">
            <div className="filter-tabs" role="tablist" aria-label="할 일 필터">
              {(Object.keys(filterLabels) as Filter[]).map((filterKey) => (
                <button
                  key={filterKey}
                  className={filter === filterKey ? "is-selected" : ""}
                  type="button"
                  role="tab"
                  aria-selected={filter === filterKey}
                  onClick={() => setFilter(filterKey)}
                >
                  {filterLabels[filterKey]}
                  <span>{filterKey === "all" ? todos.length : filterKey === "active" ? activeCount : completedCount}</span>
                </button>
              ))}
            </div>
            <label className="search-field">
              <span aria-hidden="true">⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="검색"
                aria-label="할 일 검색"
              />
            </label>
          </div>

          <div className="todo-list" aria-live="polite">
            {!isHydrated && (
              <div className="empty-state loading-state">
                <span className="empty-icon" aria-hidden="true">◌</span>
                <h3>기록을 불러오는 중이에요</h3>
              </div>
            )}

            {isHydrated && visibleTodos.map((todo) => (
              <article className={`todo-item ${todo.completed ? "is-complete" : ""}`} key={todo.id}>
                <button
                  className="check-button"
                  type="button"
                  onClick={() => toggleTodo(todo.id)}
                  aria-label={`${todo.title} ${todo.completed ? "완료 취소" : "완료 처리"}`}
                  aria-pressed={todo.completed}
                >
                  <span aria-hidden="true">✓</span>
                </button>
                <div className="todo-text">
                  <h3>{todo.title}</h3>
                  <time dateTime={todo.createdAt}>{formatTime(todo.createdAt)}에 추가</time>
                </div>
                <button
                  className="delete-button"
                  type="button"
                  onClick={() => deleteTodo(todo.id)}
                  aria-label={`${todo.title} 삭제`}
                >
                  ×
                </button>
              </article>
            ))}

            {isHydrated && visibleTodos.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon" aria-hidden="true">✦</span>
                <h3>{query ? "검색 결과가 없어요" : filter === "completed" ? "아직 완료한 일이 없어요" : "아직 적어 둔 일이 없어요"}</h3>
                <p>{query ? "다른 단어로 다시 검색해 보세요." : "위의 마이크를 누르고 첫 할 일을 말해 보세요."}</p>
              </div>
            )}
          </div>

          {completedCount > 0 && (
            <button className="clear-button" type="button" onClick={clearCompleted}>
              완료한 일 모두 지우기 <span aria-hidden="true">↗</span>
            </button>
          )}
        </section>

        <footer className="footer-note">
          <span>말해봐 · 작은 기록이 오늘을 가볍게</span>
          <span>이 기기에 안전하게 저장돼요</span>
        </footer>
      </div>
    </main>
  );
}
