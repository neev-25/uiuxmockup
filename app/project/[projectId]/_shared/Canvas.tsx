import React, { useState } from 'react'
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import ScreenFrame from './ScreenFrame';
import { ProjectType, ScreenConfig } from '@/type/types';
import { Skeleton } from '@/components/ui/skeleton';
type Props={
    projectDetail:ProjectType|undefined,
    screenConfig:ScreenConfig[],
    loading?:boolean
}
function Canvas({projectDetail,screenConfig}:Props){
    
    const[panningEnabled,setPanningEnabled]=useState(true);
    const isMobile=projectDetail?.device=='mobile';
    const SCREEN_WIDTH=isMobile?400:1200;
    const SCREEN_HEIGHT=isMobile?800:800;
    const GAP=isMobile?10:70;
  return (
    <div className='w-full h-screen bg-gray-100'
    style={{
        backgroundImage:"radial-gradient(rgba(0,0,0,0.15) 1px, transparent 1px)",
        backgroundSize:"20px 20px"
    }}
    >
       <TransformWrapper
       initialScale={0.7}
       minScale={0.7}
       maxScale={3}
       initialPositionX={50}
       initialPositionY={50}
       limitToBounds={false}
       wheel={{step:0.8}}
       doubleClick={{disabled:false}}
       panning={{disabled:!panningEnabled}}
       >
      <TransformComponent
      wrapperStyle={{width:'100%',height:'100%'}}
      >
        {screenConfig?.map((screen,index)=>(
          <div>
         {screen?.code?<ScreenFrame 
            x={index*(SCREEN_WIDTH+GAP)} 
            y={0} 
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            key={index} 
            setPanningEnabled={setPanningEnabled}
            htmlCode={screen?.code}
            projectDetail={projectDetail}
            />:
            <div className='bg-white rounded-2xl p-5 gap-4 flex flex-col'
            style={{
                width:SCREEN_WIDTH,
                height:SCREEN_HEIGHT
            }}
            >
                <Skeleton className='w-full rounded-lg h-10 bg-gray-200'/>
                <Skeleton className='w-[50%] rounded-lg h-20 bg-gray-200'/>
                <Skeleton className='w-[70%] rounded-lg h-30 bg-gray-200'/>
                <Skeleton className='w-[30%] rounded-lg h-10 bg-gray-200'/>
                 <Skeleton className='w-full rounded-lg h-10 bg-gray-200'/>
                <Skeleton className='w-[50%] rounded-lg h-20 bg-gray-200'/>
                <Skeleton className='w-[70%] rounded-lg h-30 bg-gray-200'/>

            </div>
            }
            </div>
         
        ))}

      </TransformComponent>
    </TransformWrapper>
    </div>
  )
}

export default Canvas
