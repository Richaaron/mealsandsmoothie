import React, { useState, useEffect } from 'react';
import { Search, Filter, Clock, ChefHat, Globe, X, ChevronRight, Play, Zap, Heart, Sparkles, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';

const App = () => {
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [origins, setOrigins] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeOrigin, setActiveOrigin] = useState('All');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [activeContinent, setActiveContinent] = useState('All');
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('culina-favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [shoppingList, setShoppingList] = useState(() => {
    const saved = localStorage.getItem('culina-shopping-list');
    return saved ? JSON.parse(saved) : [];
  });
  const [showShoppingList, setShowShoppingList] = useState(false);

  const [isCookMode, setIsCookMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserData(session.user.id);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setFavorites([]);
        setShoppingList([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId) => {
    const [favs, list] = await Promise.all([
      supabase.from('favorites').select('recipe_id').eq('user_id', userId),
      supabase.from('shopping_list').select('item').eq('user_id', userId)
    ]);
    
    if (favs.data) setFavorites(favs.data.map(f => f.recipe_id));
    if (list.data) setShoppingList(list.data.map(l => l.item));
  };

  const handleAuth = async (isSignUp = false) => {
    setAuthLoading(true);
    const { data, error } = isSignUp 
      ? await supabase.auth.signUp({ email: authEmail, password: authPassword })
      : await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    
    if (error) {
      alert(error.message);
    } else {
      setShowAuthModal(false);
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const toggleFavorite = async (e, recipeId) => {
    e.stopPropagation();
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const isFav = favorites.includes(recipeId);
    if (isFav) {
      setFavorites(prev => prev.filter(id => id !== recipeId));
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('recipe_id', recipeId);
    } else {
      setFavorites(prev => [...prev, recipeId]);
      await supabase.from('favorites').insert({ user_id: user.id, recipe_id: recipeId });
    }
  };

  const addToShoppingList = async (ingredients) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    const newItems = ingredients.filter(i => !shoppingList.includes(i));
    setShoppingList(prev => [...new Set([...prev, ...ingredients])]);
    
    if (newItems.length > 0) {
      await supabase.from('shopping_list').insert(
        newItems.map(item => ({ user_id: user.id, item }))
      );
    }
  };

  const removeFromShoppingList = async (item) => {
    setShoppingList(prev => prev.filter(i => i !== item));
    if (user) {
      await supabase.from('shopping_list').delete().eq('user_id', user.id).eq('item', item);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchRecipes(1, true);
  }, [search, activeCategory, activeOrigin, activeContinent]);

  const fetchInitialData = async () => {
    try {
      const [catRes, originRes] = await Promise.all([
        fetch('http://localhost:5000/api/categories'),
        fetch('http://localhost:5000/api/origins')
      ]);
      setCategories(await catRes.json());
      setOrigins(await originRes.json());
    } catch (error) {
      console.error('Error fetching meta data:', error);
    }
  };

  const fetchRecipes = async (pageNum, reset = false) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: pageNum,
        limit: 24,
        category: activeCategory,
        origin: activeOrigin,
        continent: activeContinent,
        search: search
      }).toString();

      const res = await fetch(`http://localhost:5000/api/recipes?${query}`);
      const data = await res.json();

      if (reset) {
        setRecipes(data.recipes);
      } else {
        setRecipes(prev => [...prev, ...data.recipes]);
      }

      setTotalCount(data.total);
      setHasMore(data.page < data.totalPages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setLoading(false);
    }
  };

  const surpriseMe = () => {
    const randomId = recipes[Math.floor(Math.random() * recipes.length)]?.id;
    if (randomId) {
      fetch(`http://localhost:5000/api/recipes/${randomId}`)
        .then(res => res.json())
        .then(data => setSelectedRecipe(data));
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRecipes(nextPage);
  };

  const [initialLoading, setInitialLoading] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    
    // Simulate initial loading for the "WOW" effect
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 2500);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
    };
  }, []);

  if (initialLoading) {
    return (
      <div className="fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="flex flex-col items-center"
        >
          <div className="w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-amber-500/20">
            <ChefHat className="text-black" size={40} />
          </div>
          <h1 className="text-4xl font-black serif tracking-tighter mb-4">
            CULINA<span className="text-amber-500">WORLD</span>
          </h1>
          <div className="w-48 h-[2px] bg-white/10 relative overflow-hidden">
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-amber-500"
            />
          </div>
          <p className="mt-6 text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold">Initializing Global Repository</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen selection:bg-amber-500/30 selection:text-amber-500 cursor-none">
      {/* Custom Cursor */}
      <motion.div 
        className="fixed top-0 left-0 w-8 h-8 border border-amber-500 rounded-full pointer-events-none z-[3000] hidden md:block"
        animate={{ 
          x: mousePos.x - 16, 
          y: mousePos.y - 16,
          scale: loading ? 1.5 : 1
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 250, mass: 0.5 }}
      />
      <motion.div 
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-amber-500 rounded-full pointer-events-none z-[3000] hidden md:block"
        animate={{ 
          x: mousePos.x - 3, 
          y: mousePos.y - 3 
        }}
        transition={{ type: 'spring', damping: 15, stiffness: 500, mass: 0.1 }}
      />

      {/* Background Aura */}
      <div className="aura-bg">
        <div className="aura-blob" />
        <div className="aura-blob aura-blob-2" />
      </div>

      {/* Floating Navbar */}
      <nav className="nav-floating glass px-12 py-5 hidden md:flex items-center justify-between border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <ChefHat className="text-black" size={18} />
          </div>
          <span className="text-xl font-black tracking-tighter serif">CULINA<span className="text-amber-500">WORLD</span></span>
        </div>
        <div className="flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
          <button className="hover:text-white transition-colors">Explorer</button>
          <button 
            onClick={() => setShowShoppingList(true)}
            className="hover:text-white transition-colors flex items-center gap-2"
          >
            Shopping List <div className="w-5 h-5 bg-amber-500 text-black rounded-full flex items-center justify-center text-[10px] font-black">{shoppingList.length}</div>
          </button>
          <button className="hover:text-white transition-colors flex items-center gap-2">
            Favorites <div className="w-5 h-5 bg-amber-500 text-black rounded-full flex items-center justify-center text-[10px] font-black">{favorites.length}</div>
          </button>
          
          {user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-black font-black text-[10px]">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <button onClick={handleSignOut} className="hover:text-red-500 transition-colors">Sign Out</button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-2 rounded-full border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-black transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section - Editorial Style */}
      <section className="pt-48 pb-24 container">
        <div className="hero-editorial">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="editorial-tag">Global Gastronomy Repository</span>
            <h1 className="text-7xl md:text-9xl font-black mb-8 leading-[0.9] serif">
              The Art of <br />
              <span className="gradient-text italic font-medium">Global Flavor.</span>
            </h1>
            <p className="text-slate-400 text-xl mb-12 max-w-lg leading-relaxed">
              Explore a curated archive of {totalCount.toLocaleString()} intercontinental recipes. From the spiced kitchens of Africa to the modern mixology of the West.
            </p>

            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative flex-1 w-full group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" size={20} />
                <input 
                  type="text"
                  placeholder="Search 2,200+ global recipes..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-16 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all text-lg backdrop-blur-md"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button 
                onClick={surpriseMe}
                className="btn-luxury rounded-2xl whitespace-nowrap"
              >
                <Zap size={20} />
                Surprise Me
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="hidden md:block relative"
          >
            <div className="aspect-[4/5] rounded-[40px] overflow-hidden border border-white/10 rotate-3 hover:rotate-0 transition-transform duration-700 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000" 
                alt="Culinary Art"
                className="w-full h-full object-cover scale-110"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 glass p-8 max-w-[200px] -rotate-6 border-amber-500/30">
              <Trophy className="text-amber-500 mb-4" size={32} />
              <p className="text-sm font-bold serif">Award Winning Collections 2026</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters - Luxury Style */}
      <section className="container mb-20">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <span className="text-[10px] uppercase tracking-[0.3em] text-amber-500/60 font-black">Region / Continent</span>
            <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {['All', 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania', 'Modern'].map(continent => (
                <button
                  key={continent}
                  onClick={() => setActiveContinent(continent)}
                  className={`px-8 py-3 rounded-full text-xs font-black tracking-widest uppercase transition-all border ${
                    activeContinent === continent 
                      ? 'bg-amber-500 text-black border-amber-500' 
                      : 'bg-transparent text-slate-500 border-white/10 hover:border-white/30'
                  }`}
                >
                  {continent}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-[10px] uppercase tracking-[0.3em] text-amber-500/60 font-black">Recipe Category</span>
            <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-8 py-3 rounded-full text-xs font-black tracking-widest uppercase transition-all border ${
                    activeCategory === cat 
                      ? 'bg-white text-black border-white' 
                      : 'bg-transparent text-slate-500 border-white/10 hover:border-white/30'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Recipe Grid */}
      <section className="container pb-32">
        <div className="flex justify-between items-end mb-16 border-b border-white/5 pb-8">
          <div>
            <h2 className="text-5xl font-black serif mb-2">Editor's Selection</h2>
            <p className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">Showing {recipes.length} of {totalCount.toLocaleString()} results</p>
          </div>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
        >
          <AnimatePresence mode='popLayout'>
            {recipes.map((recipe, idx) => (
              <motion.div
                key={recipe.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx % 3 * 0.1 }}
                className="luxury-card group cursor-pointer"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <div className="relative h-[400px] overflow-hidden">
                  <img 
                    src={recipe.image} 
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                  
                  <div className="absolute top-6 left-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white ${
                      recipe.category === 'Meal' ? 'gradient-primary' :
                      recipe.category === 'Smoothie' ? 'gradient-smoothie' : 'gradient-drink'
                    }`}>
                      {recipe.category}
                    </span>
                  </div>

                  <button 
                    onClick={(e) => toggleFavorite(e, recipe.id)}
                    className="absolute top-6 right-6 p-3 rounded-full glass hover:bg-white/20 transition-colors z-10"
                  >
                    <Heart 
                      size={20} 
                      className={favorites.includes(recipe.id) ? "fill-red-500 text-red-500" : "text-white"} 
                    />
                  </button>

                  <div className="absolute bottom-8 left-8 right-8">
                    <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest mb-2 block">{recipe.origin}</span>
                    <h3 className="text-3xl font-bold serif text-white mb-2 leading-tight group-hover:text-amber-500 transition-colors">{recipe.title}</h3>
                    <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-2"><Clock size={12} /> {recipe.prepTime}</span>
                      <span className="flex items-center gap-2"><Sparkles size={12} /> {recipe.difficulty}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mt-12">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[400px] rounded-[32px] bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <div className="mt-24 text-center">
            <button
              onClick={loadMore}
              className="btn-luxury rounded-2xl mx-auto"
            >
              Explore More Masterpieces
            </button>
          </div>
        )}
      </section>

      {/* Recipe Modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8"
          >
            <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setSelectedRecipe(null)} />
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="relative w-full max-w-7xl h-full max-h-[90vh] glass overflow-hidden flex flex-col md:flex-row border-white/10"
            >
              <button 
                className="absolute top-8 right-8 z-[10] w-12 h-12 glass flex items-center justify-center hover:bg-white/10 transition-colors rounded-full"
                onClick={() => setSelectedRecipe(null)}
              >
                <X size={24} />
              </button>

              <div className="w-full md:w-[45%] h-full">
                <img 
                  src={selectedRecipe.image} 
                  alt={selectedRecipe.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="w-full md:w-[55%] p-12 md:p-20 overflow-y-auto custom-scrollbar bg-[#050505]">
                <div className="max-w-xl">
                  <span className="text-amber-500 font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">{selectedRecipe.origin} • {selectedRecipe.category}</span>
                  <h2 className="text-5xl md:text-7xl font-black mb-8 leading-[0.9] serif">{selectedRecipe.title}</h2>
                  <p className="text-slate-400 text-xl mb-12 italic serif leading-relaxed">"{selectedRecipe.description}"</p>

                  <div className="grid grid-cols-2 gap-8 mb-16">
                    <div className="border-l-2 border-amber-500/30 pl-6">
                      <span className="text-slate-500 text-[10px] block mb-2 uppercase font-black tracking-widest">Technique</span>
                      <span className="text-xl font-bold">{selectedRecipe.difficulty}</span>
                    </div>
                    <div className="border-l-2 border-amber-500/30 pl-6">
                      <span className="text-slate-500 text-[10px] block mb-2 uppercase font-black tracking-widest">Time</span>
                      <span className="text-xl font-bold">{selectedRecipe.prepTime}</span>
                    </div>
                  </div>

                  <div className="mb-16">
                    <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                      <h4 className="text-2xl font-black serif">Required Elements</h4>
                      <button 
                        onClick={() => addToShoppingList(selectedRecipe.ingredients)}
                        className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-white transition-colors border border-amber-500/30 px-4 py-2 rounded-full"
                      >
                        Add All to List
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {selectedRecipe.ingredients.map((ing, idx) => (
                        <div key={idx} className="flex items-center gap-4 text-slate-300 group">
                          <div className="w-2 h-2 rounded-full bg-amber-500/50 group-hover:bg-amber-500 transition-colors" />
                          <span className="text-lg">{ing}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                      <h4 className="text-2xl font-black serif">The Process</h4>
                      <button 
                        onClick={() => {
                          setIsCookMode(true);
                          setCurrentStep(0);
                        }}
                        className="text-[10px] font-black uppercase tracking-widest bg-amber-500 text-black px-6 py-2 rounded-full hover:scale-105 transition-transform"
                      >
                        Start Cooking Mode
                      </button>
                    </div>
                    <div className="space-y-10">
                      {selectedRecipe.method.map((step, idx) => (
                        <div key={idx} className="flex gap-8 group">
                          <span className="flex-shrink-0 text-4xl font-black text-white/10 group-hover:text-amber-500/50 transition-colors serif">
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                          <p className="text-slate-400 text-lg leading-relaxed pt-2 group-hover:text-slate-200 transition-colors">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="py-24 border-t border-white/5 text-center">
        <div className="container">
          <div className="flex justify-center items-center gap-3 mb-8">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <ChefHat className="text-black" size={16} />
            </div>
            <span className="text-xl font-black tracking-tighter serif">CULINA WORLD</span>
          </div>
          <p className="text-slate-500 text-xs uppercase tracking-[0.5em] mb-4">Crafting global culinary experiences</p>
          <p className="text-slate-700 text-[10px]">© 2026 THE CULINA GROUP. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>

      {/* Shopping List Overlay */}
      <AnimatePresence>
        {showShoppingList && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-0 right-0 z-[2000] w-full max-w-md h-full glass border-l border-white/10 p-8 shadow-2xl overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl font-black serif">Your List</h2>
              <button onClick={() => setShowShoppingList(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            {shoppingList.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-slate-500 italic serif">Your list is currently empty.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {shoppingList.map((item, idx) => (
                  <motion.div 
                    layout
                    key={idx} 
                    className="flex justify-between items-center group p-4 bg-white/5 rounded-2xl border border-white/5"
                  >
                    <span className="text-slate-300">{item}</span>
                    <button 
                      onClick={() => removeFromShoppingList(item)}
                      className="text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={16} />
                    </button>
                  </motion.div>
                ))}
                <button 
                  onClick={() => setShoppingList([])}
                  className="w-full mt-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                >
                  Clear Entire List
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cook Mode Overlay */}
      <AnimatePresence>
        {isCookMode && selectedRecipe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] bg-black flex flex-col"
          >
            {/* Progress Bar */}
            <div className="h-2 w-full bg-white/5">
              <motion.div 
                className="h-full bg-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / selectedRecipe.method.length) * 100}%` }}
              />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-24">
              <div className="max-w-4xl w-full">
                <div className="flex justify-between items-center mb-16">
                  <span className="text-amber-500 font-black uppercase tracking-[0.5em] text-xs">
                    Step {(currentStep + 1).toString().padStart(2, '0')} of {selectedRecipe.method.length.toString().padStart(2, '0')}
                  </span>
                  <button onClick={() => setIsCookMode(false)} className="glass p-4 rounded-full hover:bg-white/10 transition-all">
                    <X size={24} />
                  </button>
                </div>

                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-12"
                >
                  <h3 className="text-4xl md:text-6xl font-black serif leading-tight">
                    {selectedRecipe.method[currentStep]}
                  </h3>
                  
                  <div className="flex items-center gap-6 pt-12 border-t border-white/5">
                    {currentStep > 0 && (
                      <button 
                        onClick={() => setCurrentStep(prev => prev - 1)}
                        className="p-6 glass rounded-full hover:border-amber-500 transition-all"
                      >
                        <ChevronRight size={32} className="rotate-180" />
                      </button>
                    )}
                    
                    {currentStep < selectedRecipe.method.length - 1 ? (
                      <button 
                        onClick={() => setCurrentStep(prev => prev + 1)}
                        className="flex-1 py-8 glass border-amber-500/50 text-white font-black uppercase tracking-[0.5em] text-xl hover:bg-amber-500 hover:text-black transition-all rounded-3xl"
                      >
                        Next Step
                      </button>
                    ) : (
                      <button 
                        onClick={() => setIsCookMode(false)}
                        className="flex-1 py-8 gradient-primary text-black font-black uppercase tracking-[0.5em] text-xl hover:scale-[1.02] transition-all rounded-3xl"
                      >
                        Finish Cooking
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[4000] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowAuthModal(false)} />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative w-full max-w-md glass p-12 border-amber-500/20"
            >
              <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
              
              <div className="text-center mb-10">
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <ChefHat className="text-black" size={32} />
                </div>
                <h2 className="text-3xl font-black serif">Welcome Back</h2>
                <p className="text-slate-500 text-xs uppercase tracking-widest mt-2">To your global culinary portal</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="chef@culinaworld.com" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:outline-none focus:border-amber-500/50 transition-all" 
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:outline-none focus:border-amber-500/50 transition-all" 
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleAuth(false)}
                    disabled={authLoading}
                    className="flex-1 py-5 bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] rounded-xl hover:bg-white/10 transition-all disabled:opacity-50"
                  >
                    {authLoading ? '...' : 'Login'}
                  </button>
                  <button 
                    onClick={() => handleAuth(true)}
                    disabled={authLoading}
                    className="flex-1 py-5 gradient-primary text-black font-black uppercase tracking-[0.2em] rounded-xl hover:scale-[1.02] transition-all disabled:opacity-50"
                  >
                    {authLoading ? '...' : 'Register'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
      `}} />
    </div>
  );
};

export default App;
