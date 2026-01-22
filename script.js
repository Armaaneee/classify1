const classGrid = document.getElementById("classGrid")
const addCard = document.getElementById("addCard")
const addClassInput = document.getElementById("addClassInput")
const addClassBtn = document.getElementById("addClassBtn")
const dashboard = document.getElementById("dashboard")
const classView = document.getElementById("classView")
const classTitle = document.getElementById("classTitle")
const backLink = classView ? classView.querySelector(".back") : null

function makeClassCard(name) {
	const card = document.createElement("article")
	card.className = "class-card"

	const inner = document.createElement("div")
	inner.className = "class-card__inner"

	const del = document.createElement("button")
	del.className = "delete-btn"
	del.type = "button"
	del.innerHTML =
		`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`
	const gauge = document.createElement("div")
	gauge.className = "gauge"

	const arc = document.createElement("div")
	arc.className = "gauge__arc"

	const value = document.createElement("div")
	value.className = "gauge__value"
	value.textContent = "0%"

	const title = document.createElement("div")
	title.className = "class-card__name"
	title.textContent = name

	gauge.appendChild(arc)
	gauge.appendChild(value)

	inner.appendChild(del)
	inner.appendChild(gauge)
	inner.appendChild(title)

	card.appendChild(inner)
	return card
}

function addClass() {
	const name = (addClassInput.value || "").trim()
	if (!name) return

	const card = makeClassCard(name)
	classGrid.insertBefore(card, addCard)
	addClassInput.value = ""
	addClassInput.focus()
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
			card.remove()
			return
		}

		const card = target.closest(".class-card")
		if (!card) return
		if (card.classList.contains("class-card--add")) return

		const nameEl = card.querySelector(".class-card__name")
		const name = nameEl ? nameEl.textContent.trim() : "Class"
		if (classTitle) classTitle.textContent = name
		if (dashboard) dashboard.classList.add("hidden")
		if (classView) classView.classList.remove("hidden")
	})
}

if (backLink) {
	backLink.addEventListener("click", (e) => {
		e.preventDefault()
		if (classView) classView.classList.add("hidden")
		if (dashboard) dashboard.classList.remove("hidden")
	})
}
