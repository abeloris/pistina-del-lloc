"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { usePoolStore } from "@/lib/pool-store"
import { CHEM_INFO } from "@/lib/pool-data"

function sanitize(v: string) {
    return v.replace(",", ".").replace(/[^0-9.]/g, "")
}

function out(value: string, min: number, max: number) {
    const n = parseFloat(value)
    return !isNaN(n) && (n < min || n > max)
}

export function AnalisisCard() {
    const active = usePoolStore((s) => s.active)
    const setField = usePoolStore((s) => s.setField)

    const phWarn = out(active.ph, CHEM_INFO.ph.min, CHEM_INFO.ph.max)
    const clWarn = out(active.clLibre, CHEM_INFO.cloro.min, CHEM_INFO.cloro.max)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Análisis del agua</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">

                    <div>
                        <label>pH</label>
                        <Input value={active.ph} onChange={e => setField("ph", sanitize(e.target.value))} />
                    </div>

                    <div>
                        <label>Cloro libre</label>
                        <Input value={active.clLibre} onChange={e => setField("clLibre", sanitize(e.target.value))} />
                    </div>

                    <div>
                        <label>Cloro total</label>
                        <Input value={active.clTotal} onChange={e => setField("clTotal", sanitize(e.target.value))} />
                    </div>

                    <div>
                        <label>Cloro combinado</label>
                        <Input readOnly value={active.clComb} />
                    </div>

                    <div>
                        <label>Depurada</label>
                        <Input value={active.depurada} onChange={e => setField("depurada", sanitize(e.target.value))} />
                    </div>

                    <div>
                        <label>Renovada</label>
                        <Input value={active.renovada} onChange={e => setField("renovada", sanitize(e.target.value))} />
                    </div>

                    <div className="col-span-2">
                        <label>Notas análisis</label>
                        <Input
                            value={active.analisisNotas}
                            onChange={e => setField("analisisNotas", e.target.value)}
                        />
                    </div>

                </div>

                {active.analisisNotas && (
                    <div className="border rounded p-3 text-sm">
                        {active.analisisNotas}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}