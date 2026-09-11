'use client'

import { useFormStatus } from 'react-dom'

export default function AdminSubmitButton({
  label,
  pendingLabel,
  className='btn btn-primary',
}:{
  label:string
  pendingLabel:string
  className?:string
}){
  const {pending}=useFormStatus()
  return <button className={className} type="submit" disabled={pending} aria-busy={pending} style={{minWidth:150,position:'relative'}}>
    {pending?<span style={{display:'inline-flex',alignItems:'center',gap:8}}><span aria-hidden="true" style={{width:14,height:14,border:'2px solid currentColor',borderRightColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'adminSpin .7s linear infinite'}}/>{pendingLabel}</span>:label}
    <style>{`@keyframes adminSpin{to{transform:rotate(360deg)}}`}</style>
  </button>
}
