const fs = require('fs');
const path = require('path');

const continentMap = {
  "Nigeria": "Africa", "Ghana": "Africa", "South Africa": "Africa", "Egypt": "Africa", "Morocco": "Africa", "Ethiopia": "Africa", "Kenya": "Africa", "Senegal": "Africa",
  "USA": "Americas", "Canada": "Americas", "Mexico": "Americas", "Brazil": "Americas", "Argentina": "Americas", "Peru": "Americas", "Colombia": "Americas", "Jamaica": "Americas",
  "UK": "Europe", "France": "Europe", "Italy": "Europe", "Spain": "Europe", "Germany": "Europe", "Poland": "Europe", "Sweden": "Europe", "Greece": "Europe", "Russia": "Europe", "Turkey": "Europe", "Switzerland": "Europe", "Belgium": "Europe", "Portugal": "Europe", "Hungary": "Europe",
  "China": "Asia", "Japan": "Asia", "Korea": "Asia", "Thailand": "Asia", "Vietnam": "Asia", "India": "Asia", "Pakistan": "Asia", "Indonesia": "Asia", "Malaysia": "Asia", "Singapore": "Asia", "Lebanon": "Asia", "Israel": "Asia", "Iran": "Asia", "Saudi Arabia": "Asia",
  "Australia": "Oceania", "New Zealand": "Oceania", "Modern": "Modern"
};

const origins = Object.keys(continentMap);

const smoothieBases = ["Coconut Water", "Almond Milk", "Oat Milk", "Greek Yogurt", "Soy Milk", "Whole Milk", "Water", "Orange Juice", "Apple Juice", "Green Tea"];
const smoothieFruits = ["Mango", "Pineapple", "Strawberry", "Blueberry", "Raspberry", "Banana", "Kiwi", "Dragon Fruit", "Peach", "Açaí", "Papaya", "Lychee", "Watermelon", "Apple", "Pear"];
const smoothieGreens = ["Spinach", "Kale", "Swiss Chard", "Mint", "Basil", "Cucumber", "Avocado", "Wheatgrass", "Spirulina"];
const smoothieBoosters = ["Chia Seeds", "Flax Seeds", "Hemp Seeds", "Protein Powder", "Honey", "Agave", "Maple Syrup", "Ginger", "Turmeric", "Matcha", "Cocoa Powder", "Dates", "Bee Pollen"];

const mealProteins = ["Chicken", "Beef", "Pork", "Lamb", "Shrimp", "Salmon", "Tuna", "Cod", "Tofu", "Lentils", "Chickpeas", "Beans", "Eggs"];
const mealCarbs = ["Rice", "Pasta", "Quinoa", "Couscous", "Potatoes", "Sweet Potatoes", "Yam", "Plantain", "Noodles", "Bread", "Bulgur", "Polenta"];
const mealVeggies = ["Bell Peppers", "Onions", "Garlic", "Spinach", "Carrots", "Broccoli", "Cauliflower", "Zucchini", "Eggplant", "Tomatoes", "Mushrooms", "Kale", "Cabbage"];
const mealSpices = ["Cumin", "Coriander", "Turmeric", "Paprika", "Chili Powder", "Garam Masala", "Ginger", "Thyme", "Oregano", "Rosemary", "Cinnamon", "Allspice", "Nutmeg", "Saffron"];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomMultiple(arr, min, max) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const recipes = [];

// Existing recipes handled carefully (add continent)
const existingPath = path.join(__dirname, '..', 'backend', 'data', 'recipes.json');
let existingCount = 0;
if (fs.existsSync(existingPath)) {
    const data = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
    // We only keep the first 105 "handcrafted" ones for quality, then regenerate the rest
    const handcrafted = data.filter(r => !r.id.includes('-'));
    handcrafted.forEach(r => {
        r.continent = continentMap[r.origin] || "International";
    });
    recipes.push(...handcrafted);
    existingCount = handcrafted.length;
}

