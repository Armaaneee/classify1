const classGrid = document.getElementById("classGrid")
const addCard = document.getElementById("addCard")
const addClassInput = document.getElementById("addClassInput")
const addClassBtn = document.getElementById("addClassBtn")
const dashboard = document.getElementById("dashboard")
const classView = document.getElementById("classView")
const classTitle = document.getElementById("classTitle")
const backLink = classView ? classView.querySelector(".back") : null
const topbar = document.querySelector(".topbar")
const topbarTitle = document.querySelector(".topbar h1")
const taskBoard = document.getElementById("taskBoard")
const navDashboard = document.getElementById("navDashboard")
const navTaskBoard = document.getElementById("navTaskBoard")
const navCalendar = document.getElementById("navCalendar")
const classAverage = document.getElementById("classAverage")
const classAverageFill = document.getElementById("classAverageFill")
const assignmentName = document.getElementById("assignmentName")
const assignmentGrade = document.getElementById("assignmentGrade")
const assignmentWeight = document.getElementById("assignmentWeight")
const addAssignmentBtn = document.getElementById("addAssignmentBtn")
const gradesList = document.getElementById("gradesList")
const kanbanBoard = document.getElementById("kanbanBoard")
const newListName = document.getElementById("newListName")
const addListBtn = document.getElementById("addListBtn")
const calendarPage = document.getElementById("calendarPage")
const calendarMonth = document.getElementById("calendarMonth")
const calendarGrid = document.getElementById("calendarGrid")
const calendarDay = document.getElementById("calendarDay")
const calendarTasks = document.getElementById("calendarTasks")
const calendarPrev = document.getElementById("calendarPrev")
const calendarNext = document.getElementById("calendarNext")
const calendarToday = document.getElementById("calendarToday")

const storageKey = "classify-data"
const kanbanStorageKey = "classify-kanban"

const classes = []
let activeClassId = null

function makeClassCard(name, id, assignments = []) {
	const classId = id || "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
	const card = document.createElement("article")
	card.className = "class-card"
	card.dataset.classId = classId

	const inner = document.createElement("div")
	inner.className = "class-card__inner"

	const del = document.createElement("button")
	del.className = "delete-btn"
	del.type = "button"
	del.innerHTML =
		`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`
	const gauge = document.createElement("div")
	gauge.className = "gauge"
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
	svg.setAttribute("viewBox", "0 0 100 50")
	svg.classList.add("gauge__svg")

	const track = document.createElementNS("http://www.w3.org/2000/svg", "path")
	track.setAttribute("d", "M5 50 A45 45 0 0 1 95 50")
	track.setAttribute("pathLength", "100")
	track.classList.add("gauge__track")

	const progress = document.createElementNS("http://www.w3.org/2000/svg", "path")
	progress.setAttribute("d", "M5 50 A45 45 0 0 1 95 50")
	progress.setAttribute("pathLength", "100")
	progress.classList.add("gauge__progress")

	svg.appendChild(track)
	svg.appendChild(progress)

	const value = document.createElement("div")
	value.className = "gauge__value"
	value.textContent = "0%"

	const title = document.createElement("div")
	title.className = "class-card__name"
	title.textContent = name

	gauge.appendChild(svg)
	gauge.appendChild(value)

	inner.appendChild(del)
	inner.appendChild(gauge)
	inner.appendChild(title)

	card.appendChild(inner)
	classes.push({ id: classId, name, assignments: Array.isArray(assignments) ? assignments : [], card })
	return card
}

function addClass() {
	const name = (addClassInput.value || "").trim()
	if (!name) return

	const card = makeClassCard(name)
	classGrid.insertBefore(card, addCard)
	addClassInput.value = ""
	addClassInput.focus()
	saveData()
}

if (addClassBtn) {
	addClassBtn.addEventListener("click", addClass)
}

if (addClassInput) {
	addClassInput.addEventListener("keydown", (e) => {
		if (e.key === "Enter") addClass()
	})
}

