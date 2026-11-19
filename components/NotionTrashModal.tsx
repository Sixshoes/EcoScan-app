import React, { useState, useEffect } from 'react';
import {
  Archive,
  RotateCcw,
  Check,
  X,
  Loader2,
  AlertTriangle,
  RefreshCw,
  CloudDownload,
} from 'lucide-react';
import { BusinessCardData } from '../types';
import { CardThumbnail } from './CardThumbnail';
import { saveAllCardsToDB } from '../services/dbService';
import { useToast } from './ToastProvider';

interface NotionTrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoredCards: (restored: BusinessCardData[]) => void;
  onLoadAllFromNotion?: () => void;
}

export const NotionTrashModal: React.FC<NotionTrashModalProps> = ({
  isOpen,
  onClose,
  onRestoredCards,
  onLoadAllFromNotion,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [archivedCards, setArchivedCards] = useState<BusinessCardData[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchArchivedCards = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/notion/archived');
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || '無法讀取 Notion 封存名片');
      }
      setArchivedCards(data.archivedCards || []);
      setSelectedIds(new Set((data.archivedCards || []).map((c: any) => c.id)));
    } catch (e: any) {
      setErrorMessage(e.message || '查詢失敗');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchArchivedCards();
    }
  }, [isOpen]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === archivedCards.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(archivedCards.map((c) => c.id)));
    }
  };

  const handleRestoreSelected = async () => {
    const idsToRestore = Array.from(selectedIds);
    if (idsToRestore.length === 0) return;

    setIsRestoring(true);
    try {
      const res = await fetch('/api/notion/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageIds: idsToRestore }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || '還原失敗');
      }

      const restoredCardsList = archivedCards.filter((c) => selectedIds.has(c.id));
      await saveAllCardsToDB(restoredCardsList);
      onRestoredCards(restoredCardsList);

      addToast({
        type: 'success',
        message: `成功還原 ${data.restoredCount} 筆名片回 Notion 與本地資料庫`,
      });

      setArchivedCards((prev) => prev.filter((c) => !selectedIds.has(c.id)));
      setSelectedIds(new Set());

      if (restoredCardsList.length === archivedCards.length) {
        setTimeout(onClose, 800);
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        message: `還原過程發生錯誤：${err.message}`,
      });
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl shadow-xl overflow-hidden border border-slate-200 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold font-display text-slate-900 flex items-center gap-2">
                <span>Notion 封存與垃圾桶檢查</span>
                {!isLoading && (
                  <span className="text-xs font-medium text-slate-500 tabular-nums">
                    · {archivedCards.length} 筆已封存
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                掃描 Notion 資料庫中已封存或移至垃圾桶的名片，支援批次直接還原
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isRestoring}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Bar */}
        {!isLoading && archivedCards.length > 0 && (
          <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="select-all-trash"
                checked={selectedIds.size === archivedCards.length && archivedCards.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
              />
              <label
                htmlFor="select-all-trash"
                className="text-xs font-semibold text-slate-700 cursor-pointer select-none tabular-nums"
              >
                全選 (已選 {selectedIds.size} / {archivedCards.length} 筆)
              </label>
            </div>

            <button
              type="button"
              onClick={handleRestoreSelected}
              disabled={isRestoring || selectedIds.size === 0}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer tabular-nums"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>還原中...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>還原選取名片 ({selectedIds.size})</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-52 text-slate-500 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">正在掃描 Notion 封存紀錄...</span>
            </div>
          ) : errorMessage ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : archivedCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-slate-500 gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <div className="text-center">
                <h4 className="text-sm font-semibold font-display text-slate-900">
                  目前沒有任何封存或誤刪的名片
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
                  Notion 資料庫中的所有聯絡人紀錄皆處於正常啟用狀態。
                </p>
              </div>

              {onLoadAllFromNotion && (
                <div className="mt-3 p-4 bg-white border border-slate-200 rounded-xl flex flex-col items-center gap-2.5 max-w-sm w-full">
                  <span className="text-xs text-slate-700 font-medium text-center">
                    需要將 Notion 上的全部名片重新同步至本機嗎？
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLoadAllFromNotion();
                    }}
                    className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CloudDownload className="w-3.5 h-3.5" />
                    <span>從 Notion 載入全部名片</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {archivedCards.map((c) => {
                const displayName =
                  c.firstName || c.lastName
                    ? `${c.firstName || ''} ${c.lastName || ''}`.trim()
                    : c.company || '未知名片';

                const isChecked = selectedIds.has(c.id);

                return (
                  <div
                    key={c.id}
                    onClick={() => handleToggleSelect(c.id)}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-colors cursor-pointer ${
                      isChecked
                        ? 'bg-white border-indigo-400 ring-1 ring-indigo-500/15'
                        : 'bg-white/80 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleSelect(c.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 shrink-0"
                    />

                    <CardThumbnail card={c} size="md" className="rounded-md" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {displayName}
                        </span>
                        {c.category && (
                          <span className="text-xs text-slate-400">· {c.category}</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {[c.company || '無公司', c.title].filter(Boolean).join(' · ')}
                      </div>
                      {(c.email || c.phone) && (
                        <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                          {[c.email, c.phone].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 flex justify-between items-center bg-white">
          <button
            type="button"
            onClick={fetchArchivedCards}
            disabled={isLoading || isRestoring}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>重新掃描</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isRestoring}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
