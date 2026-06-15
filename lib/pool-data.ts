export interface TaskInfo {
    title: string
    steps: string[]
    valves?: {
        open: string[]
        close: string[]
    }
}

export const DAILY_TASKS: TaskInfo[] = [
    {
        title: "Contadores",
        steps: [
            "Hacer foto del contador amarillo (agua depurada).",
            "Hacer foto del contador gris (agua renovada).",
        ],
    },
    {
        title: "Lavado del filtro de arenas",
        steps: [
            "Parar la bomba antes de tocar las válvulas.",
            "Encender la bomba durante 5 minutos.",
        ],
        valves: {
            open: ["Fondo", "Skimmer", "2", "3"],
            close: ["Limpiafondos", "1", "4", "5"],
        },
    },
    {
        title: "Limpiafondos",
        steps: [
            "Parar la bomba antes de tocar las válvulas.",
            "Cepillar escaleras y suelo.",
            "Pasar el limpiafondos, evitando que la manguera flote.",
        ],
        valves: {
            open: ["Limpiafondos", "1", "4"],
            close: ["Fondo", "Skimmer", "2", "3"],
        },
    },
    {
        title: "Limpieza de cestillos de bombas",
        steps: [
            "Cerrar las llaves B.",
            "Limpiar los cestillos.",
            "Abrir las llaves B.",
        ],
    },
    {
        title: "Relleno de la piscina",
        steps: [
            "Cerrar primera llave B desde la entrada",
            "Abrir llave llenado 3 puntos",
            "Rellenar agua hasta la mitad del skimmer central.",
            "Analizar pH con Phenol Red.",
            "Analizar cloro libre con DPD1.",
            "Analizar cloro total con DPD3.",
        ],
    },
    {
        title: "Depuración",
        steps: [
            "Parar la bomba antes de tocar las válvulas.",
            "Encender la bomba.",
        ],
        valves: {
            open: ["Fondo", "Skimmer", "1", "4"],
            close: ["Limpiafondos", "2", "3", "5"],
        },
    },
]

export const WEEKLY_TASKS: TaskInfo[] = [
    {
        title: "Algidesa en vaso",
        steps: [
            "Aplicar 3 L al cerrar la piscina.",
            "Aplicar preferiblemente por la noche.",
            "Adelantar la aplicación si se prevén tormentas.",
        ],
    },
    {
        title: "Algidesa D en playas y duchas",
        steps: [
            "Preparar la mezcla: 8 L agua + 2 L Algidesa D (proporción 4:1).",
            "Aplicar en playas y duchas.",
            "Evitar el contacto con el césped.",
        ],
    },
]

export const CHEM_INFO = {
    cloro: { min: 0.5, max: 2, target: 1, unit: "ppm" },
    ph: { min: 7.2, max: 8.0, target: 7.4 },
    acido: "5 L por cada 100 m³ reducen aproximadamente 0,2 unidades de pH. No excederse.",
}