"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Priority = "high" | "medium" | "low";
type Filter = "all" | "active" | "completed";

type Todo = {
  id: number;
  title: string;
  note: string;
  time: string;
  priority: Priority;
  completed: boolean;
};

const starterTodos: Todo[] = [
  {
    id: 1,
    title: "주간 팀 미팅 아젠다 정리하기",
    note: "업무 · 오늘",
    time: "09:30",
    priority: "high",
    completed: false,
  },
  {
    id: 2,
    title: "오후 운동 30분 하기",
    note: "건강 · 오늘",
    time: "18:00",
    priority: "medium",
    completed: false,
  },
  {
    id: 3,
    title: "뉴스레터 초안 검토하기",
    note: "콘텐츠 · 오늘",
    time: "14:00",
    priority: "medium",
    completed: true,
  },
  {
    id: 4,
    title: "다음 주 출장 숙소 예약하기",
    note: "개인 · 오늘",
    time: "19:30",
    priority: "low",
    completed: false,
  },
  {
    id: 5,
    title: "책 20페이지 읽기",
    note: "성장 · 오늘",
    time: "22:00",
    priority: "low",
    completed: true,
  },
];

const priorityLabels: Record<Priority, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

const priorityDots: Record<Priority, string> = {
  high: "#e76f51",
  medium: "#e9b44c",
  low: "#6b9e86",
};

