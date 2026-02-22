import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { AppStep, RichMenuConfig, LineAccountInfo, LiffProfile } from './types'
import Header from './components/Header'
import StepIndicator from './components/StepIndicator'
import ConfigStep from './components/ConfigStep'
import JsonStep from './components/JsonStep'
import ImageStep from './components/ImageStep'
import PreviewStep from './components/PreviewStep'
import { API_BASE_URL, LIFF_ID } from './utills/constants'
import LoadingScreen from './components/Loading'

declare const liff: any

const DEFAULT_JSON: RichMenuConfig = {
  size: { width: 2500, height: 1686 },
  selected: true,
  name: 'My New Rich Menu',
  chatBarText: 'Open Menu',
  areas: [
    {
      bounds: { x: 0, y: 0, width: 1250, height: 1686 },
      action: {
        type: 'message',
        label: 'Button 1',
        text: 'Hello from Button 1'
      }
    },
    {
      bounds: { x: 1250, y: 0, width: 1250, height: 1686 },
      action: { type: 'uri', label: 'Button 2', uri: 'https://line.me' }
    }
  ]
}

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.CONFIG)
  const [token, setToken] = useState<string>('')
  const [accountInfo, setAccountInfo] = useState<LineAccountInfo | null>(null)
  const [jsonConfig, setJsonConfig] = useState<string>(
    JSON.stringify(DEFAULT_JSON, null, 2)
  )
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  // LIFF & Auth State
  const [liffProfile, setLiffProfile] = useState<LiffProfile | null>(null)
  const [isLiffInit, setIsLiffInit] = useState(false)
  const [liffError, setLiffError] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(false)
  const [loading, setLoading] = useState(false)

  const verifySystemAccess = async (profile: LiffProfile) => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('gcode') || undefined
    setLoading(true)
    setIsVerifyingAuth(true)
    try {
      const response = await fetch(`${API_BASE_URL}?path=verifyLineLogin`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          userId: profile.userId,
          pictureUrl: profile.pictureUrl,
          displayName: profile.displayName,
          code: code
        })
      })
      const data = await response.json()
      setIsAuthorized(data.allow === true || data.allowCode === true)
      setAuthMessage(
        data.message ||
          (data.allow ? null : 'You do not have permission to use this system.')
      )
    } catch (err) {
      console.error('Authorization check failed', err)
      setIsAuthorized(false)
      setAuthMessage('Unable to verify system access. Please try again later.')
    } finally {
      setIsVerifyingAuth(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = LIFF_ID
        await liff.init({ liffId })

        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile()
          setLiffProfile(profile)
          // Check system access after login
          await verifySystemAccess(profile)
        }
        setLiffError(null)
      } catch (err: any) {
        console.warn('LIFF Initialization failed:', err.message)
        setLiffError(err.message || 'Initialization failed')
      } finally {
        setIsLiffInit(true)
      }
    }
    initLiff()
  }, [])

  // Strict Navigation Guard: Bounce to Auth if not logged in OR not authorized
  useEffect(() => {
    if (isLiffInit && currentStep !== AppStep.CONFIG) {
      if (!liffProfile || isAuthorized === false) {
        setCurrentStep(AppStep.CONFIG)
      }
    }
  }, [liffProfile, isAuthorized, currentStep, isLiffInit])

  const handleLogin = useCallback(() => {
    if (typeof liff !== 'undefined' && liff.init && !liff.isLoggedIn()) {
      liff.login()
    }
  }, [])

  const handleLogout = useCallback(() => {
    if (typeof liff !== 'undefined' && liff.logout) {
      liff.logout()
    }
    setLiffProfile(null)
    setIsAuthorized(null)
    window.location.reload()
  }, [])

  const parsedJson = useMemo(() => {
    try {
      return JSON.parse(jsonConfig) as RichMenuConfig
    } catch (e) {
      return null
    }
  }, [jsonConfig])

  const handleNext = useCallback(() => {
    if (!liffProfile || isAuthorized !== true) {
      setCurrentStep(AppStep.CONFIG)
      return
    }
    setCurrentStep(prev => Math.min(prev + 1, AppStep.PREVIEW_DEPLOY))
  }, [liffProfile, isAuthorized])

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, AppStep.CONFIG))
  }, [])

  const handleImageChange = useCallback((file: File) => {
    setImageFile(file)
    const url = URL.createObjectURL(file)
    setImageUrl(url)
  }, [])

  return (
    <>
      {loading ? <LoadingScreen /> : null}
      <div className='min-h-screen pb-20'>
        <Header
          profile={liffProfile}
          onLogin={handleLogin}
          onLogout={handleLogout}
          isLiffInit={isLiffInit}
          liffError={!!liffError}
          isAuthorized={isAuthorized}
        />

        <main className='max-w-4xl mx-auto px-4 mt-8'>
          <StepIndicator currentStep={currentStep} />

          <div className='bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10 transition-all duration-300'>
            {currentStep === AppStep.CONFIG && (
              <ConfigStep
                token={token}
                onTokenChange={setToken}
                accountInfo={accountInfo}
                onAccountVerified={setAccountInfo}
                onNext={handleNext}
                liffProfile={liffProfile}
                liffError={!!liffError}
                onLogin={handleLogin}
                isAuthorized={isAuthorized}
                authMessage={authMessage}
                isVerifyingAuth={isVerifyingAuth}
              />
            )}

            {currentStep === AppStep.JSON_DEFINITION && (
              <JsonStep
                json={jsonConfig}
                onJsonChange={setJsonConfig}
                onNext={handleNext}
                onBack={handleBack}
                isValid={parsedJson !== null}
              />
            )}

            {currentStep === AppStep.IMAGE_UPLOAD && (
              <ImageStep
                onImageUpload={handleImageChange}
                imageUrl={imageUrl}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === AppStep.PREVIEW_DEPLOY && (
              <PreviewStep
                token={token}
                config={parsedJson!}
                imageUrl={imageUrl}
                imageFile={imageFile}
                onBack={handleBack}
                liffProfile={liffProfile}
              />
            )}
          </div>
        </main>

        <footer className='fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-4 text-center text-[10px] md:text-xs text-slate-400 font-medium tracking-wide'>
          <div className='flex items-center justify-center gap-2'>
            <span>LINEOA Rich Menu Studio</span>
            <span className='w-1 h-1 bg-slate-300 rounded-full'></span>
            <span className='text-[#06C755]'>Punnathat.k</span>
            <span className='w-1 h-1 bg-slate-300 rounded-full'></span>
            <span>© 2024 All Rights Reserved</span>
          </div>
        </footer>
      </div>
    </>
  )
}

export default App
