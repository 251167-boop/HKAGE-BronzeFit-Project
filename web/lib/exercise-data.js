export const POSE_ZONE = {
  x: 0.2,
  y: 0,
  width: 0.6,
  height: 1
};

export const REFERENCE_CONNECTIONS = [
  [0, 11],
  [0, 12],
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28]
];

export const EXERCISES = {
  "wall-push-up": {
    id: "wall-push-up",
    title: "Wall Push-Up",
    icon: "🤲",
    position:
      "Standing at arm's length from a wall with palms flat on the surface at shoulder height, then lowering the chest toward the wall.",
    benefits:
      "Builds upper body strength (chest, shoulders, back) in a safe, modified way that is gentler on joints than floor push-ups.",
    demoVideo: "https://www.youtube.com/watch?v=fRoVQMyQsF4",
    modelImage: "/models/wall-push-up.jpeg",
    difficulty: "Beginner",
    duration: "30-60 seconds",
    targetReps: 10,
    targetDuration: 60,
    safetyTips: [
      "Keep your core engaged throughout the movement",
      "Start with a smaller range of motion if needed",
      "Ensure the wall is stable and dry"
    ],
    instructions: [
      "Stand arm's length from a wall",
      "Place palms flat at shoulder height",
      "Lower chest toward wall slowly",
      "Push back to the start position",
      "Keep your core engaged throughout"
    ],
    calibrationTips: [
      "Face the camera from the front",
      "Keep your full body visible",
      "Leave a little space above your head"
    ],
    modelOverlayPose: {
      0: { x: 0.73, y: 0.18 },
      11: { x: 0.63, y: 0.28 },
      12: { x: 0.69, y: 0.29 },
      13: { x: 0.76, y: 0.34 },
      14: { x: 0.83, y: 0.33 },
      15: { x: 0.9, y: 0.35 },
      16: { x: 0.95, y: 0.36 },
      23: { x: 0.56, y: 0.51 },
      24: { x: 0.63, y: 0.52 },
      25: { x: 0.51, y: 0.72 },
      26: { x: 0.67, y: 0.74 },
      27: { x: 0.48, y: 0.94 },
      28: { x: 0.71, y: 0.93 }
    },
    referencePose: {
      0: { x: 0.73, y: 0.18 },
      11: { x: 0.63, y: 0.28 },
      12: { x: 0.69, y: 0.29 },
      13: { x: 0.76, y: 0.34 },
      14: { x: 0.83, y: 0.33 },
      15: { x: 0.9, y: 0.35 },
      16: { x: 0.95, y: 0.36 },
      23: { x: 0.56, y: 0.51 },
      24: { x: 0.63, y: 0.52 },
      25: { x: 0.51, y: 0.72 },
      26: { x: 0.67, y: 0.74 },
      27: { x: 0.48, y: 0.94 },
      28: { x: 0.71, y: 0.93 }
    }
  },
  "standing-lunge": {
    id: "standing-lunge",
    title: "Standing Lunge",
    icon: "🚶",
    position:
      "Standing with one leg forward and one leg back, bending both knees slightly to lower the hips toward the floor.",
    benefits:
      "Strengthens the legs and glutes, contributing to better balance and making daily movements like climbing stairs easier.",
    demoVideo: "https://www.youtube.com/watch?v=U_638geC90o",
    modelImage: "/models/standing-lunge.png",
    difficulty: "Intermediate",
    duration: "30-45 seconds per leg",
    targetReps: 8,
    targetDuration: 45,
    safetyTips: [
      "Keep your front knee behind your toes",
      "Hold onto a chair for balance if needed",
      "Start with shallow lunges and gradually deepen"
    ],
    instructions: [
      "Stand tall with your feet hip-width apart",
      "Step one leg forward and keep one leg back",
      "Lower your hips in a gentle lunge",
      "Keep your front knee stable",
      "Return to standing with control"
    ],
    calibrationTips: [
      "Turn your body slightly sideways to the camera",
      "Keep both feet visible",
      "Make sure your whole body stays in frame"
    ],
    modelOverlayPose: {
      0: { x: 0.67, y: 0.16 },
      11: { x: 0.56, y: 0.28 },
      12: { x: 0.62, y: 0.29 },
      13: { x: 0.65, y: 0.4 },
      14: { x: 0.74, y: 0.38 },
      15: { x: 0.73, y: 0.53 },
      16: { x: 0.81, y: 0.39 },
      23: { x: 0.51, y: 0.53 },
      24: { x: 0.58, y: 0.53 },
      25: { x: 0.43, y: 0.76 },
      26: { x: 0.64, y: 0.69 },
      27: { x: 0.27, y: 0.92 },
      28: { x: 0.82, y: 0.92 }
    },
    referencePose: {
      0: { x: 0.52, y: 0.16 },
      11: { x: 0.46, y: 0.28 },
      12: { x: 0.58, y: 0.29 },
      13: { x: 0.42, y: 0.42 },
      14: { x: 0.65, y: 0.36 },
      15: { x: 0.43, y: 0.56 },
      16: { x: 0.71, y: 0.47 },
      23: { x: 0.46, y: 0.5 },
      24: { x: 0.57, y: 0.52 },
      25: { x: 0.4, y: 0.72 },
      26: { x: 0.64, y: 0.67 },
      27: { x: 0.38, y: 0.93 },
      28: { x: 0.69, y: 0.94 }
    }
  },
  "single-leg-balance": {
    id: "single-leg-balance",
    title: "Single-Leg Balance",
    icon: "⚖️",
    position:
      "Standing on one leg, with the option of holding a chair for support, to improve stability and core strength.",
    benefits:
      "Crucial for fall prevention by training the body to manage balance.",
    demoVideo: "https://www.youtube.com/shorts/9HHXi6T1dAw",
    modelImage: "/models/single-leg-balance.jpeg",
    difficulty: "Beginner",
    duration: "15-30 seconds per leg",
    targetReps: 1,
    targetDuration: 30,
    safetyTips: [
      "Always have a stable support nearby",
      "Start with both feet on the ground, then lift one foot",
      "Focus on a fixed point in front of you"
    ],
    instructions: [
      "Stand tall near a stable support",
      "Lift one foot gently off the floor",
      "Keep your chest lifted and your core braced",
      "Hold the position steadily",
      "Switch legs after the timer if needed"
    ],
    calibrationTips: [
      "Face the camera directly",
      "Leave space around both arms",
      "Keep your feet fully visible"
    ],
    modelOverlayPose: {
      0: { x: 0.5, y: 0.14 },
      11: { x: 0.41, y: 0.28 },
      12: { x: 0.58, y: 0.28 },
      13: { x: 0.27, y: 0.42 },
      14: { x: 0.72, y: 0.34 },
      15: { x: 0.2, y: 0.45 },
      16: { x: 0.91, y: 0.34 },
      23: { x: 0.45, y: 0.49 },
      24: { x: 0.54, y: 0.49 },
      25: { x: 0.47, y: 0.67 },
      26: { x: 0.51, y: 0.61 },
      27: { x: 0.48, y: 0.93 },
      28: { x: 0.51, y: 0.79 }
    },
    referencePose: {
      0: { x: 0.5, y: 0.14 },
      11: { x: 0.43, y: 0.28 },
      12: { x: 0.57, y: 0.28 },
      13: { x: 0.39, y: 0.42 },
      14: { x: 0.61, y: 0.42 },
      15: { x: 0.37, y: 0.58 },
      16: { x: 0.63, y: 0.58 },
      23: { x: 0.45, y: 0.5 },
      24: { x: 0.55, y: 0.5 },
      25: { x: 0.46, y: 0.71 },
      26: { x: 0.61, y: 0.67 },
      27: { x: 0.46, y: 0.93 },
      28: { x: 0.69, y: 0.78 }
    }
  },
  "supine-position": {
    id: "supine-position",
    title: "Lying Supine (On the Back)",
    icon: "🛌",
    position:
      "Lying on a mat or bed with legs straight or knees bent and feet flat on the floor.",
    benefits:
      "Allows for core strengthening and hip flexibility without putting pressure on the spine or lower joints.",
    demoVideo: "https://www.youtube.com/watch?v=L-vQ45G6JYI",
    modelImage: "/models/supine-position.png",
    difficulty: "Beginner",
    duration: "45-90 seconds",
    targetReps: 8,
    targetDuration: 60,
    safetyTips: [
      "Use a comfortable, supportive surface",
      "Keep your spine neutral",
      "Breathe naturally throughout"
    ],
    instructions: [
      "Lie on your back comfortably",
      "Bend your knees and place your feet flat",
      "Keep your shoulders relaxed",
      "Move slowly during each repetition",
      "Return to the resting position with control"
    ],
    calibrationTips: [
      "Place the camera so your whole body is visible",
      "Keep your legs and shoulders inside the frame",
      "Avoid strong backlight behind you"
    ],
    modelOverlayPose: {
      0: { x: 0.18, y: 0.61 },
      11: { x: 0.31, y: 0.59 },
      12: { x: 0.31, y: 0.66 },
      13: { x: 0.44, y: 0.58 },
      14: { x: 0.44, y: 0.67 },
      15: { x: 0.61, y: 0.57 },
      16: { x: 0.61, y: 0.68 },
      23: { x: 0.57, y: 0.6 },
      24: { x: 0.57, y: 0.66 },
      25: { x: 0.81, y: 0.51 },
      26: { x: 0.81, y: 0.42 },
      27: { x: 0.95, y: 0.56 },
      28: { x: 0.95, y: 0.71 }
    },
    referencePose: {
      0: { x: 0.25, y: 0.42 },
      11: { x: 0.36, y: 0.42 },
      12: { x: 0.36, y: 0.56 },
      13: { x: 0.46, y: 0.38 },
      14: { x: 0.46, y: 0.6 },
      15: { x: 0.58, y: 0.36 },
      16: { x: 0.58, y: 0.63 },
      23: { x: 0.56, y: 0.46 },
      24: { x: 0.56, y: 0.54 },
      25: { x: 0.72, y: 0.41 },
      26: { x: 0.72, y: 0.59 },
      27: { x: 0.88, y: 0.39 },
      28: { x: 0.88, y: 0.61 }
    }
  },
  "half-kneeling": {
    id: "half-kneeling",
    title: "Half-Kneeling or Supported Kneeling",
    icon: "🧘",
    position:
      "Kneeling on the floor (often with a cushion for support) or in a half-kneeling position.",
    benefits:
      "Improves spinal mobility and relieves hip tightness caused by prolonged sitting.",
    demoVideo: "https://www.youtube.com/watch?v=NmUDbTp0E2A",
    modelImage: "/models/half-kneeling.png",
    difficulty: "Intermediate",
    duration: "30-60 seconds per side",
    targetReps: 1,
    targetDuration: 45,
    safetyTips: [
      "Use a cushion or pad under your knees",
      "Keep your back straight",
      "Do not force the stretch"
    ],
    instructions: [
      "Place one knee down on a padded surface",
      "Bring the other foot forward",
      "Lift your chest and stay tall",
      "Shift gently until you feel the stretch",
      "Hold and breathe steadily"
    ],
    calibrationTips: [
      "Angle your body slightly toward the camera",
      "Keep both knees and feet visible",
      "Make sure the camera sees from head to knee level"
    ],
    modelOverlayPose: {
      0: { x: 0.61, y: 0.16 },
      11: { x: 0.52, y: 0.29 },
      12: { x: 0.59, y: 0.3 },
      13: { x: 0.67, y: 0.42 },
      14: { x: 0.73, y: 0.4 },
      15: { x: 0.72, y: 0.53 },
      16: { x: 0.8, y: 0.4 },
      23: { x: 0.49, y: 0.52 },
      24: { x: 0.56, y: 0.53 },
      25: { x: 0.39, y: 0.77 },
      26: { x: 0.64, y: 0.69 },
      27: { x: 0.28, y: 0.94 },
      28: { x: 0.82, y: 0.94 }
    },
    referencePose: {
      0: { x: 0.52, y: 0.16 },
      11: { x: 0.45, y: 0.28 },
      12: { x: 0.57, y: 0.28 },
      13: { x: 0.42, y: 0.42 },
      14: { x: 0.64, y: 0.41 },
      15: { x: 0.41, y: 0.59 },
      16: { x: 0.67, y: 0.58 },
      23: { x: 0.46, y: 0.5 },
      24: { x: 0.56, y: 0.5 },
      25: { x: 0.43, y: 0.76 },
      26: { x: 0.65, y: 0.69 },
      27: { x: 0.4, y: 0.94 },
      28: { x: 0.69, y: 0.94 }
    }
  }
};

export const EXERCISE_LIST = Object.values(EXERCISES);

export function getExerciseById(exerciseId) {
  return EXERCISES[exerciseId] || EXERCISES["wall-push-up"];
}
