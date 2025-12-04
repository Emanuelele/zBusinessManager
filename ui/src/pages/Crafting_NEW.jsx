import { useState, useEffect, useRef } from 'react';
import { fetchNui } from '../utils/fetchNui';

export default function Crafting({ businessId }) {
  const [recipes, setRecipes] = useState([]);
  const [stock, setStock] = useState({});
  const [queue, setQueue] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [crafting, setCrafting] = useState(false);

  const scrollRef = useRef(null);
  const detailScrollRef = useRef(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, [businessId]);

  const loadData = async () => {
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
      console.error(e);
    }
    setLoading(false);
  };

  const canCraft = (recipe) =>
    recipe.required.every(req => (stock[req.item] || 0) >= req.quantity);

  const startCraft = async () => {
    if (!selectedRecipe) return;
    setCrafting(true);

    try {
      const res = await fetchNui('startCraft', { 
        businessId, 
        itemName: selectedRecipe.id 
      });

      if (res.success) loadData();
    } catch (e) {
      console.error(e);
    }

    setCrafting(false);
  };

  const openStash = () => fetchNui('openCraftStash', { businessId });

  if (loading) {
    return <div className="flex items-center justify-center text-2xl animate-pulse">LOADING...</div>;
  }


  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-wider">CRAFTING SYSTEM</h2>
          <p className="text-sm text-green-500">Seleziona una ricetta</p>
        </div>

        <button 
          onClick={openStash}
          className="px-4 py-2 border-2 border-green-400 hover:bg-green-400 hover:text-black font-bold"
        >
          OPEN STORAGE
        </button>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-3 gap-4 min-h-[400px]">

        {/* Left: recipe list */}
        <div className="col-span-2 border-2 border-green-400 flex flex-col">
          <div className="border-b-2 border-green-400 p-3 bg-green-400/10 font-bold">
            RICETTE DISPONIBILI
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {recipes.map(recipe => (
              <button
                key={recipe.id}
                onClick={() => setSelectedRecipe(recipe)}
                className={`w-full p-3 border-2 text-left transition 
                  ${
                    selectedRecipe?.id === recipe.id
                      ? 'border-green-400 bg-green-400/20'
                      : canCraft(recipe)
                        ? 'border-green-600 hover:bg-green-400/10'
                        : 'border-red-600/40 opacity-60'
                  }`}
              >
                <div className="font-bold">{recipe.label}</div>
                <div className="text-xs text-green-500 mt-1">
                  {recipe.required.map((r, i) => (
                    <div key={i}>• {r.item} x{r.quantity}</div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: details */}
        <div className="col-span-1 border-2 border-green-400 flex flex-col">
          <div className="border-b-2 border-green-400 p-3 bg-green-400/10 font-bold">
            DETTAGLI
          </div>

          <div ref={detailScrollRef} className="flex-1 overflow-y-auto p-4">
            {!selectedRecipe ? (
              <p className="text-center text-green-600/40 mt-10">
                Seleziona una ricetta
              </p>
            ) : (
              <div className="space-y-4">

                <h3 className="text-lg font-bold">{selectedRecipe.label}</h3>

                <div>
                  <h5 className="font-bold text-sm mb-2">MATERIALI</h5>
                  <div className="space-y-1">
                    {selectedRecipe.required.map((req, i) => {
                      const have = stock[req.item] || 0;
                      const ok = have >= req.quantity;
                      return (
                        <div 
                          key={i}
                          className="flex justify-between px-2 py-1 border border-green-600/40"
                        >
                          <span>{req.item}</span>
                          <span className={ok ? "text-green-400" : "text-red-500"}>
                            {have}/{req.quantity}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={startCraft}
                  disabled={!canCraft(selectedRecipe) || crafting}
                  className="w-full py-2.5 border-2 border-green-400 font-bold
                    hover:bg-green-400 hover:text-black disabled:opacity-40"
                >
                  {crafting ? "LAVORAZIONE..." : "AVVIA CRAFT"}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <div className="border-2 border-yellow-400">
          <div className="border-b-2 border-yellow-400 p-3 bg-yellow-400/10 font-bold">
            CODA DI CRAFTING
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {queue.map((item, i) => (
              <div key={i} className="p-2 bg-yellow-400/10 border border-yellow-400/50">
                <span>{item.label}</span>
                <span className="float-right text-yellow-400">⏳</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
