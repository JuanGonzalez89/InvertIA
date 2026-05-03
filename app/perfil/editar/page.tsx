"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function EditProfilePage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [country, setCountry] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, country })
      })

      if (res.ok) {
        router.push('/perfil')
      } else {
        const txt = await res.text()
        alert('Error: ' + txt)
      }
    } catch (err) {
      alert('Error al actualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Editar perfil</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground">Nombre</label>
          <input value={name} onChange={(e)=>setName(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground">Teléfono</label>
          <input value={phone} onChange={(e)=>setPhone(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground">País</label>
          <input value={country} onChange={(e)=>setCountry(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
          <Button variant="outline" onClick={()=>router.push('/perfil')}>Cancelar</Button>
        </div>
      </form>
    </div>
  )
}
