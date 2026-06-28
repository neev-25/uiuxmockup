"use client"

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RefreshDataContext } from '@/context/RefreshDataContext'
import { SettingContext } from '@/context/SettingContext'
import { THEME_NAME_LIST, THEMES } from '@/data/Themes'
import { ProjectType } from '@/type/types'
import axios from 'axios'
import { Camera, Home, Loader, Loader2Icon, Share, Sparkles } from 'lucide-react'
import React, { useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  projectDetail: ProjectType | undefined
  screenDescription?: string | undefined
  takeScreenShot: () => void
  onBack?: () => void
}

function SettingsSection({
  projectDetail,
  screenDescription,
  takeScreenShot,
  onBack,
}: Props) {
  const [selectedTheme, setSelectedTheme] = useState('')
  const [projectName, setProjectName] = useState(projectDetail?.projectName ?? '')
  const [userNewScreenInput, setUserNewScreenInput] = useState('')
  const { settingsDetail, setSettingsDetail } = useContext(SettingContext)
  const [loading, setLoading] = useState(false)
  const { setRefreshData } = useContext(RefreshDataContext)

  useEffect(() => {
    if (projectDetail) {
      setProjectName(projectDetail.projectName ?? '')
      setSelectedTheme(
        (projectDetail.theme || settingsDetail?.theme || '') as string
      )
    }
  }, [projectDetail, settingsDetail?.theme])

  const onThemeSelect = (theme: string) => {
    setSelectedTheme(theme)
    setSettingsDetail((prev) => {
      const base = prev || projectDetail || {}
      return {
        ...base,
        theme,
        projectId: base.projectId || projectDetail?.projectId,
        projectName: base.projectName || projectDetail?.projectName,
      }
    })
  }

  const generateNewScreen = async () => {
    if (!userNewScreenInput.trim()) {
      toast.error('Please describe the screen you want to generate')
      return
    }
    if (!projectDetail?.projectId) {
      toast.error('Project not loaded')
      return
    }

    try {
      setLoading(true)
      await axios.post('/api/generate-config', {
        userInput: userNewScreenInput,
        projectId: projectDetail.projectId,
        deviceType: projectDetail.device,
        theme: projectDetail.theme,
        oldScreenDescription: screenDescription,
      })
      setUserNewScreenInput('')
      setRefreshData({ method: 'screenConfig', date: Date.now() })
      toast.success('New screen added — generating UI...')
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e)
        ? e.response?.data?.error || e.message
        : 'Failed to generate screen'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const onShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Project URL copied to clipboard')
  }

  return (
    <div className="w-[300px] h-[calc(100vh-57px)] p-5 border-r bg-white overflow-y-auto shrink-0">
      {onBack && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start mb-3 -mt-1 text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          <Home className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      )}
      <h2 className="font-medium text-lg">Settings</h2>

      {loading && (
        <div className="p-3 mt-3 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="flex gap-2 items-center text-sm text-blue-700">
            <Loader2Icon className="animate-spin h-4 w-4" />
            Generating screen...
          </p>
        </div>
      )}

      <div className="mt-3">
        <h2 className="text-sm mb-1 text-muted-foreground">Project Name</h2>
        <Input
          placeholder="Project Name"
          value={projectName}
          onChange={(event) => {
            const newValue = event.target.value
            setProjectName(newValue)
            setSettingsDetail((prev) => {
              const base = prev || projectDetail || {}
              return {
                ...base,
                projectName: newValue,
                projectId: base.projectId || projectDetail?.projectId,
                theme: base.theme || projectDetail?.theme,
              }
            })
          }}
        />
      </div>

      <div className="mt-5">
        <h2 className="text-sm mb-1 text-muted-foreground">Generate New Screen</h2>
        <Textarea
          placeholder="Describe the new screen you want..."
          value={userNewScreenInput}
          onChange={(event) => setUserNewScreenInput(event.target.value)}
        />
        <Button
          size="sm"
          className="mt-2 w-full"
          onClick={generateNewScreen}
          disabled={loading}
        >
          {loading ? (
            <Loader className="animate-spin mr-2 h-4 w-4" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate With AI
        </Button>
      </div>

      <div className="mt-5">
        <h2 className="text-sm mb-1 text-muted-foreground">Themes</h2>
        <div className="h-[200px] overflow-auto">
          {THEME_NAME_LIST.map((theme) => (
            <div
              key={theme}
              className={`p-3 border rounded-xl mb-2 cursor-pointer transition-colors ${
                theme === selectedTheme
                  ? 'border-primary bg-primary/10'
                  : 'hover:border-primary/40'
              }`}
              onClick={() => onThemeSelect(theme)}
            >
              <h2 className="text-sm font-medium">{theme.replace(/_/g, ' ')}</h2>
              <div className="flex gap-2 mt-2">
                <div
                  className="h-4 w-4 rounded-full border"
                  style={{ background: THEMES[theme].primary }}
                />
                <div
                  className="h-4 w-4 rounded-full border"
                  style={{ background: THEMES[theme].secondary }}
                />
                <div
                  className="h-4 w-4 rounded-full border"
                  style={{ background: THEMES[theme].accent }}
                />
                <div
                  className="h-4 w-4 rounded-full border"
                  style={{ background: THEMES[theme].background }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <h2 className="text-sm mb-2 text-muted-foreground">Extras</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button size="sm" variant="outline" onClick={takeScreenShot}>
            <Camera className="mr-2 h-4 w-4" />
            Screenshot
          </Button>
          <Button size="sm" variant="outline" onClick={onShare}>
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SettingsSection
