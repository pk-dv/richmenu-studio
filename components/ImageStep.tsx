
import React from 'react';

interface ImageStepProps {
  onImageUpload: (file: File) => void;
  imageUrl: string | null;
  onNext: () => void;
  onBack: () => void;
}

const ImageStep: React.FC<ImageStepProps> = ({ onImageUpload, imageUrl, onNext, onBack }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800">รูป Rich Menu</h2>
        <p className="text-slate-500">อัพโหลดรูปภาพพื้นหลังของคุณ (PNG หรือ JPEG).</p>
      </div>

      <div className="group relative">
        <label className={`block w-full cursor-pointer rounded-2xl border-2 border-dashed transition-all p-4 ${
          imageUrl ? 'border-[#06C755] bg-[#06C755]/5' : 'border-slate-300 bg-slate-50 hover:border-[#06C755] hover:bg-[#06C755]/5'
        }`}>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            {imageUrl ? (
              <div className="relative">
                <img src={imageUrl} alt="Preview" className="max-h-64 rounded-xl shadow-xl" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold px-4 py-2 bg-[#06C755] rounded-lg">เปลี่ยนรูป</span>
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-[#06C755] transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">คลิกเพื่ออัพโหลดรูป</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG ขนาดไม่เกิน 1MB</p>
                </div>
              </>
            )}
          </div>
        </label>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 space-y-1">
        <p className="font-bold text-slate-700 mb-1">Recommended Dimensions:</p>
        <div className="grid grid-cols-2 gap-2">
          <p>• Large: 2500 x 1686 px</p>
          <p>• Compact: 2500 x 843 px</p>
          <p>• Small: 1200 x 810 px</p>
          <p>• Full: 1200 x 405 px</p>
        </div>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={onBack}
          className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
        >
          กลับไปแก้ไข JSON
        </button>
        <button 
          onClick={onNext}
          disabled={!imageUrl}
          className={`flex-[2] py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
            imageUrl 
              ? 'bg-[#06C755] hover:bg-[#05b14c] hover:-translate-y-0.5' 
              : 'bg-slate-300 cursor-not-allowed'
          }`}
        >
          ไปต่อที่ ตรวจสอบและเปิดใช้งาน
        </button>
      </div>
    </div>
  );
};

export default ImageStep;
