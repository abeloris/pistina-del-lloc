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

type Mode = "create" | "edit"

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

/**
 * IMPORTANT:
 * Keep everything in LOCAL time (avoid UTC shift from toISOString)
 */
const toLocalISO = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0")

    return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
        `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    )
}

const recalc = (r: PoolRecord): PoolRecord => {
    const l = parseFloat(r.clLibre)
    const t = parseFloat(r.clTotal)

    return {
        ...r,
        clComb: !isNaN(l) && !isNaN(t) ? Math.max(0, t - l).toFixed(2) : "",
    }
}

interface Store {
    active: PoolRecord
    historial: PoolRecord[]
    mode: Mode
    editingIndex: number | null

    startNew: () => void
    finishDay: () => void
    setField: <K extends keyof PoolRecord>(k: K, v: PoolRecord[K]) => void
    toggleCheck: (i: number) => void
    setImage: (k: "img1" | "img2", v: string) => void
    save: () => void
    exportData: () => void
    editRecord: (i: number) => void
    deleteRecord: (i: number) => void
    reset: () => void
}

export const usePoolStore = create<Store>()(
    persist(
        (set, get) => ({
            active: { ...EMPTY },
            historial: [],
            mode: "create",
            editingIndex: null,

            startNew() {
                set((s) => ({
                    active: {
                        ...s.active,
                        start: build(s.active.start?.slice(0, 10) || today()),
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
                    active: recalc({
                        ...s.active,
                        [k]: v,
                    }),
                }))
            },

            toggleCheck(i) {
                set((s) => {
                    const checks = [...s.active.checks]
                    checks[i] = !checks[i]
                    return { active: { ...s.active, checks } }
                })
            },

            setImage(k, v) {
                set((s) => ({
                    active: {
                        ...s.active,
                        [k]: v,
                    },
                }))
            },

            save() {
                const { active, historial, mode, editingIndex } = get()

                if (!active.start) return

                if (mode === "edit" && editingIndex !== null) {
                    const h = [...historial]
                    h[editingIndex] = active

                    set({
                        historial: h,
                        active: { ...EMPTY },
                        mode: "create",
                        editingIndex: null,
                    })
                    return
                }

                set({
                    historial: [...historial, active],
                    active: { ...EMPTY },
                    mode: "create",
                    editingIndex: null,
                })
            },

            exportData() {
                const blob = new Blob(
                    [JSON.stringify(get().historial, null, 2)],
                    { type: "application/json" }
                )

                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")

                a.href = url
                a.download = "historial_piscina.json"
                a.click()

                URL.revokeObjectURL(url)
            },

            editRecord(i) {
                const item = get().historial[i]
                if (!item) return

                set({
                    active: { ...item },
                    mode: "edit",
                    editingIndex: i,
                })
            },

            deleteRecord(i) {
                set((s) => ({
                    historial: s.historial.filter((_, idx) => idx !== i),
                }))
            },

            reset() {
                set({
                    active: { ...EMPTY },
                    mode: "create",
                    editingIndex: null,
                })
            },
        }),
        {
            name: "piscina-storage",
            skipHydration: true,
            partialize: (s) => ({
                active: s.active,
                historial: s.historial,
                mode: s.mode,
                editingIndex: s.editingIndex,
            }),
        }
    )
)