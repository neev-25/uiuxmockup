"use client"

import { Button } from '@/components/ui/button'
import { SettingContext } from '@/context/SettingContext'
import axios from 'axios'
import { ArrowLeft, Home, Loader2, Save, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useContext, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  projectName?: string | null
}

function ProjectHeader({ projectName }: Props) {
  const { settingsDetail } = useContext(SettingContext)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onSave = async () => {
    if (!settingsDetail?.projectId) {
      toast.error('Project details not loaded. Please refresh the page.')
      return
    }

    try {
      setLoading(true)
      const result = await axios.put('/api/project', {
        theme: settingsDetail.theme,
        projectId: settingsDetail.projectId,
        projectName: settingsDetail.projectName,
      })

      if (result.status === 200 && result.data) {
        toast.success('Settings saved successfully')
      } else {
        toast.error('Failed to save settings')
      }
    } catch (e: unknown) {
      console.error('Save error:', e)
      const errorMsg = axios.isAxiosError(e)
        ? e.response?.data?.error || e.message
        : 'Internal Server Error'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 p-3 shadow bg-white z-40 relative border-b">
      <div className="flex items-center gap-2 min-w-0">
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => router.push('/')}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Dashboard
        </Button>
        <Link
          href="/"
          className="hidden sm:flex gap-2 items-center min-w-0 hover:opacity-80 transition-opacity"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold leading-tight truncate">
              {projectName || settingsDetail?.projectName || 'Untitled Project'}
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Home className="h-3 w-3" />
              UIUXMock
            </p>
          </div>
        </Link>
      </div>
      <Button disabled={loading} onClick={onSave} size="sm">
        {loading ? <Loader2 className="animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
        Save
      </Button>
    </div>
  )
}

export default ProjectHeader
