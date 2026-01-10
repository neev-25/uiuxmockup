'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { UserDetailContext } from '@/context/UserDetailContext';
import { SettingContext } from '@/context/SettingContext';
function Provider({children}: any) {
    const [userDetail,setUserDetail]=useState();
    const [settingsDetail,setSettingsDetail]=useState<any>(null);
    useEffect(()=>{
        CreateNewUser();
    },[])
    const CreateNewUser=async()=>{
        const result=await axios.post('/api/user',{});
        console.log(result.data)
        setUserDetail(result.data)
    }
  return (
    <UserDetailContext.Provider value={{userDetail,setUserDetail}}>
      <SettingContext.Provider value={{settingsDetail,setSettingsDetail}}>
        <div>
      {children}
    </div>
      </SettingContext.Provider>
    </UserDetailContext.Provider>
  )
}

export default Provider
