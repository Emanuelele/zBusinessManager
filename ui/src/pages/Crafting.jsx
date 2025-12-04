import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { fetchNui } from '../utils/fetchNui';
import { useNavigate } from 'react-router-dom';
import './Crafting.css';
import QueueItem from './QueueItem';

// Memoized Recipe Item Component
const RecipeItem = memo(({ recipe, isSelected, canCraft, onSelect, getItemImage, getDummyImage }) => (
  <button
    onClick={() => onSelect(recipe)}
    className={`recipe-item group
      ${isSelected ? 'selected' : ''}
      ${!canCraft ? 'disabled' : ''}
    `}
  >
    <div className="item-icon-frame">
      <img 
        src={getItemImage(recipe.id)} 
        alt={recipe.label}
        className="item-icon"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = getDummyImage(recipe.id);
        }}
      />
    </div>
    
    <div className="item-info">
      <div className="item-name">
        {recipe.label.toUpperCase()}
      </div>
      <div className="item-req-count">
        REQ: {recipe.required.length} ITEMS
      </div>
    </div>

    {canCraft ? (
      <div className="status-badge status-ready">READY</div>
    ) : (
      <div className="status-badge status-missing">MISSING</div>
    )}
  </button>
));

export default function Crafting({ businessId }) {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [stock, setStock] = useState([]);
  const [queue, setQueue] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [crafting, setCrafting] = useState(false);

  const [stats, setStats] = useState(null);
  const craftingInProgressRef = useRef(false);
const mountedRef = useRef(true);
  // Pagination state
  const [visibleRecipes, setVisibleRecipes] = useState(20);
  const recipeListRef = useRef(null);

  // Memoize recipe selection to prevent re-creating function on every render
  const handleSelectRecipe = useCallback((recipe) => {
    setSelectedRecipe(recipe);
  }, []);

  useEffect(() => {
  mountedRef.current = true;
  return () => { mountedRef.current = false; };
}, []);
  useEffect(() => {
    loadData();
    loadStats();
  }, [businessId]);

const loadStats = async () => {
  try {
    const result = await fetchNui('zBusinessManager:server:getNPCStats', businessId);
    if (result.success && mountedRef.current) {
      setStats(result.stats);
    }
  } catch (e) {
    if (mountedRef.current) console.error(e);
  } finally {
    if (mountedRef.current) setLoading(false);
  }
};
  // Listen for queue updates from server
  useEffect(() => {
    const handleMessage = (event) => {
      const message = event.data;
      if (message.action === 'updateQueue') {
        setQueue(message.queue);
      } else if (message.action === 'syncStock') {
        setStock(message.stock);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleScroll = () => {
    if (recipeListRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = recipeListRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        setVisibleRecipes(prev => Math.min(prev + 20, recipes.length));
      }
    }
  };

  const loadData = async () => {
    const isDev = import.meta.env.DEV;
    
    if (isDev) {
      // Mock data for dev
      const fakeRecipes = Array.from({ length: 50 }, (_, i) => ({
        id: `item_${i}`,
        label: `ITEM ${i + 1}`,
        required: [{ item: 'material', quantity: 1 }]
      }));
      const fakeStock = { material: 100 };
      const fakeQueue = [
        { item: 'item_1', label: 'ITEM 1', progress: 45, startTime: Date.now() / 1000 - 10, duration: 20 },
      ];
      
      setRecipes(fakeRecipes);
      setStock(fakeStock);
      setQueue(fakeQueue);
      setLoading(false);
      return;
    }
    
    try {
      const [rec, stk, que] = await Promise.all([
        fetchNui('getCraftRecipes', { businessId }),
        fetchNui('getCraftStock', { businessId }),
        fetchNui('getCraftQueue', { businessId })
      ]);

      if (rec.success) setRecipes(rec.recipes);
      if (stk.success) setStock(stk.stock);
      if (que.success) setQueue(que.queue);
    } catch (e) {
      //console.error(e);
    }
    setLoading(false);
  };

  const canCraft = useCallback((recipe) =>
    recipe.required.every(req => (stock[req.item] || 0) >= req.quantity), [stock]);

  const startCraft = async () => {
    if (!selectedRecipe || crafting || craftingInProgressRef.current || ( stats?.queueSize && stats?.queueSize > 0 && queue.length >= stats?.queueSize)) return;
    
    craftingInProgressRef.current = true;
    setCrafting(true);

    try {
      const res = await fetchNui('startCraft', { 
        businessId, 
        itemName: selectedRecipe.id 
      });

      if (res.success) {
        await loadData();
      }
    } catch (e) {
      //console.error(e);
    } finally {
      setTimeout(() => {
        setCrafting(false);
        craftingInProgressRef.current = false;
      }, 300);
    }
  };

  const openStash = () => fetchNui('openCraftStash', { businessId });

  // Helper to get image URL
  const getItemImage = useCallback((itemId) => `https://cfx-nui-ox_inventory/web/build/images/${itemId}.webp`, []);

  // Fallback image generator
  const getDummyImage = useCallback((itemId) => {
    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const hash = itemId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const color = colors[hash % colors.length];
    
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <rect width="64" height="64" fill="${color}" opacity="0.1"/>
        <rect x="16" y="16" width="32" height="32" fill="${color}" opacity="0.8"/>
        <path d="M16 16 L32 8 L48 16 L48 48 L32 56 L16 48 Z" fill="none" stroke="${color}" stroke-width="2"/>
        <text x="32" y="36" font-family="monospace" font-size="10" fill="black" text-anchor="middle" font-weight="bold">
          ${itemId.slice(0, 3).toUpperCase()}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-2xl animate-pulse text-[var(--terminal-green)]">
        INITIALIZING SYSTEM...
        <button 
          onClick={openStash}
          className="btn-stash blink-hover"
        >
          [ APRI MAGAZZINO ]
        </button>
      </div>
    );
  }

  return (
    <div className="crafting-page">
      
      {/* HEADER */}
      <div className="crafting-header">
        <div className="crafting-title">
          <h2 className="glitch-text">CRAFTING.EXE</h2>
          <p>V.1.0.4 // PRODUCTION MODULE</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/npc')}
            className="btn-stash blink-hover"
          >
            [ GESTIONE NPC ]
          </button>
          <button 
            onClick={openStash}
            className="btn-stash blink-hover"
          >
            [ APRI MAGAZZINO ]
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="crafting-main">
        
        {/* LEFT: RECIPE LIST */}
        <div className="recipe-list-container">
          <div className="list-header">
            <span>AVAILABLE_SCHEMATICS</span>
            <span>{recipes.length} FOUND</span>
          </div>
          
          <div 
            className="recipe-list custom-scrollbar"
            ref={recipeListRef}
            onScroll={handleScroll}
          >
            {recipes.slice(0, visibleRecipes).map(recipe => (
              <RecipeItem
                key={recipe.id}
                recipe={recipe}
                isSelected={selectedRecipe?.id === recipe.id}
                canCraft={canCraft(recipe)}
                onSelect={handleSelectRecipe}
                getItemImage={getItemImage}
                getDummyImage={getDummyImage}
              />
            ))}
          </div>
        </div>

        {/* RIGHT: DETAILS & ACTION */}
        <div className="details-column">
          
          {/* DETAILS PANEL */}
          <div className="details-panel">
            {!selectedRecipe ? (
              <div className="empty-state">
                <div className="animate-pulse">
                  &lt; SELEZIONA UNA RICETTA &gt;<br/>
                  PER VEDERE I DETTAGLI
                </div>
              </div>
            ) : (
              <>
                <div className="details-content custom-scrollbar">
                  <h3 className="details-title" style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}} >
                    {selectedRecipe.label}
                    <div className="bg-watermark">
                      {selectedRecipe.id.slice(0, 2).toUpperCase()}
                    </div>
                  </h3>

                  <div className="req-list">
                    <div className="req-header">REQUIRED_COMPONENTS:</div>
                    {selectedRecipe.required.map((req, i) => {
                      const have = stock[req.item] || 0;
                      const ok = have >= req.quantity;
                      
                      return (
                        <div key={i} className="req-item">
                          <span>{req.item.toUpperCase()}</span>
                          <span className={ok ? 'req-ok' : 'req-missing'}>
                            {have} / {req.quantity}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="action-area">
                  <button
                    onClick={startCraft}
                    disabled={!canCraft(selectedRecipe) || crafting || (stats?.queueSize && stats?.queueSize > 0 && queue.length >= stats?.queueSize)}
                    className="btn-craft group"
                  >
                    {crafting ? (
                      <span className="animate-pulse">PROCESSING...</span>
                    ) : (
                      <span>ASSEMBLE</span>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* QUEUE PANEL */}
          <div className="queue-panel">
            <div className="queue-header">
              <span>PRODUCTION_QUEUE</span>
              <span>{queue.length}/{(stats?.queueSize && stats?.queueSize > 0 ? stats?.queueSize : 0)} ACTIVE</span>
            </div>
            
            <div className="queue-list custom-scrollbar">
              {queue.map((item, i) => (
                <QueueItem 
                  key={`${item.item}-${item.startTime}-${i}`} // Unique key
                  item={item}
                  getItemImage={getItemImage}
                  getDummyImage={getDummyImage}
                />
              ))}
              
              {queue.length === 0 && (
                <div className="queue-empty">
                  -- IDLE --
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
