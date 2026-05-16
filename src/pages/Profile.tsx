import React, { useState, useRef } from 'react';
import { Camera, Save, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { translations } from '../i18n';

export default function Profile() {
  const { language } = useLanguage();
  const { user, updateUser, bmi } = useUser();
  const t = translations[language].profile;

  const [formData, setFormData] = useState(user);
  const [showSaved, setShowSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'name' ? value : Number(value)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(formData);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  const getBmiStatus = (bmiValue: number) => {
    if (bmiValue < 18.5) return { label: t.underweight, color: 'text-[var(--warning)]' };
    if (bmiValue >= 24) return { label: t.overweight, color: 'text-[var(--destructive)]' };
    return { label: t.normalBmi, color: 'text-[var(--success)]' };
  };

  const bmiStatus = getBmiStatus(bmi);

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
          {t.title}
        </h1>
        <p className="text-[var(--text-secondary)] text-base">
          {t.subtitle}
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-[var(--border)]/50">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-50 flex items-center justify-center">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-300" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-10 h-10 bg-[var(--terracotta)] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[var(--terracotta-dark)] transition-colors"
              >
                <Camera className="w-5 h-5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
            <span className="text-sm text-[var(--text-muted)] font-medium">
              {t.uploadImage}
            </span>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">{t.name}</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/20 focus:border-[var(--terracotta)] transition-colors"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">{t.age}</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="1"
                max="120"
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/20 focus:border-[var(--terracotta)] transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">{t.height}</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                min="50"
                max="300"
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/20 focus:border-[var(--terracotta)] transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">{t.weight}</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                min="10"
                max="300"
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/20 focus:border-[var(--terracotta)] transition-colors"
                required
              />
            </div>
          </div>

          {/* BMI Display */}
          <div className="bg-[#FDF8F5] rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">{t.bmi}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">
                  {bmi.toFixed(1)}
                </span>
                <span className={`text-sm font-semibold ${bmiStatus.color}`}>
                  ({bmiStatus.label})
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4">
            {showSaved && (
              <span className="text-sm font-medium text-[var(--success)] animate-fade-in">
                {t.saved}
              </span>
            )}
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-[var(--terracotta)] text-white rounded-xl font-medium hover:bg-[var(--terracotta-dark)] hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <Save className="w-5 h-5" />
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
