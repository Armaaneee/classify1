import { useEffect, useMemo, useRef, useState } from "react"
import "./App.css"

type Assignment = {
  name: string
  grade: number
  weight: number
}

type ClassItem = {
  id: string
  name: string
  assignments: Assignment[]
}

type KanbanCard = {
  id: string
  text: string
  dueDate: string
}

type KanbanList = {
  id: string
  title: string
  cards: KanbanCard[]
}

type View = "dashboard" | "classView" | "taskBoard" | "calendar"

const STORAGE_KEY = "classify-data"
const KANBAN_STORAGE_KEY = "classify-kanban"

const defaultLists: KanbanList[] = [
  { id: "todo", title: "To do", cards: [] },
  { id: "progress", title: "In progress", cards: [] },
  { id: "done", title: "Complete", cards: [] }
]

const createId = (prefix: string) =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

const calculateAverage = (items: Assignment[]) => {
  let totalWeight = 0
  let totalScore = 0
  items.forEach((item) => {
    totalWeight += item.weight
    totalScore += item.grade * item.weight
  })
  if (!totalWeight) return 0
  return totalScore / totalWeight
}

const getAverageColor = (value: number) => {
  if (value < 50) return "#ef4444"
  if (value < 80) return "#f59e0b"
  return "#22c55e"
}

const formatISODate = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

const formatDueDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-")
  if (!year || !month || !day) return ""
  return `${day}/${month}/${year.slice(2)}`
}

const getDueDotClass = (cellDate: Date) => {
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfCell = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate())
  const diffMs = startOfCell.getTime() - startOfToday.getTime()
  const diffDays = Math.round(diffMs / 86400000)
  if (diffDays === 0 || diffDays === 1) return "calendar__dot--urgent"
  if (diffDays >= 2 && diffDays <= 7) return "calendar__dot--soon"
  return "calendar__dot--ok"
}

const getDueStatus = (dueDate: string) => {
  if (!dueDate) return ""
  const target = new Date(`${dueDate}T00:00:00`)
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diffMs = target.getTime() - startOfToday.getTime()
  const diffDays = Math.round(diffMs / 86400000)
  if (diffDays === 0 || diffDays === 1) return "due-urgent"
  if (diffDays >= 2 && diffDays <= 7) return "due-soon"
  return ""
}

