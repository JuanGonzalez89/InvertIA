'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  CreditCard,
  Globe,
  Mail,
  Pencil,
  Phone,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"

type EditableField = "name" | "phone"

interface ProfileInlineDetailsProps {
  name: string
  phone?: string | null
  email?: string | null
  country?: string | null
}

export function ProfileInlineDetails({
  name,
  phone,
  email,
  country,
}: ProfileInlineDetailsProps) {
  const router = useRouter()
  const [editing, setEditing] = useState<EditableField | null>(null)
  const [savingField, setSavingField] = useState<EditableField | null>(null)
  const [draft, setDraft] = useState({
    name: name ?? "",
    phone: phone ?? "",
  })

  const saveField = async (field: EditableField) => {
    setSavingField(field)
    try {
      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          phone: draft.phone.trim(),
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? "No pudimos actualizar tu perfil")
      }

      toast.success("Perfil actualizado")
      setEditing(null)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error actualizando perfil")
    } finally {
      setSavingField(null)
    }
  }

  const editableItems = [
    {
      key: "name" as const,
      label: "Nombre",
      icon: User,
      value: draft.name || "Sin configurar",
    },
    {
      key: "phone" as const,
      label: "Teléfono",
      icon: Phone,
      value: draft.phone || "No configurado",
    },
  ]

  const readonlyItems = [
    { label: "Email", icon: Mail, value: email || "Sin email" },
    { label: "País", icon: Globe, value: country || "No configurado" },
  ]

  return (
    <ul className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
      {editableItems.map((item) => {
        const Icon = item.icon
        const isEditing = editing === item.key
        const isSaving = savingField === item.key
        return (
          <li
            key={item.key}
            className="flex items-center gap-3 bg-card px-5 py-4"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {item.label}
              </div>
              {isEditing ? (
                <Input
                  value={draft[item.key]}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, [item.key]: event.target.value }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      saveField(item.key)
                    }
                  }}
                  className="mt-1 h-8"
                  disabled={isSaving}
                />
              ) : (
                <div className="mt-0.5 truncate font-mono text-sm text-foreground">
                  {item.value}
                </div>
              )}
            </div>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
              onClick={() =>
                isEditing ? saveField(item.key) : setEditing(item.key)
              }
              aria-label={isEditing ? "Guardar" : "Editar"}
              disabled={isSaving}
            >
              {isEditing ? (
                <Check className="h-4 w-4 text-emerald-500" aria-hidden />
              ) : (
                <Pencil className="h-4 w-4" aria-hidden />
              )}
            </button>
          </li>
        )
      })}
      {readonlyItems.map((item) => {
        const Icon = item.icon
        return (
          <li
            key={item.label}
            className="flex items-center gap-3 bg-card px-5 py-4"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {item.label}
              </div>
              <div className="mt-0.5 truncate font-mono text-sm text-foreground">
                {item.value}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
