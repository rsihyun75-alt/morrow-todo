"use client";

import { FormEvent, startTransition, useEffect, useMemo, useState } from "react";

type Priority = "high" | "medium" | "low";
type Filter = "all" | "active" | "completed";

type Todo = {
  id: string;
  title: string;
  priority: Priority;
  completed: boolean;
  createdAt: string;
};

const STORAGE_KEY = "morrow-todos-v1";

const seedTodos: Todo[] = [
  {
    id: "morning-routine",
    title: "오늘 가장 중요한 일 하나 정하기",
    priority: "high",
    completed: false,
    createdAt: "2026-08-07T08:30:00.000Z",
  },
  {
    id: "inbox-zero",
    title: "메일함 15분만 정리하기",
    priority: "medium",
    completed: false,
    createdAt: "2026-08-07T09:10:00.000Z",
  },
  {
    id: "walk",
    title: "점심 후 가볍게 걷기",
    priority: "low",
    completed: true,
    createdAt: "2026-08-07T07:45:00.000Z",
  },
];

const priorityLabels: Record<Priority, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

const priorityDescriptions: Record<Priority, string> = {
  high: "오늘 꼭",
  medium: "여유 있게",
  low: "시간 나면",
};

function createTodoId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `todo-${Date.now()}`;
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatToday() {
  return new Intl.DateTimeFormat("ko-KR", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [today, setToday] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      const savedTodos = window.localStorage.getItem(STORAGE_KEY);
      let nextTodos = seedTodos;

      if (savedTodos) {
        try {
          const parsedTodos = JSON.parse(savedTodos) as Todo[];
          nextTodos = Array.isArray(parsedTodos) ? parsedTodos : seedTodos;
        } catch {
          nextTodos = seedTodos;
        }
      }

      startTransition(() => {
        setTodos(nextTodos);
        setToday(formatToday());
        setIsReady(true);
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isReady) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }
  }, [isReady, todos]);

  const completedCount = todos.filter((todo) => todo.completed).length;
  const activeCount = todos.length - completedCount;
  const progress = todos.length ? Math.round((completedCount / todos.length) * 100) : 0;

  const filteredTodos = useMemo(() => {
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

  function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTodo.trim();

    if (!title) return;

    setTodos((currentTodos) => [
      {
        id: createTodoId(),
        title,
        priority,
        completed: false,
        createdAt: new Date().toISOString(),
      },
      ...currentTodos,
    ]);
    setNewTodo("");
    setPriority("medium");
  }

  function toggleTodo(id: string) {
    setTodos((currentTodos) =>
      currentTodos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)),
    );
  }

  function deleteTodo(id: string) {
    setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== id));
  }

  function clearCompleted() {
    setTodos((currentTodos) => currentTodos.filter((todo) => !todo.completed));
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-mark" aria-hidden="true">
            m.
          </div>
          <div className="brand-name">morrow</div>
          <p className="brand-copy">
            오늘에 집중하는
            <br />
            조용한 할 일 공간
          </p>

          <nav className="side-nav" aria-label="주요 메뉴">
            <button
              className={`side-link ${filter === "all" ? "active" : ""}`}
              type="button"
              onClick={() => setFilter("all")}
            >
              <span className="nav-icon" aria-hidden="true">
                ◎
              </span>
              오늘의 할 일
              <span className="nav-count">{activeCount}</span>
            </button>
            <button
              className={`side-link ${filter === "active" ? "active" : ""}`}
              type="button"
              onClick={() => setFilter("active")}
            >
              <span className="nav-icon" aria-hidden="true">
                ◌
              </span>
              진행 중
              <span className="nav-count">{activeCount}</span>
            </button>
            <button
              className={`side-link ${filter === "completed" ? "active" : ""}`}
              type="button"
              onClick={() => setFilter("completed")}
            >
              <span className="nav-icon" aria-hidden="true">
                ✓
              </span>
              완료한 일
              <span className="nav-count">{completedCount}</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="mini-progress-card">
            <div className="mini-progress-heading">
              <span>오늘의 진행률</span>
              <strong>{progress}%</strong>
            </div>
            <div className="progress-track" aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </div>
            <p>{activeCount > 0 ? `${activeCount}개의 일이 남아 있어요` : "오늘의 목표를 모두 마쳤어요"}</p>
          </div>

          <button className="side-link settings-link" type="button" onClick={() => setFilter("all")}>
            <span className="nav-icon" aria-hidden="true">
              ◒
            </span>
            나의 공간
          </button>

          <div className="profile-row">
            <div className="avatar" aria-hidden="true">
              J
            </div>
            <div>
              <strong>지금의 나</strong>
              <span>Focus mode</span>
            </div>
            <span className="profile-more" aria-hidden="true">
              ···
            </span>
          </div>
        </div>
      </aside>

      <section className="content-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>나의 공간</span>
            <b>/</b>
            <strong>오늘</strong>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" type="button" aria-label="알림">
              <span aria-hidden="true">♧</span>
              <i />
            </button>
            <button className="avatar avatar-small" type="button" aria-label="프로필">
              J
            </button>
          </div>
        </header>

        <div className="page-intro">
          <div>
            <p className="eyebrow">{today || "오늘의 기록"}</p>
            <h1>
              좋은 하루의 시작,
              <br />
              <span>작은 한 걸음부터.</span>
            </h1>
            <p className="intro-copy">오늘의 중요한 일만 남겨두고, 하나씩 가볍게 시작해볼까요?</p>
          </div>
          <div className="intro-stats" aria-label="할 일 요약">
            <div>
              <strong>{todos.length}</strong>
              <span>전체</span>
            </div>
            <div>
              <strong>{completedCount}</strong>
              <span>완료</span>
            </div>
            <div>
              <strong>{activeCount}</strong>
              <span>남음</span>
            </div>
          </div>
        </div>

        <div className="workspace-grid">
          <section className="todo-panel" aria-labelledby="focus-title">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">MY FOCUS</p>
                <h2 id="focus-title">오늘의 할 일</h2>
              </div>
              <span className="date-chip">
                {completedCount}/{todos.length} 완료
              </span>
            </div>

            <form className="add-form" onSubmit={addTodo}>
              <span className="plus-icon" aria-hidden="true">
                +
              </span>
              <input
                value={newTodo}
                onChange={(event) => setNewTodo(event.target.value)}
                placeholder="새로운 할 일을 적어보세요"
                aria-label="새로운 할 일"
              />
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as Priority)}
                aria-label="우선순위"
              >
                <option value="high">높음</option>
                <option value="medium">보통</option>
                <option value="low">낮음</option>
              </select>
              <button type="submit">
                추가하기 <span aria-hidden="true">↵</span>
              </button>
            </form>

            <div className="list-toolbar">
              <div className="filter-tabs" role="tablist" aria-label="할 일 필터">
                <button
                  className={filter === "all" ? "selected" : ""}
                  onClick={() => setFilter("all")}
                  type="button"
                  role="tab"
                  aria-selected={filter === "all"}
                >
                  전체 <span>{todos.length}</span>
                </button>
                <button
                  className={filter === "active" ? "selected" : ""}
                  onClick={() => setFilter("active")}
                  type="button"
                  role="tab"
                  aria-selected={filter === "active"}
                >
                  진행 중 <span>{activeCount}</span>
                </button>
                <button
                  className={filter === "completed" ? "selected" : ""}
                  onClick={() => setFilter("completed")}
                  type="button"
                  role="tab"
                  aria-selected={filter === "completed"}
                >
                  완료 <span>{completedCount}</span>
                </button>
              </div>
              <label className="search-box">
                <span aria-hidden="true">⌕</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="검색" aria-label="할 일 검색" />
              </label>
            </div>

            <div className="todo-list" aria-live="polite">
              {!isReady && <div className="empty-state loading-state"><span aria-hidden="true">…</span><h3>오늘의 일을 준비하고 있어요</h3><p>잠시만 기다려주세요.</p></div>}
              {isReady && filteredTodos.map((todo) => (
                <article className={`todo-item ${todo.completed ? "is-complete" : ""}`} key={todo.id}>
                  <button
                    className="check-button"
                    type="button"
                    onClick={() => toggleTodo(todo.id)}
                    aria-label={`${todo.title} ${todo.completed ? "완료 취소" : "완료"}`}
                    aria-pressed={todo.completed}
                  >
                    <span aria-hidden="true">✓</span>
                  </button>
                  <div className="todo-content">
                    <h3>{todo.title}</h3>
                    <p>
                      <span className={`priority-dot priority-${todo.priority}`} />
                      {priorityDescriptions[todo.priority]}
                    </p>
                  </div>
                  <span className={`priority-label priority-label-${todo.priority}`}>{priorityLabels[todo.priority]}</span>
                  <time dateTime={todo.createdAt}>{formatTime(todo.createdAt)}</time>
                  <button className="delete-button" type="button" onClick={() => deleteTodo(todo.id)} aria-label={`${todo.title} 삭제`}>
                    ×
                  </button>
                </article>
              ))}
              {isReady && filteredTodos.length === 0 && (
                <div className="empty-state">
                  <span aria-hidden="true">☼</span>
                  <h3>{query ? "검색 결과가 없어요" : "아직 보이는 일이 없어요"}</h3>
                  <p>{query ? "다른 단어로 다시 찾아보세요." : "새로운 할 일을 추가하거나 다른 필터를 선택해보세요."}</p>
                </div>
              )}
            </div>

            {completedCount > 0 && (
              <button className="clear-button" type="button" onClick={clearCompleted}>
                완료한 일 모두 지우기 <span aria-hidden="true">→</span>
              </button>
            )}
          </section>

          <aside className="insights-column" aria-label="오늘의 인사이트">
            <section className="quote-card">
              <span className="quote-mark" aria-hidden="true">
                “
              </span>
              <p>
                완벽하게 해내려 하기보다,
                <br />
                <strong>한 걸음씩 나아가요.</strong>
              </p>
              <span className="quote-author">morrow note&nbsp; / &nbsp;04</span>
            </section>

            <section className="insight-card">
              <div className="insight-header">
                <div>
                  <p className="section-kicker">YOUR RHYTHM</p>
                  <h2>나의 리듬</h2>
                </div>
                <span className="trend-icon" aria-hidden="true">
                  ↗
                </span>
              </div>
              <div className="ring-wrap">
                <div className="progress-ring" style={{ background: `conic-gradient(#23483f ${progress * 3.6}deg, #e7ede8 0deg)` }}>
                  <div>
                    <strong>{progress}%</strong>
                    <span>오늘 완료</span>
                  </div>
                </div>
                <div className="ring-copy">
                  <strong>{progress >= 70 ? "아주 좋아요" : "좋은 시작이에요"}</strong>
                  <p>{activeCount > 0 ? `남은 일 ${activeCount}개도 천천히 마무리해요.` : "오늘의 리듬을 잘 지키고 있어요."}</p>
                </div>
              </div>
              <div className="week-bars" aria-label="이번 주 진행률">
                <span style={{ height: "40%" }}><i>월</i></span>
                <span style={{ height: "64%" }}><i>화</i></span>
                <span style={{ height: "52%" }}><i>수</i></span>
                <span style={{ height: "80%" }}><i>목</i></span>
                <span className="today" style={{ height: `${Math.max(progress, 12)}%` }}><i>금</i></span>
                <span style={{ height: "28%" }}><i>토</i></span>
                <span style={{ height: "20%" }}><i>일</i></span>
              </div>
            </section>

            <section className="streak-card">
              <div className="streak-icon" aria-hidden="true">✦</div>
              <div>
                <p className="section-kicker">KEEP GOING</p>
                <h2>4일 연속 기록 중</h2>
                <p>작은 습관이 멋진 하루를 만들어요.</p>
              </div>
              <span className="streak-arrow" aria-hidden="true">↗</span>
            </section>
          </aside>
        </div>

        <footer className="page-footer">
          <span>morrow / your calm productivity space</span>
          <span>⌘ K&nbsp; 빠른 검색</span>
        </footer>
      </section>
    </main>
  );
}
