"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { DAILY_TASKS, WEEKLY_TASKS } from "./pool-data"
import { saveImage, loadImage, deleteImage } from "./image-store"

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
    filtroTimerEnd: number | null
}

export interface PoolRecordWithImages extends PoolRecord {
    img1: string
    img2: string
}

type Mode = "create" | "edit"

interface PoolStore {
    active: PoolRecordWithImages
    historial: PoolRecord[]
    mode: Mode
    editingIndex: number | null
    openTaskIndex: number | null

    setOpenTaskIndex: (i: number | null) => void
    startNew: () => void
    finishDay: () => void
    setField: <K extends keyof PoolRecordWithImages>(k: K, v: PoolRecordWithImages[K]) => void
    toggleCheck: (i: number) => void
    setImage: (k: "img1" | "img2", v: string) => void
    loadImagesForActive: () => Promise<void>

    save: () => Promise<void>
    editRecord: (i: number) => Promise<void>
    deleteRecord: (i: number) => Promise<void>
    reset: () => void

    exportJson: () => Promise<void>
    exportJornadaCsv: () => void
    exportJornadaTxt: () => void
    importJson: (file: File) => Promise<void>
}

const EMPTY: PoolRecordWithImages = {
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

const now = () => {
    const d = new Date()
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const recalc = (r: PoolRecordWithImages): PoolRecordWithImages => {
    const l = parseFloat(r.clLibre)
    const t = parseFloat(r.clTotal)
    return {
        ...r,
        clComb: !isNaN(l) && !isNaN(t) ? Math.max(0, t - l).toFixed(2) : "",
    }
}

const imgKey = (recordStart: string, slot: "img1" | "img2") =>
    `img_${recordStart}_${slot}`

const formatDateShort = (iso: string) => {
    if (!iso) return ""
    const d = new Date(iso)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const formatTime = (iso: string) => {
    if (!iso) return ""
    const d = new Date(iso)
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const formatDateDisplay = (iso: string) => {
    if (!iso) return ""
    const d = new Date(iso)
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
}

const diffHours = (start: string, end: string) => {
    if (!start || !end) return ""
    const ms = new Date(end).getTime() - new Date(start).getTime()
    if (ms <= 0) return ""
    const totalMin = Math.floor(ms / 60000)
    return `${Math.floor(totalMin / 60)}h ${totalMin % 60}min`
}

const jornadaFilename = (historial: PoolRecord[], ext: string) => {
    const valid = historial.filter((r) => r.start)
    if (!valid.length) return `jornadas.${ext}`
    const first = formatDateShort(valid[0].start)
    const last = formatDateShort(valid[valid.length - 1].start)
    return first === last ? `jornada_${first}.${ext}` : `jornadas_${first}_${last}.${ext}`
}

const download = (content: string, filename: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }))
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
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
                set((s) => ({ active: { ...s.active, start: now() } }))
            },

            finishDay() {
                set((s) => ({ active: { ...s.active, end: now() } }))
            },

            setField(k, v) {
                set((s) => ({ active: recalc({ ...s.active, [k]: v }) }))
            },

            toggleCheck(i) {
                set((s) => {
                    const checks = [...s.active.checks]
                    checks[i] = !checks[i]
                    return { active: { ...s.active, checks } }
                })
            },

            async setImage(k, v) {
                const key = imgKey(get().active.start || "draft", k)
                await saveImage(key, v)
                set((s) => ({ active: { ...s.active, [k]: v } }))
            },

            async loadImagesForActive() {
                const key = get().active.start || "draft"
                const [img1, img2] = await Promise.all([
                    loadImage(imgKey(key, "img1")),
                    loadImage(imgKey(key, "img2")),
                ])
                set((s) => ({ active: { ...s.active, img1, img2 } }))
            },

            async save() {
                const { active, historial, mode, editingIndex } = get()
                if (!active.start) return

                const { img1, img2, ...record } = active
                if (img1) await saveImage(imgKey(active.start, "img1"), img1)
                if (img2) await saveImage(imgKey(active.start, "img2"), img2)

                if (mode === "edit" && editingIndex !== null) {
                    const copy = [...historial]
                    copy[editingIndex] = record
                    set({ historial: copy, active: { ...EMPTY }, mode: "create", editingIndex: null })
                    return
                }

                set({ historial: [...historial, record], active: { ...EMPTY }, mode: "create", editingIndex: null })
            },

            async editRecord(i) {
                const item = get().historial[i]
                if (!item) return
                const [img1, img2] = await Promise.all([
                    loadImage(imgKey(item.start, "img1")),
                    loadImage(imgKey(item.start, "img2")),
                ])
                set({ active: { ...item, img1, img2 }, mode: "edit", editingIndex: i })
            },

            async deleteRecord(i) {
                const item = get().historial[i]
                if (item?.start) {
                    await Promise.all([
                        deleteImage(imgKey(item.start, "img1")),
                        deleteImage(imgKey(item.start, "img2")),
                    ])
                }
                set((s) => ({ historial: s.historial.filter((_, idx) => idx !== i) }))
            },

            reset() {
                set({ active: { ...EMPTY }, mode: "create", editingIndex: null })
            },

            async exportJson() {
                const { historial } = get()
                const records = await Promise.all(
                    historial.map(async (r) => ({
                        ...r,
                        img1: await loadImage(imgKey(r.start, "img1")),
                        img2: await loadImage(imgKey(r.start, "img2")),
                    }))
                )
                download(JSON.stringify(records, null, 2), jornadaFilename(historial, "json"), "application/json")
            },

            exportJornadaCsv() {
                const { historial } = get()
                const rows = historial
                    .filter((r) => r.start && r.end)
                    .map((r) => `${formatDateDisplay(r.start)},${formatTime(r.start)},${formatTime(r.end)},${diffHours(r.start, r.end)}`)
                download(
                    ["Fecha,Inicio,Fin,Horas trabajadas", ...rows].join("\n"),
                    jornadaFilename(historial, "csv"),
                    "text/csv"
                )
            },

            exportJornadaTxt() {
                const { historial } = get()
                const text = historial
                    .filter((r) => r.start && r.end)
                    .map((r) => `Fecha ${formatDateDisplay(r.start)}, Inicio ${formatTime(r.start)}, Fin ${formatTime(r.end)}, Horas: ${diffHours(r.start, r.end)}`)
                    .join("\n\n")
                download(text, jornadaFilename(historial, "txt"), "text/plain")
            },

            importJson(file) {
                return new Promise((res, rej) => {
                    const reader = new FileReader()
                    reader.onload = async () => {
                        try {
                            const records: (PoolRecord & { img1?: string; img2?: string })[] =
                                JSON.parse(reader.result as string)

                            await Promise.all(
                                records.map(async (r) => {
                                    if (r.img1) await saveImage(imgKey(r.start, "img1"), r.img1)
                                    if (r.img2) await saveImage(imgKey(r.start, "img2"), r.img2)
                                })
                            )

                            set({ historial: records.map(({ img1, img2, ...rest }) => rest) })
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
                active: { ...s.active, img1: "", img2: "" },
                historial: s.historial,
                mode: s.mode,
                editingIndex: s.editingIndex,
                openTaskIndex: s.openTaskIndex,
            }),
        }
    )
)