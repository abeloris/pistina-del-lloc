"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ChevronDown, Camera } from "lucide-react"
import { usePoolStore } from "@/lib/pool-store"
import { DAILY_TASKS, WEEKLY_TASKS, TaskInfo } from "@/lib/pool-data"
import { Input } from "../ui/input"

type ImgKey = "img1" | "img2"

function sanitize(value: string) {
    return value.replace(",", ".").replace(/[^0-9.]/g, "")
}

function compressImage(file: File, maxSize = 1000, quality = 0.7): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const img = new Image()
            img.onload = () => {
                let { width, height } = img

                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = Math.round((height * maxSize) / width)
                        width = maxSize
                    } else {
                        width = Math.round((width * maxSize) / height)
                        height = maxSize
                    }
                }

                const canvas = document.createElement("canvas")
                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext("2d")
                if (!ctx) return reject(new Error("canvas error"))

                ctx.drawImage(img, 0, 0, width, height)
                resolve(canvas.toDataURL("image/jpeg", quality))
            }

            img.onerror = reject
            img.src = reader.result as string
        }

        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

function formatTime(ms: number) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function FiltroTimer() {
    const filtroTimerEnd = usePoolStore((s) => s.active.filtroTimerEnd)
    const setField = usePoolStore((s) => s.setField)
    const [now, setNow] = useState(() => Date.now())
    const notifiedRef = useRef(false)

    useEffect(() => {
        if (!filtroTimerEnd) return
        const id = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(id)
    }, [filtroTimerEnd])

    const remaining = filtroTimerEnd ? filtroTimerEnd - now : null
    const running = remaining !== null && remaining > 0
    const finished = !!filtroTimerEnd && remaining !== null && remaining <= 0

    useEffect(() => {
        if (finished && !notifiedRef.current) {
            notifiedRef.current = true
            if (typeof navigator !== "undefined" && "vibrate" in navigator) {
                navigator.vibrate([300, 150, 300, 150, 300])
            }
        }
        if (!finished) notifiedRef.current = false
    }, [finished])

    return (
        <div className="flex items-center justify-between rounded-lg border bg-background p-3">
            <div>
                <p className={`font-mono text-lg ${finished ? "text-emerald-600" : ""}`}>
                    {finished ? "¡Listo!" : running ? formatTime(remaining!) : "05:00"}
                </p>
                <p className="text-xs text-muted-foreground">
                    {finished
                        ? "Apaga la bomba"
                        : running
                            ? "Bomba en marcha..."
                            : "Cronómetro de lavado (5 min)"}
                </p>
            </div>

            {running ? (
                <Button size="sm" variant="outline" onClick={() => setField("filtroTimerEnd", null)}>
                    Detener
                </Button>
            ) : (
                <Button
                    size="sm"
                    onClick={() => setField("filtroTimerEnd", Date.now() + 5 * 60 * 1000)}
                >
                    {finished ? "Repetir" : "Iniciar"}
                </Button>
            )}
        </div>
    )
}