if (classGrid) {
	classGrid.addEventListener("click", (e) => {
		const target = e.target
		if (!(target instanceof Element)) return

		const deleteBtn = target.closest(".delete-btn")
		if (deleteBtn) {
			const card = deleteBtn.closest(".class-card")
			if (!card) return
			if (card.classList.contains("class-card--add")) return
			const id = card.dataset.classId
			if (id) {
				const index = classes.findIndex((item) => item.id === id)
				if (index >= 0) classes.splice(index, 1)
			}
			card.remove()
			saveData()
			return
		}

		const card = target.closest(".class-card")
		if (!card) return
		if (card.classList.contains("class-card--add")) return

		const id = card.dataset.classId
		const info = id ? classes.find((item) => item.id === id) : null
		if (!info) return

		activeClassId = info.id
		if (classTitle) classTitle.textContent = info.name
		if (dashboard) dashboard.classList.add("hidden")
		if (classView) classView.classList.remove("hidden")
		if (topbar) topbar.classList.add("hidden")
		renderAssignments()
	})
}

if (backLink) {
	backLink.addEventListener("click", (e) => {
		e.preventDefault()
		if (classView) classView.classList.add("hidden")
		if (dashboard) dashboard.classList.remove("hidden")
		if (calendarPage) calendarPage.classList.add("hidden")
		if (topbar) topbar.classList.remove("hidden")
		if (taskBoard) taskBoard.classList.add("hidden")
		if (topbarTitle) topbarTitle.textContent = "Dashboard"
	})
}

if (navDashboard) {
	navDashboard.addEventListener("click", (e) => {
		e.preventDefault()
		if (dashboard) dashboard.classList.remove("hidden")
		if (classView) classView.classList.add("hidden")
		if (taskBoard) taskBoard.classList.add("hidden")
		if (calendarPage) calendarPage.classList.add("hidden")
		if (topbar) topbar.classList.remove("hidden")
		if (topbarTitle) topbarTitle.textContent = "Dashboard"
	})
}

if (navTaskBoard) {
	navTaskBoard.addEventListener("click", (e) => {
		e.preventDefault()
		if (dashboard) dashboard.classList.add("hidden")
		if (classView) classView.classList.add("hidden")
		if (taskBoard) taskBoard.classList.remove("hidden")
		if (calendarPage) calendarPage.classList.add("hidden")
		if (topbar) topbar.classList.remove("hidden")
		if (topbarTitle) topbarTitle.textContent = "Task Board"
	})
}

if (navCalendar) {
	navCalendar.addEventListener("click", (e) => {
		e.preventDefault()
		if (dashboard) dashboard.classList.add("hidden")
		if (classView) classView.classList.add("hidden")
		if (taskBoard) taskBoard.classList.add("hidden")
		if (calendarPage) calendarPage.classList.remove("hidden")
		if (topbar) topbar.classList.remove("hidden")
		if (topbarTitle) topbarTitle.textContent = "Calendar"
		renderCalendar()
	})
}

if (gradesList) {
	gradesList.addEventListener("click", (e) => {
		const target = e.target
		if (!(target instanceof Element)) return
		const btn = target.closest(".row-delete")
		if (!btn) return

		const info = getActiveClass()
		if (!info) return
		const index = Number(btn.dataset.index)
		if (!Number.isInteger(index)) return
		info.assignments.splice(index, 1)
		renderAssignments()
		saveData()
	})
}

function getActiveClass() {
	return classes.find((item) => item.id === activeClassId) || null
}

function calculateAverage(items) {
	let totalWeight = 0
	let totalScore = 0

	items.forEach((item) => {
		totalWeight += item.weight
		totalScore += item.grade * item.weight
	})

	if (!totalWeight) return 0
	return totalScore / totalWeight
}

function getAverageColor(value) {
	if (value < 50) return "#ef4444"
	if (value < 80) return "#f59e0b"
	return "#22c55e"
}

