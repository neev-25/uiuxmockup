import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch'
import ScreenFrame from './ScreenFrame'
import { ProjectType, ScreenConfig } from '@/type/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Minus, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import axios from 'axios'

type Props = {
  projectDetail: ProjectType | undefined
  screenConfig: ScreenConfig[]
  takeScreenShot: number | null | undefined
}

function Canvas({ projectDetail, screenConfig, takeScreenShot }: Props) {
  const [panningEnabled, setPanningEnabled] = useState(true)
  const isMobile = projectDetail?.device === 'mobile'
  const SCREEN_WIDTH = isMobile ? 400 : 1200
  const SCREEN_HEIGHT = isMobile ? 800 : 800
  const GAP = isMobile ? 40 : 80
  const PADDING = 40

  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([])

  const workspaceSize = useMemo(() => {
    const count = Math.max(screenConfig.length, 1)
    const cols = Math.min(count, 3)
    const rows = Math.ceil(count / cols)
    return {
      width: Math.max(cols * (SCREEN_WIDTH + GAP) + PADDING * 2, 3200),
      height: Math.max(rows * (SCREEN_HEIGHT + GAP) + PADDING * 2, 2400),
    }
  }, [screenConfig.length, SCREEN_WIDTH, SCREEN_HEIGHT, GAP])

  const getInitialPosition = (index: number) => {
    const cols = Math.min(screenConfig.length || 1, 3)
    const col = index % cols
    const row = Math.floor(index / cols)
    return {
      x: PADDING + col * (SCREEN_WIDTH + GAP),
      y: PADDING + row * (SCREEN_HEIGHT + GAP),
    }
  }

  const Controls = () => {
    const { zoomIn, zoomOut, resetTransform } = useControls()
    return (
      <div className="tools absolute p-2 px-3 bg-white shadow flex gap-3 rounded-4xl bottom-10 left-1/2 z-30 text-gray-500">
        <Button variant="ghost" size="sm" onClick={() => zoomIn()}>
          <Plus />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => zoomOut()}>
          <Minus />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => resetTransform()}>
          <RefreshCw />
        </Button>
      </div>
    )
  }

  useEffect(() => {
    if (takeScreenShot !== null && takeScreenShot !== undefined) {
      onTakeScreenshot(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [takeScreenShot])

  const captureOneIframe = async (iframe: HTMLIFrameElement) => {
    const doc = iframe.contentDocument
    if (!doc) throw new Error('iframe doc not ready')

    if ('fonts' in doc && doc.fonts && 'ready' in doc.fonts) {
      await doc.fonts.ready
    }

    await new Promise((r) => setTimeout(r, 250))

    const target = doc.body
    const w = doc.documentElement.scrollWidth
    const h = doc.documentElement.scrollHeight

    return html2canvas(target, {
      backgroundColor: null,
      useCORS: true,
      allowTaint: true,
      width: w,
      height: h,
      windowWidth: w,
      windowHeight: h,
      scale: window.devicePixelRatio || 1,
    })
  }

  const updateProjectWithScreenShot = async (base64Url: string) => {
    if (!projectDetail?.projectId) return
    await axios.put('/api/project', {
      screenShot: base64Url,
      projectId: projectDetail.projectId,
      theme: projectDetail.theme,
      projectName: projectDetail.projectName,
    })
  }

  const onTakeScreenshot = async (saveOnly = false) => {
    try {
      const iframes = iframeRefs.current.filter(Boolean) as HTMLIFrameElement[]
      if (!iframes.length) {
        toast.error('No screens available to capture')
        return
      }

      const shotCanvases: HTMLCanvasElement[] = []
      for (const iframe of iframes) {
        shotCanvases.push(await captureOneIframe(iframe))
      }

      const scale = window.devicePixelRatio || 1
      const headerH = 48
      const outW =
        Math.max(iframes.length * (SCREEN_WIDTH + GAP), SCREEN_WIDTH) * scale
      const outH = SCREEN_HEIGHT * scale

      const out = document.createElement('canvas')
      out.width = outW
      out.height = outH

      const ctx = out.getContext('2d')
      if (!ctx) throw new Error('No 2D context')

      ctx.clearRect(0, 0, outW, outH)

      for (let i = 0; i < shotCanvases.length; i++) {
        const x = i * (SCREEN_WIDTH + GAP) * scale
        const y = headerH * scale
        ctx.drawImage(shotCanvases[i], x, y)
      }

      const url = out.toDataURL('image/png')
      await updateProjectWithScreenShot(url)

      if (!saveOnly) {
        const a = document.createElement('a')
        a.href = url
        a.download = `${projectDetail?.projectName ?? 'canvas'}.png`
        a.click()
        toast.success('Screenshot saved')
      }
    } catch (e) {
      console.error(e)
      toast.error('Capture failed')
    }
  }

  const setIframeRef = useCallback(
    (index: number) => (iframe: HTMLIFrameElement | null) => {
      iframeRefs.current[index] = iframe
    },
    []
  )

  return (
    <div
      className="w-full h-[calc(100vh-57px)] bg-gray-100"
      style={{
        backgroundImage:
          'radial-gradient(rgba(0,0,0,0.15) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      <TransformWrapper
        initialScale={0.7}
        minScale={0.3}
        maxScale={3}
        initialPositionX={50}
        initialPositionY={50}
        limitToBounds={false}
        wheel={{ step: 0.8, smoothStep: 0.01 }}
        panning={{
          disabled: !panningEnabled,
          velocityDisabled: true,
        }}
        doubleClick={{ disabled: true }}
      >
        {() => (
          <>
            <Controls />
            <TransformComponent
              wrapperStyle={{
                width: '100%',
                height: '100%',
                position: 'relative',
              }}
            >
              <div
                className="relative"
                style={{
                  width: workspaceSize.width,
                  height: workspaceSize.height,
                  minWidth: workspaceSize.width,
                  minHeight: workspaceSize.height,
                }}
              >
                {screenConfig.map((screen, index) => {
                  const pos = getInitialPosition(index)
                  return screen.code ? (
                    <ScreenFrame
                      key={screen.screenId}
                      x={pos.x}
                      y={pos.y}
                      width={SCREEN_WIDTH}
                      height={SCREEN_HEIGHT}
                      setPanningEnabled={setPanningEnabled}
                      htmlCode={screen.code}
                      projectDetail={projectDetail}
                      screen={screen}
                      onIframeRef={setIframeRef(index)}
                    />
                  ) : (
                    <div
                      key={screen.screenId || index}
                      className="bg-white rounded-2xl p-5 gap-4 flex flex-col border shadow-sm absolute"
                      style={{
                        width: SCREEN_WIDTH,
                        height: SCREEN_HEIGHT,
                        left: pos.x,
                        top: pos.y,
                      }}
                    >
                      <Skeleton className="w-full rounded-lg h-10" />
                      <Skeleton className="w-[50%] rounded-lg h-20" />
                      <Skeleton className="w-[70%] rounded-lg h-32" />
                      <Skeleton className="w-[30%] rounded-lg h-10" />
                      <Skeleton className="w-full rounded-lg h-10" />
                      <Skeleton className="w-[50%] rounded-lg h-20" />
                      <Skeleton className="w-[70%] rounded-lg h-32" />
                    </div>
                  )
                })}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  )
}

export default Canvas
