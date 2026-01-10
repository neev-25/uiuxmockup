"use client"
import React, { useEffect, useState } from 'react'
import ProjectHeader from './_shared/ProjectHeader'
import SettingsSection from './_shared/SettingsSection'
import axios from 'axios'
import { useParams } from 'next/navigation'
import { ProjectType, ScreenConfig } from '@/type/types'
import { Loader2Icon } from 'lucide-react'
import { se } from 'date-fns/locale'
import Canvas from './_shared/Canvas'

function ProjectCanvasPlayground() {
  const {projectId}=useParams();
  const [projectDetail,setProjectDetail]=useState<ProjectType>();
  const [screenConfigOriginal,setScreenConfigOriginal]=useState<ScreenConfig[]>([]);
  const [screenConfig,setScreenConfig]=useState<ScreenConfig[]>([]);
  const [loading,setLoading]=useState(false);
  const [loadingMsg,setLoadingMsg]=useState('Loading');
  useEffect(()=>{
      GetProjectDetail()
    },[projectId])
  const GetProjectDetail=async()=>{
    setLoading(true);
    setLoadingMsg('Loading...')
    const result=await axios.get('/api/project?projectId='+projectId);
    console.log(result.data)
    setProjectDetail(result?.data?.projectDetail);
    setScreenConfigOriginal(result?.data?.screenConfig);
    setScreenConfig(result?.data?.screenConfig);
    // if(result.data.screenConfig?.length==0)
    // {
    //   generateScreenConfig()
    // }
    setLoading(false);
  }

  useEffect(()=>{
    if(projectDetail && screenConfigOriginal && screenConfigOriginal.length==0)
    {
      generateScreenConfig();
    }
    else if(projectDetail && screenConfig)
    {
      GenerateScreenUIUX();
    }
  },[projectDetail,screenConfigOriginal])

  const generateScreenConfig=async()=>{
    setLoading(true);
    setLoadingMsg("Generating Screen Config...");
    const result=await axios.post('/api/generate-config',{
      projectId:projectId,
      deviceType:projectDetail?.device,
      userInput:projectDetail?.userInput
    })
    console.log(result.data);
    GetProjectDetail();
    setLoading(false);
  }

  const GenerateScreenUIUX=async ()=>{
    setLoading(true)
    for(let index=0;index<screenConfig?.length;index++)
    {
     const screen=screenConfig[index];
     if(screen?.code) continue;
     
     setLoadingMsg('Generating Screen'+index+1)
     const result=await axios.post('/api/generate-screen-ui',{
      projectId,
      screenId:screen?.screenId,
      screenName:screen?.screenName,
      purpose:screen?.purpose,
      screenDescription:screen?.screenDescription
     });
     console.log(result.data)
     setScreenConfig(prev=>prev.map((item,i)=>(i==index?result.data:item)))
    }
    setLoading(false)
  }

  return (
    <div>
      <ProjectHeader/>
      <div className='flex'>
        {loading && <div className='p-3 absolute bg-blue-300/20 border-blue-400 border rounded-xl left-1/2 mt-20'>
          <h2 className='flex gap-2 items-center'>
            <Loader2Icon className='animate-spin'/>{loadingMsg}  
          </h2>
        </div>}
        {/* Settings */}
        <SettingsSection projectDetail={projectDetail}/>
        
        {/* canvas */}
        <Canvas projectDetail={projectDetail} 
        screenConfig={screenConfig}/>
      </div>
    </div>
  )
}

export default ProjectCanvasPlayground
