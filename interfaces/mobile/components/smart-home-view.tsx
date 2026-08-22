"use client"

import { useState } from "react"
import { Lightbulb, Thermometer, LockKeyhole, Wifi, Camera, Fan, Tv, Plus } from "lucide-react"
import type { LucideIcon } from "lucide-react"

type Device = {
  id: string
  name: string
  room: string
  icon: LucideIcon
  active: boolean
  value?: string
  wide?: boolean
}

const INITIAL: Device[] = [
  { id: "thermostat", name: "Termostato", room: "Sala", icon: Thermometer, active: true, value: "22°", wide: true },
  { id: "lights", name: "Luzes", room: "Sala", icon: Lightbulb, active: true, value: "80%" },
  { id: "lock", name: "Fechadura", room: "Entrada", icon: LockKeyhole, active: true, value: "Trancada" },
  { id: "wifi", name: "Wi-Fi", room: "Casa", icon: Wifi, active: true, value: "Conectado" },
  { id: "camera", name: "Câmera", room: "Portão", icon: Camera, active: false, value: "Desligada" },
  { id: "fan", name: "Ventilador", room: "Quarto", icon: Fan, active: false, value: "Desligado" },
  { id: "tv", name: "TV", room: "Sala", icon: Tv, active: false, value: "Desligada" },
]

export function SmartHomeView() {
  const [devices, setDevices] = useState<Device[]>(INITIAL)

  function toggle(id: string) {
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, active: !d.active } : d)))
  }

  const activeCount = devices.filter((d) => d.active).length

  return (
    <div className="flex h-full flex-col animate-view-in">
      <div className="flex items-center justify-between px-5 pb-4 pt-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Casa Inteligente</h1>
          <p className="text-xs text-muted-foreground">
            {activeCount} de {devices.length} dispositivos ativos
          </p>
        </div>
        <button
          type="button"
          aria-label="Adicionar dispositivo"
          className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
        >
          <Plus className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div className="grid flex-1 auto-rows-min grid-cols-2 gap-3 overflow-y-auto px-5 pb-2">
        {devices.map((d) => {
          const Icon = d.icon
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => toggle(d.id)}
              aria-pressed={d.active}
              className={`${d.wide ? "col-span-2" : ""} flex flex-col gap-3 rounded-2xl border p-4 text-left transition-colors ${
                d.active
                  ? "border-primary/30 bg-primary text-primary-foreground"
                  : "border-border bg-card text-card-foreground"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex size-10 items-center justify-center rounded-full ${
                    d.active ? "bg-primary-foreground/20" : "bg-secondary"
                  }`}
                >
                  <Icon className={`size-5 ${d.active ? "text-primary-foreground" : "text-primary"}`} aria-hidden="true" />
                </span>
                <span
                  className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
                    d.active ? "bg-primary-foreground/30" : "bg-secondary"
                  }`}
                >
                  <span
                    className={`size-5 rounded-full bg-background transition-transform ${
                      d.active ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold">{d.name}</p>
                <p className={`text-xs ${d.active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {d.room} · {d.value}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
