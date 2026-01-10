import { Button } from '@/components/ui/button'
import { ScreenConfig } from '@/type/types'
import { Code2Icon, Copy, Download, GripVertical, Loader2Icon, MoreVertical, Sparkle, SparkleIcon, Trash } from 'lucide-react'
import React, { useContext, useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { toast } from 'sonner'
import { HTMLWrapper } from '@/data/constant'
import html2canvas from 'html2canvas'
import axios from 'axios'
import { RefreshDataContext } from '@/context/RefreshDataContext'
import { Textarea } from '@/components/ui/textarea'
type Props={
    screen:ScreenConfig|undefined,
    theme:any,
    iframeRef:any,
    projectId:string|undefined
}
function ScreenHandler({screen,theme,iframeRef,projectId}:Props) {
    const htmlCode=HTMLWrapper(theme,screen?.code as string)
    const {refreshData,setRefreshData}=useContext(RefreshDataContext)
    const [editUserInput,setEditUserInput]=useState<string>();
    const [loading,setLoading]=useState(false)
const takeIframeScreenshot = async () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
        const doc = iframe.contentDocument;
        if (!doc) return;

        const body = doc.body;

        // wait one frame to ensure layout is stable
        await new Promise((res) => requestAnimationFrame(res));

        const canvas = await html2canvas(body, {
            backgroundColor: null,
            useCORS: true,
            scale: window.devicePixelRatio || 1,
        });

        const image = canvas.toDataURL("image/png");

        // download automatically
        const link = document.createElement("a");
        link.href = image;
        link.download = `${screen?.screenName as string|| "screen"}.png`;
        link.click();
    } catch (err) {
        console.error("Screenshot failed:", err);
    }
};



const onDelete=async()=>{
    const result=await axios.delete('/api/generate-config?projectId='+projectId+"&screenId="+screen?.screenId)
    toast.success("Screen Deleted")
    setRefreshData({method:'screenConfig',date:Date.now()})
}

const editScreen=async ()=>{
    setLoading(true);
    toast.info('Regenerating New Screen,Please Wait...');
    const result=await axios.post('/api/edit-screen',{
        projectId:projectId,
        screenId:screen?.screenId,
        userInput:editUserInput,
        oldCode:screen?.code
    });
    toast.success('Screen generate Successfully')
    
    setRefreshData({method:'screenConfig',date:Date.now()});
    setLoading(false)

}

  return (
    <div className='flex justify-between items-center w-full'>
        <div className='flex items-center gap-2'>
    <GripVertical className='text-gray-500 h-4 w-4'/> 
    <h2>{screen?.screenName}</h2>  
      </div>
      <div>
        <Dialog>
        <DialogTrigger>
        <Button variant={'ghost'} ><Code2Icon/></Button>
        </DialogTrigger>
        <DialogContent className='max-w-6xl w-full h-[70vh] flex flex-col'>
          <DialogHeader>
            <DialogTitle>HTML + Tailwindcss Code</DialogTitle>
            <DialogDescription>
                <div className='flex-1 overflow-y-auto rounded-md border bg-muted p-4'>
                {/* @ts-ignore */}
              <SyntaxHighlighter 
              language="html" 
              style={docco}
              customStyle={{
                margin:0,
                padding:0,
                whiteSpace:'pre-wrap',
                wordBreak:'break-word',
                overflowX:'hidden',
                height:'50vh'
              }}
              codeTagProps={{
                style:{
                    whiteSpace:'pre-wrap',
                    wordBreak:"break-word"
                }
              }}
              >
                    {htmlCode}
                    
                </SyntaxHighlighter>
                </div>
                <Button className='mt-3' 
                onClick={()=>{navigator.clipboard.writeText(htmlCode as string)
                    toast.success('Code Copied')
                }}
                
                ><Copy/>Copy</Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
    </Dialog>
    <Button variant={'ghost'} onClick={takeIframeScreenshot}>
        <Download/>
    </Button>

        <Popover>
          <PopoverTrigger>
            <Button variant={'ghost'}><SparkleIcon/></Button>
            </PopoverTrigger>
          <PopoverContent>
            <div>
                <Textarea placeholder='What Changes you want to make?'
                onChange={(event)=>setEditUserInput(event.target.value)}
                />
                <Button size={'sm'} className='mt-2'
                disabled={loading}
                onClick={()=>editScreen()}
                >{loading?<Loader2Icon className='animate-spin'/>:<Sparkle/>}Regenerate</Button>
            </div>
          </PopoverContent>
        </Popover>
    
    <DropdownMenu>
    <DropdownMenuTrigger>
    <Button variant={'ghost'}>
        <MoreVertical/>
    </Button></DropdownMenuTrigger>
    <DropdownMenuContent>
        <DropdownMenuItem variant='destructive' onClick={()=>onDelete()}><Trash/>Delete</DropdownMenuItem>
    </DropdownMenuContent>
    </DropdownMenu>

      </div>
    </div>
  )
}

export default ScreenHandler