function App() {
  const [view, setView] = useState<View>("dashboard")
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [activeClassId, setActiveClassId] = useState<string | null>(null)
  const [classNameInput, setClassNameInput] = useState("")
  const [assignmentForm, setAssignmentForm] = useState({ name: "", grade: "", weight: "" })
  const [kanbanLists, setKanbanLists] = useState<KanbanList[]>(defaultLists)
  const [newListName, setNewListName] = useState("")
  const [cardInputs, setCardInputs] = useState<Record<string, string>>({})
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeDueCard, setActiveDueCard] = useState<{ listId: string; cardId: string } | null>(null)
  const [draggingCard, setDraggingCard] = useState<{ listId: string; cardId: string } | null>(null)
  const [duePopoverOpen, setDuePopoverOpen] = useState(false)
  const [duePopoverPos, setDuePopoverPos] = useState({ top: 0, left: 0 })
  const [duePickerDate, setDuePickerDate] = useState(new Date())
  const [dueSelectedDate, setDueSelectedDate] = useState(new Date())
  const duePopoverRef = useRef<HTMLDivElement | null>(null)
  const activeClass = classes.find((item) => item.id === activeClassId) || null

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const data = JSON.parse(raw)
        if (Array.isArray(data)) {
          setClasses(
            data
              .filter((item) => item && item.id && item.name)
              .map((item) => ({
                id: item.id,
                name: item.name,
                assignments: Array.isArray(item.assignments) ? item.assignments : []
              }))
          )
        }
      } catch {
        // ignore
      }
    }
    const kanbanRaw = localStorage.getItem(KANBAN_STORAGE_KEY)
    if (kanbanRaw) {
      try {
        const data: Array<{
          id?: string
          title?: string
          cards?: Array<{ id?: string; text?: string; dueDate?: string } | string>
        }> = JSON.parse(kanbanRaw)
        if (Array.isArray(data)) {
          setKanbanLists(
            data
              .filter((list) => list && list.title)
              .map((list) => ({
                id: list.id || createId("l"),
                title: list.title || "",
                cards: Array.isArray(list.cards)
                  ? list.cards
                    .filter((card) => {
                      if (!card) return false
                      if (typeof card === "string") return Boolean(card)
                      return Boolean(card.text)
                    })
                    .map((card) => {
                        if (typeof card === "string") {
                          return { id: createId("c"), text: card, dueDate: "" }
                        }
                        return {
                          id: card.id || createId("c"),
                          text: card.text || "",
                          dueDate: card.dueDate || ""
                        }
                    })
                  : []
              }))
          )
        }
      } catch {
        // ignore
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(classes))
  }, [classes])

  useEffect(() => {
    localStorage.setItem(KANBAN_STORAGE_KEY, JSON.stringify(kanbanLists))
  }, [kanbanLists])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!duePopoverOpen) return
      const target = event.target
      if (!(target instanceof Element)) return
      if (duePopoverRef.current?.contains(target)) return
      if (target.closest(".kanban__due-toggle")) return
      setDuePopoverOpen(false)
      setActiveDueCard(null)
    }
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [duePopoverOpen])

  const dueCounts = useMemo(() => {
    const counts = new Map<string, number>()
    kanbanLists.forEach((list) => {
      list.cards.forEach((card) => {
        if (!card.dueDate) return
        counts.set(card.dueDate, (counts.get(card.dueDate) || 0) + 1)
      })
    })
    return counts
  }, [kanbanLists])

  const tasksForDate = (isoDate: string) => {
    const tasks: string[] = []
    kanbanLists.forEach((list) => {
      list.cards.forEach((card) => {
        if (card.dueDate === isoDate) tasks.push(card.text)
      })
    })
    return tasks
  }

  const addClass = () => {
    const name = classNameInput.trim()
    if (!name) return
    setClasses((prev) => [
      ...prev,
      { id: createId("c"), name, assignments: [] }
    ])
    setClassNameInput("")
  }

  const openClass = (id: string) => {
    setActiveClassId(id)
    setView("classView")
  }

  const removeClass = (id: string) => {
    setClasses((prev) => prev.filter((item) => item.id !== id))
    if (activeClassId === id) {
      setActiveClassId(null)
      setView("dashboard")
    }
  }

  const addAssignment = () => {
    if (!activeClass) return
    const name = assignmentForm.name.trim()
    const grade = Number(assignmentForm.grade)
    const weight = Number(assignmentForm.weight)
    if (!name || !Number.isFinite(grade) || !Number.isFinite(weight)) return
    setClasses((prev) =>
      prev.map((item) =>
        item.id === activeClass.id
          ? { ...item, assignments: [...item.assignments, { name, grade, weight }] }
          : item
      )
    )
    setAssignmentForm({ name: "", grade: "", weight: "" })
  }

  const removeAssignment = (index: number) => {
    if (!activeClass) return
    setClasses((prev) =>
      prev.map((item) =>
        item.id === activeClass.id
          ? { ...item, assignments: item.assignments.filter((_, i) => i !== index) }
          : item
      )
    )
  }

  const addKanbanList = () => {
    const name = newListName.trim()
    if (!name) return
    setKanbanLists((prev) => [...prev, { id: createId("l"), title: name, cards: [] }])
    setNewListName("")
  }

  const addKanbanCard = (listId: string) => {
    const text = (cardInputs[listId] || "").trim()
    if (!text) return
    setKanbanLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, cards: [...list.cards, { id: createId("k"), text, dueDate: "" }] }
          : list
      )
    )
    setCardInputs((prev) => ({ ...prev, [listId]: "" }))
  }

  const moveKanbanCard = (fromListId: string, toListId: string, cardId: string, toIndex: number) => {
    setKanbanLists((prev) => {
      const sourceList = prev.find((item) => item.id === fromListId)
      const targetList = prev.find((item) => item.id === toListId)
      if (!sourceList || !targetList) return prev
      const sourceIndex = sourceList.cards.findIndex((card) => card.id === cardId)
      if (sourceIndex === -1) return prev
      const movingCard = sourceList.cards[sourceIndex]
      if (!movingCard) return prev
      const removingFromSameList = fromListId === toListId
      const next = prev.map((item) => {
        if (item.id === fromListId) {
          return { ...item, cards: item.cards.filter((card) => card.id !== cardId) }
        }
        return item
      })
      const targetLength = removingFromSameList
        ? targetList.cards.length - 1
        : targetList.cards.length
      let targetIndex = Math.max(0, Math.min(toIndex, targetLength))
      if (removingFromSameList && targetIndex > sourceIndex) {
        targetIndex -= 1
      }
      return next.map((item) => {
        if (item.id !== toListId) return item
        const updatedCards = [...item.cards]
        updatedCards.splice(targetIndex, 0, movingCard)
        return { ...item, cards: updatedCards }
      })
    })
  }

  const parseDragPayload = (raw: string) => {
    const parts = raw.split("|")
    if (parts.length < 2) return null
    return parts
  }

  const resolveDraggedCard = (raw: string) => {
    if (draggingCard) return draggingCard
    const parts = parseDragPayload(raw)
    if (!parts || parts[0] !== "card") return null
    const [, listId, cardId] = parts
    if (!listId || !cardId) return null
    return { listId, cardId }
  }

  const removeKanbanList = (listId: string) => {
    setKanbanLists((prev) => prev.filter((list) => list.id !== listId))
  }

  const removeKanbanCard = (listId: string, cardId: string) => {
    setKanbanLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, cards: list.cards.filter((card) => card.id !== cardId) }
          : list
      )
    )
  }

  const updateKanbanCardDue = (listId: string, cardId: string, dueDate: string) => {
    setKanbanLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              cards: list.cards.map((card) =>
                card.id === cardId ? { ...card, dueDate } : card
              )
            }
          : list
      )
    )
  }

  const openDuePopover = (listId: string, cardId: string, anchor: HTMLButtonElement) => {
    setActiveDueCard({ listId, cardId })
    const card = kanbanLists
      .flatMap((list) => list.cards)
      .find((item) => item.id === cardId)
    const existing = card?.dueDate || ""
    if (existing) {
      const [y, m, d] = existing.split("-").map(Number)
      setDueSelectedDate(new Date(y, m - 1, d))
      setDuePickerDate(new Date(y, m - 1, 1))
    } else {
      const today = new Date()
      setDueSelectedDate(today)
      setDuePickerDate(new Date(today.getFullYear(), today.getMonth(), 1))
    }
    const rect = anchor.getBoundingClientRect()
    setDuePopoverPos({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX
    })
    setDuePopoverOpen(true)
  }

  const calendarCells = useMemo(() => {
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDay = (firstDay.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrev = new Date(year, month, 0).getDate()
    const cells: Array<
      { type: "muted"; day: number } | { type: "current"; date: Date }
    > = []
    for (let i = 0; i < startDay; i++) {
      cells.push({ type: "muted", day: daysInPrev - startDay + i + 1 })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ type: "current", date: new Date(year, month, d) })
    }
    const totalCells = startDay + daysInMonth
    const trailing = (7 - (totalCells % 7)) % 7
    for (let i = 1; i <= trailing; i++) {
      cells.push({ type: "muted", day: i })
    }
    return cells
  }, [calendarDate])

  const dueCells = useMemo(() => {
    const year = duePickerDate.getFullYear()
    const month = duePickerDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDay = (firstDay.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrev = new Date(year, month, 0).getDate()
    const cells: Array<
      { type: "muted"; day: number } | { type: "current"; date: Date }
    > = []
    for (let i = 0; i < startDay; i++) {
      cells.push({ type: "muted", day: daysInPrev - startDay + i + 1 })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ type: "current", date: new Date(year, month, d) })
    }
    const totalCells = startDay + daysInMonth
    const trailing = (7 - (totalCells % 7)) % 7
    for (let i = 1; i <= trailing; i++) {
      cells.push({ type: "muted", day: i })
    }
    return cells
  }, [duePickerDate])

  const topbarTitle =
    view === "taskBoard" ? "Task Board" : view === "calendar" ? "Calendar" : "Dashboard"

  const averageInfo = activeClass
    ? (() => {
      const avg = calculateAverage(activeClass.assignments)
      const rounded = Math.round(avg)
      return { rounded, color: getAverageColor(rounded) }
    })()
    : { rounded: 0, color: getAverageColor(0) }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar__top">
          <a
            className="brand"
            href="#dashboard"
            onClick={(event) => {
              event.preventDefault()
              setView("dashboard")
            }}
          >
            <span className="brand__icon">
              <svg viewBox="0 0 24 24">
                <path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z" />
              </svg>
            </span>
            Classify
          </a>
        </div>

        <nav className="nav">
          <a
            className="nav__item"
            href="#dashboard"
            onClick={(event) => {
              event.preventDefault()
              setView("dashboard")
            }}
          >
            <span className="nav__icon">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="3" width="8" height="8" rx="2" />
                <rect x="13" y="3" width="8" height="8" rx="2" />
                <rect x="3" y="13" width="8" height="8" rx="2" />
                <rect x="13" y="13" width="8" height="8" rx="2" />
              </svg>
            </span>
            Dashboard
          </a>
          <a
            className="nav__item"
            href="#taskBoard"
            onClick={(event) => {
              event.preventDefault()
              setView("taskBoard")
            }}
          >
            <span className="nav__icon">
              <svg viewBox="0 0 24 24">
                <path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 5h8M8 12h8M8 16h8" />
              </svg>
            </span>
            Task Board
          </a>
          <a
            className="nav__item"
            href="#calendar"
            onClick={(event) => {
              event.preventDefault()
              setView("calendar")
            }}
          >
            <span className="nav__icon">
              <svg viewBox="0 0 24 24">
                <path d="M7 2v2H5a2 2 0 0 0-2 2v3h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm14 9H3v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9Zm-13 3h4v4H8v-4Z" />
              </svg>
            </span>
            Calendar
          </a>
        </nav>

        <div className="sidebar__bottom">
          <div className="sidebar__credit">Made with ❤️ By Armaan J</div>
        </div>
      </aside>

      <main className="main">
        {view !== "classView" && (
          <header className="topbar">
            <div className="topbar__title">
              <h1>{topbarTitle}</h1>
            </div>
          </header>
        )}

        {view === "dashboard" && (
          <section className="page">
            <div className="page__header">
              <h2>Classes</h2>
            </div>

              <div className="card-grid">
                {classes.map((item) => {
                const avg = Math.round(calculateAverage(item.assignments))
                const color = getAverageColor(avg)
                const pct = Math.max(0, Math.min(100, avg))
                return (
                  <article
                    className="class-card"
                    key={item.id}
                    onClick={() => openClass(item.id)}
                  >
                    <div className="class-card__inner">
                      <button
                        className="delete-btn"
                        type="button"
                        onClick={(event) => {
                        event.stopPropagation()
                        removeClass(item.id)
                      }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                      <div className="gauge">
                        <svg className="gauge__svg" viewBox="0 0 100 50">
                          <path
                            className="gauge__track"
                            d="M5 50 A45 45 0 0 1 95 50"
                            pathLength={100}
                          />
                          <path
                            className="gauge__progress"
                            d="M5 50 A45 45 0 0 1 95 50"
                            pathLength={100}
                            style={{
                              stroke: color,
                              strokeDasharray: "100",
                              strokeDashoffset: String(100 - pct),
                              strokeLinecap: pct === 0 ? "butt" : "round",
                              opacity: pct === 0 ? "0" : "1"
                            }}
                          />
                        </svg>
                        <div className="gauge__value">{avg}%</div>
                      </div>
                      <div className="class-card__name">{item.name}</div>
                    </div>
                  </article>
                )
              })}

              <article className="class-card class-card--add">
                <div className="class-card__inner">
                  <input
                    className="add-input"
                    type="text"
                    placeholder="Enter Subject"
                    value={classNameInput}
                    onChange={(event) => setClassNameInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") addClass()
                    }}
                  />
                  <button
                    className="add-btn"
                    type="button"
                    onClick={addClass}
                  >
                    Add Class
                  </button>
                </div>
              </article>
            </div>
          </section>
        )}

        {view === "classView" && activeClass && (
          <section className="page">
            <a
              className="back"
              href="#"
              onClick={(event) => {
                event.preventDefault()
                setView("dashboard")
              }}
            >
              ← Back to Classes
            </a>
            <h2 className="class-title">{activeClass.name}</h2>
            <div className="class-summary">
              <div className="summary-title">
                Class Average: <span>{averageInfo.rounded}%</span>
              </div>
              <div className="summary-bar">
                <div
                  className="summary-fill"
                  style={{
                    width: `${Math.min(100, averageInfo.rounded)}%`,
                    background: averageInfo.color
                  }}
                ></div>
              </div>
            </div>

            <div className="grades">
              <h3>Grades</h3>
              <div className="grades-table">
                <div className="grades-head">
                  <div>Assignment</div>
                  <div>Grade</div>
                  <div>Weighting</div>
                  <div>Actions</div>
                </div>
                <div className="grades-input">
                  <input
                    type="text"
                    placeholder="Enter assignment name"
                    value={assignmentForm.name}
                    onChange={(event) =>
                      setAssignmentForm((prev) => ({
                        ...prev,
                        name: event.target.value
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") addAssignment()
                    }}
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Enter grade (%)"
                    value={assignmentForm.grade}
                    onChange={(event) =>
                      setAssignmentForm((prev) => ({
                        ...prev,
                        grade: event.target.value
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") addAssignment()
                    }}
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Enter weighting (%)"
                    value={assignmentForm.weight}
                    onChange={(event) =>
                      setAssignmentForm((prev) => ({
                        ...prev,
                        weight: event.target.value
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") addAssignment()
                    }}
                  />
                  <button type="button" onClick={addAssignment}>
                    +
                  </button>
                </div>
                <div className="grades-list">
                  {activeClass.assignments.map((item, index) => (
                    <div className="grades-row" key={`${item.name}-${index}`}>
                      <div>{item.name}</div>
                      <div>{item.grade}%</div>
                      <div>{item.weight}%</div>
                      <div>
                        <button type="button" onClick={() => removeAssignment(index)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {view === "taskBoard" && (
          <section className="page">
            <div className="page__header kanban__header">
              <h2>Task Board</h2>
              <div className="kanban__new">
                <input
                  type="text"
                  placeholder="New list name"
                  value={newListName}
                  onChange={(event) => setNewListName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addKanbanList()
                  }}
                />
                <button type="button" onClick={addKanbanList}>
                  Add List
                </button>
              </div>
            </div>
            <div className="kanban">
              {kanbanLists.map((list) => (
                <div
                  className="kanban__column"
                  key={list.id}
                  draggable
                  onDragStart={(event) => {
                    const target = event.target
                    if (target instanceof Element && target.closest(".kanban__card")) return
                    if (draggingCard) return
                    event.dataTransfer.setData("text/plain", `column|${list.id}`)
                    event.dataTransfer.effectAllowed = "move"
                  }}
                  onDragOver={(event) => {
                    event.preventDefault()
                    event.dataTransfer.dropEffect = "move"
                  }}
                  onDrop={(event) => {
                    const raw = event.dataTransfer.getData("text/plain")
                    const parts = parseDragPayload(raw)
                    if (!parts || parts[0] !== "column") return
                    const draggedId = parts[1]
                    if (!draggedId || draggedId === list.id) return
                    event.preventDefault()
                    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect()
                    const isAfter = event.clientX > rect.left + rect.width / 2
                    setKanbanLists((prev) => {
                      const draggedIndex = prev.findIndex((item) => item.id === draggedId)
                      const overIndex = prev.findIndex((item) => item.id === list.id)
                      if (draggedIndex === -1 || overIndex === -1) return prev
                      const next = [...prev]
                      const [moved] = next.splice(draggedIndex, 1)
                      const insertIndex = isAfter
                        ? overIndex + (draggedIndex < overIndex ? 0 : 1)
                        : overIndex
                      next.splice(insertIndex, 0, moved)
                      return next
                    })
                  }}
                >
                  <div className="kanban__title">
                    <span>{list.title}</span>
                    <button
                      className="kanban__remove"
                      type="button"
                      onClick={() => removeKanbanList(list.id)}
                    >
                      ×
                    </button>
                  </div>
                  <div
                    className="kanban__cards"
                    onDragOver={(event) => {
                      event.preventDefault()
                      event.dataTransfer.dropEffect = "move"
                    }}
                    onDrop={(event) => {
                      const raw = event.dataTransfer.getData("text/plain")
                      const dragged = resolveDraggedCard(raw)
                      if (!dragged) return
                      event.preventDefault()
                      moveKanbanCard(dragged.listId, list.id, dragged.cardId, list.cards.length)
                    }}
                  >
                    {list.cards.map((card, cardIndex) => (
                      <div
                        className="kanban__card"
                        key={card.id}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", `card|${list.id}|${card.id}`)
                          event.dataTransfer.effectAllowed = "move"
                          setDraggingCard({ listId: list.id, cardId: card.id })
                          setTimeout(() => {
                            event.currentTarget.classList.add("is-dragging")
                          }, 0)
                        }}
                        onDragEnd={(event) => {
                          event.currentTarget.classList.remove("is-dragging")
                          setDraggingCard(null)
                        }}
                        onDragOver={(event) => {
                          event.preventDefault()
                          event.dataTransfer.dropEffect = "move"
                        }}
                        onDrop={(event) => {
                          const raw = event.dataTransfer.getData("text/plain")
                          const dragged = resolveDraggedCard(raw)
                          if (!dragged) return
                          event.preventDefault()
                          if (dragged.listId === list.id && dragged.cardId === card.id) return
                          const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect()
                          const isAfter = event.clientY > rect.top + rect.height / 2
                          const targetIndex = isAfter ? cardIndex + 1 : cardIndex
                          moveKanbanCard(dragged.listId, list.id, dragged.cardId, targetIndex)
                        }}
                      >
                        <span>{card.text}</span>
                        <div className="kanban__card-meta">
                          <button
                            className={`kanban__due-toggle ${
                              card.dueDate ? "has-date" : "no-date"
                            } ${getDueStatus(card.dueDate)}`}
                            type="button"
                            onClick={(event) =>
                            openDuePopover(list.id, card.id, event.currentTarget)
                          }
                          >
                            <span
                              className="kanban__due-icon"
                              style={{ display: card.dueDate ? "none" : "block" }}
                            >
                              <svg
                                className="kanban__due-icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                            </span>
                            <span className="kanban__due-text">
                              {card.dueDate ? formatDueDate(card.dueDate) : ""}
                            </span>
                          </button>
                          <button
                            className="kanban__card-remove"
                            type="button"
                            onClick={() => removeKanbanCard(list.id, card.id)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="kanban__add">
                    <input
                      type="text"
                      placeholder="Add a card"
                      value={cardInputs[list.id] || ""}
                      onChange={(event) =>
                        setCardInputs((prev) => ({
                          ...prev,
                          [list.id]: event.target.value
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") addKanbanCard(list.id)
                      }}
                    />
                    <button type="button" onClick={() => addKanbanCard(list.id)}>
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {view === "calendar" && (
          <section className="page">
            <div className="page__header calendar__header">
              <h2>Calendar</h2>
              <div className="calendar__controls">
                <button
                  type="button"
                  onClick={() =>
                    setCalendarDate(
                      new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1)
                    )
                  }
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date()
                    setCalendarDate(new Date(today.getFullYear(), today.getMonth(), 1))
                    setSelectedDate(today)
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCalendarDate(
                      new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1)
                    )
                  }
                >
                  →
                </button>
              </div>
            </div>
            <div className="calendar">
              <div className="calendar__left">
                <div className="calendar__month">
                  {calendarDate.toLocaleString("default", {
                    month: "long",
                    year: "numeric"
                  })}
                </div>
                <div className="calendar__weekdays">
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                  <div>Sun</div>
                </div>
                <div className="calendar__grid">
                  {calendarCells.map((cell, index) => {
                    if (cell.type === "muted") {
                      return (
                        <div className="calendar__cell calendar__cell--muted" key={`m-${index}`}>
                          {cell.day}
                        </div>
                      )
                    }
                    const cellDate = cell.date
                    const isToday = (() => {
                      const today = new Date()
                      return (
                        cellDate.getFullYear() === today.getFullYear() &&
                        cellDate.getMonth() === today.getMonth() &&
                        cellDate.getDate() === today.getDate()
                      )
                    })()
                    const isSelected =
                      cellDate.getFullYear() === selectedDate.getFullYear() &&
                      cellDate.getMonth() === selectedDate.getMonth() &&
                      cellDate.getDate() === selectedDate.getDate()
                    const isoDate = formatISODate(cellDate)
                    const count = dueCounts.get(isoDate) || 0
                    return (
                      <div
                        className={`calendar__cell${
                          isToday ? " calendar__cell--today" : ""
                        }${isSelected ? " calendar__cell--selected" : ""}`}
                        key={isoDate}
                        onClick={() => setSelectedDate(new Date(cellDate))}
                      >
                        <div className="calendar__date">{cellDate.getDate()}</div>
                        {count > 0 && (
                          <div className="calendar__dots">
                            {Array.from({ length: count }).map((_, dotIndex) => (
                              <span
                                className={`calendar__dot ${getDueDotClass(cellDate)}`}
                                key={`${isoDate}-${dotIndex}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="calendar__right">
                <div className="calendar__day">
                  {selectedDate.toLocaleDateString("default", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  })}
                </div>
                <div className="calendar__tasks">
                  <div className="calendar__tasks-title">
                    {tasksForDate(formatISODate(selectedDate)).length
                      ? "Due tasks"
                      : "No tasks due"}
                  </div>
                  {tasksForDate(formatISODate(selectedDate)).length > 0 && (
                    <ul className="calendar__tasks-list">
                      {tasksForDate(formatISODate(selectedDate)).map((task, idx) => (
                        <li key={`${task}-${idx}`}>{task}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <div
        ref={duePopoverRef}
        className={`due-popover${duePopoverOpen ? " is-open" : ""}`}
        style={{ top: duePopoverPos.top, left: duePopoverPos.left }}
      >
        <div className="due-popover__header">
          <button
            className="due-popover__nav"
            type="button"
            onClick={() =>
              setDuePickerDate(
                new Date(duePickerDate.getFullYear(), duePickerDate.getMonth() - 1, 1)
              )
            }
          >
            ←
          </button>
          <div className="due-popover__month">
            {duePickerDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </div>
          <button
            className="due-popover__nav"
            type="button"
            onClick={() =>
              setDuePickerDate(
                new Date(duePickerDate.getFullYear(), duePickerDate.getMonth() + 1, 1)
              )
            }
          >
            →
          </button>
        </div>
        <div className="due-popover__weekdays">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
          <div>Sun</div>
        </div>
        <div className="due-popover__grid">
          {dueCells.map((cell, index) => {
            if (cell.type === "muted") {
              return (
                <div className="due-popover__cell due-popover__cell--muted" key={`d-${index}`}>
                  {cell.day}
                </div>
              )
            }
            const cellDate = cell.date
            const isToday = (() => {
              const today = new Date()
              return (
                cellDate.getFullYear() === today.getFullYear() &&
                cellDate.getMonth() === today.getMonth() &&
                cellDate.getDate() === today.getDate()
              )
            })()
            const isSelected =
              cellDate.getFullYear() === dueSelectedDate.getFullYear() &&
              cellDate.getMonth() === dueSelectedDate.getMonth() &&
              cellDate.getDate() === dueSelectedDate.getDate()
            return (
              <button
                key={formatISODate(cellDate)}
                type="button"
                className={`due-popover__cell${isToday ? " due-popover__cell--today" : ""}${
                  isSelected ? " due-popover__cell--selected" : ""
                }`}
                onClick={() => {
                  setDueSelectedDate(cellDate)
                  if (!activeDueCard) return
                  updateKanbanCardDue(
                    activeDueCard.listId,
                    activeDueCard.cardId,
                    formatISODate(cellDate)
                  )
                  setDuePopoverOpen(false)
                  setActiveDueCard(null)
                }}
              >
                {cellDate.getDate()}
              </button>
            )
          })}
        </div>
        <div className="due-popover__actions">
          <button
            className="due-popover__btn"
            type="button"
            onClick={() => {
              if (!activeDueCard) return
              const today = new Date()
              setDueSelectedDate(today)
              updateKanbanCardDue(
                activeDueCard.listId,
                activeDueCard.cardId,
                formatISODate(today)
              )
              setDuePopoverOpen(false)
              setActiveDueCard(null)
            }}
          >
            Today
          </button>
          <button
            className="due-popover__btn"
            type="button"
            onClick={() => {
              if (!activeDueCard) return
              updateKanbanCardDue(activeDueCard.listId, activeDueCard.cardId, "")
              setDuePopoverOpen(false)
              setActiveDueCard(null)
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