function updateCardAverage(info) {
	const avg = calculateAverage(info.assignments)
	const rounded = Math.round(avg)
	const color = getAverageColor(rounded)

	const valueEl = info.card.querySelector(".gauge__value")
	if (valueEl) valueEl.textContent = rounded + "%"

	const progressEl = info.card.querySelector(".gauge__progress")
	if (progressEl) {
		const pct = Math.max(0, Math.min(100, rounded))
		progressEl.style.stroke = color
		progressEl.style.strokeDasharray = "100"
		progressEl.style.strokeDashoffset = String(100 - pct)
		progressEl.style.strokeLinecap = pct === 0 ? "butt" : "round"
		progressEl.style.opacity = pct === 0 ? "0" : "1"
	}

	return { rounded, color }
}

function renderAssignments() {
	const info = getActiveClass()
	if (!info) return

	if (gradesList) {
		gradesList.innerHTML = ""
		info.assignments.forEach((item, index) => {
			const row = document.createElement("div")
			row.className = "grades-row"
			row.innerHTML =
				`<div>${item.name}</div><div>${item.grade}%</div><div>${item.weight}%</div><div><button class="row-delete" data-index="${index}">Delete</button></div>`
			gradesList.appendChild(row)
		})
	}

	const { rounded, color } = updateCardAverage(info)
	if (classAverage) classAverage.textContent = rounded + "%"
	if (classAverageFill) {
		classAverageFill.style.width = Math.min(100, rounded) + "%"
		classAverageFill.style.background = color
	}
}

function addAssignment() {
	const info = getActiveClass()
	if (!info) return

	const name = (assignmentName?.value || "").trim()
	const grade = Number(assignmentGrade?.value)
	const weight = Number(assignmentWeight?.value)
	if (!name || !Number.isFinite(grade) || !Number.isFinite(weight)) return

	info.assignments.push({ name, grade, weight })
	if (assignmentName) assignmentName.value = ""
	if (assignmentGrade) assignmentGrade.value = ""
	if (assignmentWeight) assignmentWeight.value = ""
	if (assignmentName) assignmentName.focus()
	renderAssignments()
	saveData()
}

if (addAssignmentBtn) {
	addAssignmentBtn.addEventListener("click", addAssignment)
}

let calendarDate = new Date()
let selectedDate = new Date()

function renderCalendar() {
	if (!calendarMonth || !calendarGrid || !calendarDay) return

	const dueCounts = getDueDateCounts()

	const year = calendarDate.getFullYear()
	const month = calendarDate.getMonth()
	calendarMonth.textContent = calendarDate.toLocaleString("default", { month: "long", year: "numeric" })

	const firstDay = new Date(year, month, 1)
	const startDay = (firstDay.getDay() + 6) % 7
	const daysInMonth = new Date(year, month + 1, 0).getDate()
	const daysInPrev = new Date(year, month, 0).getDate()

	calendarGrid.innerHTML = ""

	for (let i = 0; i < startDay; i++) {
		const dayNum = daysInPrev - startDay + i + 1
		const cell = document.createElement("div")
		cell.className = "calendar__cell calendar__cell--muted"
		cell.textContent = dayNum
		calendarGrid.appendChild(cell)
	}

	for (let d = 1; d <= daysInMonth; d++) {
		const cellDate = new Date(year, month, d)
		const cell = document.createElement("div")
		cell.className = "calendar__cell"
		const dayNumber = document.createElement("div")
		dayNumber.className = "calendar__date"
		dayNumber.textContent = d

		const today = new Date()
		if (
			cellDate.getFullYear() === today.getFullYear() &&
			cellDate.getMonth() === today.getMonth() &&
			cellDate.getDate() === today.getDate()
		) {
			cell.classList.add("calendar__cell--today")
		}

		if (
			cellDate.getFullYear() === selectedDate.getFullYear() &&
			cellDate.getMonth() === selectedDate.getMonth() &&
			cellDate.getDate() === selectedDate.getDate()
		) {
			cell.classList.add("calendar__cell--selected")
		}

		cell.addEventListener("click", () => {
			selectedDate = new Date(year, month, d)
			renderCalendar()
		})

		const isoDate = formatISODate(cellDate)
		const count = dueCounts.get(isoDate) || 0
		if (count > 0) {
			const dots = document.createElement("div")
			dots.className = "calendar__dots"
			const dotClass = getDueDotClass(cellDate)
			for (let i = 0; i < count; i++) {
				const dot = document.createElement("span")
				dot.className = `calendar__dot ${dotClass}`
				dots.appendChild(dot)
			}
			cell.appendChild(dayNumber)
			cell.appendChild(dots)
		} else {
			cell.appendChild(dayNumber)
		}

		calendarGrid.appendChild(cell)
	}

	const totalCells = startDay + daysInMonth
	const trailing = (7 - (totalCells % 7)) % 7
	for (let i = 1; i <= trailing; i++) {
		const cell = document.createElement("div")
		cell.className = "calendar__cell calendar__cell--muted"
		cell.textContent = i
		calendarGrid.appendChild(cell)
	}

	calendarDay.textContent = selectedDate.toLocaleDateString("default", {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric"
	})

	renderCalendarTasks()

}