function formatDate() {
  return new Intl.DateTimeFormat("ko-KR", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>(starterTodos);
  const [newTodo, setNewTodo] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedTodos = window.localStorage.getItem("morrow-todos");
      if (savedTodos) {
        try {
          setTodos(JSON.parse(savedTodos) as Todo[]);
        } catch {
          window.localStorage.removeItem("morrow-todos");
        }
      }
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem("morrow-todos", JSON.stringify(todos));
    }
  }, [todos, hydrated]);

  const completedCount = todos.filter((todo) => todo.completed).length;
  const activeCount = todos.length - completedCount;
  const progress = todos.length ? Math.round((completedCount / todos.length) * 100) : 0;

  const filteredTodos = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return todos.filter((todo) => {
      const matchesFilter =
        filter === "all" || (filter === "active" && !todo.completed) || (filter === "completed" && todo.completed);
      const matchesQuery = !normalizedQuery || `${todo.title} ${todo.note}`.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query, todos]);

  function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTodo.trim();
    if (!title) return;

    setTodos((current) => [
      {
        id: Date.now(),
        title,
        note: "새 할 일 · 오늘",
        time: "오늘",
        priority,
        completed: false,
      },
      ...current,
    ]);
    setNewTodo("");
  }

  function toggleTodo(id: number) {
    setTodos((current) => current.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
  }

  function deleteTodo(id: number) {
    setTodos((current) => current.filter((todo) => todo.id !== id));
  }

  function clearCompleted() {
    setTodos((current) => current.filter((todo) => !todo.completed));
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-mark" aria-hidden="true">m.</div>
          <div className="brand-name">morrow</div>
          <p className="brand-copy">작은 루틴이 모여<br />더 나은 하루가 됩니다.</p>
        </div>

        <nav className="side-nav" aria-label="주 메뉴">
          <button className="side-link active" type="button"><span className="nav-icon">⌂</span>오늘의 할 일 <span className="nav-count">{activeCount}</span></button>
          <button className="side-link" type="button"><span className="nav-icon">▦</span>모든 할 일</button>
          <button className="side-link" type="button"><span className="nav-icon">◷</span>예정된 일정</button>
        </nav>

        <div className="sidebar-bottom">
          <div className="mini-progress-card">
            <div className="mini-progress-heading"><span>오늘의 진행률</span><strong>{progress}%</strong></div>
            <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
            <p>{completedCount === todos.length && todos.length > 0 ? "오늘의 목표를 모두 달성했어요!" : `${activeCount}개의 할 일이 남아 있어요.`}</p>
          </div>
          <button className="side-link settings-link" type="button"><span className="nav-icon">⚙</span>설정</button>
          <div className="profile-row"><div className="avatar">J</div><div><strong>지윤</strong><span>Focus mode</span></div><span className="profile-more">···</span></div>
        </div>
      </aside>

      <section className="content-area">
        <header className="topbar">
          <div className="breadcrumb"><span>나의 공간</span><b>/</b><strong>오늘</strong></div>
          <div className="topbar-actions"><button className="icon-button" type="button" aria-label="알림">♧<i /></button><button className="avatar avatar-small" type="button" aria-label="프로필">J</button></div>
        </header>

        <div className="page-intro">
          <div>
            <p className="eyebrow">{formatDate()}</p>
            <h1>좋은 아침이에요, 지윤님 <span aria-hidden="true">✦</span></h1>
            <p className="intro-copy">오늘도 가장 중요한 일부터, 가볍게 시작해볼까요?</p>
          </div>
          <div className="intro-stats" aria-label="할 일 요약">
            <div><strong>{todos.length}</strong><span>전체 할 일</span></div>
            <div><strong>{completedCount}</strong><span>완료했어요</span></div>
            <div><strong>{activeCount}</strong><span>남아 있어요</span></div>
          </div>
        </div>

        <div className="workspace-grid">
          <section className="todo-panel" aria-labelledby="focus-title">
            <div className="panel-heading">
              <div><p className="section-kicker">MY FOCUS</p><h2 id="focus-title">오늘의 할 일</h2></div>
              <span className="date-chip">{completedCount}/{todos.length || 0} 완료</span>
            </div>

            <form className="add-form" onSubmit={addTodo}>
              <span className="plus-icon" aria-hidden="true">＋</span>
              <input value={newTodo} onChange={(event) => setNewTodo(event.target.value)} placeholder="새로운 할 일을 입력해보세요" aria-label="새로운 할 일" />
              <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)} aria-label="우선순위">
                <option value="high">높은 우선순위</option><option value="medium">보통 우선순위</option><option value="low">낮은 우선순위</option>
              </select>
              <button type="submit">추가하기 <span>↵</span></button>
            </form>

            <div className="list-toolbar">
              <div className="filter-tabs" role="tablist" aria-label="할 일 필터">
                <button className={filter === "all" ? "selected" : ""} onClick={() => setFilter("all")} type="button" role="tab" aria-selected={filter === "all"}>전체 <span>{todos.length}</span></button>
                <button className={filter === "active" ? "selected" : ""} onClick={() => setFilter("active")} type="button" role="tab" aria-selected={filter === "active"}>진행 중 <span>{activeCount}</span></button>
                <button className={filter === "completed" ? "selected" : ""} onClick={() => setFilter("completed")} type="button" role="tab" aria-selected={filter === "completed"}>완료 <span>{completedCount}</span></button>
              </div>
              <label className="search-box"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="할 일 검색" aria-label="할 일 검색" /></label>
            </div>

            <div className="todo-list">
              {filteredTodos.map((todo) => (
                <article className={`todo-item ${todo.completed ? "is-complete" : ""}`} key={todo.id}>
                  <button className="check-button" type="button" onClick={() => toggleTodo(todo.id)} aria-label={`${todo.title} ${todo.completed ? "완료 취소" : "완료"}`}><span>✓</span></button>
                  <div className="todo-content"><h3>{todo.title}</h3><p><span className="priority-dot" style={{ backgroundColor: priorityDots[todo.priority] }} />{todo.note}</p></div>
                  <span className="priority-label">{priorityLabels[todo.priority]}</span>
                  <time>{todo.time}</time>
                  <button className="delete-button" type="button" onClick={() => deleteTodo(todo.id)} aria-label={`${todo.title} 삭제`}>×</button>
                </article>
              ))}
              {filteredTodos.length === 0 && <div className="empty-state"><span>◌</span><h3>아직 보이는 할 일이 없어요</h3><p>새로운 할 일을 추가하거나 다른 필터를 선택해보세요.</p></div>}
            </div>

            {completedCount > 0 && <button className="clear-button" type="button" onClick={clearCompleted}>완료한 할 일 모두 지우기 <span>→</span></button>}
          </section>

          <aside className="insights-column" aria-label="오늘의 인사이트">
            <section className="quote-card"><span className="quote-mark">“</span><p>완벽하게 하려고 하기보다,<br /><strong>한 걸음씩 나아가세요.</strong></p><span className="quote-author">— morrow note  /  04</span></section>
            <section className="insight-card">
              <div className="insight-header"><div><p className="section-kicker">YOUR RHYTHM</p><h2>나의 리듬</h2></div><span className="trend-icon">↗</span></div>
              <div className="ring-wrap"><div className="progress-ring" style={{ background: `conic-gradient(#23483f ${progress * 3.6}deg, #e8ece8 0deg)` }}><div><strong>{progress}%</strong><span>오늘 완료</span></div></div><div className="ring-copy"><strong>{progress >= 70 ? "아주 좋아요" : "좋은 시작이에요"}</strong><p>어제보다 {Math.max(progress - 15, 5)}% 더<br />집중하고 있어요.</p></div></div>
              <div className="week-bars"><span style={{ height: "40%" }}><i>월</i></span><span style={{ height: "64%" }}><i>화</i></span><span style={{ height: "52%" }}><i>수</i></span><span style={{ height: "80%" }}><i>목</i></span><span className="today" style={{ height: `${Math.max(progress, 12)}%` }}><i>금</i></span><span style={{ height: "28%" }}><i>토</i></span><span style={{ height: "20%" }}><i>일</i></span></div>
            </section>
            <section className="streak-card"><div className="streak-icon">✺</div><div><p className="section-kicker">KEEP GOING</p><h2>4일 연속 달성 중</h2><p>꾸준함이 가장 멋진 습관이에요.</p></div><span className="streak-arrow">↗</span></section>
          </aside>
        </div>
        <footer className="page-footer"><span>morrow / your calm productivity space</span><span>⌘ K&nbsp; 빠른 검색</span></footer>
      </section>
    </main>
  );
}
