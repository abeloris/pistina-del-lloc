"use client"
import { useState, useSyncExternalStore, useRef, useEffect } from "react"
import { usePoolStore } from "@/lib/pool-store"
import { Header } from "@/components/pool/header"
import { JornadaCard } from "@/components/pool/jornada-card"
import { TareasCard } from "@/components/pool/tareas-card"
import { AnalisisCard } from "@/components/pool/analisis-card"
import { HistorialView } from "@/components/pool/historial-view"
import { GuiaCard } from "@/components/pool/guia-card"
import { BottomBar } from "@/components/pool/bottom-bar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Download, FileText, MoreVertical, Table, Upload } from "lucide-react"

const TABS = ["Hoy", "Historial", "Guía"] as const

function useHydrated() {
  return useSyncExternalStore(
    (callback) => {
      const unsub = usePoolStore.persist.onFinishHydration(callback)
      if (!usePoolStore.persist.hasHydrated()) {
        usePoolStore.persist.rehydrate()
      }
      return unsub
    },
    () => usePoolStore.persist.hasHydrated(),
    () => false
  )
}

export default function Home() {
  const [tab, setTab] = useState<typeof TABS[number]>("Hoy")
  const ready = useHydrated()
  const fileRef = useRef<HTMLInputElement>(null)

  const exportJson = usePoolStore((s) => s.exportJson)
  const exportTxt = usePoolStore((s) => s.exportJornadaTxt)
  const exportCsv = usePoolStore((s) => s.exportJornadaCsv)
  const importJson = usePoolStore((s) => s.importJson)

  const loadImagesForActive = usePoolStore((s) => s.loadImagesForActive)

  useEffect(() => {
    if (ready) loadImagesForActive()
  }, [ready])

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    importJson(file).catch(() => { })
    e.target.value = ""
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-xl space-y-4 p-4">
        <Header />
        <p className="pt-8 text-center text-sm text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4 pb-24">
      <Header />

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImport}
      />

      <div className="flex items-center border-b">
        <div className="flex flex-1 gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground"
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Historial" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="mb-1">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportJson} className="gap-2">
                <Download className="w-4 h-4" />
                Exportar JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileRef.current?.click()} className="gap-2">
                <Upload className="w-4 h-4" />
                Importar JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportTxt} className="gap-2">
                <FileText className="w-4 h-4" />
                Jornada TXT
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportCsv} className="gap-2">
                <Table className="w-4 h-4" />
                Jornada CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {tab === "Hoy" && (
        <div className="space-y-4">
          <JornadaCard />
          <TareasCard />
          <AnalisisCard />
        </div>
      )}
      {tab === "Historial" && <HistorialView onEdit={() => setTab("Hoy")} />}
      {tab === "Guía" && <GuiaCard />}
      {tab === "Hoy" && <BottomBar />}
    </div>
  )
}