function renderCalendarTasks() {
	if (!calendarTasks) return
	const isoDate = formatISODate(selectedDate)
	const tasks = getDueTasksForDate(isoDate)
	calendarTasks.innerHTML = ""
	const title = document.createElement("div")
	title.className = "calendar__tasks-title"
	title.textContent = tasks.length ? "Due tasks" : "No tasks due"
	calendarTasks.appendChild(title)
	if (!tasks.length) return
	const list = document.createElement("ul")
	list.className = "calendar__tasks-list"
	tasks.forEach((task) => {
		const item = document.createElement("li")
		item.textContent = task
		list.appendChild(item)
	})
	calendarTasks.appendChild(list)
}

function getDueDateCounts() {
	const counts = new Map()
	if (kanbanBoard) {
		kanbanBoard.querySelectorAll(".kanban__card").forEach((card) => {
			const dueDate = card.dataset.dueDate || ""
			if (!dueDate) return
			counts.set(dueDate, (counts.get(dueDate) || 0) + 1)
		})
		return counts
	}
	const raw = localStorage.getItem(kanbanStorageKey)
	if (!raw) return counts
	try {
		const data = JSON.parse(raw)
		if (!Array.isArray(data)) return counts
		data.forEach((list) => {
			if (!list || !Array.isArray(list.cards)) return
			list.cards.forEach((card) => {
				const dueDate = card?.dueDate || ""
				if (!dueDate) return
				counts.set(dueDate, (counts.get(dueDate) || 0) + 1)
			})
		})
	} catch {
		return counts
	}
	return counts
}

function getDueDotClass(cellDate) {
	const today = new Date()
	const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
	const startOfCell = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate())
	const diffMs = startOfCell.getTime() - startOfToday.getTime()
	const diffDays = Math.round(diffMs / 86400000)
	if (diffDays === 0 || diffDays === 1) return "calendar__dot--urgent"
	if (diffDays >= 2 && diffDays <= 7) return "calendar__dot--soon"
	return "calendar__dot--ok"
}

function getDueTasksForDate(isoDate) {
	const tasks = []
	if (kanbanBoard) {
		kanbanBoard.querySelectorAll(".kanban__card").forEach((card) => {
			const dueDate = card.dataset.dueDate || ""
			if (dueDate !== isoDate) return
			const text = card.querySelector("span")?.textContent || ""
			if (text) tasks.push(text)
		})
		return tasks
	}
	const raw = localStorage.getItem(kanbanStorageKey)
	if (!raw) return tasks
	try {
		const data = JSON.parse(raw)
		if (!Array.isArray(data)) return tasks
		data.forEach((list) => {
			if (!list || !Array.isArray(list.cards)) return
			list.cards.forEach((card) => {
				if (!card || card.dueDate !== isoDate) return
				if (card.text) tasks.push(card.text)
			})
		})
	} catch {
		return tasks
	}
	return tasks
}

if (calendarPrev) {
	calendarPrev.addEventListener("click", () => {
		calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1)
		renderCalendar()
	})
}

