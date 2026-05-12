import React, { useState, useEffect } from 'react';
import { Search, Filter, Clock, ChefHat, Globe, X, ChevronRight, Play, Zap, Heart, Sparkles, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';
import { Volume2, Scale, Printer, Languages } from 'lucide-react';

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

  const [reviews, setReviews] = useState([]);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [sharing, setSharing] = useState(false);

  const [mealPlans, setMealPlans] = useState([]);
  const [showMealPlanner, setShowMealPlanner] = useState(false);
  const [activeTab, setActiveTab] = useState('Explorer'); // Explorer, MealPlanner, Map

  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'bot', text: 'Hello Chef! How can I assist your culinary journey today?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const [isMetric, setIsMetric] = useState(true);
  const [activeLanguage, setActiveLanguage] = useState('English');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [userXP, setUserXP] = useState(() => Number(localStorage.getItem('culina-xp')) || 0);
  const [pulseMessages, setPulseMessages] = useState([
    "Chef in Italy just saved 'Japanese Masterpiece'",
    "Smoothie craze hitting Lagos right now!",
    "New Recipe Trend: Modern Fusion Desserts",
    "Someone just reached 'Executive Chef' rank!"
  ]);

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

  const fetchReviews = async (recipeId) => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles:user_id(email)')
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false });
    
    if (data) setReviews(data);
  };

  const submitReview = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const { error } = await supabase.from('reviews').insert({
      user_id: user.id,
      recipe_id: selectedRecipe.id,
      rating: userRating,
      comment: userComment
    });

    if (!error) {
      fetchReviews(selectedRecipe.id);
      setUserComment('');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d4af37', '#ffffff']
      });
    }
  };

  const shareRecipe = async () => {
    const node = document.getElementById('recipe-card-content');
    if (!node) return;

    setSharing(true);
    try {
      const dataUrl = await toPng(node, { quality: 0.95, backgroundColor: '#050505' });
      const link = document.createElement('a');
      link.download = `CulinaWorld-${selectedRecipe.title}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error sharing recipe:', err);
    }
    setSharing(false);
  };

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const toggleUnits = (ingredient) => {
    if (isMetric) return ingredient;
    // Simple conversion logic for demo
    return ingredient.replace(/(\d+)g/g, (m, g) => `${Math.round(g * 0.035)}oz`)
                     .replace(/(\d+)ml/g, (m, ml) => `${Math.round(ml * 0.034)}fl oz`);
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (selectedRecipe) fetchReviews(selectedRecipe.id);
  }, [selectedRecipe]);

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
      let query = supabase
        .from('recipes')
        .select('*', { count: 'exact' });

      // Filtering
      if (activeCategory !== 'All') query = query.eq('category', activeCategory);
      if (activeOrigin !== 'All') query = query.eq('origin', activeOrigin);
      if (activeContinent !== 'All') query = query.eq('continent', activeContinent);
      if (search) query = query.ilike('title', `%${search}%`);

      // Pagination
      const from = (pageNum - 1) * 24;
      const to = from + 23;
      
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (reset) {
        setRecipes(data);
      } else {
        setRecipes(prev => [...prev, ...data]);
      }

      setTotalCount(count);
      setHasMore(data.length === 24);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setLoading(false);
    }
  };

  const surpriseMe = async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('id')
      .limit(100); // Random sample
    
    if (data && data.length > 0) {
      const randomId = data[Math.floor(Math.random() * data.length)].id;
      const { data: recipe } = await supabase.from('recipes').select('*').eq('id', randomId).single();
      setSelectedRecipe(recipe);
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

      {/* Global Pulse Feed */}
      <div className="pulse-ticker bg-amber-500 text-black py-2 overflow-hidden whitespace-nowrap border-b border-black/10">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="inline-block"
        >
          {[...pulseMessages, ...pulseMessages].map((msg, i) => (
            <span key={i} className="mx-16 text-[9px] font-black uppercase tracking-[0.3em]">
              ⚡ {msg}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Floating Navbar */}
      <nav className="nav-floating glass px-12 py-5 hidden md:flex items-center justify-between border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <ChefHat className="text-black" size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter serif leading-none">CULINA<span className="text-amber-500">WORLD</span></span>
            <span className="text-[8px] font-black uppercase tracking-widest text-amber-500/50 mt-1">Level {Math.floor(userXP / 100) + 1} Chef</span>
          </div>
        </div>
        <div className="flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
          <button 
            onClick={() => { setActiveTab('Explorer'); setShowMealPlanner(false); }}
            className={`transition-colors ${activeTab === 'Explorer' ? 'text-amber-500' : 'hover:text-white'}`}
          >
            Explorer
          </button>
          <button 
            onClick={() => { setActiveTab('MealPlanner'); setShowMealPlanner(true); }}
            className={`transition-colors ${activeTab === 'MealPlanner' ? 'text-amber-500' : 'hover:text-white'}`}
          >
            Meal Planner
          </button>
          <button 
            onClick={() => { setActiveTab('Map'); }}
            className={`transition-colors ${activeTab === 'Map' ? 'text-amber-500' : 'hover:text-white'}`}
          >
            Culinary Map
          </button>
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
      <section className="pt-72 pb-32 container">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="z-10"
            >
              <span className="editorial-tag">Global Gastronomy Repository</span>
              <h1 className="text-8xl md:text-[12rem] font-black mb-8 leading-[0.85] serif">
                Taste the <br />
                <span className="gradient-text italic font-black">Infinite.</span>
              </h1>
              <p className="text-slate-500 text-2xl mb-16 max-w-xl leading-relaxed serif italic">
                A curated archive of {totalCount.toLocaleString()} intercontinental masterpieces. From the spiced kitchens of Africa to the modern mixology of the West.
              </p>

            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative flex-1 w-full group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" size={20} />
                <input 
                  type="text"
                  placeholder={`Search ${totalCount.toLocaleString()} global recipes...`}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-16 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all text-lg backdrop-blur-md"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <button 
                  onClick={surpriseMe}
                  className="btn-luxury rounded-2xl whitespace-nowrap flex-1 md:flex-initial"
                >
                  <Zap size={20} />
                  Surprise Me
                </button>
                <div className="flex glass rounded-2xl p-1 gap-1 border-white/5">
                  {['EN', 'ES', 'FR'].map(lang => (
                    <button 
                      key={lang}
                      onClick={() => setActiveLanguage(lang)}
                      className={`w-12 h-12 rounded-xl text-[10px] font-black transition-all ${activeLanguage === lang ? 'bg-amber-500 text-black' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20"
        >
          <AnimatePresence mode='popLayout'>
            {recipes.map((recipe, idx) => (
              <motion.div
                key={recipe.id}
                layout
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
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
              id="recipe-card-content"
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
                      <div className="flex gap-4">
                        <button 
                          onClick={handlePrint}
                          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-full flex items-center gap-2"
                        >
                          <Printer size={14} /> Print
                        </button>
                        <button 
                          onClick={() => setIsMetric(!isMetric)}
                          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-full flex items-center gap-2"
                        >
                          <Scale size={14} /> {isMetric ? 'Metric' : 'Imperial'}
                        </button>
                        <button 
                          onClick={() => {
                            if (!user) return setShowAuthModal(true);
                            // Simple logic to add to Monday Breakfast for demo
                            supabase.from('meal_plans').insert({ user_id: user.id, recipe_id: selectedRecipe.id, day: 'Monday', meal_type: 'Breakfast' }).then(() => {
                              alert('Added to your Monday Breakfast!');
                            });
                          }}
                          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-full"
                        >
                          Add to Planner
                        </button>
                        <button 
                          onClick={shareRecipe}
                          disabled={sharing}
                          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-full flex items-center gap-2"
                        >
                          {sharing ? 'Generating...' : 'Share Postcard'}
                        </button>
                        <button 
                          onClick={() => addToShoppingList(selectedRecipe.ingredients)}
                          className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-white transition-colors border border-amber-500/30 px-4 py-2 rounded-full"
                        >
                          Add All to List
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {selectedRecipe.ingredients.map((ing, idx) => (
                        <div key={idx} className="flex items-center gap-4 text-slate-300 group">
                          <div className="w-2 h-2 rounded-full bg-amber-500/50 group-hover:bg-amber-500 transition-colors" />
                          <span className="text-lg">{toggleUnits(ing)}</span>
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
                    <div className="space-y-10 mb-20">
                      {selectedRecipe.method.map((step, idx) => (
                        <div key={idx} className="flex gap-8 group">
                          <span className="flex-shrink-0 text-4xl font-black text-white/10 group-hover:text-amber-500/50 transition-colors serif">
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                          <p className="text-slate-400 text-lg leading-relaxed pt-2 group-hover:text-slate-200 transition-colors">{step}</p>
                        </div>
                      ))}
                    </div>

                    {/* Community Reviews Section */}
                    <div className="border-t border-white/5 pt-16">
                      <h4 className="text-3xl font-black serif mb-10">Chef's Community</h4>
                      
                      {/* Review Form */}
                      <div className="glass p-8 rounded-3xl mb-12 border-amber-500/10">
                        <p className="text-[10px] uppercase tracking-widest text-amber-500 font-black mb-6">Leave a Review</p>
                        <div className="flex gap-2 mb-6">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button 
                              key={star} 
                              onClick={() => setUserRating(star)}
                              className={`p-1 transition-colors ${userRating >= star ? 'text-amber-500' : 'text-slate-700'}`}
                            >
                              <Heart size={20} fill={userRating >= star ? 'currentColor' : 'none'} />
                            </button>
                          ))}
                        </div>
                        <textarea 
                          value={userComment}
                          onChange={(e) => setUserComment(e.target.value)}
                          placeholder="Share your culinary experience..."
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-slate-300 focus:outline-none focus:border-amber-500/30 transition-all mb-6 min-h-[120px]"
                        />
                        <button 
                          onClick={submitReview}
                          className="btn-luxury w-full py-4 rounded-2xl"
                        >
                          Publish Review
                        </button>
                      </div>

                      {/* Review List */}
                      <div className="space-y-8">
                        {reviews.length === 0 ? (
                          <p className="text-slate-500 italic serif">No reviews yet. Be the first to try this masterpiece!</p>
                        ) : (
                          reviews.map(review => (
                            <div key={review.id} className="pb-8 border-b border-white/5 last:border-0">
                              <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Chef Anonymous</span>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <Heart key={star} size={10} className={review.rating >= star ? 'text-amber-500 fill-amber-500' : 'text-slate-800'} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-slate-300 leading-relaxed italic serif">"{review.comment}"</p>
                            </div>
                          ))
                        )}
                      </div>
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

      {/* Meal Planner Overlay */}
      <AnimatePresence>
        {showMealPlanner && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[2500] bg-black p-8 md:p-24 overflow-y-auto"
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-20">
                <div>
                  <h2 className="text-6xl font-black serif mb-4">Your Week</h2>
                  <p className="text-slate-500 uppercase tracking-[0.5em] text-xs">A luxury timeline of global flavors</p>
                </div>
                <button onClick={() => setShowMealPlanner(false)} className="glass p-6 rounded-full hover:bg-white/10 transition-all">
                  <X size={32} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <div key={day} className="glass p-6 rounded-[32px] min-h-[400px] border-white/5">
                    <h3 className="text-lg font-black serif mb-6 border-b border-white/5 pb-4 text-amber-500">{day}</h3>
                    <div className="space-y-4">
                      {['Breakfast', 'Lunch', 'Dinner'].map(type => (
                        <div key={type} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all group">
                          <span className="text-[8px] uppercase tracking-widest text-slate-600 block mb-2">{type}</span>
                          <p className="text-xs font-bold text-slate-400 italic">No recipe planned</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Chef Assistant */}
      <div className="fixed bottom-10 right-10 z-[5000]">
        <AnimatePresence>
          {showAIChat && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass w-[350px] h-[500px] rounded-[32px] mb-6 flex flex-col overflow-hidden border-amber-500/20 shadow-2xl"
            >
              <div className="gradient-primary p-6 flex justify-between items-center">
                <div className="flex items-center gap-3 text-black">
                  <Zap size={20} />
                  <span className="font-black text-xs uppercase tracking-widest">Culina AI</span>
                </div>
                <button onClick={() => setShowAIChat(false)} className="text-black/50 hover:text-black">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user' ? 'bg-amber-500 text-black font-bold' : 'bg-white/5 text-slate-300 border border-white/5'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-white/5">
                <div className="relative">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && setChatMessages([...chatMessages, { role: 'user', text: chatInput }, { role: 'bot', text: 'That sounds delicious! I recommend checking out our Mediterranean collection.' }])}
                    placeholder="Ask your chef..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button 
          onClick={() => setShowAIChat(!showAIChat)}
          className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform text-black"
        >
          <Zap size={28} />
        </button>
      </div>
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
                    <div className="flex gap-4">
                      <button 
                        onClick={() => speak(selectedRecipe.method[currentStep])}
                        className={`p-4 glass rounded-full transition-all ${isSpeaking ? 'text-amber-500 animate-pulse border-amber-500' : 'text-slate-400'}`}
                      >
                        <Volume2 size={24} />
                      </button>
                      <button onClick={() => setIsCookMode(false)} className="glass p-4 rounded-full hover:bg-white/10 transition-all">
                        <X size={24} />
                      </button>
                    </div>
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
                        onClick={() => {
                          setIsCookMode(false);
                          const newXP = userXP + 50;
                          setUserXP(newXP);
                          localStorage.setItem('culina-xp', newXP);
                          confetti({
                            particleCount: 150,
                            spread: 100,
                            origin: { y: 0.6 },
                            colors: ['#d4af37', '#ffffff', '#f59e0b']
                          });
                          alert(`+50 XP! You are now ${Math.floor(newXP / 100) + 1} Level Chef!`);
                        }}
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

      {/* Culinary Map / Analytics Overlay */}
      <AnimatePresence>
        {activeTab === 'Map' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2600] bg-black p-8 md:p-24 overflow-y-auto"
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-20">
                <div>
                  <h2 className="text-6xl font-black serif mb-4">Your World</h2>
                  <p className="text-slate-500 uppercase tracking-[0.5em] text-xs">Tracking your global culinary footprint</p>
                </div>
                <button onClick={() => { setActiveTab('Explorer'); }} className="glass p-6 rounded-full hover:bg-white/10 transition-all">
                  <X size={32} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
                <div className="glass p-12 rounded-[40px] border-amber-500/20 flex flex-col items-center justify-center text-center">
                  <Globe className="text-amber-500 mb-8" size={64} />
                  <h3 className="text-7xl font-black serif mb-4">{Math.round((favorites.length / 5000) * 1000) / 10}%</h3>
                  <p className="text-slate-500 uppercase tracking-widest text-xs">Global Coverage</p>
                </div>
                
                <div className="lg:col-span-2 glass p-12 rounded-[40px] border-white/5">
                  <h4 className="text-2xl font-black serif mb-12">Continental Authority</h4>
                  <div className="space-y-8">
                    {['Africa', 'Asia', 'Europe', 'Americas', 'Oceania'].map(cont => (
                      <div key={cont} className="space-y-3">
                        <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                          <span>{cont}</span>
                          <span className="text-amber-500">Mastery Level: 1</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '20%' }}
                            className="h-full gradient-primary"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="glass p-12 rounded-[40px] border-white/5">
                <h4 className="text-2xl font-black serif mb-8">Culinary Achievements</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {[
                    { icon: <Trophy />, title: 'First Taste', desc: 'Saved your first recipe' },
                    { icon: <Zap />, title: 'Speed Chef', desc: 'Finished 5 quick meals' },
                    { icon: <Globe />, title: 'World Traveler', desc: '3 continents explored' },
                    { icon: <Sparkles />, title: 'Flavor Master', desc: 'Reached 10 favorites' }
                  ].map((ach, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center p-6 bg-white/5 rounded-3xl border border-white/10 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-help">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
                        {ach.icon}
                      </div>
                      <h5 className="font-bold text-sm mb-1">{ach.title}</h5>
                      <p className="text-[10px] text-slate-500">{ach.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        
        @media print {
          nav, footer, .aura-bg, .btn-luxury, .fixed, button { display: none !important; }
          body { background: white !important; color: black !important; cursor: auto !important; }
          .glass { background: transparent !important; border: none !important; }
          .container { max-width: 100% !important; padding: 0 !important; }
          .serif { color: black !important; }
          img { border-radius: 20px !important; }
        }
      `}} />
    </div>
  );
};

export default App;
