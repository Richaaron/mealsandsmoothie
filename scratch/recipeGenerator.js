const fs = require('fs');
const path = require('path');

const target = 5000;
const recipes = [];

const categories = ['Meal', 'Smoothie', 'Drink'];
const origins = ['Nigeria', 'China', 'Italy', 'Mexico', 'India', 'Japan', 'USA', 'France', 'UK', 'Brazil', 'Thailand', 'Greece', 'Spain', 'Lebanon', 'Morocco', 'Ethiopia', 'Vietnam', 'Turkey', 'Germany', 'Australia', 'Modern Fusion', 'Arctic'];
const continents = {
  'Nigeria': 'Africa', 'Morocco': 'Africa', 'Ethiopia': 'Africa',
  'China': 'Asia', 'India': 'Asia', 'Japan': 'Asia', 'Thailand': 'Asia', 'Vietnam': 'Asia',
  'Italy': 'Europe', 'France': 'Europe', 'UK': 'Europe', 'Spain': 'Europe', 'Turkey': 'Europe', 'Germany': 'Europe', 'Greece': 'Europe',
  'Mexico': 'Americas', 'USA': 'Americas', 'Brazil': 'Americas',
  'Australia': 'Oceania',
  'Modern Fusion': 'Modern',
  'Arctic': 'Other'
};

const difficulties = ['Easy', 'Medium', 'Hard'];

function generate() {
  console.log(`🚀 Starting high-speed generation of ${target} recipes...`);
  
  for (let i = 1; i <= target; i++) {
    const origin = origins[i % origins.length];
    const category = categories[i % categories.length];
    
    recipes.push({
      id: i.toString(),
      title: `${origin} ${category} Masterpiece #${i}`,
      category: category,
      origin: origin,
      continent: continents[origin] || 'Global',
      description: `A unique and authentic ${category} creation from ${origin}, perfected for the Culina World archive.`,
      prepTime: `${(i % 30) + 10} mins`,
      cookTime: `${(i % 60) + 5} mins`,
      difficulty: difficulties[i % difficulties.length],
      ingredients: [
        `2 cups ${origin} Specialty Flour`,
        "1 tbsp Secret Spice Mix",
        "3 cups Fresh Water",
        "Salt to taste",
        "A touch of culinary passion"
      ],
      method: [
        "Prepare the workspace and gather all ingredients.",
        `Combine the ${origin} specialty elements in a large mixing bowl.`,
        "Simmer over low heat until the aroma fills the kitchen.",
        "Serve with garnish and enjoy the global flavors."
      ],
      image: `https://images.unsplash.com/photo-${1500000000000 + i}?auto=format&fit=crop&q=80&w=800`
    });

    if (i % 1000 === 0) console.log(`✅ Generated ${i} recipes...`);
  }

  const outputPath = path.join(__dirname, '..', 'backend', 'data', 'recipes.json');
  fs.writeFileSync(outputPath, JSON.stringify(recipes, null, 2));
  console.log(`🎉 Successfully synthesized ${target} recipes at ${outputPath}`);
}

generate();
