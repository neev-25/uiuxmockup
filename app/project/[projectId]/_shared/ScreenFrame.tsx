import { SettingContext } from '@/context/SettingContext'
import { HTMLWrapper } from '@/data/constant'
import { THEME_NAME_LIST, ThemeKey } from '@/data/Themes'
import { ProjectType, ScreenConfig } from '@/type/types'
import { GripVertical } from 'lucide-react'
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Rnd } from 'react-rnd'
import { useTransformContext } from 'react-zoom-pan-pinch'
import ScreenHandler from './ScreenHandler'

type Props = {
  x: number
  y: number
  setPanningEnabled: (enabled: boolean) => void
  width: number
  height: number
  htmlCode: string | undefined
  projectDetail: ProjectType | undefined
  screen: ScreenConfig | undefined
  onIframeRef: (iframe: HTMLIFrameElement | null) => void
}

function ScreenFrame({
  x,
  y,
  setPanningEnabled,
  width,
  height,
  htmlCode,
  projectDetail,
  screen,
  onIframeRef,
}: Props) {
  const { settingsDetail } = useContext(SettingContext)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const transformContext = useTransformContext()
  const scale = transformContext?.transformState?.scale ?? 1

  const resolvedThemeKey = useMemo((): ThemeKey => {
    const key = (settingsDetail?.theme ?? projectDetail?.theme ?? 'AURORA_INK') as string
    return (THEME_NAME_LIST as readonly string[]).includes(key)
      ? (key as ThemeKey)
      : 'AURORA_INK'
  }, [settingsDetail?.theme, projectDetail?.theme])

  const html = useMemo(
    () => HTMLWrapper(resolvedThemeKey, htmlCode as string),
    [resolvedThemeKey, htmlCode]
  )

  const [position, setPosition] = useState({ x, y })
  const [size, setSize] = useState({ width, height })
  const [isDragging, setIsDragging] = useState(false)

  // Reset position only when a different screen is mounted
  useEffect(() => {
    setPosition({ x, y })
  }, [screen?.screenId])

  useEffect(() => {
    setSize({ width, height })
  }, [height, width])

  const setIframeRef = useCallback(
    (node: HTMLIFrameElement | null) => {
      iframeRef.current = node
      onIframeRef(node)
    },
    [onIframeRef]
  )

  const measureIframeHeight = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    try {
      const doc = iframe.contentDocument
      if (!doc) return

      const headerH = 48
      const htmlEl = doc.documentElement
      const body = doc.body

      const contentH = Math.max(
        htmlEl?.scrollHeight ?? 0,
        body?.scrollHeight ?? 0,
        htmlEl?.offsetHeight ?? 0,
        body?.offsetHeight ?? 0
      )

      const next = Math.min(Math.max(contentH + headerH, 160), 2000)
      setSize((s) =>
        Math.abs(s.height - next) > 2 ? { ...s, height: next } : s
      )
    } catch {
      // sandbox/origin blocks access
    }
  }, [])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const onLoad = () => {
      measureIframeHeight()

      const doc = iframe.contentDocument
      if (!doc) return

      const observer = new MutationObserver(() => measureIframeHeight())
      observer.observe(doc.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      })

      const t1 = window.setTimeout(measureIframeHeight, 50)
      const t2 = window.setTimeout(measureIframeHeight, 200)
      const t3 = window.setTimeout(measureIframeHeight, 600)

      return () => {
        observer.disconnect()
        window.clearTimeout(t1)
        window.clearTimeout(t2)
        window.clearTimeout(t3)
      }
    }

    iframe.addEventListener('load', onLoad)
    window.addEventListener('resize', measureIframeHeight)

    return () => {
      iframe.removeEventListener('load', onLoad)
      window.removeEventListener('resize', measureIframeHeight)
    }
  }, [measureIframeHeight, htmlCode, resolvedThemeKey, html])

  return (
    <Rnd
      position={position}
      size={size}
      scale={scale}
      dragHandleClassName="screen-drag-handle"
      cancel=".no-drag"
      enableUserSelectHack={false}
      style={{ zIndex: isDragging ? 50 : 10 }}
      enableResizing={{
        bottomRight: true,
        bottomLeft: true,
        topRight: false,
        topLeft: false,
      }}
      onDragStart={() => {
        setIsDragging(true)
        setPanningEnabled(false)
      }}
      onDrag={(_, data) => {
        setPosition({ x: data.x, y: data.y })
      }}
      onDragStop={(_, data) => {
        setIsDragging(false)
        setPanningEnabled(true)
        setPosition({ x: data.x, y: data.y })
      }}
      onResizeStart={() => {
        setPanningEnabled(false)
      }}
      onResizeStop={(_, __, ref, ___, newPosition) => {
        setPanningEnabled(true)
        setPosition({ x: newPosition.x, y: newPosition.y })
        setSize({
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        })
      }}
      className="!absolute"
    >
      <div className="flex flex-col h-full bg-white rounded-2xl shadow-md border overflow-hidden">
        <div className="flex items-stretch shrink-0 border-b bg-white min-h-[48px]">
          <div className="screen-drag-handle flex items-center gap-2 px-3 cursor-grab active:cursor-grabbing border-r bg-muted/30 shrink-0 max-w-[45%]">
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium truncate">
              {screen?.screenName}
            </span>
          </div>
          <div className="no-drag flex-1 min-w-0">
            <ScreenHandler
              screen={screen}
              themeKey={resolvedThemeKey}
              iframeRef={iframeRef}
              projectId={projectDetail?.projectId}
            />
          </div>
        </div>
        <iframe
          key={`${resolvedThemeKey}-${htmlCode?.substring(0, 100)?.replace(/[^a-zA-Z0-9]/g, '') || 'empty'}`}
          ref={setIframeRef}
          className={`flex-1 w-full bg-white border-0 ${isDragging ? 'pointer-events-none' : 'pointer-events-auto'}`}
          sandbox="allow-same-origin allow-scripts"
          srcDoc={html}
          title={screen?.screenName ?? 'Screen preview'}
        />
      </div>
    </Rnd>
  )
}

export default ScreenFrame
