import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  X,
  RotateCcw,
  Upload,
  Camera,
  FlipHorizontal2,
  RotateCw,
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  Briefcase,
  UserCheck,
  Ban,
  Filter,
  CheckSquare,
  Layers,
  CloudUpload,
  Keyboard,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  QrCode,
  Mail,
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartInteractiveTour: () => void;
}

type GuideSectionId = 'quickstart' | 'scanning' | 'qs_rules' | 'database' | 'cloud_shortcuts';

const SECTIONS: { id: GuideSectionId; step: string; title: string; subtitle: string }[] = [
  {
    id: 'quickstart',
    step: '01',
    title: '快速上手 4 步驟',
    subtitle: '從掃描建檔到匯出 QS 名單',
  },
  {
    id: 'scanning',
    step: '02',
    title: '掃描、雙面合併與翻正',
    subtitle: '圖檔、PDF 裁切與影像方向修正',
  },
  {
    id: 'qs_rules',
    step: '03',
    title: 'QS 聯絡人分類與輸出',
    subtitle: '學者 / 雇主判定標準與綁定匯出',
  },
  {
    id: 'database',
    step: '04',
    title: '資料庫檢索與批次編輯',
    subtitle: '多維篩選、標籤來源與重複合併',
  },
  {
    id: 'cloud_shortcuts',
    step: '05',
    title: 'Notion 同步與快捷鍵',
    subtitle: '雲端雙向備份與高速審閱秘訣',
  },
];

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onStartInteractiveTour,
}) => {
  const [activeSection, setActiveSection] = useState<GuideSectionId>('quickstart');

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentIdx = SECTIONS.findIndex((s) => s.id === activeSection);
  const canGoPrev = currentIdx > 0;
  const canGoNext = currentIdx < SECTIONS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[9700] bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-guide-title"
    >
      <div
        className="bg-white w-full max-w-5xl h-[88vh] max-h-[820px] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="user-guide-title"
                className="text-lg font-bold font-display text-slate-900 leading-snug"
              >
                EcoScan 系統使用教學指南
              </h2>
              <p className="text-sm text-slate-600">
                了解名片智慧辨識、雙面合併、QS Hub 分類健檢與一鍵匯出完整操作流程
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartInteractiveTour();
              }}
              className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重看教學（互動步驟導覽）</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="關閉使用教學"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body: Left Chapter Rail + Right Content */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Chapter Navigation */}
          <aside className="md:w-64 lg:w-72 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-3 sm:p-4 overflow-x-auto md:overflow-y-auto custom-scrollbar shrink-0">
            <div className="flex md:flex-col gap-1.5">
              {SECTIONS.map((sec) => {
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSection(sec.id)}
                    className={`text-left px-3.5 py-3 rounded-xl transition-colors cursor-pointer shrink-0 md:shrink border ${
                      isActive
                        ? 'bg-white border-indigo-300 shadow-2xs text-slate-900'
                        : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded tabular-nums ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200/80 text-slate-600'
                        }`}
                      >
                        {sec.step}
                      </span>
                      <span className="text-sm font-bold whitespace-nowrap md:whitespace-normal">
                        {sec.title}
                      </span>
                    </div>
                    <p className="hidden md:block text-xs text-slate-600 mt-1 pl-8 leading-relaxed">
                      {sec.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Active Chapter Article */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-7 bg-white">
            {activeSection === 'quickstart' && (
              <div className="max-w-3xl space-y-6">
                <div>
                  <div className="text-xs font-bold text-indigo-600 tracking-wide mb-1">
                    CHAPTER 01 · 快速上手
                  </div>
                  <h3 className="text-xl font-bold font-display text-slate-900">
                    4 個步驟完成名片數位化與 QS 平台名單匯出
                  </h3>
                  <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                    本系統專為國際學術交流與企業雇主名片建檔設計，預設將活動來源統一標記為{' '}
                    <strong className="text-slate-900">FO GUANG UNIVERSITY</strong>，並自動完成國家標準化與合規檢查。
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      step: '步驟 1',
                      title: '新增、拖曳或拍照掃描名片',
                      desc: '點擊右上角「新增名片」或直接把 JPG、PNG、多頁掃描 PDF 拖曳進視窗；行動裝置可點擊「拍照」直接拍攝實體名片。',
                      Icon: Upload,
                    },
                    {
                      step: '步驟 2',
                      title: '自動擷取欄位與影像翻正',
                      desc: '系統會自動辨識姓名、職稱、機構、信箱與英譯參考，並將橫躺或直拍的名片自動翻正為正立方向。',
                      Icon: RotateCw,
                    },
                    {
                      step: '步驟 3',
                      title: '雙面併排檢視、雙語升降與雙職稱整合',
                      desc: '上傳或拍攝名片反面後可開啟「併排檢視」；英文自動升為主欄位、中文保留對照欄，不同職稱自動斜線併列並對應 QS 分類。',
                      Icon: FlipHorizontal2,
                    },
                    {
                      step: '步驟 4',
                      title: '一鍵輸出 QS 平台名單與雲端同步',
                      desc: '在「名片資料庫」上方點擊「一鍵輸出 QS 上傳名單」，即可下載符合 QS Hub 規範的 Academic 與 Employer 雙分頁 Excel 檔。',
                      Icon: FileSpreadsheet,
                    },
                  ].map((item, idx) => {
                    const IconComp = item.Icon;
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col gap-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-md">
                            {item.step}
                          </span>
                          <IconComp className="w-5 h-5 text-slate-600" />
                        </div>
                        <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
                        <p className="text-sm text-slate-700 leading-relaxed">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      想跟著實際畫面一步步操作嗎？
                    </h4>
                    <p className="text-sm text-slate-700 mt-0.5">
                      點擊「重看教學」即可在畫面上高亮標示每個核心按鈕的位置與功能說明。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onStartInteractiveTour();
                    }}
                    className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>啟動實境步驟導覽</span>
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'scanning' && (
              <div className="max-w-3xl space-y-6">
                <div>
                  <div className="text-xs font-bold text-indigo-600 tracking-wide mb-1">
                    CHAPTER 02 · 掃描與影像處理
                  </div>
                  <h3 className="text-xl font-bold font-display text-slate-900">
                    批次掃描、PDF 智慧裁切、雙面合併與自動翻正
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                      <Upload className="w-4 h-4 text-indigo-600" />
                      <span>1. 單張、多張批次圖檔與多頁 PDF 裁切</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      • <strong>單張圖檔或 PDF</strong>：上傳後會進入「智慧裁切工作台」，自動框選同一頁上的多張名片；您也可以手動拖曳滑鼠新增或調整裁切框，確認後一次送入辨識佇列。
                      <br />• <strong>多張照片批次上傳</strong>：一次選取多張 JPG/PNG 圖檔時，系統會在背景佇列自動逐張辨識，您可以繼續瀏覽或編輯其他名片，不需等待畫面鎖死。
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                      <FlipHorizontal2 className="w-4 h-4 text-indigo-600" />
                      <span>2. 雙面名片併排檢視、雙語升降與差異衝突處理</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      進入「審閱工作台」檢視名片時，左上角支援<strong>「正面」</strong>、<strong>「反面」</strong>與<strong>「併排檢視」</strong>三種模式，並可點擊「智慧雙面比對合併」或於資料庫執行「批次雙面重整」：
                      <br />• <strong>中英雙語名片</strong>：自動將英文姓名、機構與職稱升為主欄位（符合國際匯出規格），中文完整保留於對照欄位。
                      <br />• <strong>前後職稱不同</strong>：自動去重並以斜線 <code className="px-1 py-0.5 bg-slate-100 rounded text-xs font-mono">/</code> 併列雙職稱，直接重新對應最適合的 QS 分類（不寫入備註）。
                      <br />• <strong>前後機構或聯絡人不同</strong>：系統會主動彈出正反面對照視窗，讓您一鍵選擇「合併為兼任身分」、「拆分為兩筆獨立名片」或「僅保留雙面影像」。
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                      <RotateCw className="w-4 h-4 text-indigo-600" />
                      <span>3. 名片影像自動翻正與手動旋轉</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      • <strong>全庫一鍵自動翻正</strong>：點擊資料庫頂端橫幅的「自動翻正名片」（或右上角「Notion 與維護 → 自動翻正全部名片影像」），系統會自動檢測橫躺或顛倒的掃描圖並轉為正立方向。
                      <br />• <strong>單張微調與縮放</strong>：在「審閱工作台」影像區可使用滑鼠滾輪放大檢視細節，或點擊下方旋轉按鈕手動每次旋轉 90 度。
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                      <Camera className="w-4 h-4 text-indigo-600" />
                      <span>4. 內建電子名片 QR Code 與跟進開發信草稿</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      審閱名片時點擊右上角<strong>「QR 名片」</strong>（快捷鍵 <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono">Q</kbd>）即可用手機掃描匯入通訊錄；點擊<strong>「開發信草稿」</strong>（快捷鍵 <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono">E</kbd>）可快速產生中英文商務／學術問候信。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'qs_rules' && (
              <div className="max-w-3xl space-y-6">
                <div>
                  <div className="text-xs font-bold text-indigo-600 tracking-wide mb-1">
                    CHAPTER 03 · QS 聯絡人分類與報表輸出
                  </div>
                  <h3 className="text-xl font-bold font-display text-slate-900">
                    QS Hub 四大分類規範、合規健檢與綁定名單匯出
                  </h3>
                  <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                    為確保上傳至 QS 平台的名單百分之百符合官方審查標準，系統內建分類健檢邏輯，區分以下 4 種聯絡人類別：
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1.5">
                    <div className="flex items-center gap-2 text-base font-bold text-amber-900">
                      <GraduationCap className="w-5 h-5 text-amber-700" />
                      <span>QS Academic (高教學者)</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      任職於國內外<strong>大學、學院、高等教育或國家級研究機構</strong>，且具備教學或研究職銜者（如教授、副教授、助理教授、講師、研究員、博士後研究員、校長、院長、系主任）。
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5">
                    <div className="flex items-center gap-2 text-base font-bold text-blue-900">
                      <Briefcase className="w-5 h-5 text-blue-700" />
                      <span>QS Employer (企業雇主)</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      任職於<strong>一般企業、跨國公司、政府機關、公協會、醫院、基金會、媒體或高中職以下學校</strong>之主管與代表，可評估大學畢業生就業表現者。
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1.5">
                    <div className="flex items-center gap-2 text-base font-bold text-emerald-900">
                      <UserCheck className="w-5 h-5 text-emerald-700" />
                      <span>QS Staff (大專校務職員)</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      任職於大專院校但屬於<strong>純行政職務</strong>（如國際處專員、行政組長、專案經理、秘書），未兼任教職或研究職者，系統會自動分流避免誤報為學者。
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                      <Ban className="w-5 h-5 text-slate-600" />
                      <span>一般名片 (非 QS / 校內自薦排除)</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      依 QS 規定<strong>不得提交本機構（佛光大學 Fo Guang University）校內人員</strong>；系統會自動將校內名片歸為「一般名片」並從上傳名單中排除。
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
                  <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                    <span>如何匯出綁定的 QS 平台上傳名單？</span>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-700 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                      <span>
                        <strong>直接一鍵下載</strong>：在「名片資料庫」最上方藍色橫幅（或右上角「匯出報表」選單）點擊<strong>「一鍵輸出 QS 上傳名單 (.xlsx)」</strong>，即會匯出全庫通過 Email、機構、姓名、標準國家檢查且已完成 Email 去重的合規名單。
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                      <span>
                        <strong>匯出前審閱與分類健檢</strong>：點擊<strong>「檢視名單與分類健檢」</strong>可開啟專屬審核視窗，查看 Academic / Employer 筆數、缺漏欄位原因，以及一鍵套用分類修正。
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeSection === 'database' && (
              <div className="max-w-3xl space-y-6">
                <div>
                  <div className="text-xs font-bold text-indigo-600 tracking-wide mb-1">
                    CHAPTER 04 · 資料庫檢索與批次管理
                  </div>
                  <h3 className="text-xl font-bold font-display text-slate-900">
                    多維度搜尋、批次編輯欄位與重複聯絡人智慧合併
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                      <Filter className="w-4 h-4 text-indigo-600" />
                      <span>1. 多維度交叉篩選與關鍵字高亮</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      在「名片資料庫」可同時組合<strong>關鍵字搜尋</strong>（支援中英文姓名、公司、職稱、Email、摘要）、<strong>QS 分類頁籤</strong>、<strong>標準 197 國下拉選單</strong>、<strong>活動來源</strong>、<strong>自訂標籤</strong>以及「含 Email / 含電話」快速篩選。點擊表格內的國家或標籤文字也能一鍵過濾相同屬性名片。
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                      <span>2. 多筆勾選與底部浮動「批次編輯列」</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      勾選任意一筆或多筆名片（或點選「全選目前結果」），畫面下方會自動浮現深色<strong>批次操作列</strong>，可一次對所有勾選名片執行：
                      <br />• 批次更改 QS 分類 · 批次設定標準國家 · 批次設定活動來源 · 批次貼上自訂標籤 · 送入 QS 審核匯出。
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>3. 重複名片偵測與智慧合併</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      系統會自動比對相同 Email、電話或同名同機構的重複紀錄。點擊上方導覽列<strong>「重複管理」</strong>可檢視每組重複明細，或點擊「一鍵合併」保留最完整主紀錄並自動整合電話、備註、標籤與反面圖檔。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'cloud_shortcuts' && (
              <div className="max-w-3xl space-y-6">
                <div>
                  <div className="text-xs font-bold text-indigo-600 tracking-wide mb-1">
                    CHAPTER 05 · 雲端同步與快捷鍵
                  </div>
                  <h3 className="text-xl font-bold font-display text-slate-900">
                    Notion 雙向雲端同步與鍵盤高速審閱快捷鍵
                  </h3>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <CloudUpload className="w-4 h-4 text-indigo-600" />
                    <span>Notion 雲端資料庫雙向同步說明</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    • <strong>本機即時自動儲存</strong>：您在表單中輸入的每一個字都會自動寫入瀏覽器本機資料庫（顯示「已自動儲存」），重新整理網頁也不會遺失。
                    <br />• <strong>單筆或批次同步至 Notion</strong>：在審閱工作台可點擊右上角「更新至 Notion」推送單筆；若進行了大量批次修改，請點選頂部<strong>「Notion 與維護 → 批次同步變更至 Notion」</strong>一次上傳所有待同步紀錄。
                    <br />• <strong>載入與封存還原</strong>：換電腦或清空快取後，可點選「從 Notion 載入名片資料」還原雲端紀錄，或使用「檢查並還原 Notion 封存名片」找回誤刪項目。
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-slate-700" />
                    <h4 className="text-sm font-bold text-slate-900">
                      常用鍵盤快捷鍵速查表（未聚焦於文字輸入框時可直接按鍵觸發）
                    </h4>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {[
                      { keys: ['⌘ / Ctrl', 'K'], desc: '快速切換「名片資料庫」與「審閱工作台」視圖' },
                      { keys: ['J / ↓', 'K / ↑'], desc: '在審閱工作台快速切換下一張 / 上一張名片' },
                      { keys: ['1', '2', '3', '4'], desc: '一鍵將目前名片設為：1 雇主 · 2 學者 · 3 職員 · 4 一般名片' },
                      { keys: ['Q'], desc: '開啟目前名片的 vCard 電子名片 QR Code' },
                      { keys: ['E'], desc: '開啟目前名片的跟進開發信草稿抽屜' },
                      { keys: ['?'], desc: '隨時開啟或關閉鍵盤快捷鍵清單' },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                      >
                        <span className="text-slate-700 font-medium">{row.desc}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {row.keys.map((k) => (
                            <kbd
                              key={k}
                              className="px-2.5 py-1 text-xs font-mono font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-md"
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    提示：頂部導覽列也提供「字級切換」按鈕，可隨時放大全站字體！
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    隨時點擊頂部「重看教學」即可重新播放步驟導覽。
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => canGoPrev && setActiveSection(SECTIONS[currentIdx - 1].id)}
              className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>上一章節</span>
            </button>
            <button
              type="button"
              disabled={!canGoNext}
              onClick={() => canGoNext && setActiveSection(SECTIONS[currentIdx + 1].id)}
              className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>下一章節</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartInteractiveTour();
              }}
              className="hidden sm:inline-flex px-3.5 py-2 rounded-lg text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重看互動導覽</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              開始使用系統
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
