// src/initialDares.js
const initialDares = [
    // --- EASY DARES (3 Dares, 5 Points Each) ---
    {
        title: "Compliment a Stranger",
        description: "Give a genuine, specific compliment to a complete stranger today.",
        points: 5,
        difficulty: "Easy",
        tags: ["Social", "Positive"],
        proof_required: false,
    },
    {
        title: "Eat a Veggie",
        description: "Eat a vegetable you haven't had in the last week. No excuses!",
        points: 5,
        difficulty: "Easy",
        tags: ["Health", "Food"],
        proof_required: false,
    },
    {
        title: "5-Minute Plank Challenge",
        description: "Hold a plank for a total of 5 minutes (can be broken up into multiple sets).",
        points: 5,
        difficulty: "Easy",
        tags: ["Fitness", "Endurance"],
        proof_required: true, // Will require user photo proof
    },
    
    // --- MEDIUM DARES (2 Dares, 15 Points Each) ---
    {
        title: "Learn a Fun Fact",
        description: "Spend 10 minutes researching a topic you know nothing about and teach a friend one fact.",
        points: 15,
        difficulty: "Medium",
        tags: ["Knowledge", "Social"],
        proof_required: false,
    },
    {
        title: "Zero Waste Coffee Run",
        description: "Buy a coffee using only your own reusable mug. No disposable cups!",
        points: 15,
        difficulty: "Medium",
        tags: ["Environment", "Habit"],
        proof_required: true, // Will require a proof photo
    },

    // --- HARD DARES (1 Dare, 30 Points) ---
    {
        title: "Cold Shower Shock",
        description: "Take a full 3-minute cold shower. Completely cold water, no turning it warm!",
        points: 30,
        difficulty: "Hard",
        tags: ["Discomfort", "Mental"],
        proof_required: true, // Will require a proof photo
    },
];

export default initialDares;