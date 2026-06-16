"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useMemo, useState } from "react"
import { usePoolStore } from "@/lib/pool-store"
import { DAILY_TASKS, WEEKLY_TASKS } from "@/lib/pool-data"

const PAGE_SIZE = 6

export function HistorialView({ onEdit }: { onEdit: () => void }) {
  const historial = usePoolStore((s) => s.historial)
  const edit = usePoolStore((s) => s.editRecord)
  const remove = usePoolStore((s) => s.deleteRecord)
  const [page, setPage] = useState(1)

  const handleDelete = (i: number) => {
    const ok = window.confirm("¿Seguro que quieres borrar este registro?")
    if (!ok) return
    remove(i)
  }

  const handleEdit = async (i: number) => {
    await edit(i)
    onEdit()
  }

  const data = useMemo(() => [...historial].reverse(), [historial])
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE))

  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return data.slice(start, start + PAGE_SIZE)
  }, [data, page])

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin registros</p>
  }

  return (
    <div className="space-y-3">
      {pageData.map((r, idx) => {
        const globalIndex = (page - 1) * PAGE_SIZE + idx
        const realIndex = historial.length - 1 - globalIndex

        const dailyDone = r.checks
          .slice(0, DAILY_TASKS.length)
          .filter(Boolean).length

        const weeklyDone = r.checks
          .slice(DAILY_TASKS.length)
          .filter(Boolean).length

        return (
          <Card key={realIndex} className="p-3 space-y-2">
            <div className="flex gap-4">
              <span className="font-medium text-sm">
                {r.start
                  ? new Date(r.start).toLocaleDateString("es-ES")
                  : "Sin fecha"}
              </span>
              <span className="text-m">
                {r.start
                  ? new Date(r.start).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "--:--"}{" "}
                →{" "}
                {r.end
                  ? new Date(r.end).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "--:--"}
              </span>
              <span>
                {r.start && r.end
                  ? (() => {
                      const diffMs =
                        new Date(r.end).getTime() - new Date(r.start).getTime()
                      const hours = Math.floor(diffMs / (1000 * 60 * 60))
                      const minutes = Math.floor(
                        (diffMs % (1000 * 60 * 60)) / (1000 * 60)
                      )
                      return `${hours}h ${minutes.toString().padStart(2, "0")}m`
                    })()
                  : "--"}
              </span>
            </div>

            <div className="flex justify-between items-end gap-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>pH: {r.ph ?? "—"}</span>
                <span>Cl libre: {r.clLibre ?? "—"}</span>
                <span>Cl total: {r.clTotal ?? "—"}</span>
                <span>Cl comb: {r.clComb ?? "—"}</span>
                <span>Depurada: {r.depurada ?? "—"} m³</span>
                <span>Renovada: {r.renovada ?? "—"} m³</span>
                <span>Transparencia: {r.transparencia ? "Sí" : "No"}</span>
                <span>Diarias: {dailyDone}/{DAILY_TASKS.length}</span>
                <span>Semanales: {weeklyDone}/{WEEKLY_TASKS.length}</span>
              </div>

              <div className="flex flex-col items-end gap-1">
                <Button variant="outline" size="sm" onClick={() => handleEdit(realIndex)}>
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(realIndex)}>
                  Borrar
                </Button>
              </div>
            </div>
          </Card>
        )
      })}

      {data.length > PAGE_SIZE && (
        <div className="flex justify-between items-center pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}