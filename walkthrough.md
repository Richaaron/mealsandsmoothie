# Culina World: Massive Global Recipe Repository

Culina World is a high-performance, premium web application that serves as a massive repository for global meals, smoothies, and drinks. It currently hosts over **2,200 unique recipes** from across the globe.

## Key Features
- **Massive Global Repository**: Over 2,200 diverse recipes (1,000 Smoothies, 1,000 Meals, 200 Drinks) from every corner of the world.
- **Smart Search & Pagination**: Real-time search across the entire 2k+ dataset with a smooth "Load More" pagination system.
- **Discovery Tools**: 
    - **Surprise Me**: Instantly discover a random masterpiece from the collection.
    - **Continent Filters**: Group recipes by Africa, Americas, Asia, Europe, Oceania, or Modern.
    - **Favorites**: Heart your favorite recipes to save them for later (stored locally).
- **Immersive Details**: Full ingredients, step-by-step methods, and difficulty ratings.
- **Premium Aesthetics**: High-performance dark mode with glassmorphism and motion transitions.

## Technical Implementation
- **Data Scaling**: Implemented a `recipeGenerator.js` script to programmatically create a diverse, high-quality dataset of 2,200 recipes.
- **Backend Optimization**: Updated Express.js server to support server-side pagination and efficient filtering, ensuring the API stays fast despite the large volume.
- **Frontend Performance**: Implemented a "Load More" pattern in React to prevent browser lag and ensure a smooth scrolling experience.

## How to Run
The servers are currently running in the background:
- **Frontend**: [http://localhost:5173/](http://localhost:5173/)
- **Backend**: [http://localhost:5000/](http://localhost:5000/)

## Recipe Preview (Massive Repository)
| Recipe Type | Count | Sample Origins |
| :--- | :--- | :--- |
| **Meals** | 1,000+ | Nigeria, Japan, Brazil, Italy, Mexico, etc. |
| **Smoothies** | 1,000+ | Modern, Thailand, USA, Kenya, Spain, etc. |
| **Drinks** | 200+ | India, Greece, Vietnam, South Africa, etc. |

---

Developed with ❤️ by Antigravity
