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
  all: "?꾩껜",
  active: "吏꾪뻾 以?,
  completed: "?꾨즺",
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
      setVoiceMessage("Chrome 釉뚮씪?곗??먯꽌 ?뚯꽦 ?낅젰???ъ슜?????덉뼱??");
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
      setVoiceMessage("?ｊ퀬 ?덉뼱?? ?댁빞 ???쇱쓣 留먰빐 二쇱꽭??");
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
        ? "留덉씠??沅뚰븳???꾩슂?댁슂. 釉뚮씪?곗? ?ㅼ젙?먯꽌 ?덉슜??二쇱꽭??"
        : "?뚯꽦???몄떇?섏? 紐삵뻽?댁슂. ?ㅼ떆 ??踰?留먰빐 二쇱꽭??";
      setVoiceMessage(errorMessage);
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      setInterimText("");
      recognitionRef.current = null;
      setVoiceMessage((currentMessage) =>
        currentMessage.startsWith("?ｊ퀬 ?덉뼱??) ? "?뺤씤?????꾨옒 踰꾪듉?쇰줈 ???쇱쓣 ??ν빐 二쇱꽭??" : currentMessage,
      );
    };

    recognitionRef.current = recognition;
    setVoiceMessage("");
    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceMessage("留덉씠?щ? ?쒖옉?섏? 紐삵뻽?댁슂. ?좎떆 ???ㅼ떆 ?뚮윭 二쇱꽭??");
    }
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <div className="app-container">
        <header className="topbar">
          <div className="brand-lockup">
            <div className="brand-mark" aria-hidden="true">留?/div>
            <div>
              <p className="brand-name">留먰빐遊?/p>
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
            <p className="eyebrow">?ㅻ뒛???묒? ?쒖옉</p>
            <h1 id="page-title">
              ?앷컖???쇱?
              <br />
              <em>留먰븯硫?諛붾줈 ?⑥븘??</em>
            </h1>
            <p className="hero-description">
              ?먯쓣 硫덉텛吏 ?딄퀬, Chrome ?뚯꽦 ?몄떇?쇰줈<br className="desktop-break" />
              ?댁빞 ???쇱쓣 媛蹂띻쾶 湲곕줉??蹂댁꽭??
            </p>
          </div>

          <div className="progress-summary" aria-label="?ㅻ뒛??吏꾪뻾瑜?>
            <div className="progress-orbit" style={{ background: `conic-gradient(var(--forest) ${progress * 3.6}deg, #e4dfd6 0deg)` }}>
              <div className="progress-orbit-inner">
                <strong>{progress}%</strong>
                <span>?꾨즺</span>
              </div>
            </div>
            <div className="summary-copy">
              <span>?ㅻ뒛??湲곕줉</span>
              <strong>{activeCount > 0 ? `${activeCount}媛??⑥븯?댁슂` : "紐⑤몢 ?대깉?댁슂"}</strong>
            </div>
          </div>
        </section>

        <section className="capture-card" aria-labelledby="capture-title">
          <div className="capture-heading">
            <div>
              <div className="feature-label"><span aria-hidden="true">??/span> QUICK CAPTURE</div>
              <h2 id="capture-title">??????異붽?</h2>
            </div>
            <span className="browser-badge">Chrome STT</span>
          </div>

          <form className="capture-form" onSubmit={handleAddTodo}>
            <div className={`input-wrap ${isListening ? "is-listening" : ""}`}>
              <span className="input-prefix" aria-hidden="true">??/span>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="?? ??蹂닿퀬 ??곸뿉 ?대룞?섍린"
                aria-label="??????
                autoComplete="off"
              />
              <button
                className={`voice-button ${isListening ? "is-active" : ""}`}
                type="button"
                onClick={handleVoiceToggle}
                aria-label={isListening ? "?뚯꽦 ?몄떇 硫덉텛湲? : "?뚯꽦?쇰줈 ?????낅젰?섍린"}
                aria-pressed={isListening}
                data-testid="voice-button"
              >
                <span aria-hidden="true">{isListening ? "?? : "??}</span>
              </button>
            </div>
            <button className="add-button" type="submit" disabled={!draft.trim()}>
              <span>????異붽?</span>
              <span aria-hidden="true">??/span>
            </button>
          </form>

          <div className="voice-status" aria-live="polite">
            <span className={`status-pip ${isListening ? "is-listening" : ""}`} aria-hidden="true" />
            <span>
              {isListening
                ? interimText || "?ｊ퀬 ?덉뼱?붴?
                : voiceMessage || (voiceSupported ? "留덉씠?щ? ?꾨Ⅴ怨?留먰빐 蹂댁꽭?? ?댁슜? ?낅젰李쎌뿉???뺤씤?????덉뼱??" : "??釉뚮씪?곗??먯꽌???뚯꽦 ?낅젰??吏?먰븯吏 ?딆븘??")}
            </span>
          </div>
        </section>

        <section className="todo-section" aria-labelledby="todo-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MY LIST</p>
              <h2 id="todo-title">?ㅻ뒛??????<span>{todos.length}</span></h2>
            </div>
            <div className="list-stats">
              <span><b>{completedCount}</b> ?꾨즺</span>
              <span><b>{activeCount}</b> 吏꾪뻾 以?/span>
            </div>
          </div>

          <div className="list-tools">
            <div className="filter-tabs" role="tablist" aria-label="?????꾪꽣">
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
              <span aria-hidden="true">??/span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="寃??
                aria-label="????寃??
              />
            </label>
          </div>

          <div className="todo-list" aria-live="polite">
            {!isHydrated && (
              <div className="empty-state loading-state">
                <span className="empty-icon" aria-hidden="true">??/span>
                <h3>湲곕줉??遺덈윭?ㅻ뒗 以묒씠?먯슂</h3>
              </div>
            )}

            {isHydrated && visibleTodos.map((todo) => (
              <article className={`todo-item ${todo.completed ? "is-complete" : ""}`} key={todo.id}>
                <button
                  className="check-button"
                  type="button"
                  onClick={() => toggleTodo(todo.id)}
                  aria-label={`${todo.title} ${todo.completed ? "?꾨즺 痍⑥냼" : "?꾨즺 泥섎━"}`}
                  aria-pressed={todo.completed}
                >
                  <span aria-hidden="true">??/span>
                </button>
                <div className="todo-text">
                  <h3>{todo.title}</h3>
                  <time dateTime={todo.createdAt}>{formatTime(todo.createdAt)}??異붽?</time>
                </div>
                <button
                  className="delete-button"
                  type="button"
                  onClick={() => deleteTodo(todo.id)}
                  aria-label={`${todo.title} ??젣`}
                >
                  횞
                </button>
              </article>
            ))}

            {isHydrated && visibleTodos.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon" aria-hidden="true">??/span>
                <h3>{query ? "寃??寃곌낵媛 ?놁뼱?? : filter === "completed" ? "?꾩쭅 ?꾨즺???쇱씠 ?놁뼱?? : "?꾩쭅 ?곸뼱 ???쇱씠 ?놁뼱??}</h3>
                <p>{query ? "?ㅻⅨ ?⑥뼱濡??ㅼ떆 寃?됲빐 蹂댁꽭??" : "?꾩쓽 留덉씠?щ? ?꾨Ⅴ怨?泥????쇱쓣 留먰빐 蹂댁꽭??"}</p>
              </div>
            )}
          </div>

          {completedCount > 0 && (
            <button className="clear-button" type="button" onClick={clearCompleted}>
              ?꾨즺????紐⑤몢 吏?곌린 <span aria-hidden="true">??/span>
            </button>
          )}
        </section>

        <footer className="footer-note">
          <span>留먰빐遊?쨌 ?묒? 湲곕줉???ㅻ뒛??媛蹂띻쾶</span>
          <span>??湲곌린???덉쟾?섍쾶 ??λ뤌??/span>
        </footer>
      </div>
    </main>
  );
}
