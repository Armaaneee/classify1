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
		if (topbar) topbar.classList.remove("hidden")
		if (topbarTitle) topbarTitle.textContent = "Task Board"
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

function makeKanbanCard(text) {
	const card = document.createElement("div")
	card.className = "kanban__card"
	card.draggable = true
	const label = document.createElement("span")
	label.textContent = text
	const remove = document.createElement("button")
	remove.className = "kanban__card-remove"
	remove.type = "button"
	remove.textContent = "×"
	card.appendChild(label)
	card.appendChild(remove)
	return card
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
		const cards = [...column.querySelectorAll(".kanban__card span")].map((span) => span.textContent)
		return { title, cards }
	})
	localStorage.setItem(kanbanStorageKey, JSON.stringify(data))
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
			list.cards.forEach((text) => {
				if (!text) return
				cardsContainer.appendChild(makeKanbanCard(text))
			})
		}
		kanbanBoard.appendChild(column)
	})
}

loadKanban()
