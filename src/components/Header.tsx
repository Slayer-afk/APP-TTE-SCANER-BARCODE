import React from 'react';
import {
  FileSignature,
  ScanLine,
  QrCode,
  FolderClock,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

export type AppTab = 'tte' | 'scan' | 'qr-generator' | 'archive';

interface HeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onOpenInstallModal: () => void;
  historyCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenInstallModal,
  historyCount = 0,
}) => {
  const tabs = [
    {
      id: 'tte' as AppTab,
      label: 'Dokumen TTE',
      sublabel: 'Tanda Tangan Elektronik',
      icon: FileSignature,
    },
    {
      id: 'scan' as AppTab,
      label: 'Scan Barcode / QR',
      sublabel: 'Pindai Kamera & Berkas',
      icon: ScanLine,
    },
    {
      id: 'qr-generator' as AppTab,
      label: 'Bikin QR Link',
      sublabel: 'Kode QR dari Hyperlink',
      icon: QrCode,
    },
    {
      id: 'archive' as AppTab,
      label: 'Arsip TTE',
      sublabel: 'Riwayat Dokumen Sah',
      icon: FolderClock,
      badge: historyCount > 0 ? historyCount : undefined,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 text-base sm:text-lg leading-none tracking-tight">
                  Dokumen TTE & QR
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-extrabold rounded-md uppercase tracking-wider border border-blue-200">
                  APK Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block mt-0.5">
                Aplikasi Tanda Tangan Elektronik, Pemindai Barcode & Generator QR
              </p>
            </div>
          </div>

          {/* Desktop Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Install APK / PWA Trigger Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-install-apk"
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Pasang</span> APK
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation / Bar */}
      <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-2 py-1.5 fixed bottom-0 left-0 right-0 z-40 shadow-lg">
        <div className="grid grid-cols-4 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-semibold transition-colors relative ${
                  isActive ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="truncate max-w-[70px]">{tab.label.split(' ')[0]}</span>
                {tab.badge !== undefined && (
                  <span className="absolute top-1 right-3 w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[8px] flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
