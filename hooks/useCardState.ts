import { useState, useEffect, useRef, useCallback } from 'react';
import { BusinessCardData, ProcessingTask, SaveStatus } from '../types';
import {
  getCardsMetadataFromDB,
  getCardById,
  saveCardToDB,
  saveAllCardsToDB,
} from '../services/dbService';
import { normalizeCountry } from '../utils/countries';
import {
  DEFAULT_CARD_SOURCE,
  inferCountryFromCard,
  auditCardQsCategory,
  stripQsAuditNotes,
} from '../utils/qsValidation';

const FGU_MIGRATION_KEY = 'ecoscan_fgu_qs_migrated_v2';
const UPRIGHT_MIGRATION_KEY = 'ecoscan_auto_upright_migrated_v2';

export const useCardState = () => {
  const [cards, setCards] = useState<BusinessCardData[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BusinessCardData | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [tasks, setTasks] = useState<ProcessingTask[]>([]);

  const cardsRef = useRef<BusinessCardData[]>([]);
  const pendingSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCardRef = useRef<BusinessCardData | null>(null);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  const loadCards = useCallback(async () => {
    let data = await getCardsMetadataFromDB();

    if (data.length > 0) {
      const alreadyMigratedFgu = localStorage.getItem(FGU_MIGRATION_KEY) === 'true';
      const modifiedForDb: BusinessCardData[] = [];

      data = data.map((card) => {
        let changed = false;
        let next = { ...card };

        // Ensure all existing cards adopt FO GUANG UNIVERSITY on migration, and fill empty/EcoScan sources thereafter
        if (!alreadyMigratedFgu ? next.source !== DEFAULT_CARD_SOURCE : !next.source || next.source === 'EcoScan') {
          next.source = DEFAULT_CARD_SOURCE;
          changed = true;
        }

        const inferredCtry = inferCountryFromCard(next);
        if (inferredCtry && inferredCtry !== next.country) {
          next.country = inferredCtry;
          changed = true;
        }

        if (!alreadyMigratedFgu) {
          const audit = auditCardQsCategory(next);
          if (audit.hasError && audit.suggestedCategory !== next.category) {
            next.category = audit.suggestedCategory;
            changed = true;
          }
        }

        if (next.reasoning && next.reasoning.includes('[QS 分類健檢修正')) {
          next.reasoning = stripQsAuditNotes(next.reasoning);
          changed = true;
        }

        if (changed) {
          modifiedForDb.push(next);
        }
        return next;
      });

      if (modifiedForDb.length > 0) {
        await saveAllCardsToDB(modifiedForDb);
      }
      if (!alreadyMigratedFgu) {
        localStorage.setItem(FGU_MIGRATION_KEY, 'true');
      }
    }

    const sorted = data.sort((a, b) => b.scannedAt - a.scannedAt);
    setCards(sorted);

    // Run one-time background auto-upright for existing local IndexedDB cards if not yet uprighted
    if (sorted.length > 0 && localStorage.getItem(UPRIGHT_MIGRATION_KEY) !== 'true') {
      const candidates = sorted.filter((c) => c.imageUrl);
      if (candidates.length > 0) {
        (async () => {
          try {
            const CHUNK = 60;
            const changedMap = new Map<string, { rotation: number; backRotation?: number }>();
            for (let i = 0; i < candidates.length; i += CHUNK) {
              const slice = candidates.slice(i, i + CHUNK).map((c) => ({
                id: c.id,
                imageUrl: c.imageUrl,
                backImageUrl: c.backImageUrl,
                rotation: c.rotation || 0,
                backRotation: c.backRotation || 0,
              }));
              const res = await fetch('/api/cards/auto-upright', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cards: slice }),
              });
              const json = await res.json();
              if (json.success && Array.isArray(json.updates)) {
                for (const u of json.updates) {
                  if (u.changed) {
                    changedMap.set(u.id, { rotation: u.rotation, backRotation: u.backRotation });
                  }
                }
              }
            }

            if (changedMap.size > 0) {
              const updatedRecords: BusinessCardData[] = [];
              for (const [id, rotInfo] of changedMap.entries()) {
                const full = await getCardById(id);
                if (full) {
                  updatedRecords.push({
                    ...full,
                    rotation: rotInfo.rotation,
                    backRotation:
                      rotInfo.backRotation !== undefined ? rotInfo.backRotation : full.backRotation,
                  });
                }
              }
              if (updatedRecords.length > 0) {
                await saveAllCardsToDB(updatedRecords);
              }
              setCards((prev) =>
                prev.map((c) => {
                  const r = changedMap.get(c.id);
                  if (!r) return c;
                  return {
                    ...c,
                    rotation: r.rotation,
                    backRotation: r.backRotation !== undefined ? r.backRotation : c.backRotation,
                  };
                })
              );
              setFormData((prev) => {
                if (!prev) return prev;
                const r = changedMap.get(prev.id);
                if (!r) return prev;
                return {
                  ...prev,
                  rotation: r.rotation,
                  backRotation: r.backRotation !== undefined ? r.backRotation : prev.backRotation,
                };
              });
            }
            localStorage.setItem(UPRIGHT_MIGRATION_KEY, 'true');
          } catch (err) {
            console.error('Background auto-upright check failed:', err);
          }
        })();
      }
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const persistCardNow = useCallback(async (cardToSave: BusinessCardData) => {
    try {
      setSaveStatus('saving');
      const normalizedCard: BusinessCardData = {
        ...cardToSave,
        country: cardToSave.country ? normalizeCountry(cardToSave.country) : '',
        translations: cardToSave.translations
          ? {
              ...cardToSave.translations,
              country: cardToSave.translations.country
                ? normalizeCountry(cardToSave.translations.country)
                : '',
            }
          : cardToSave.translations,
        notionUnsyncedChanges:
          cardToSave.syncStatus === 'notion' ? true : cardToSave.notionUnsyncedChanges,
      };
      await saveCardToDB(normalizedCard);
      setCards((prev) => prev.map((c) => (c.id === normalizedCard.id ? normalizedCard : c)));
      setFormData((prev) => (prev && prev.id === normalizedCard.id ? normalizedCard : prev));
      setIsFormDirty(false);
      setSaveStatus('saved');
      return normalizedCard;
    } catch (e) {
      console.error('Auto-save failed:', e);
      setSaveStatus('error');
      return cardToSave;
    }
  }, []);

  const flushPendingSave = useCallback(async () => {
    if (pendingSaveTimerRef.current) {
      clearTimeout(pendingSaveTimerRef.current);
      pendingSaveTimerRef.current = null;
    }
    if (pendingCardRef.current) {
      const card = pendingCardRef.current;
      pendingCardRef.current = null;
      await persistCardNow(card);
    }
  }, [persistCardNow]);

  const scheduleAutoSave = useCallback(
    (nextCard: BusinessCardData) => {
      setFormData(nextCard);
      setIsFormDirty(true);
      setSaveStatus('saving');
      pendingCardRef.current = nextCard;

      if (pendingSaveTimerRef.current) {
        clearTimeout(pendingSaveTimerRef.current);
      }
      pendingSaveTimerRef.current = setTimeout(() => {
        pendingSaveTimerRef.current = null;
        const target = pendingCardRef.current;
        pendingCardRef.current = null;
        if (target) {
          persistCardNow(target);
        }
      }, 600);
    },
    [persistCardNow]
  );

  useEffect(() => {
    return () => {
      if (pendingSaveTimerRef.current) {
        clearTimeout(pendingSaveTimerRef.current);
      }
    };
  }, []);

  const selectCard = useCallback(
    async (id: string | null) => {
      await flushPendingSave();
      setSelectedCardId(id);
      if (id) {
        const data = await getCardById(id);
        if (data) {
          setFormData(data);
          setIsFormDirty(false);
          setSaveStatus('idle');
        }
      } else {
        setFormData(null);
        setIsFormDirty(false);
        setSaveStatus('idle');
      }
    },
    [flushPendingSave]
  );

  const updateCardInList = useCallback((updatedCard: BusinessCardData) => {
    setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
  }, []);

  const removeCardFromList = useCallback((id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addCardToList = useCallback((newCard: BusinessCardData) => {
    setCards((prev) => [newCard, ...prev].sort((a, b) => b.scannedAt - a.scannedAt));
  }, []);

  return {
    cards,
    setCards,
    cardsRef,
    selectedCardId,
    setSelectedCardId,
    selectCard,
    formData,
    setFormData,
    isFormDirty,
    setIsFormDirty,
    saveStatus,
    setSaveStatus,
    scheduleAutoSave,
    flushPendingSave,
    persistCardNow,
    tasks,
    setTasks,
    loadCards,
    updateCardInList,
    removeCardFromList,
    addCardToList,
  };
};