if (calendarNext) {
	calendarNext.addEventListener("click", () => {
		calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1)
		renderCalendar()
	})
}

if (calendarToday) {
	calendarToday.addEventListener("click", () => {
		calendarDate = new Date()
		selectedDate = new Date()
		renderCalendar()
	})
}

function saveData() {
	const data = classes.map(({ id, name, assignments }) => ({ id, name, assignments }))
	localStorage.setItem(storageKey, JSON.stringify(data))
}

function loadData() {
	const raw = localStorage.getItem(storageKey)
	if (!raw) return
	let data
	try {
		data = JSON.parse(raw)
	} catch {
		return
	}
	if (!Array.isArray(data)) return
	data.forEach((item) => {
		if (!item || !item.id || !item.name) return
		const card = makeClassCard(item.name, item.id, item.assignments)
		classGrid.insertBefore(card, addCard)
		const info = classes.find((c) => c.id === item.id)
		if (info) updateCardAverage(info)
	})
}

loadData()

function makeKanbanColumn(title) {
	const id = "l" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
	const column = document.createElement("div")
	column.className = "kanban__column"
	column.dataset.listId = id
	column.draggable = true

	const header = document.createElement("div")
	header.className = "kanban__title"
	const headerText = document.createElement("span")
	headerText.textContent = title
	const remove = document.createElement("button")
	remove.className = "kanban__remove"
	remove.type = "button"
	remove.textContent = "×"
	header.appendChild(headerText)
	header.appendChild(remove)

	const cards = document.createElement("div")
	cards.className = "kanban__cards"

	const add = document.createElement("div")
	add.className = "kanban__add"

	const input = document.createElement("input")
	input.type = "text"
	input.placeholder = "Add a card"

	const button = document.createElement("button")
	button.type = "button"
	button.textContent = "+"

	add.appendChild(input)
	add.appendChild(button)

	column.appendChild(header)
	column.appendChild(cards)
	column.appendChild(add)

	return column
}

