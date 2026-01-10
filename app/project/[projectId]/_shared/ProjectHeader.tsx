import { Button } from '@/components/ui/button'
import { SettingContext } from '@/context/SettingContext'
import axios from 'axios'
import { Loader, Loader2, Save } from 'lucide-react'
import Image from 'next/image'
import React, { useContext, useState } from 'react'
import { toast } from 'sonner'

function ProjectHeader() {
      const {settingsDetail,setSettingsDetail}=useContext(SettingContext)
      const [loading,setLoading]=useState(false)
  const OnSave=async()=>{
    if(!settingsDetail || !settingsDetail.projectId) {
      toast.error('Project details not loaded. Please refresh the page.')
      return;
    }
    
    try{
      setLoading(true);
      const result=await axios.put('/api/project',{
        theme:settingsDetail?.theme,
        projectId:settingsDetail?.projectId,
        projectName:settingsDetail?.projectName
      })
      
      if(result.status === 200 && result.data) {
        setLoading(false)
        toast.success('Settings Saved Successfully')
      } else {
        setLoading(false)
        toast.error('Failed to save settings')
      }
    }
    catch(e:any){
      setLoading(false)
      console.error('Save error:', e)
      const errorMsg = e?.response?.data?.error || e?.message || 'Internal Server Error'
      toast.error(errorMsg)
    }
    
  }
  return (
    <div className='flex items-center justify-between p-3 shadow'>
      <div className='flex gap-2 items-center'>
            <Image src={'/logo.png'} alt='logo' width={40} height={40}/>
            <h2 className='text-xl font-semibold '><span className='text-primary'>UIUX</span>Mock</h2>
        </div>
        <Button disabled={loading}
        onClick={OnSave}
        >
          {loading ? <Loader2 className='animate-spin'/>: <Save/>
          }
          Save</Button>
    </div>
  )
}

export default ProjectHeader
