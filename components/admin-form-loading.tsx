'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function AdminFormLoading(){
  const pathname=usePathname()

  useEffect(()=>{
    if(pathname!=='/admin/company') return
    const onSubmit=(event:SubmitEvent)=>{
      const form=event.target
      if(!(form instanceof HTMLFormElement)) return
      if(form.enctype!=='multipart/form-data') return
      const button=form.querySelector('button[type="submit"], button:not([type])') as HTMLButtonElement|null
      if(!button) return
      button.disabled=true
      button.setAttribute('aria-busy','true')
      button.dataset.originalText=button.textContent||''
      button.innerHTML='<span class="admin-upload-spinner" aria-hidden="true"></span><span>Uploading &amp; saving…</span>'
    }
    document.addEventListener('submit',onSubmit)
    return()=>document.removeEventListener('submit',onSubmit)
  },[pathname])

  if(pathname!=='/admin/company') return null
  return <style>{`.admin-upload-spinner{width:14px;height:14px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;display:inline-block;animation:adminUploadSpin .7s linear infinite;margin-right:8px;vertical-align:-2px}@keyframes adminUploadSpin{to{transform:rotate(360deg)}}`}</style>
}
