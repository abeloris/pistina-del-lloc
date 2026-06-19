"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { usePoolStore } from "@/lib/pool-store"
import { CHEM_INFO } from "@/lib/pool-data"

function sanitize(value: string) {
  return value.replace(",", ".").replace(/[^0-9.]/g, "")
}

function outOfRange(value: string, min: number, max: number) {
  const n = parseFloat(value)
  if (isNaN(n)) return false
  return n < min || n > max
}

export function AnalisisCard() {
  const active = usePoolStore((s) => s.active)
  const setField = usePoolStore((s) => s.setField)

  const phWarn = outOfRange(active.ph, CHEM_INFO.ph.min, CHEM_INFO.ph.max)
  const clWarn = outOfRange(active.clLibre, CHEM_INFO.cloro.min, CHEM_INFO.cloro.max)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis del agua</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">

          {/* pH */}
          <div className="space-y-1">
            <label className="text-sm font-medium">pH</label>
            <Input
              value={active.ph}
              onChange={(e) => setField("ph", sanitize(e.target.value))}
              placeholder="Ej: 7.2"
              inputMode="decimal"
              step="0.1"
              className={phWarn ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Rango {CHEM_INFO.ph.min}–{CHEM_INFO.ph.max}
            </p>
          </div>

          {/* Cloro libre */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Cloro libre (ppm)</label>
            <Input
              value={active.clLibre}
              onChange={(e) => setField("clLibre", sanitize(e.target.value))}
              placeholder="Ej: 1.5"
              inputMode="decimal"
              step="0.1"
              className={clWarn ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Objetivo {CHEM_INFO.cloro.target} ppm ({CHEM_INFO.cloro.min}–{CHEM_INFO.cloro.max})
            </p>
          </div>

          {/* Cloro total */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Cloro total (ppm)</label>
            <Input
              value={active.clTotal}
              onChange={(e) => setField("clTotal", sanitize(e.target.value))}
              placeholder="Ej: 2.0"
              inputMode="decimal"
              step="0.1"
            />
          </div>

          {/* Cloro combinado */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Cloro combinado</label>
            <Input
              readOnly
              value={active.clComb}
              className="bg-muted"
            />
          </div>

          {/* Agua depurada */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Agua depurada (m³)</label>

            {active.img1 && (
              <img
                src={active.img1}
                alt="Contador agua depurada"
                className="w-full h-28 object-cover rounded-lg border"
              />
            )}

            <Input
              value={active.depurada}
              onChange={(e) => setField("depurada", sanitize(e.target.value))}
              placeholder="Ej: 232323"
              inputMode="decimal"
              min={0}
              step="0.1"
            />
          </div>

          {/* Agua renovada */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Agua renovada (m³)</label>

            {active.img2 && (
              <img
                src={active.img2}
                alt="Contador agua renovada"
                className="w-full h-28 object-cover rounded-lg border"
              />
            )}

            <Input
              value={active.renovada}
              onChange={(e) => setField("renovada", sanitize(e.target.value))}
              placeholder="Ej: 15126"
              inputMode="decimal"
              min={0}
              step="0.1"
            />
          </div>

        </div>

        {/* Transparencia */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <span className="text-sm font-medium">Transparencia del agua</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={active.transparencia === true ? "default" : "outline"}
              onClick={() => setField("transparencia", true)}
            >
              Sí
            </Button>
            <Button
              size="sm"
              variant={active.transparencia === false ? "destructive" : "outline"}
              onClick={() => setField("transparencia", false)}
            >
              No
            </Button>
          </div>
        </div>

        {active.transparencia === false && !clWarn && !phWarn && (
          <p className="text-xs text-amber-600">
            Cloro y pH correctos pero agua turbia: contacta con Miguel antes de añadir producto. No usar Delsafloc sin autorización.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
