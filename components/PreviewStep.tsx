import React, { useState } from 'react'
import { LiffProfile, RichMenuConfig } from '../types'
import { API_BASE_URL } from '@/utills/constants'
import LoadingScreen from './Loading'
import { Upload, message, Result } from 'antd'

interface PreviewStepProps {
  token: string
  config: RichMenuConfig
  imageUrl: string | null
  imageFile: File | null
  liffProfile: LiffProfile | null

  onBack: () => void
}

const PreviewStep: React.FC<PreviewStepProps> = ({
  token,
  config,
  imageUrl,
  imageFile,
  liffProfile,
  onBack
}) => {
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployStatus, setDeployStatus] = useState<{
    type: 'success' | 'error'
    msg: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('gcode') || undefined

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1]
        resolve(base64String)
      }
      reader.onerror = error => reject(error)
    })
  }

  const success = text => {
    messageApi.open({
      type: 'success',
      content: text
    })
  }

  const errorPopup = text => {
    messageApi.open({
      type: 'error',
      content: text
    })
  }

  const handleDeploy = async () => {
    setLoading(true)
    if (!token || !imageFile) {
      setLoading(false)
      setDeployStatus({
        type: 'error',
        msg: 'Missing Channel Access Token or Image.'
      })
      return
    }

    setIsDeploying(true)
    setDeployStatus(null)

    try {
      const base64Image = await fileToBase64(imageFile)

      const payload = {
        token: token,
        richmenu: config,
        imageBase64: base64Image,
        code: code,
        userId: liffProfile?.userId
      }

      const res = await fetch(`${API_BASE_URL}?path=setupRichMenu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      })

      const result = await res.json()

      // Handle the specific error response format provided
      if (result.success === false || result.error) {
        let displayError = result.error || 'Deployment failed'

        if (result.message) {
          displayError = result.message
          // Try to parse if message is a stringified JSON like {"message": "..."}
          try {
            const nested = JSON.parse(result.message)
            if (nested && nested.message) {
              displayError = nested.message
            }
          } catch (e) {
            // If parsing fails, just use the string as is
          }
        }
        setLoading(false)
        throw new Error(displayError)
      }

      success(
        'Rich Menu ถูกสร้างสำเร็จแล้ว. คุณสามารถดูผลลัพธ์ได้ในช่องแชทของคุณ หรือกลับไปที่หน้าแรกเพื่อสร้างเมนูใหม่ได้เลยครับ!'
      )

      return setDeployStatus({
        type: 'success',
        msg: `Rich Menu created successfully!\nID: ${
          result.richMenuId || 'Success'
        }`
      })
    } catch (e: any) {
      console.error('Deployment error:', e)
      setDeployStatus({
        type: 'error',
        msg: `${code} ${e.message || 'Check your token and JSON config.'}`
      })
      return errorPopup(
        e.message || 'Verification failed. Please check your credentials.'
      )
    } finally {
      setIsDeploying(false)
      setLoading(false)
    }
  }

  const scale = 300 / (config.size?.width || 2500)

  return (
    <>
      {contextHolder}
      {loading ? <LoadingScreen /> : null}
      <div className='space-y-6 animate-fadeIn'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-slate-800'>Final Preview</h2>
          <p className='text-slate-500'>How your menu will appear to users.</p>
        </div>

        <div className='flex flex-col md:flex-row gap-8 items-start'>
          <div className='flex-1 w-full space-y-4'>
            <div className='bg-slate-100 rounded-2xl p-4 flex justify-center overflow-hidden border border-slate-200'>
              <div
                className='relative shadow-2xl bg-white border border-slate-300'
                style={{
                  width: 300,
                  height: (config.size?.height || 1686) * scale
                }}
              >
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt='Rich Menu'
                    className='w-full h-full object-cover'
                  />
                )}
                {config.areas?.map((area, idx) => (
                  <div
                    key={idx}
                    className='absolute border border-dashed border-red-500 bg-red-500/10 group cursor-pointer hover:bg-red-500/30 transition-all flex items-center justify-center'
                    style={{
                      left: area.bounds.x * scale,
                      top: area.bounds.y * scale,
                      width: area.bounds.width * scale,
                      height: area.bounds.height * scale
                    }}
                  >
                    <span className='opacity-0 group-hover:opacity-100 text-[10px] font-bold text-red-800 bg-white px-1 rounded shadow'>
                      {area.action.label || area.action.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className='text-center text-xs text-slate-400'>
              Hover areas to see action labels
            </div>
          </div>

          <div className='flex-1 w-full space-y-4'>
            <div className='bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-3'>
              <h3 className='font-bold text-slate-700 uppercase text-xs tracking-wider'>
                Properties
              </h3>
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='text-slate-500'>Name:</span>
                  <span className='font-medium text-slate-800'>
                    {config.name}
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-slate-500'>Chat Bar Text:</span>
                  <span className='font-medium text-slate-800'>
                    {config.chatBarText}
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-slate-500'>Tap Areas:</span>
                  <span className='font-medium text-slate-800'>
                    {config.areas?.length || 0} spots
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-slate-500'>Size:</span>
                  <span className='font-medium text-slate-800'>
                    {config.size?.width}x{config.size?.height}
                  </span>
                </div>
              </div>
            </div>

            {deployStatus && (
              <div
                className={`p-4 rounded-xl text-sm font-medium animate-fadeIn ${
                  deployStatus.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {deployStatus.msg}
              </div>
            )}

            {deployStatus ? (
              <div className='space-y-3'>
                <button
                  onClick={() => (window.location.href = '/')}
                  className='w-full py-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors'
                >
                  Back To Home
                </button>
              </div>
            ) : (
              <div className='space-y-3'>
                <button
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  className={`w-full py-4 rounded-xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-2 ${
                    isDeploying
                      ? 'bg-slate-400'
                      : 'bg-[#06C755] hover:bg-[#05b14c] hover:-translate-y-0.5'
                  }`}
                >
                  {isDeploying && (
                    <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  )}
                  {isDeploying ? 'Deploying...' : 'Setup Rich Menu Now'}
                </button>
                <button
                  onClick={onBack}
                  disabled={isDeploying}
                  className='w-full py-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors'
                >
                  Edit Configuration
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default PreviewStep
