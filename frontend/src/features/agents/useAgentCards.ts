import React, { useState, useEffect } from 'react';
import type { AgentId, CardState } from '../../types/index';
import { DEFAULT_CARDS } from '../../data/constants';

export function useAgentCards(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [cards, setCards] = useState<Record<AgentId, CardState>>(DEFAULT_CARDS);
  const [draggingCard, setDraggingCard] = useState<AgentId | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [topZIndex, setTopZIndex] = useState<number>(20);

  const handleStartDrag = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, agentId: AgentId) => {
    e.stopPropagation();
    const nextZ = topZIndex + 1;
    setTopZIndex(nextZ);
    setCards(prev => ({
      ...prev,
      [agentId]: { ...prev[agentId], zIndex: nextZ }
    }));
    setDraggingCard(agentId);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const currentCard = cards[agentId];

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDragOffset({
        x: clientX - (currentCard.x / 100) * rect.width,
        y: clientY - (currentCard.y / 100) * rect.height
      });
    }
  };

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingCard) return;
      e.preventDefault();

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        let newX = ((clientX - dragOffset.x) / rect.width) * 100;
        let newY = ((clientY - dragOffset.y) / rect.height) * 100;

        newX = Math.max(1, Math.min(newX, 79));
        newY = Math.max(10, Math.min(newY, 78));

        setCards(prev => ({
          ...prev,
          [draggingCard]: { ...prev[draggingCard], x: newX, y: newY }
        }));
      }
    };

    const handleGlobalEnd = () => {
      if (draggingCard) setDraggingCard(null);
    };

    if (draggingCard) {
      window.addEventListener('mousemove', handleGlobalMove, { passive: false });
      window.addEventListener('mouseup', handleGlobalEnd);
      window.addEventListener('touchmove', handleGlobalMove, { passive: false });
      window.addEventListener('touchend', handleGlobalEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [draggingCard, dragOffset, containerRef]);

  const toggleAgentCard = (agentId: AgentId) => {
    const nextZ = topZIndex + 1;
    setTopZIndex(nextZ);
    setCards(prev => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        isOpen: !prev[agentId].isOpen,
        zIndex: nextZ
      }
    }));
  };

  const resetCards = () => {
    setCards(DEFAULT_CARDS);
  };

  return {
    cards,
    setCards,
    topZIndex,
    setTopZIndex,
    handleStartDrag,
    toggleAgentCard,
    resetCards
  };
}
