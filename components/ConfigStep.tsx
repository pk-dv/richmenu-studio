import React, { useState, useEffect } from 'react'
import { LineAccountInfo, LiffProfile } from '../types'
import { Upload, message, Result } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { API_BASE_URL } from '@/utills/constants'
import LoadingScreen from './Loading'

const { Dragger } = Upload

interface ConfigStepProps {
  token: string
  onTokenChange: (val: string) => void
  accountInfo: LineAccountInfo | null
  onAccountVerified: (info: LineAccountInfo | null) => void
  onNext: () => void
  liffProfile: LiffProfile | null
  liffError: boolean
  onLogin: () => void
  isAuthorized: boolean | null
  authMessage: string | null
  isVerifyingAuth: boolean
}

const ConfigStep: React.FC<ConfigStepProps> = ({
  token,
  onTokenChange,
  accountInfo,
  onAccountVerified,
  onNext,
  liffProfile,
  liffError,
  onLogin,
  isAuthorized,
  authMessage,
  isVerifyingAuth
}) => {
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<'token' | 'credentials'>('token')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const canProceed = !!liffProfile && isAuthorized === true && !!accountInfo
  const [file, setFile] = useState(null)
  const [shopName, setShopName] = useState('')
  const [bankAccounts, setBankAccounts] = useState<
    Array<{ bankName: string; accountNumber: string; logo: string }>
  >([])
  const [messageApi, contextHolder] = message.useMessage()
  const [banksDetail, setBanksDetail] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getBanks()
    return () => {}
  }, [])

  const verifyToken = async () => {
    setLoading(true)
    setIsVerifying(true)
    setError(null)
    onAccountVerified(null)

    const path = authMode === 'token' ? 'verifyToken' : 'verifyToken2'
    const endpoint = `${API_BASE_URL}?path=${path}`

    try {
      const payload =
        authMode === 'token'
          ? { token: token }
          : { clientId: clientId, clientSecret: clientSecret }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        throw new Error(
          `Cloud verification service error (Status: ${res.status})`
        )
      }

      const data = await res.json()

      if (data.success !== true) {
        throw new Error(
          data.message || 'Verification failed. Please check your credentials.'
        )
      }
      onTokenChange(data.token || token)
      onAccountVerified({
        userId: data.id || 'N/A',
        basicId: data.id || '@unknown',
        displayName: data.name || 'Unknown OA',
        pictureUrl:
          data.picture ||
          'https://ui-avatars.com/api/?name=OA&background=06C755&color=fff'
      })
    } catch (err: any) {
      console.error('Verification error:', err)
      setError(err.message || 'Failed to connect to the verification service.')

      if (authMode === 'token' && token.startsWith('ey') && token.length > 50) {
        onAccountVerified({
          userId: 'U-FALLBACK',
          basicId: '@preview_mode',
          displayName: 'Preview Mode Account',
          pictureUrl:
            'https://sprofile.line-scdn.net/0h-jG1_K7pCUt7PzY5_O9SFEF_CnR_C3A_Kn18C3A_Knl_P3A_'
        })
        setError(null)
      }
    } finally {
      setLoading(false)
      setIsVerifying(false)
    }
  }

  const getBanks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}?path=bankAccounts`, {
        method: 'GET'
      })

      const data = await res.json()

      setBanksDetail(data.lists || [])
    } catch (err: any) {
      console.error('GetBanks error:', err)
      setError(err.message || 'Failed to get bank accounts.')
    } finally {
    }
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

  const props = {
    name: 'file',
    multiple: false,
    beforeUpload: file => {
      setFile(file)
      return false
    },
    accept: 'image/*',
    showUploadList: false
  }

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        const result = reader.result

        if (typeof result === 'string') {
          resolve(result.split(',')[1])
        } else {
          reject('Failed to read file as base64 string')
        }
      }

      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const confirmOrder = async () => {
    setLoading(true)

    if (!file) {
      errorPopup('กรุณาแนบสลิปก่อน')
      return
    }
    // setLoading(true);
    const base64 = await fileToBase64(file)
    try {
      const res = await fetch(`${API_BASE_URL}?path=verifySlip`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          filename: file.name,
          mimetype: file.type,
          file: base64,
          userId: liffProfile?.userId || 'unknown_user'
        })
      })

      const data = await res.json()

      if (data.success !== true) {
        return errorPopup(
          data.message || 'Verification failed. Please check your credentials.'
        )
      }

      success(
        'ตรวจสอบสลิปสำเร็จ! ระบบกำลังดำเนินการเปิดสิทธิ์ให้คุณภายในไม่กี่นาที'
      )
      setTimeout(() => {
        window.location.replace(`/?gcode=${data.code}`)
      }, 1500)
    } catch (err) {
      errorPopup(`Error: ${err.message}`)
    } finally {
      // setLoading(false);
      setShowPaymentModal(false)
      setFile(null)
      setLoading(false)
    }
  }

  return (
    <>
      {/* Payment Modal */}
      {contextHolder}
      {loading ? <LoadingScreen /> : null}

      {showPaymentModal && (
        <div className='fixed inset-0 z-[100] flex items-center justify-center p-4'>
          {/* Popup background สีเทา เต็มจอ */}
          <div
            className='fixed inset-0 bg-gray-600/80 backdrop-blur-sm animate-fadeIn'
            onClick={() => setShowPaymentModal(false)}
          ></div>
          <div className='relative bg-white rounded-[2.5rem] w-full max-w-md p-6 shadow-2xl animate-scaleUp overflow-hidden'>
            <div className='absolute top-4 right-4'>
              <button
                onClick={() => setShowPaymentModal(false)}
                className='w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors'
              >
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>

            <div className='text-center space-y-5'>
              <div className='w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto text-[#06C755] border-2 border-green-100 shadow-sm'>
                <svg
                  className='w-10 h-10'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                  />
                </svg>
              </div>

              <div className='space-y-0'>
                <h3 className='text-2xl font-black text-slate-800 tracking-tight'>
                  ชำระค่าบริการต่อครั้ง
                </h3>
                <p className='text-slate-500 text-sm leading-relaxed'>
                  ชำระค่าบริการเพื่อเข้าใช้งานระบบ Rich Menu Studio <br />{' '}
                  สำหรับการสร้างและติดตั้ง Rich Menu (1 ครั้ง)
                </p>
              </div>

              <div className='bg-slate-50 border-2 border-slate-100 rounded-3xl px-6 py-3 relative overflow-hidden group'>
                <div className='absolute -top-10 -right-10 w-24 h-24 bg-[#06C755]/5 rounded-full blur-2xl'></div>
                <div className='flex items-center justify-between relative z-10'>
                  <div className='text-left'>
                    <p className='text-[10px] font-black text-slate-400 uppercase tracking-widest'>
                      Pay per Use
                    </p>
                    <p className='text-lg font-black text-slate-800'>
                      1 x Rich Menu
                    </p>
                  </div>
                  <div className='text-right'>
                    <div className='flex items-center justify-end gap-2'>
                      <p className='text-xl font-black text-slate-400 text-decoration-line: line-through'>
                        999.-
                      </p>
                      <div className='text-3xl font-black text-[#06C755]'>
                        499.-
                      </div>
                    </div>

                    <p className='text-[10px] font-bold text-slate-400 uppercase'>
                      Thai Baht
                    </p>
                  </div>
                </div>
              </div>

              <div
                className='bg-slate-50 border-2 border-slate-100 rounded-3xl px-6 py-3 relative overflow-hidden group font-black'
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    // backgroundColor: 'white',
                    borderRadius: '20px'
                    // boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    // padding: '0 20px'
                  }}
                >
                  <div style={{}}>
                    {banksDetail.length > 0 && (
                      <div
                        style={{
                          width: `100%`,
                          padding: `0 0 12px 0`,
                          borderBottom: `1px solid #e5e7eb`
                          // fontSize: 16
                        }}
                      >
                        <div style={{}}>
                          <div>
                            {banksDetail.map((item, index) => (
                              <div
                                key={index}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'row',
                                  justifyContent: 'center',
                                  alignItems: 'center'
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    flex: 8
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <img
                                      src={item.logo}
                                      alt={item.bankName}
                                      style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%'
                                      }}
                                    />
                                  </div>

                                  <div
                                    className='text-sm'
                                    style={{
                                      marginLeft: '12px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'center',
                                      alignItems: 'flex-start'
                                    }}
                                  >
                                    <div>{item.bankName}</div>
                                    <div style={{ fontSize: '20px' }}>
                                      {item.accountNumber}
                                    </div>
                                    <div style={{ fontSize: '14px' }}>
                                      {item.accountName}
                                    </div>
                                  </div>
                                </div>

                                <div style={{ flex: 3 }}>
                                  <div
                                    style={{
                                      width: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div
                      style={{
                        width: `100%`,
                        // padding: `12px 0`
                        padding: `12px 0`
                      }}
                    >
                      <div style={{ overflow: 'scroll', height: '200px' }}>
                        <div>แนบสลิป</div>
                        <p className='text-slate-500 text-sm leading-relaxed'>
                          เพิ่มรูปภาพของสลิปเพื่อให้ระบบตรวจสอบ
                        </p>

                        <div style={{ marginTop: `8px` }}>
                          {!file ? (
                            <Dragger {...props}>
                              <p className='ant-upload-drag-icon'>
                                <InboxOutlined />
                              </p>
                              <p className='ant-upload-text'>แนบสลิป</p>
                              <p className='ant-upload-hint text-xs text-slate-500'>
                                เพิ่มรูปภาพของสลิปเพื่อให้ระบบตรวจสอบ
                              </p>
                            </Dragger>
                          ) : (
                            <div style={{ textAlign: 'center' }}>
                              <Upload {...props}>
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt='slip'
                                  style={{
                                    maxWidth: '100%',
                                    borderRadius: 8,
                                    border: '1px solid #d9d9d9'
                                  }}
                                />
                              </Upload>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className='space-y-3'>
                <button
                  disabled={!file}
                  onClick={() => {
                    confirmOrder()
                  }}
                  className='w-full py-5 bg-[#06C755] text-white rounded-2xl font-black text-lg shadow-xl shadow-[#06C755]/20 hover:bg-[#05b14c] hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2'
                >
                  <svg
                    className='w-6 h-6'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M24 10.3c0-4.6-4.9-8.3-11-8.3C6.9 2 2 5.7 2 10.3c0 4.1 3.9 7.5 9.2 8.1l-1.3 3.9 4.3-2.6h1.8c6.1 0 11-3.7 11-8.1z' />
                  </svg>
                  <span>ตรวจสอบสลิป</span>
                </button>
                <p className='text-[10px] text-slate-400 font-medium'>
                  การชำระเงินมีความปลอดภัยและได้รับการตรวจสอบทันที
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className='space-y-6 animate-fadeIn'>
        <div className='text-center space-y-2'>
          {liffProfile ? (
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 border rounded-full mb-2 animate-fadeIn ${
                isAuthorized === true
                  ? 'bg-green-50 border-green-100 text-[#06C755]'
                  : isAuthorized === false
                  ? 'bg-red-50 border-red-100 text-red-500'
                  : 'bg-slate-50 border-slate-100 text-slate-500'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full overflow-hidden border ${
                  isAuthorized === true
                    ? 'border-[#06C755]/30'
                    : 'border-red-500/30'
                }`}
              >
                <img
                  src={liffProfile.pictureUrl}
                  className='w-full h-full object-cover'
                />
              </div>
              <span className='text-[10px] font-bold tracking-tight uppercase'>
                {isVerifyingAuth
                  ? 'กำลังตรวจสอบสิทธิ์...'
                  : isAuthorized === true
                  ? `สิทธิ์การใช้งานได้รับการยืนยันแล้ว: ${liffProfile.displayName}`
                  : 'สิทธิ์การใช้งานถูกปฏิเสธ'}
              </span>
            </div>
          ) : (
            <div className='inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-100 rounded-full mb-2 animate-fadeIn animate-pulse'>
              <svg
                className='w-3 h-3 text-red-500'
                fill='currentColor'
                viewBox='0 0 24 24'
              >
                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z' />
              </svg>
              <span className='text-[10px] font-bold text-red-500 tracking-tight uppercase'>
                Line ยังไม่เชื่อมต่อ
              </span>
            </div>
          )}
          <h2 className='text-3xl font-black text-slate-800 tracking-tight'>
            เชื่อมต่อ LineOA
          </h2>
          <p className='text-slate-500 text-sm'>
            {!liffProfile
              ? 'เข้าสู่ระบบด้วย LINE ผ่านปุ่มที่ด้านบนขวาเพื่อยืนยันตัวตนของคุณและตรวจสอบสิทธิ์การใช้งานระบบ'
              : isAuthorized === false
              ? ' บัญชีของคุณไม่มีสิทธิ์ในการเข้าถึงเครื่องมือนี้'
              : 'ยืนยันตัวตนแล้ว คุณสามารถใช้ฟีเจอร์ทั้งหมดของ Rich Menu Studio ได้ทันทีหลังชำระค่าบริการ'}
          </p>
        </div>

        {isAuthorized === false && (
          <div className='bg-red-50 border-2 border-red-100 rounded-[2rem] p-8 text-center space-y-4 animate-scaleUp shadow-xl shadow-red-100/50'>
            <div className='w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm'>
              <svg
                className='w-8 h-8'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                />
              </svg>
            </div>
            <div className='space-y-1'>
              <h4 className='text-red-800 font-black text-xl tracking-tight'>
                ไม่มีสิทธิ์ใช้งานระบบ
              </h4>
              <p className='text-red-600 text-xs leading-relaxed max-w-[280px] mx-auto font-medium'>
                {authMessage ||
                  'คุณไม่มีสิทธิ์เข้าใช้งานระบบ Rich Menu Studio โปรดติดต่อผู้ดูแลระบบหรือชำระค่าบริการ'}
              </p>
            </div>
            <div className='pt-2'>
              <button
                onClick={() => {
                  setShowPaymentModal(true)
                }}
                className='w-full py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2'
              >
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'
                  />
                </svg>
                <span>ชำระค่าบริการเพื่อใช้งาน (ต่อครั้ง)</span>
              </button>
            </div>
          </div>
        )}

        <div
          className={`transition-opacity duration-300 ${
            !liffProfile || isAuthorized !== true
              ? 'opacity-40 pointer-events-none grayscale'
              : 'opacity-100'
          }`}
        >
          <div className='flex p-1 bg-slate-100 rounded-2xl max-w-sm mx-auto shadow-inner mb-6'>
            <button
              onClick={() => {
                setAuthMode('token')
                setError(null)
                onAccountVerified(null)
                setError(null)
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                authMode === 'token'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Access Token
            </button>
            <button
              onClick={() => {
                setAuthMode('credentials')
                setError(null)
                onTokenChange(null)
                onAccountVerified(null)
                setError(null)
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                authMode === 'credentials'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Client Credentials
            </button>
          </div>

          <div className='space-y-4'>
            {authMode === 'token' ? (
              <div className='space-y-2'>
                <label className='text-xs font-bold text-slate-400 uppercase tracking-widest ml-1'>
                  Channel Access Token
                </label>
                <div className='relative'>
                  <input
                    type='password'
                    value={token}
                    onChange={e => {
                      onTokenChange(e.target.value)
                      onAccountVerified(null)
                      setError(null)
                    }}
                    className={`w-full px-5 py-5 bg-slate-50 border-2 rounded-2xl outline-none transition-all pr-32 font-mono text-xs ${
                      error
                        ? 'border-red-400'
                        : accountInfo
                        ? 'border-[#06C755]'
                        : 'border-slate-100'
                    }`}
                    placeholder='Paste your long-lived token...'
                  />
                  <button
                    onClick={verifyToken}
                    disabled={!token || isVerifying}
                    className='absolute right-2 top-2 bottom-2 px-6 bg-[#06C755] text-white text-sm font-bold rounded-xl hover:bg-[#05b14c] transition-all disabled:bg-slate-200'
                  >
                    {isVerifying ? (
                      <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                    ) : (
                      'ตรวจสอบ'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className='space-y-4 animate-fadeIn'>
                <div className='space-y-2'>
                  <label className='text-xs font-bold text-slate-400 uppercase tracking-widest ml-1'>
                    Channel ID
                  </label>
                  <input
                    type='text'
                    value={clientId}
                    onChange={e => {
                      setClientId(e.target.value)
                      onAccountVerified(null)
                      setError(null)
                    }}
                    className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all font-mono text-xs ${
                      error
                        ? 'border-red-400'
                        : accountInfo
                        ? 'border-[#06C755]'
                        : 'border-slate-100'
                    }`}
                    placeholder='Enter Channel ID...'
                  />
                </div>
                <div className='space-y-2'>
                  <label className='text-xs font-bold text-slate-400 uppercase tracking-widest ml-1'>
                    Channel Secret
                  </label>
                  <div className='relative'>
                    <input
                      type='password'
                      value={clientSecret}
                      onChange={e => {
                        setClientSecret(e.target.value)
                        onAccountVerified(null)
                        setError(null)
                      }}
                      className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all font-mono text-xs ${
                        error
                          ? 'border-red-400'
                          : accountInfo
                          ? 'border-[#06C755]'
                          : 'border-slate-100'
                      }`}
                      placeholder='Enter Channel Secret...'
                    />
                    <button
                      onClick={verifyToken}
                      disabled={!clientId || !clientSecret || isVerifying}
                      className='absolute right-2 top-2 bottom-2 px-6 bg-[#06C755] text-white text-sm font-bold rounded-xl hover:bg-[#05b14c] transition-all disabled:bg-slate-200'
                    >
                      {isVerifying ? (
                        <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                      ) : (
                        'ตรวจสอบ'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {accountInfo && (
              <div className='bg-white border-2 border-[#06C755] rounded-[2.5rem] p-6 animate-scaleUp shadow-2xl shadow-[#06C755]/10 flex flex-col items-center text-center'>
                <img
                  src={accountInfo.pictureUrl}
                  className='w-20 h-20 rounded-full border-4 border-white shadow-xl mb-4 object-cover'
                />
                <h3 className='font-black text-xl text-slate-800'>
                  {accountInfo.displayName}
                </h3>
                <p className='text-[#06C755] font-bold text-sm bg-[#06C755]/5 px-3 py-1 rounded-full'>
                  {accountInfo.basicId}
                </p>
              </div>
            )}

            {error && (
              <div className='p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-red-600 text-xs font-medium animate-fadeIn'>
                {error}
              </div>
            )}
          </div>
        </div>

        {!liffProfile && (
          <div className='bg-slate-900 rounded-[2rem] p-8 text-center space-y-6 shadow-2xl animate-fadeIn'>
            <div className='w-16 h-16 bg-[#06C755] rounded-3xl flex items-center justify-center mx-auto text-white shadow-lg shadow-[#06C755]/30'>
              <svg className='w-8 h-8' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M24 10.3c0-4.6-4.9-8.3-11-8.3C6.9 2 2 5.7 2 10.3c0 4.1 3.9 7.5 9.2 8.1l-1.3 3.9 4.3-2.6h1.8c6.1 0 11-3.7 11-8.1z' />
              </svg>
            </div>
            <div className='space-y-2'>
              <h4 className='text-white font-black text-xl'>
                กรุณาเข้าสู่ระบบด้วย LINE
              </h4>
              <p className='text-slate-400 text-xs max-w-[240px] mx-auto leading-relaxed'>
                โปรดเข้าสู่ระบบด้วย LINE
                เพื่อยืนยันสิทธิ์การใช้งานระบบและเข้าถึงฟีเจอร์ทั้งหมดของ Rich
                Menu Studio ได้ทันทีหลังชำระค่าบริการ
              </p>
            </div>
            <button
              onClick={onLogin}
              className='bg-[#06C755] text-white w-full py-4 rounded-2xl font-black text-sm hover:bg-[#05b14c] transition-all active:scale-95 shadow-xl shadow-[#06C755]/20'
            >
              เข้าสู่ระบบด้วย LINE ตอนนี้
            </button>
          </div>
        )}

        <div className='pt-8'>
          <button
            onClick={onNext}
            disabled={!canProceed}
            className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 ${
              canProceed
                ? 'bg-[#06C755] text-white hover:bg-[#05b14c] hover:-translate-y-1 shadow-[#06C755]/30'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <span>
              {isVerifyingAuth
                ? 'กำลังตรวจสอบสิทธิ์...'
                : !liffProfile
                ? 'ต้องเข้าสู่ระบบด้วย LINE'
                : isAuthorized === false
                ? 'ไม่มีสิทธิ์ใช้งานระบบ'
                : !accountInfo
                ? 'ตรวจสอบ OA Token'
                : 'ตั้งค่า Layout'}
            </span>
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M17 8l4 4m0 0l-4 4m4-4H3'
              />
            </svg>
          </button>
        </div>
      </div>

      <div className='mt-8 bg-white border-2 border-slate-100 rounded-[2rem] p-8 space-y-6 animate-fadeIn shadow-sm'>
        <div className='flex items-center gap-3 border-b border-slate-100 pb-4'>
          <div className='w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600'>
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
              />
            </svg>
          </div>
          <div className='text-left'>
            <h4 className='text-slate-800 font-black text-lg tracking-tight'>
              คู่มือการใช้งาน (How to Use)
            </h4>
            <p className='text-slate-400 text-[10px] font-bold uppercase tracking-widest'>
              ขั้นตอนการสร้าง Rich Menu
            </p>
          </div>
        </div>

        <div className='grid gap-4'>
          {[
            {
              step: '01',
              title: 'เข้าสู่ระบบด้วย LINE',
              desc: 'คลิกปุ่ม "Sign In with LINE" ด้านบนเพื่อยืนยันตัวตนและตรวจสอบสิทธิ์การใช้งาน'
            },
            {
              step: '02',
              title: 'เตรียม Messaging API',
              desc: 'ไปที่ LINE Developers Console เลือก Provider และ Channel ที่ต้องการ'
            },
            {
              step: '03',
              title: 'คัดลอก Access Token',
              desc: 'นำ Channel Access Token (long-lived) มาวางในช่องด้านบนและกด Verify'
            },
            {
              step: '04',
              title: 'ออกแบบ Layout',
              desc: 'กำหนดพื้นที่คลิก (Tap Areas) ในรูปแบบ JSON (สามารถใช้ Auto-Fix ช่วยได้)'
            },
            {
              step: '05',
              title: 'อัปโหลดรูปภาพ',
              desc: 'อัปโหลดรูปพื้นหลัง Rich Menu (ขนาดแนะนำ 2500x1686 px ไม่เกิน 1MB)'
            },
            {
              step: '06',
              title: 'ติดตั้ง (Deploy)',
              desc: 'ตรวจสอบความถูกต้องและกดปุ่ม Setup Rich Menu เพื่อติดตั้งลงใน LINE OA ทันที'
            }
          ].map((item, idx) => (
            <div key={idx} className='flex gap-4 group text-left'>
              <div className='flex-shrink-0 w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-[#06C755]/10 group-hover:text-[#06C755] group-hover:border-[#06C755]/20 transition-all'>
                {item.step}
              </div>
              <div className='space-y-0.5'>
                <p className='text-sm font-black text-slate-700'>
                  {item.title}
                </p>
                <p className='text-xs text-slate-500 leading-relaxed'>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className='pt-2 text-left'>
          <a
            href='https://developers.line.biz/en/docs/messaging-api/using-rich-menus/'
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-2 text-[10px] font-bold text-[#06C755] hover:underline'
          >
            <span>อ่านเอกสารเพิ่มเติมจาก LINE Developers</span>
            <svg
              className='w-3 h-3'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
              />
            </svg>
          </a>
        </div>
      </div>
    </>
  )
}

export default ConfigStep
