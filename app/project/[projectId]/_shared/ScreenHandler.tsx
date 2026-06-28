import { Button } from '@/components/ui/button'
import { ScreenConfig } from '@/type/types'
import {
  Code2Icon,
  Copy,
  Download,
  Loader2Icon,
  MoreVertical,
  Sparkle,
  Trash,
} from 'lucide-react'
import React, { RefObject, useContext, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { toast } from 'sonner'
import { HTMLWrapper } from '@/data/constant'
import { ThemeKey } from '@/data/Themes'
import html2canvas from 'html2canvas'
import axios from 'axios'
import { RefreshDataContext } from '@/context/RefreshDataContext'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  screen: ScreenConfig | undefined
  themeKey: ThemeKey
  iframeRef: RefObject<HTMLIFrameElement | null>
  projectId: string | undefined
}

function ScreenHandler({ screen, themeKey, iframeRef, projectId }: Props) {
  const htmlCode = HTMLWrapper(themeKey, screen?.code ?? '')
  const { setRefreshData } = useContext(RefreshDataContext)
  const [editUserInput, setEditUserInput] = useState<string>()
  const [loading, setLoading] = useState(false)

  const takeIframeScreenshot = async () => {
    const iframe = iframeRef.current
    if (!iframe) return

    try {
      const doc = iframe.contentDocument
      if (!doc?.body) return

      await new Promise((res) => requestAnimationFrame(res))

      const canvas = await html2canvas(doc.body, {
        backgroundColor: null,
        useCORS: true,
        scale: window.devicePixelRatio || 1,
      })

      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `${screen?.screenName ?? 'screen'}.png`
      link.click()
    } catch (err) {
      console.error('Screenshot failed:', err)
      toast.error('Failed to capture screenshot')
    }
  }

  const onDelete = async () => {
    if (!projectId || !screen?.screenId) return
    try {
      await axios.delete(
        `/api/generate-config?projectId=${projectId}&screenId=${screen.screenId}`
      )
      toast.success('Screen deleted')
      setRefreshData({ method: 'screenConfig', date: Date.now() })
    } catch {
      toast.error('Failed to delete screen')
    }
  }

  const editScreen = async () => {
    if (!editUserInput?.trim()) {
      toast.error('Please describe the changes you want')
      return
    }
    if (!projectId || !screen?.screenId) return

    setLoading(true)
    toast.info('Regenerating screen, please wait...')

    try {
      await axios.post('/api/edit-screen', {
        projectId,
        screenId: screen.screenId,
        userInput: editUserInput,
        oldCode: screen.code,
      })
      toast.success('Screen updated successfully')
      setRefreshData({ method: 'screenConfig', date: Date.now() })
    } catch {
      toast.error('Failed to update screen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="no-drag flex items-center justify-end w-full h-full px-1">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Code2Icon className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl w-full h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>HTML + Tailwind CSS Code</DialogTitle>
            <DialogDescription asChild>
              <div>
                <div className="flex-1 overflow-y-auto rounded-md border bg-muted p-4">
                  <SyntaxHighlighter
                    language="html"
                    style={docco}
                    customStyle={{
                      margin: 0,
                      padding: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflowX: 'hidden',
                      height: '50vh',
                    }}
                    codeTagProps={{
                      style: {
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      },
                    }}
                  >
                    {htmlCode}
                  </SyntaxHighlighter>
                </div>
                <Button
                  className="mt-3"
                  onClick={() => {
                    navigator.clipboard.writeText(htmlCode)
                    toast.success('Code copied')
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={takeIframeScreenshot}
      >
        <Download className="h-4 w-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Sparkle className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <Textarea
            placeholder="What changes do you want to make?"
            value={editUserInput ?? ''}
            onChange={(e) => setEditUserInput(e.target.value)}
          />
          <Button
            size="sm"
            className="mt-2 w-full"
            disabled={loading}
            onClick={editScreen}
          >
            {loading ? (
              <Loader2Icon className="animate-spin mr-2 h-4 w-4" />
            ) : (
              <Sparkle className="mr-2 h-4 w-4" />
            )}
            Regenerate
          </Button>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default ScreenHandler
