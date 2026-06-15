"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { usePoolStore } from "@/lib/pool-store"
import { DAILY_TASKS, WEEKLY_TASKS } from "@/lib/pool-data"

export function HistorialView() {
  const historial = usePoolStore((s) => s.historial)
  const edit = usePoolStore((s) => s.editRecord)
  const remove = usePoolStore((s) => s.deleteRecord)

  if (!historial.length) {
    return <p className="text-sm text-muted-foreground">Sin registros</p>
  }

  return (
    <div className="space-y-3">
      {[...historial].reverse().map((r, ri) => {
        const i = historial.length - 1 - ri
        const dailyDone = r.checks.slice(0, DAILY_TASKS.length).filter(Boolean).length
        const weeklyDone = r.checks.slice(DAILY_TASKS.length).filter(Boolean).length
        return (
          <Card key={i} className="space-y-2 p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex flex-col">
                <span className="font-medium">
                  {r.start
                    ? new Date(r.start).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                    : "Sin fecha"}
                </span>

                <span className="text-xs text-muted-foreground">
                  {r.start
                    ? new Date(r.start).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : "--:--"}
                  {" → "}
                  {r.end
                    ? new Date(r.end).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : "--:--"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => edit(i)}>Editar</Button>
                <Button size="sm" variant="destructive" onClick={() => remove(i)}>Borrar</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              <span>pH: {r.ph || "—"}</span>
              <span>Cl libre: {r.clLibre || "—"}</span>
              <span>Cl total: {r.clTotal || "—"}</span>
              <span>Cl combinado: {r.clComb || "—"}</span>
              <span>Depurada: {r.depurada || "—"} m³</span>
              <span>Renovada: {r.renovada || "—"} m³</span>
              <span>Transparencia: {r.transparencia == null ? "—" : r.transparencia ? "Sí" : "No"}</span>
              <span>Diarias: {dailyDone}/{DAILY_TASKS.length}</span>
              <span>Semanales: {weeklyDone}/{WEEKLY_TASKS.length}</span>
            </div>
          </Card>
        )
      })}
    </div>
  )
}