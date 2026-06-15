"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePoolStore } from "@/lib/pool-store"

const pad = (n: number) => String(n).padStart(2, "0")

const toLocalString = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
  `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`

export function JornadaCard() {
  const active = usePoolStore((s) => s.active)
  const startNew = usePoolStore((s) => s.startNew)
  const finishDay = usePoolStore((s) => s.finishDay)
  const setField = usePoolStore((s) => s.setField)

  const status =
    active.start && !active.end
      ? "running"
      : active.start && active.end
        ? "done"
        : "idle"

  const dateValue = active.start ? active.start.slice(0, 10) : ""
  const startTime = active.start ? active.start.slice(11, 16) : ""
  const endTime = active.end ? active.end.slice(11, 16) : ""

  const updateDate = (value: string) => {
    if (!active.start) return

    const start = new Date(active.start)
    const [year, month, day] = value.split("-").map(Number)

    start.setFullYear(year)
    start.setMonth(month - 1)
    start.setDate(day)

    const updatedStart = toLocalString(start)
    setField("start", updatedStart)

    if (active.end) {
      const end = new Date(active.end)

      end.setFullYear(year)
      end.setMonth(month - 1)
      end.setDate(day)

      setField("end", toLocalString(end))
    }
  }

  const updateTime = (field: "start" | "end", value: string) => {
    const current = active[field]
    if (!current) return

    const date = new Date(current)
    const [hours, minutes] = value.split(":").map(Number)

    date.setHours(hours)
    date.setMinutes(minutes)

    setField(field, toLocalString(date))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Jornada</CardTitle>

        <Badge variant={status === "done" ? "secondary" : "default"}>
          {status === "idle" && "No iniciada"}
          {status === "running" && "En curso"}
          {status === "done" && "Finalizada"}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex justify-center">
          <input
            type="date"
            value={dateValue}
            disabled={!active.start}
            onChange={(e) => updateDate(e.target.value)}
            className="w-auto rounded-md border px-3 py-2 text-center"
          />
        </div>

        <div className="flex items-center justify-center gap-2">
          <input
            type="time"
            value={startTime}
            disabled={!active.start}
            onChange={(e) => updateTime("start", e.target.value)}
            className="rounded-md border px-2 py-1"
          />

          <span className="text-lg">→</span>

          <input
            type="time"
            value={endTime}
            disabled={!active.end}
            onChange={(e) => updateTime("end", e.target.value)}
            className="rounded-md border px-2 py-1"
          />
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={startNew}
            disabled={status === "running"}
          >
            Iniciar
          </Button>

          <Button
            className="flex-1"
            variant="secondary"
            onClick={finishDay}
            disabled={status !== "running"}
          >
            Finalizar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}