function makeKanbanCard(text, dueDate = "") {
	const card = document.createElement("div")
	card.className = "kanban__card"
	card.draggable = true
	const label = document.createElement("span")
	label.textContent = text
	const meta = document.createElement("div")
	meta.className = "kanban__card-meta"
	const due = document.createElement("button")
	due.className = "kanban__due-toggle"
	due.type = "button"
	const dueIcon = document.createElement("span")
	dueIcon.innerHTML =
		`<svg class="kanban__due-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
	const dueText = document.createElement("span")
	dueText.className = "kanban__due-text"
	due.appendChild(dueIcon)
	due.appendChild(dueText)
	const remove = document.createElement("button")
	remove.className = "kanban__card-remove"
	remove.type = "button"
	remove.textContent = "×"
	meta.appendChild(due)
	meta.appendChild(remove)
	card.appendChild(label)
	card.appendChild(meta)
	setDueDate(card, dueDate)
	return card
}

function setDueDate(card, dueDate) {
	const dueBtn = card.querySelector(".kanban__due-toggle")
	if (!dueBtn) return
	const dueText = dueBtn.querySelector(".kanban__due-text")
	const icon = dueBtn.querySelector(".kanban__due-icon")
	if (!dueText || !icon) return
	if (!dueDate) {
		card.dataset.dueDate = ""
		dueText.textContent = ""
		dueBtn.classList.remove("has-date")
		dueBtn.classList.add("no-date")
		dueBtn.classList.remove("due-soon", "due-urgent")
		icon.style.display = "block"
		return
	}
	card.dataset.dueDate = dueDate
	dueText.textContent = formatDueDate(dueDate)
	dueBtn.classList.add("has-date")
	dueBtn.classList.remove("no-date")
	updateDueState(dueBtn, dueDate)
	icon.style.display = "none"
}

function updateDueState(button, dueDate) {
	button.classList.remove("due-soon", "due-urgent")
	const target = new Date(`${dueDate}T00:00:00`)
	const today = new Date()
	const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
	const diffMs = target.getTime() - startOfToday.getTime()
	const diffDays = Math.round(diffMs / 86400000)
	if (diffDays === 0 || diffDays === 1) {
		button.classList.add("due-urgent")
		return
	}
	if (diffDays >= 2 && diffDays <= 7) {
		button.classList.add("due-soon")
	}
}

function formatDueDate(isoDate) {
	const [year, month, day] = isoDate.split("-")
	if (!year || !month || !day) return ""
	return `${day}/${month}/${year.slice(2)}`
}

const duePopover = document.createElement("div")
duePopover.className = "due-popover"
duePopover.innerHTML = `
	<div class="due-popover__header">
		<button class="due-popover__nav" type="button" data-action="prev">←</button>
		<div class="due-popover__month"></div>
		<button class="due-popover__nav" type="button" data-action="next">→</button>
	</div>
	<div class="due-popover__weekdays">
		<div>Mon</div>
		<div>Tue</div>
		<div>Wed</div>
		<div>Thu</div>
		<div>Fri</div>
		<div>Sat</div>
		<div>Sun</div>
	</div>
	<div class="due-popover__grid"></div>
	<div class="due-popover__actions">
		<button class="due-popover__btn" type="button" data-action="today">Today</button>
		<button class="due-popover__btn" type="button" data-action="clear">Clear</button>
	</div>
`
document.body.appendChild(duePopover)

let activeDueCard = null
let duePickerDate = new Date()
let dueSelectedDate = new Date()

function formatISODate(date) {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, "0")
	const d = String(date.getDate()).padStart(2, "0")
	return `${y}-${m}-${d}`
}

function renderDueCalendar() {
	const monthEl = duePopover.querySelector(".due-popover__month")
	const grid = duePopover.querySelector(".due-popover__grid")
	if (!monthEl || !grid) return

	const year = duePickerDate.getFullYear()
	const month = duePickerDate.getMonth()
	monthEl.textContent = duePickerDate.toLocaleString("default", { month: "long", year: "numeric" })

	const firstDay = new Date(year, month, 1)
	const startDay = (firstDay.getDay() + 6) % 7
	const daysInMonth = new Date(year, month + 1, 0).getDate()
	const daysInPrev = new Date(year, month, 0).getDate()

	grid.innerHTML = ""

	for (let i = 0; i < startDay; i++) {
		const dayNum = daysInPrev - startDay + i + 1
		const cell = document.createElement("div")
		cell.className = "due-popover__cell due-popover__cell--muted"
		cell.textContent = dayNum
		grid.appendChild(cell)
	}

	for (let d = 1; d <= daysInMonth; d++) {
		const cellDate = new Date(year, month, d)
		const cell = document.createElement("button")
		cell.type = "button"
		cell.className = "due-popover__cell"
		cell.textContent = d
		cell.dataset.date = formatISODate(cellDate)

		const today = new Date()
		if (
			cellDate.getFullYear() === today.getFullYear() &&
			cellDate.getMonth() === today.getMonth() &&
			cellDate.getDate() === today.getDate()
		) {
			cell.classList.add("due-popover__cell--today")
		}

		if (
			cellDate.getFullYear() === dueSelectedDate.getFullYear() &&
			cellDate.getMonth() === dueSelectedDate.getMonth() &&
			cellDate.getDate() === dueSelectedDate.getDate()
		) {
			cell.classList.add("due-popover__cell--selected")
		}

		grid.appendChild(cell)
	}

	const totalCells = startDay + daysInMonth
	const trailing = (7 - (totalCells % 7)) % 7
	for (let i = 1; i <= trailing; i++) {
		const cell = document.createElement("div")
		cell.className = "due-popover__cell due-popover__cell--muted"
		cell.textContent = i
		grid.appendChild(cell)
	}
}

function openDuePopover(card, anchor) {
	activeDueCard = card
	const existing = card.dataset.dueDate || ""
	if (existing) {
		const [y, m, d] = existing.split("-").map(Number)
		dueSelectedDate = new Date(y, m - 1, d)
		duePickerDate = new Date(y, m - 1, 1)
	} else {
		dueSelectedDate = new Date()
		duePickerDate = new Date(dueSelectedDate.getFullYear(), dueSelectedDate.getMonth(), 1)
	}
	const rect = anchor.getBoundingClientRect()
	duePopover.style.top = `${rect.bottom + window.scrollY + 8}px`
	duePopover.style.left = `${rect.left + window.scrollX}px`
	duePopover.classList.add("is-open")
	renderDueCalendar()
}

function closeDuePopover() {
	duePopover.classList.remove("is-open")
	activeDueCard = null
}

function handleAddCard(button) {
	const container = button.closest(".kanban__column")
	if (!container) return
	const input = container.querySelector(".kanban__add input")
	const cards = container.querySelector(".kanban__cards")
	if (!input || !cards) return
	const text = input.value.trim()
	if (!text) return
	const card = makeKanbanCard(text)
	cards.appendChild(card)
	input.value = ""
	input.focus()
}

if (addListBtn) {
	addListBtn.addEventListener("click", () => {
		const name = (newListName?.value || "").trim()
		if (!name || !kanbanBoard) return
		const column = makeKanbanColumn(name)
		kanbanBoard.appendChild(column)
		newListName.value = ""
		newListName.focus()
		saveKanban()
	})
}

if (kanbanBoard) {
	kanbanBoard.addEventListener("click", (e) => {
		const target = e.target
		if (!(target instanceof Element)) return
		const dueToggle = target.closest(".kanban__due-toggle")
		if (dueToggle) {
			const card = dueToggle.closest(".kanban__card")
			if (card) openDuePopover(card, dueToggle)
			return
		}
		if (target.matches(".kanban__add button")) {
			handleAddCard(target)
			saveKanban()
		}
		if (target.matches(".kanban__remove")) {
			const column = target.closest(".kanban__column")
			if (!column) return
			column.remove()
			saveKanban()
		}
		if (target.matches(".kanban__card-remove")) {
			const card = target.closest(".kanban__card")
			if (!card) return
			card.remove()
			saveKanban()
		}
	})

	kanbanBoard.querySelectorAll(".kanban__column").forEach((column) => {
		column.draggable = true
	})

	kanbanBoard.addEventListener("keydown", (e) => {
		const target = e.target
		if (!(target instanceof HTMLInputElement)) return
		if (!target.closest(".kanban__add")) return
		if (e.key === "Enter") {
			const button = target.closest(".kanban__add")?.querySelector("button")
			if (button) handleAddCard(button)
		}
	})
}

document.addEventListener("click", (e) => {
	const target = e.target
	if (!(target instanceof Element)) return
	if (duePopover.contains(target)) return
	if (target.closest(".kanban__due-toggle")) return
	if (duePopover.classList.contains("is-open")) closeDuePopover()
})

duePopover.addEventListener("click", (e) => {
	const target = e.target
	if (!(target instanceof Element)) return
	const action = target.getAttribute("data-action")
	if (action) {
		if (!activeDueCard) return
		if (action === "clear") {
			setDueDate(activeDueCard, "")
			saveKanban()
			closeDuePopover()
			return
		}
		if (action === "today") {
			const today = new Date()
			const value = formatISODate(today)
			setDueDate(activeDueCard, value)
			saveKanban()
			closeDuePopover()
			return
		}
		if (action === "prev") {
			duePickerDate = new Date(duePickerDate.getFullYear(), duePickerDate.getMonth() - 1, 1)
			renderDueCalendar()
			return
		}
		if (action === "next") {
			duePickerDate = new Date(duePickerDate.getFullYear(), duePickerDate.getMonth() + 1, 1)
			renderDueCalendar()
			return
		}
	}
	const cell = target.closest(".due-popover__cell")
	if (!cell || !cell.dataset.date || !activeDueCard) return
	setDueDate(activeDueCard, cell.dataset.date)
	saveKanban()
	closeDuePopover()
})

let draggedCard = null

if (kanbanBoard) {
	kanbanBoard.addEventListener("dragstart", (e) => {
		const target = e.target
		if (!(target instanceof Element)) return
		if (target.classList.contains("kanban__card")) {
			draggedCard = target
			requestAnimationFrame(() => target.classList.add("is-dragging"))
		}
	})

	kanbanBoard.addEventListener("dragend", (e) => {
		const target = e.target
		if (!(target instanceof Element)) return
		if (target.classList.contains("kanban__card")) {
			target.classList.remove("is-dragging")
			saveKanban()
		}
		draggedCard = null
	})

	kanbanBoard.addEventListener("dragover", (e) => {
		e.preventDefault()
		const target = e.target
		if (!(target instanceof Element)) return

		const column = target.closest(".kanban__column")
		if (!column || !draggedCard) return
		const cards = column.querySelector(".kanban__cards")
		if (!cards) return
		const afterElement = getDragAfterElement(cards, e.clientY)
		if (afterElement == null) {
			cards.appendChild(draggedCard)
		} else {
			cards.insertBefore(draggedCard, afterElement)
		}
	})
}

let draggedColumn = null

if (kanbanBoard) {
	kanbanBoard.addEventListener("dragstart", (e) => {
		const target = e.target
		if (!(target instanceof Element)) return
		if (target.classList.contains("kanban__column")) {
			draggedColumn = target
		}
	})

	kanbanBoard.addEventListener("dragend", () => {
		draggedColumn = null
		saveKanban()
	})

	kanbanBoard.addEventListener("dragover", (e) => {
		if (!draggedColumn) return
		const target = e.target
		if (!(target instanceof Element)) return
		const column = target.closest(".kanban__column")
		if (!column || column === draggedColumn) return
		const rect = column.getBoundingClientRect()
		const isAfter = e.clientX > rect.left + rect.width / 2
		if (isAfter) {
			kanbanBoard.insertBefore(draggedColumn, column.nextSibling)
		} else {
			kanbanBoard.insertBefore(draggedColumn, column)
		}
	})
}

function getDragAfterElement(container, y) {
	const draggableElements = [...container.querySelectorAll(".kanban__card:not(.is-dragging)")]
	let closest = null
	let closestOffset = Number.NEGATIVE_INFINITY
	for (const child of draggableElements) {
		const box = child.getBoundingClientRect()
		const offset = y - box.top - box.height / 2
		if (offset < 0 && offset > closestOffset) {
			closestOffset = offset
			closest = child
		}
	}
	return closest
}

function saveKanban() {
	if (!kanbanBoard) return
	const data = [...kanbanBoard.querySelectorAll(".kanban__column")].map((column) => {
		const titleEl = column.querySelector(".kanban__title span")
		const title = titleEl ? titleEl.textContent.trim() : ""
		const cards = [...column.querySelectorAll(".kanban__card")].map((card) => {
			const text = card.querySelector("span")?.textContent || ""
			const dueDate = card.dataset.dueDate || ""
			return { text, dueDate }
		})
		return { title, cards }
	})
	localStorage.setItem(kanbanStorageKey, JSON.stringify(data))
	if (calendarPage && !calendarPage.classList.contains("hidden")) {
		renderCalendar()
	}
}

function loadKanban() {
	if (!kanbanBoard) return
	const raw = localStorage.getItem(kanbanStorageKey)
	if (!raw) return
	let data
	try {
		data = JSON.parse(raw)
	} catch {
		return
	}
	if (!Array.isArray(data)) return
	kanbanBoard.innerHTML = ""
	data.forEach((list) => {
		if (!list || !list.title) return
		const column = makeKanbanColumn(list.title)
		const cardsContainer = column.querySelector(".kanban__cards")
		if (cardsContainer && Array.isArray(list.cards)) {
			list.cards.forEach((cardItem) => {
				if (!cardItem) return
				if (typeof cardItem === "string") {
					if (!cardItem) return
					cardsContainer.appendChild(makeKanbanCard(cardItem))
					return
				}
				if (!cardItem.text) return
				cardsContainer.appendChild(makeKanbanCard(cardItem.text, cardItem.dueDate || ""))
			})
		}
		kanbanBoard.appendChild(column)
	})
}

loadKanban()
