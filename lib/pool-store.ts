"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { DAILY_TASKS, WEEKLY_TASKS } from "./pool-data"

const TOTAL_TASKS = DAILY_TASKS.length + WEEKLY_TASKS.length

export interface PoolRecord {
    start: string
    end: string
    ph: string
    clLibre: string
    clTotal: string
    clComb: string
    depurada: string
    renovada: string
    transparencia: boolean | null
    checks: boolean[]
    img1: string
    img2: string
    filtroTimerEnd: number | null
}

type Mode = "create" | "edit"

interface PoolStore {
    active: PoolRecord
    historial: PoolRecord[]
    mode: Mode
    editingIndex: number | null

    openTaskIndex: number | null
    setOpenTaskIndex: (i: number | null) => void

    startNew: () => void
    finishDay: () => void
    setField: <K extends keyof PoolRecord>(k: K, v: PoolRecord[K]) => void
    toggleCheck: (i: number) => void
    setImage: (k: "img1" | "img2", v: string) => void

    save: () => void
    editRecord: (i: number) => void
    deleteRecord: (i: number) => void
    reset: () => void

    exportJson: () => void
    exportJornadaCsv: () => void
    exportJornadaTxt: () => void
    importJson: (file: File) => Promise<void>
}

const EMPTY: PoolRecord = {
    start: "",
    end: "",
    ph: "",
    clLibre: "",
    clTotal: "",
    clComb: "",
    depurada: "",
    renovada: "",
    transparencia: null,
    checks: Array(TOTAL_TASKS).fill(false),
    img1: "",
    img2: "",
    filtroTimerEnd: null,
}

const pad = (n: number) => String(n).padStart(2, "0")

const nowTime = () => {
    const d = new Date()
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const today = () => {
    const d = new Date()
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const build = (date: string) => `${date}T${nowTime()}`

const recalc = (r: PoolRecord): PoolRecord => {
    const l = parseFloat(r.clLibre)
    const t = parseFloat(r.clTotal)

    return {
        ...r,
        clComb: !isNaN(l) && !isNaN(t) ? Math.max(0, t - l).toFixed(2) : "",
    }
}

export const usePoolStore = create<PoolStore>()(
    persist(
        (set, get) => ({
            active: { ...EMPTY },
            historial: [],
            mode: "create",
            editingIndex: null,

            openTaskIndex: null,

            setOpenTaskIndex(i) {
                set({ openTaskIndex: i })
            },

            startNew() {
                set((s) => ({
                    active: {
                        ...s.active,
                        start: build(today()),
                    },
                }))
            },

            finishDay() {
                set((s) => {
                    if (!s.active.start) return s
                    const date = s.active.start.slice(0, 10)
                    return {
                        active: {
                            ...s.active,
                            end: build(date),
                        },
                    }
                })
            },

            setField(k, v) {
                set((s) => ({
                    active: recalc({ ...s.active, [k]: v }),
                }))
            },

            toggleCheck(i) {
                set((s) => {
                    const c = [...s.active.checks]
                    c[i] = !c[i]
                    return { active: { ...s.active, checks: c } }
                })
            },

            setImage(k, v) {
                set((s) => ({
                    active: { ...s.active, [k]: v },
                }))
            },

            save() {
                const { active, historial, mode, editingIndex } = get()
                if (!active.start) return

                if (mode === "edit" && editingIndex !== null) {
                    const copy = [...historial]
                    copy[editingIndex] = active
                    set({ historial: copy, active: { ...EMPTY }, mode: "create", editingIndex: null })
                    return
                }

                set({
                    historial: [...historial, active],
                    active: { ...EMPTY },
                    mode: "create",
                    editingIndex: null,
                })
            },

            editRecord(i) {
                const item = get().historial[i]
                if (!item) return
                set({ active: { ...item }, mode: "edit", editingIndex: i })
            },

            deleteRecord(i) {
                set((s) => ({
                    historial: s.historial.filter((_, idx) => idx !== i),
                }))
            },

            reset() {
                set({ active: { ...EMPTY }, mode: "create", editingIndex: null })
            },

            exportJson() {
                const blob = new Blob([JSON.stringify(get().historial, null, 2)], {
                    type: "application/json",
                })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = "historial.json"
                a.click()
            },

            exportJornadaCsv() {
                const rows = get().historial
                    .map(r => r.start && r.end ? `${r.start},${r.end}` : "")
                    .filter(Boolean)

                const csv = ["start,end", ...rows].join("\n")
                const blob = new Blob([csv], { type: "text/csv" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = "jornadas.csv"
                a.click()
            },

            exportJornadaTxt() {
                const text = get().historial
                    .map(r => r.start && r.end ? `${r.start} - ${r.end}` : "")
                    .filter(Boolean)
                    .join("\n")

                const blob = new Blob([text], { type: "text/plain" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = "jornadas.txt"
                a.click()
            },

            importJson(file) {
                return new Promise((res, rej) => {
                    const reader = new FileReader()
                    reader.onload = () => {
                        try {
                            set({ historial: JSON.parse(reader.result as string) })
                            res()
                        } catch (e) {
                            rej(e)
                        }
                    }
                    reader.readAsText(file)
                })
            },
        }),
        {
            name: "piscina-storage",
            partialize: (s) => ({
                active: s.active,
                historial: s.historial,
                mode: s.mode,
                editingIndex: s.editingIndex,
                openTaskIndex: s.openTaskIndex,
            }),
        }
    )
)