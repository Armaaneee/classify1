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

const storageKey = "classify-data"

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
