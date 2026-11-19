import React, { useState, useCallback } from 'react';
import { BusinessCardData } from '../../types';
import {
  saveCardToDB,
  saveAllCardsToDB,
  getCardById,
  deleteCardFromDB,
  deleteCardsFromDB,
} from '../../services/dbService';
import { uploadImageAsset } from '../../utils/firebase';
import { useToast } from '../../components/ToastProvider';
import { useConfirm } from '../../components/ConfirmDialogProvider';

const extractImageId = (url: string): string => {
  try {
    const decoded = decodeURIComponent(url);
    const match = decoded.match(/business_cards[\/]([^.\/?#]+)/);
    if (match && match[1]) {
      return match[1];
    }
  } catch (e) {
    console.error(e);
  }
  return Math.random().toString(36).substring(2);
};

const isFirebaseStorageUrl = (url?: string): boolean => {
  if (!url) return false;
  return (
    url.includes('storage.googleapis.com') ||
    url.includes('firebasestorage.googleapis.com') ||
    url.includes('firebasestorage.app')
  );
};

export const useNotionSync = (
  cards: BusinessCardData[],
  setCards: React.Dispatch<React.SetStateAction<BusinessCardData[]>>,
  formData: BusinessCardData | null,
  setFormData: React.Dispatch<React.SetStateAction<BusinessCardData | null>>,
  setSelectedCardId: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const [isNotionLoading, setIsNotionLoading] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [notionProgress, setNotionProgress] = useState<{ loaded: number; total: number | null }>({
    loaded: 0,
    total: null,
  });
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);
  const { addToast } = useToast();
  const confirm = useConfirm();

  const deleteFromNotion = useCallback(
    async (id: string, imageId?: string, name?: string, backImageId?: string) => {
      try {
        const params = new URLSearchParams();
        if (imageId) params.set('imageId', imageId);
        if (backImageId) params.set('backImageId', backImageId);
        const qs = params.toString();
        const url = qs ? `/api/notion/delete/${id}?${qs}` : `/api/notion/delete/${id}`;
        const res = await fetch(url, { method: 'DELETE' });
        const json = await res.json();
        if (!json.success) {
          console.error('Failed to delete from Notion:', json.error);
          addToast({ type: 'error', message: `無法從 Notion 刪除資料：${json.error}` });
        } else {
          addToast({ type: 'success', message: `${name || '名片資料'}已同步從 Notion 移除` });
        }
      } catch (e: any) {
        console.error('Failed to delete from Notion:', e);
        addToast({ type: 'error', message: `無法從 Notion 刪除資料：${e.message || e}` });
      }
    },
    [addToast]
  );

  const ensureFirebaseImage = useCallback(
    async (card: BusinessCardData): Promise<BusinessCardData> => {
      let updatedCard = { ...card };
      let changed = false;

      if (updatedCard.imageUrl) {
        if (isFirebaseStorageUrl(updatedCard.imageUrl)) {
          if (!updatedCard.imageId) {
            updatedCard.imageId = extractImageId(updatedCard.imageUrl);
            changed = true;
          }
        } else {
          try {
            const { imageId, downloadUrl } = await uploadImageAsset(updatedCard.imageUrl, updatedCard.id);
            updatedCard.imageUrl = downloadUrl;
            updatedCard.imageId = imageId;
            changed = true;
          } catch (e) {
            console.error('Failed to upload front image asset', e);
          }
        }
      }

      if (updatedCard.backImageUrl) {
        if (isFirebaseStorageUrl(updatedCard.backImageUrl)) {
          if (!updatedCard.backImageId) {
            updatedCard.backImageId = extractImageId(updatedCard.backImageUrl);
            changed = true;
          }
        } else {
          try {
            const { imageId, downloadUrl } = await uploadImageAsset(
              updatedCard.backImageUrl,
              `${updatedCard.id}_back`
            );
            updatedCard.backImageUrl = downloadUrl;
            updatedCard.backImageId = imageId;
            changed = true;
          } catch (e) {
            console.error('Failed to upload back image asset', e);
          }
        }
      }

      if (changed) {
        updatedCard.syncStatus = updatedCard.syncStatus === 'notion' ? 'notion' : 'firebase';
        await saveCardToDB(updatedCard);
        setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
        setFormData((prev) => (prev && prev.id === updatedCard.id ? updatedCard : prev));
      }

      return updatedCard;
    },
    [setCards, setFormData]
  );

  const handleLoadFromNotion = async () => {
    setIsNotionLoading(true);
    setNotionProgress({ loaded: 0, total: null });
    let loadedCount = 0;
    let hasMore = true;
    let nextCursor: string | undefined = undefined;
    let allNewCards: BusinessCardData[] = [];

    try {
      while (hasMore) {
        const url = nextCursor
          ? `/api/notion/load?cursor=${encodeURIComponent(nextCursor)}`
          : '/api/notion/load';

        const res = await fetch(url);
        const json = await res.json();

        if (json.success) {
          const pageCards: BusinessCardData[] = json.data;
          await saveAllCardsToDB(pageCards);

          // Background asset migration for external Notion URLs
          (async () => {
            const uploadBatchSize = 3;
            for (let i = 0; i < pageCards.length; i += uploadBatchSize) {
              const batch = pageCards.slice(i, i + uploadBatchSize);
              await Promise.all(
                batch.map(async (card) => {
                  if (card.imageUrl) {
                    if (isFirebaseStorageUrl(card.imageUrl)) {
                      if (!card.imageId) {
                        const imageId = extractImageId(card.imageUrl);
                        const updatedCard: BusinessCardData = {
                          ...card,
                          imageId,
                          syncStatus: 'notion',
                        };
                        await saveCardToDB(updatedCard);
                        setCards((prev) => prev.map((c) => (c.id === card.id ? updatedCard : c)));
                      }
                    } else {
                      try {
                        const { imageId, downloadUrl } = await uploadImageAsset(card.imageUrl, card.id);
                        const updatedCard: BusinessCardData = {
                          ...card,
                          imageUrl: downloadUrl,
                          imageId,
                          syncStatus: 'notion',
                        };
                        await saveCardToDB(updatedCard);
                        setCards((prev) => prev.map((c) => (c.id === card.id ? updatedCard : c)));
                        await fetch('/api/notion/save', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(updatedCard),
                        });
                      } catch (e) {
                        console.error('Migration to ImageService failed in background', e);
                      }
                    }
                  }
                })
              );
              await new Promise((resolve) => setTimeout(resolve, 250));
            }
          })();

          loadedCount += json.data.length;
          setNotionProgress({ loaded: loadedCount, total: null });
          allNewCards = [...allNewCards, ...json.data];
          hasMore = json.has_more;
          nextCursor = json.next_cursor;
        } else {
          throw new Error(json.error);
        }
      }

      const loadedIds = new Set(allNewCards.map((c) => c.id));
      const staleCards = cards.filter((c) => c.syncStatus === 'notion' && !loadedIds.has(c.id));

      if (staleCards.length > 0) {
        await deleteCardsFromDB(staleCards.map((c) => c.id));
      }

      if (formData && staleCards.some((c) => c.id === formData.id)) {
        setSelectedCardId(null);
        setFormData(null);
      }

      setCards((prev) => {
        const unsyncedCards = prev.filter((c) => c.syncStatus !== 'notion');
        const merged = [...allNewCards, ...unsyncedCards];
        return merged.sort((a, b) => b.scannedAt - a.scannedAt);
      });

      addToast({ type: 'success', message: `成功從 Notion 載入 ${loadedCount} 筆名片` });
    } catch (e: any) {
      addToast({ type: 'error', message: 'Notion 載入失敗：' + e.message });
    } finally {
      setIsNotionLoading(false);
      setNotionProgress({ loaded: 0, total: null });
    }
  };

  const handleSaveToNotion = async (targetCard?: BusinessCardData) => {
    const activeCard = targetCard || formData;
    if (!activeCard) return;
    const oldImageId = activeCard.imageId;
    const oldBackImageId = activeCard.backImageId;
    setIsNotionLoading(true);
    try {
      const cardToSync = await ensureFirebaseImage(activeCard);
      const isAlreadyNotion = cardToSync.syncStatus === 'notion' && cardToSync.id.replace(/-/g, '').length >= 32;
      const res = await fetch('/api/notion/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cardToSync,
          notionPageId: isAlreadyNotion ? cardToSync.id : undefined,
          oldImageId,
          oldBackImageId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        addToast({ type: 'success', message: isAlreadyNotion ? '已同步更新至 Notion' : '成功新增至 Notion' });
        const oldId = cardToSync.id;
        const newId = json.notionId || oldId;
        const updatedCard: BusinessCardData = {
          ...cardToSync,
          id: newId,
          syncStatus: 'notion',
          syncedToNotion: true,
          notionUnsyncedChanges: false,
        };

        if (newId !== oldId) {
          await saveCardToDB(updatedCard);
          await deleteCardFromDB(oldId);
        } else {
          await saveCardToDB(updatedCard);
        }

        setCards((prev) => prev.map((c) => (c.id === oldId ? updatedCard : c)));
        if (formData?.id === oldId) {
          setFormData(updatedCard);
          setSelectedCardId(newId);
        }
      } else {
        throw new Error(json.error);
      }
    } catch (e: any) {
      addToast({ type: 'error', message: '同步至 Notion 失敗：' + e.message });
    } finally {
      setIsNotionLoading(false);
    }
  };

  const handleSyncAllToNotion = async () => {
    const unsyncedCards = cards.filter(
      (c) => c.syncStatus !== 'notion' || c.notionUnsyncedChanges
    );
    if (unsyncedCards.length === 0) {
      addToast({ type: 'info', message: '所有名片皆與 Notion 保持最新同步狀態' });
      return;
    }

    const ok = await confirm({
      title: '批次同步至 Notion',
      message: `即將同步 ${unsyncedCards.length} 筆待更新或尚未上傳的名片至 Notion 資料庫，確定要開始同步嗎？`,
      confirmLabel: '開始同步',
      variant: 'primary',
    });
    if (!ok) return;

    setIsSyncingAll(true);
    setSyncProgress({ current: 0, total: unsyncedCards.length });
    let successCount = 0;
    let completedCount = 0;

    try {
      const CONCURRENCY = 3;
      let cursorIndex = 0;

      const worker = async () => {
        while (cursorIndex < unsyncedCards.length) {
          const idx = cursorIndex++;
          const cardMeta = unsyncedCards[idx];
          try {
            const card = await getCardById(cardMeta.id);
            if (card) {
              const oldImageId = card.imageId;
              const oldBackImageId = card.backImageId;
              const cardToSync = await ensureFirebaseImage(card);
              const isAlreadyNotion =
                cardToSync.syncStatus === 'notion' &&
                cardToSync.id.replace(/-/g, '').length >= 32;

              const res = await fetch('/api/notion/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...cardToSync,
                  notionPageId: isAlreadyNotion ? cardToSync.id : undefined,
                  oldImageId,
                  oldBackImageId,
                }),
              });
              const json = await res.json();
              if (json.success) {
                const oldId = cardToSync.id;
                const newId = json.notionId || oldId;
                const updatedCard: BusinessCardData = {
                  ...cardToSync,
                  id: newId,
                  syncStatus: 'notion',
                  syncedToNotion: true,
                  notionUnsyncedChanges: false,
                };

                if (newId !== oldId) {
                  await saveCardToDB(updatedCard);
                  await deleteCardFromDB(oldId);
                } else {
                  await saveCardToDB(updatedCard);
                }

                setCards((prev) => prev.map((c) => (c.id === oldId ? updatedCard : c)));
                setFormData((prev) => (prev && prev.id === oldId ? updatedCard : prev));
                successCount++;
              }
            }
          } catch (innerE) {
            console.error(`Failed to sync card ${cardMeta.id}:`, innerE);
          } finally {
            completedCount++;
            setSyncProgress({ current: completedCount, total: unsyncedCards.length });
            await new Promise((r) => setTimeout(r, 180));
          }
        }
      };

      const workers = Array.from(
        { length: Math.min(CONCURRENCY, unsyncedCards.length) },
        () => worker()
      );
      await Promise.all(workers);

      addToast({ type: 'success', message: `批次同步完成：成功同步 ${successCount} 筆名片` });
    } catch (e: any) {
      addToast({ type: 'error', message: '同步過程發生錯誤：' + e.message });
    } finally {
      setIsSyncingAll(false);
      setSyncProgress(null);
    }
  };

  return {
    isNotionLoading,
    isSyncingAll,
    notionProgress,
    syncProgress,
    handleLoadFromNotion,
    handleSaveToNotion,
    handleSyncAllToNotion,
    deleteFromNotion,
  };
};
