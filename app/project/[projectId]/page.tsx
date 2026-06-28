"use client"

import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import ProjectHeader from './_shared/ProjectHeader'
import SettingsSection from './_shared/SettingsSection'
import axios from 'axios'
import { useParams, useRouter } from 'next/navigation'
import { ProjectType, ScreenConfig } from '@/type/types'
import { ArrowLeft, Loader2Icon, RefreshCw } from 'lucide-react'
import Canvas from './_shared/Canvas'
import { SettingContext } from '@/context/SettingContext'
import { RefreshDataContext } from '@/context/RefreshDataContext'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const AI_REQUEST_TIMEOUT = 120_000

function ProjectCanvasPlayground() {
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()
  const [projectDetail, setProjectDetail] = useState<ProjectType>()
  const [screenConfigOriginal, setScreenConfigOriginal] = useState<ScreenConfig[]>([])
  const [screenConfig, setScreenConfig] = useState<ScreenConfig[]>([])
  const { setSettingsDetail } = useContext(SettingContext)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('Loading')
  const generatingRef = useRef(false)
  const configStartedRef = useRef(false)
  const attemptedScreensRef = useRef<Set<string>>(new Set())
  const { refreshData } = useContext(RefreshDataContext)
  const [takeScreenShot, setTakeScreenShot] = useState<number | null>(null)
  const [configFailed, setConfigFailed] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)
  const [failedScreens, setFailedScreens] = useState<string[]>([])
  const [creditsBlocked, setCreditsBlocked] = useState(false)

  const getProjectDetail = useCallback(async () => {
    setLoading(true)
    setLoadingMsg('Loading project...')
    try {
      const result = await axios.get(`/api/project?projectId=${projectId}`)

      if (result.data?.projectDetail) {
        const projectData = result.data.projectDetail as ProjectType
        setProjectDetail(projectData)
        setSettingsDetail({
          ...projectData,
          projectId: projectData.projectId || projectId,
        })
      } else {
        setSettingsDetail({ projectId })
      }

      const screens = (result.data?.screenConfig ?? []) as ScreenConfig[]
      setScreenConfigOriginal(screens)
      setScreenConfig(screens)

      for (const screen of screens) {
        if (screen.code) {
          attemptedScreensRef.current.add(screen.screenId)
        }
      }
    } catch (error) {
      console.error('Error loading project:', error)
      toast.error('Failed to load project')
    } finally {
      setLoading(false)
    }
  }, [projectId, setSettingsDetail])

  useEffect(() => {
    getProjectDetail()
  }, [getProjectDetail])

  useEffect(() => {
    if (refreshData?.method === 'screenConfig') {
      getProjectDetail()
    }
  }, [refreshData, getProjectDetail])

  const generateScreenConfig = useCallback(async () => {
    if (!projectDetail) return
    setLoading(true)
    setLoadingMsg('Planning screens with AI...')
    setConfigFailed(false)
    setConfigError(null)

    try {
      await axios.post(
        '/api/generate-config',
        {
          projectId,
          deviceType: projectDetail.device,
          userInput: projectDetail.userInput,
        },
        { timeout: AI_REQUEST_TIMEOUT }
      )
      await getProjectDetail()
    } catch (error) {
      console.error('Error generating config:', error)
      const status = axios.isAxiosError(error) ? error.response?.status : undefined
      const msg = axios.isAxiosError(error)
        ? error.response?.data?.error || 'Failed to generate screen plan'
        : 'Failed to generate screen plan'
      if (status === 402) {
        setCreditsBlocked(true)
      }
      setConfigFailed(true)
      setConfigError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [projectDetail, projectId, getProjectDetail])

  useEffect(() => {
    if (
      projectDetail &&
      screenConfigOriginal.length === 0 &&
      !loading &&
      !configFailed &&
      !configStartedRef.current
    ) {
      configStartedRef.current = true
      generateScreenConfig()
    }
  }, [
    projectDetail,
    screenConfigOriginal.length,
    loading,
    configFailed,
    generateScreenConfig,
  ])

  const retryConfigGeneration = () => {
    if (creditsBlocked) {
      setCreditsBlocked(false)
    }
    configStartedRef.current = false
    setConfigFailed(false)
    setConfigError(null)
    generateScreenConfig()
  }

  const generateScreenUIUX = useCallback(
    async (screensToGenerate?: ScreenConfig[]) => {
      if (creditsBlocked) {
        generatingRef.current = false
        return
      }

      const targets =
        screensToGenerate ??
        screenConfigOriginal.filter(
          (s) => !s.code && !attemptedScreensRef.current.has(s.screenId)
        )

      if (!targets.length) {
        generatingRef.current = false
        return
      }

      setLoading(true)
      const newFailures: string[] = []

      for (let index = 0; index < targets.length; index++) {
        const screen = targets[index]
        attemptedScreensRef.current.add(screen.screenId)

        setLoadingMsg(
          `Generating screen ${index + 1} of ${targets.length}...`
        )

        try {
          const result = await axios.post(
            '/api/generate-screen-ui',
            {
              projectId,
              screenId: screen.screenId,
              screenName: screen.screenName,
              purpose: screen.purpose,
              screenDescription: screen.screenDescription,
            },
            { timeout: AI_REQUEST_TIMEOUT }
          )

          if (result.data?.screenId) {
            const updater = (prev: ScreenConfig[]) =>
              prev.map((item) =>
                item.screenId === result.data.screenId ? result.data : item
              )
            setScreenConfig(updater)
            setScreenConfigOriginal(updater)
            setFailedScreens((prev) =>
              prev.filter((id) => id !== screen.screenId)
            )
          }
        } catch (error) {
          const status = axios.isAxiosError(error) ? error.response?.status : undefined
          if (status === 402) {
            setCreditsBlocked(true)
            // Keep in attempted set — do NOT retry automatically on payment errors
          } else {
            attemptedScreensRef.current.delete(screen.screenId)
          }
          newFailures.push(screen.screenId)
          console.error(`Error generating screen ${screen.screenName}:`, error)
          const msg = axios.isAxiosError(error)
            ? error.response?.data?.error ||
              `Failed to generate ${screen.screenName}`
            : `Failed to generate ${screen.screenName}`
          toast.error(msg)
          if (status === 402) break
        }
      }

      if (newFailures.length) {
        setFailedScreens((prev) => [...new Set([...prev, ...newFailures])])
      }

      generatingRef.current = false
      setLoading(false)
      setLoadingMsg('Loading')
    },
    [screenConfigOriginal, projectId, creditsBlocked]
  )

  const retryFailedScreens = () => {
    if (creditsBlocked) {
      toast.error('Add OpenRouter credits first, then retry.')
      return
    }
    const failed = screenConfigOriginal.filter(
      (s) => !s.code && failedScreens.includes(s.screenId)
    )
    if (!failed.length) return
    generatingRef.current = true
    generateScreenUIUX(failed)
  }

  useEffect(() => {
    if (
      !projectDetail ||
      !screenConfigOriginal.length ||
      generatingRef.current ||
      creditsBlocked
    )
      return

    const needsGeneration = screenConfigOriginal.some(
      (s) => !s.code && !attemptedScreensRef.current.has(s.screenId)
    )
    if (needsGeneration && !loading) {
      generatingRef.current = true
      generateScreenUIUX()
    }
  }, [projectDetail, screenConfigOriginal, loading, generateScreenUIUX, creditsBlocked])

  return (
    <div className="min-h-screen bg-background">
      <ProjectHeader projectName={projectDetail?.projectName} />
      <div className="flex relative">
        {(loading || configFailed || failedScreens.length > 0) && (
          <div className="p-3 absolute left-1/2 -translate-x-1/2 mt-4 z-50 flex flex-col items-center gap-2">
            {loading && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                <p className="flex gap-2 items-center text-sm text-blue-700">
                  <Loader2Icon className="animate-spin h-4 w-4" />
                  {loadingMsg}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/')}
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </div>
            )}

            {configFailed && !loading && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl max-w-md text-center">
                <p className="text-sm text-red-700 mb-3">
                  {configError || 'AI generation failed. Please try again.'}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button size="sm" variant="outline" onClick={retryConfigGeneration}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => router.push('/')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </div>
              </div>
            )}

            {creditsBlocked && !loading && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl max-w-md text-center">
                <p className="text-sm text-amber-900 mb-2">
                  OpenRouter credits are insufficient. Add credits at{' '}
                  <a
                    href="https://openrouter.ai/settings/credits"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-medium"
                  >
                    openrouter.ai/settings/credits
                  </a>
                  , then click Retry.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCreditsBlocked(false)
                    retryConfigGeneration()
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry after adding credits
                </Button>
              </div>
            )}

            {failedScreens.length > 0 && !loading && !configFailed && !creditsBlocked && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <p className="text-sm text-amber-800 mb-2">
                  {failedScreens.length} screen(s) failed to generate
                </p>
                <Button size="sm" variant="outline" onClick={retryFailedScreens}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry failed screens
                </Button>
              </div>
            )}
          </div>
        )}

        <SettingsSection
          projectDetail={projectDetail}
          screenDescription={screenConfig[0]?.screenDescription}
          takeScreenShot={() => setTakeScreenShot(Date.now())}
          onBack={() => router.push('/')}
        />
        <Canvas
          projectDetail={projectDetail}
          screenConfig={screenConfig}
          takeScreenShot={takeScreenShot}
        />
      </div>
    </div>
  )
}

export default ProjectCanvasPlayground