console.log("Generating 1000 Smoothies...");
const smoothieTitles = new Set();
while (recipes.filter(r => r.category === "Smoothie").length < 1000) {
  const fruit = getRandom(smoothieFruits);
  const base = getRandom(smoothieBases);
  const greens = getRandom(smoothieGreens);
  const boosters = getRandomMultiple(smoothieBoosters, 1, 3);
  const origin = getRandom(origins);
  
  const title = `${fruit} & ${greens} ${getRandom(["Power", "Glow", "Detox", "Energy", "Blast", "Fusion", "Delight"])} Smoothie`;
  if (smoothieTitles.has(title)) continue;
  smoothieTitles.add(title);

  recipes.push({
    id: `s-${recipes.length}`,
    title: title,
    category: "Smoothie",
    origin: origin,
    continent: continentMap[origin],
    description: `A refreshing ${title.toLowerCase()} made with fresh ${fruit.toLowerCase()} and ${greens.toLowerCase()}, boosted with ${boosters.join(", ").toLowerCase()}.`,
    prepTime: "5 mins",
    cookTime: "0 mins",
    difficulty: "Easy",
    ingredients: [fruit, greens, base, ...boosters],
    method: [
      `Place the ${fruit.toLowerCase()} and ${greens.toLowerCase()} in a blender.`,
      `Add the ${base.toLowerCase()} and ${boosters.join(" and ").toLowerCase()}.`,
      "Blend on high until completely smooth.",
      "Serve immediately in a chilled glass."
    ],
    image: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? "1610970881699-44a5587cabec" : "1553530666-ba11a7da3888"}?auto=format&fit=crop&q=80&w=800`
  });
}

console.log("Generating 1000 Meals...");
const mealTitles = new Set();
while (recipes.filter(r => r.category === "Meal").length < 1000) {
  const protein = getRandom(mealProteins);
  const carb = getRandom(mealCarbs);
  const veggie = getRandom(mealVeggies);
  const spices = getRandomMultiple(mealSpices, 2, 4);
  const origin = getRandom(origins);
  
  const title = `${origin} ${protein} with ${carb} & ${veggie}`;
  if (mealTitles.has(title)) continue;
  mealTitles.add(title);

  recipes.push({
    id: `m-${recipes.length}`,
    title: title,
    category: "Meal",
    origin: origin,
    continent: continentMap[origin],
    description: `A traditional-style ${origin} dish featuring succulent ${protein.toLowerCase()} paired with ${carb.toLowerCase()} and fresh ${veggie.toLowerCase()}, seasoned with ${spices.join(" and ").toLowerCase()}.`,
    prepTime: `${Math.floor(Math.random() * 20) + 10} mins`,
    cookTime: `${Math.floor(Math.random() * 40) + 15} mins`,
    difficulty: getRandom(["Easy", "Intermediate", "Hard"]),
    ingredients: [protein, carb, veggie, ...spices, "Olive oil", "Salt and pepper"],
    method: [
      `Sauté the ${protein.toLowerCase()} in a pan with olive oil until browned.`,
      `Add the ${veggie.toLowerCase()} and ${spices.join(", ").toLowerCase()}.`,
      `Prepare the ${carb.toLowerCase()} according to package instructions.`,
      `Combine and simmer for 10 minutes to let flavors meld.`,
      "Serve hot and garnish with fresh herbs."
    ],
    image: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? "1547592166-23ac45744acd" : "1512058564366-18510be2db19"}?auto=format&fit=crop&q=80&w=800`
  });
}

console.log("Generating 200 Drinks...");
while (recipes.filter(r => r.category === "Drink").length < 200) {
  const origin = getRandom(origins);
  recipes.push({
    id: `d-${recipes.length}`,
    title: `${origin} Custom Infusion #${recipes.length}`,
    category: "Drink",
    origin: origin,
    continent: continentMap[origin],
    description: `A unique ${origin} inspired beverage infusion.`,
    prepTime: "5 mins",
    cookTime: "5 mins",
    difficulty: "Easy",
    ingredients: ["Water", "Fresh Fruit", "Local Spices", "Sweetener"],
    method: ["Boil water with spices.", "Add fruit and steep.", "Serve hot or cold."],
    image: "https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&q=80&w=800"
  });
}

const finalData = JSON.stringify(recipes, null, 2);
fs.writeFileSync(existingPath, finalData);
console.log(`Done! Total recipes: ${recipes.length}`);