function TaskItem({
    task,
    checked,
    open,
    onToggleOpen,
    onToggleCheck,
    children,
}: {
    task: TaskInfo
    checked: boolean
    open: boolean
    onToggleOpen: () => void
    onToggleCheck: () => void
    children?: React.ReactNode
}) {
    return (
        <div className="rounded-lg border">
            <div
                role="button"
                tabIndex={0}
                className="flex w-full cursor-pointer items-center gap-3 p-3 text-left text-sm"
                onClick={onToggleOpen}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        onToggleOpen()
                    }
                }}
            >
                <Checkbox
                    checked={checked}
                    onCheckedChange={onToggleCheck}
                    onClick={(e) => e.stopPropagation()}
                />

                <span className={checked ? "flex-1 text-muted-foreground line-through" : "flex-1"}>
                    {task.title}
                </span>

                <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""
                        }`}
                />
            </div>

            {open && (
                <div className="space-y-2 px-3 pb-3 text-sm text-muted-foreground">
                    {task.valves && (
                        <div className="rounded-md border bg-muted/50 p-3 text-xs">
                            <p className="text-emerald-700">
                                <strong>Abrir:</strong> {task.valves.open.join(", ")}
                            </p>
                            <p className="mt-1 text-red-700">
                                <strong>Cerrar:</strong> {task.valves.close.join(", ")}
                            </p>
                        </div>
                    )}

                    <ol className="list-inside list-decimal space-y-1">
                        {task.steps.map((step, i) => (
                            <li key={i}>{step}</li>
                        ))}
                    </ol>

                    {children}
                </div>
            )}
        </div>
    )
}

export function TareasCard() {
    const active = usePoolStore((s) => s.active)
    const toggleCheck = usePoolStore((s) => s.toggleCheck)
    const setImage = usePoolStore((s) => s.setImage)

    const setField = usePoolStore((s) => s.setField)

    const openTaskIndex = usePoolStore((s) => s.openTaskIndex)
    const setOpenTaskIndex = usePoolStore((s) => s.setOpenTaskIndex)

    const cameraRef = useRef<HTMLInputElement>(null)
    const galleryRef = useRef<HTMLInputElement>(null)
    const keyRef = useRef<ImgKey | null>(null)

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file || !keyRef.current) return

        try {
            const dataUrl = await compressImage(file)
            setImage(keyRef.current, dataUrl)
        } catch {
            const reader = new FileReader()
            reader.onload = () => setImage(keyRef.current!, reader.result as string)
            reader.readAsDataURL(file)
        }

        e.target.value = ""
    }

    function openCamera(k: ImgKey) {
        keyRef.current = k
        cameraRef.current?.click()
    }

    function openGallery(k: ImgKey) {
        keyRef.current = k
        galleryRef.current?.click()
    }

    const dailyDone = active.checks
        .slice(0, DAILY_TASKS.length)
        .filter(Boolean).length

    const percent = (dailyDone / DAILY_TASKS.length) * 100

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tareas</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
                <Progress value={percent} />
                <p className="text-xs text-muted-foreground">
                    {dailyDone} de {DAILY_TASKS.length} tareas diarias
                </p>

                <input
                    ref={cameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFile}
                    className="hidden"
                />

                <input
                    ref={galleryRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFile}
                    className="hidden"
                />

                <p className="pt-2 text-xs font-medium text-muted-foreground">
                    Diarias
                </p>

                {DAILY_TASKS.map((task, i) => (
                    <TaskItem
                        key={task.title}
                        task={task}
                        checked={active.checks[i]}
                        open={openTaskIndex === i}
                        onToggleOpen={() =>
                            setOpenTaskIndex(openTaskIndex === i ? null : i)
                        }
                        onToggleCheck={() => toggleCheck(i)}
                    >
                        {i === 0 && (
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                {[
                                    { k: "img1" as ImgKey, label: "Amarillo", img: active.img1 },
                                    { k: "img2" as ImgKey, label: "Gris", img: active.img2 },
                                ].map((item) => (
                                    <div key={item.k} className="space-y-2">
                                        <button
                                            type="button"
                                            className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg border bg-muted"
                                            onClick={() =>
                                                !item.img && openCamera(item.k)
                                            }
                                        >
                                            {item.img ? (
                                                <img
                                                    src={item.img}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center text-muted-foreground">
                                                    <Camera className="h-5 w-5" />
                                                    <span className="text-xs">
                                                        {item.label}
                                                    </span>
                                                </div>
                                            )}
                                        </button>

                                        <Button
                                            className="w-full"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openGallery(item.k)}
                                        >
                                            Galería
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {i === 1 && <FiltroTimer />}

                        {i === 4 && (
                            <div className="grid grid-cols-3 gap-2 pt-2">

                                <div className="flex flex-col">
                                    <label className="text-sm text-black mb-1">pH</label>
                                    <Input
                                        placeholder="7.2 - 7.8"
                                        value={active.ph}
                                        inputMode="decimal"
                                        step="0.1"
                                        onChange={(e) => setField("ph", sanitize(e.target.value))}
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-sm text-black mb-1">Cl libre</label>
                                    <Input
                                        placeholder="0.5 - 2"
                                        value={active.clLibre}
                                        inputMode="decimal"
                                        step="0.1"
                                        onChange={(e) => setField("clLibre", sanitize(e.target.value))}
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-sm text-black mb-1">Cl total</label>
                                    <Input
                                        placeholder="0.5 - 2"
                                        value={active.clTotal}
                                        inputMode="decimal"
                                        step="0.1"
                                        onChange={(e) => setField("clTotal", sanitize(e.target.value))}
                                    />
                                </div>

                            </div>
                        )}
                    </TaskItem>
                ))}

                <p className="pt-2 text-xs font-medium text-muted-foreground">
                    Semanales
                </p>

                {WEEKLY_TASKS.map((task, wi) => {
                    const i = DAILY_TASKS.length + wi

                    return (
                        <TaskItem
                            key={task.title}
                            task={task}
                            checked={active.checks[i]}
                            open={openTaskIndex === i}
                            onToggleOpen={() =>
                                setOpenTaskIndex(openTaskIndex === i ? null : i)
                            }
                            onToggleCheck={() => toggleCheck(i)}
                        />
                    )
                })}
            </CardContent>
        </Card>
    )
}