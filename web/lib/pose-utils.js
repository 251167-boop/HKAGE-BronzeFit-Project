import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import { POSE_ZONE, REFERENCE_CONNECTIONS } from "./exercise-data";

let poseLandmarkerPromise = null;

const REQUIRED_LANDMARKS = [0, 11, 12, 23, 24, 27, 28];

export async function createPoseLandmarker() {
  if (typeof window === "undefined") return null;

  if (!poseLandmarkerPromise) {
    poseLandmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
      );

      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
    })();
  }

  return poseLandmarkerPromise;
}

export function detectPoseForVideo(poseLandmarker, video, timestamp) {
  if (!poseLandmarker || !video || video.readyState < 2) return null;
  return poseLandmarker.detectForVideo(video, timestamp);
}

export function getPrimaryLandmarks(result) {
  if (!result?.landmarks?.length) return null;
  return result.landmarks[0];
}

export function getCalibrationFeedback(landmarks) {
  if (!landmarks) {
    return {
      positionStatus: "checking",
      message: "Looking for your body. Please step into view."
    };
  }

  const visibleLandmarks = REQUIRED_LANDMARKS.map((index) => landmarks[index]).filter(
    (point) => point && typeof point.x === "number" && typeof point.y === "number"
  );

  if (visibleLandmarks.length < REQUIRED_LANDMARKS.length - 1) {
    return {
      positionStatus: "invalid",
      message: "Make sure your full body is visible."
    };
  }

  const box = getBoundingBox(visibleLandmarks);
  const insideX = box.minX >= POSE_ZONE.x && box.maxX <= POSE_ZONE.x + POSE_ZONE.width;
  const insideY = box.minY >= POSE_ZONE.y && box.maxY <= POSE_ZONE.y + POSE_ZONE.height;

  if (insideX && insideY) {
    return {
      positionStatus: "valid",
      message: "Great. You are inside the blue zone."
    };
  }

  const zoneCenterX = POSE_ZONE.x + POSE_ZONE.width / 2;
  const zoneCenterY = POSE_ZONE.y + POSE_ZONE.height / 2;
  const bodyCenterX = (box.minX + box.maxX) / 2;
  const bodyCenterY = (box.minY + box.maxY) / 2;

  if (box.minY < POSE_ZONE.y || box.maxY > POSE_ZONE.y + POSE_ZONE.height) {
    return {
      positionStatus: "invalid",
      message: "Stand fully inside the blue zone."
    };
  }

  if (box.maxY > 0.98 || box.maxX > 0.98 || box.minX < 0.02) {
    return {
      positionStatus: "invalid",
      message: "Move backward so your full body is visible."
    };
  }

  if (bodyCenterY < zoneCenterY - 0.06) {
    return {
      positionStatus: "invalid",
      message: "Move a little closer to the center of the blue zone."
    };
  }

  if (bodyCenterX < zoneCenterX - 0.05 || bodyCenterX > zoneCenterX + 0.05) {
    return {
      positionStatus: "invalid",
      message: "Move left or right until you are centered."
    };
  }

  return {
    positionStatus: "invalid",
    message: "Adjust your position until your full body is inside the blue zone."
  };
}

export function comparePoseToReference(landmarks, referencePose) {
  if (!landmarks || !referencePose) {
    return {
      postureStatus: "not_detected",
      similarity: 0,
      message: "No body detected yet."
    };
  }

  const referenceIndices = Object.keys(referencePose).map(Number);
  const torso = getTorsoNormalization(landmarks);

  if (!torso) {
    return {
      postureStatus: "neutral",
      similarity: 0,
      message: "Hold still while posture is being checked."
    };
  }

  let compared = 0;
  let totalDistance = 0;

  referenceIndices.forEach((index) => {
    const point = landmarks[index];
    const target = referencePose[index];
    if (!point || !target) return;

    const dx = (point.x - target.x) / torso;
    const dy = (point.y - target.y) / torso;
    totalDistance += Math.sqrt(dx * dx + dy * dy);
    compared += 1;
  });

  if (!compared) {
    return {
      postureStatus: "neutral",
      similarity: 0,
      message: "Reference pose is not ready."
    };
  }

  const averageDistance = totalDistance / compared;
  const similarity = Math.max(0, Math.round((1 - averageDistance / 1.6) * 100));

  if (similarity >= 72) {
    return {
      postureStatus: "correct",
      similarity,
      message: "Posture looks good. Keep it steady."
    };
  }

  if (similarity <= 45) {
    return {
      postureStatus: "incorrect",
      similarity,
      message: "Adjust your body to match the reference skeleton."
    };
  }

  return {
    postureStatus: "neutral",
    similarity,
    message: "Almost there. Make a small posture adjustment."
  };
}

export function drawPoseCanvas({
  canvas,
  video,
  landmarks,
  referencePose,
  zone = false,
  postureStatus = "neutral"
}) {
  if (!canvas || !video) return;

  const width = video.videoWidth || 960;
  const height = video.videoHeight || 540;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);

  if (zone) {
    drawZone(ctx, width, height);
  }

  if (referencePose) {
    drawReferenceSkeleton(ctx, referencePose, width, height);
  }

  if (landmarks) {
    drawLiveSkeleton(ctx, landmarks, width, height, postureStatus);
  }
}

export function drawReferenceCanvas({
  canvas,
  referencePose,
  overlayPose,
  width = 720,
  height = 960,
  showBackdrop = true
}) {
  if (!canvas || !referencePose) return;

  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const cssWidth = canvas.clientWidth || width;
  const cssHeight = canvas.clientHeight || height;

  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  if (showBackdrop) {
    const gradient = ctx.createLinearGradient(0, 0, 0, cssHeight);
    gradient.addColorStop(0, "#071426");
    gradient.addColorStop(1, "#0d2440");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    ctx.save();
    ctx.strokeStyle = "rgba(56, 189, 248, 0.18)";
    ctx.lineWidth = 1;
    for (let y = 0; y <= cssHeight; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cssWidth, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  const poseToDraw =
    !showBackdrop && overlayPose
      ? overlayPose
      : fitReferencePoseToCanvas(referencePose, cssWidth, cssHeight, 0.12);

  drawReferenceSkeleton(ctx, poseToDraw, cssWidth, cssHeight, true);
}

function getBoundingBox(points) {
  return points.reduce(
    (acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxX: Math.max(acc.maxX, point.x),
      maxY: Math.max(acc.maxY, point.y)
    }),
    { minX: 1, minY: 1, maxX: 0, maxY: 0 }
  );
}

function getTorsoNormalization(landmarks) {
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null;

  const shoulderMid = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2
  };
  const hipMid = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2
  };

  const dx = shoulderMid.x - hipMid.x;
  const dy = shoulderMid.y - hipMid.y;
  return Math.sqrt(dx * dx + dy * dy) || null;
}

function drawZone(ctx, width, height) {
  const x = POSE_ZONE.x * width;
  const y = POSE_ZONE.y * height;
  const zoneWidth = POSE_ZONE.width * width;
  const zoneHeight = POSE_ZONE.height * height;

  ctx.save();
  ctx.strokeStyle = "rgba(59, 130, 246, 0.95)";
  ctx.fillStyle = "rgba(59, 130, 246, 0.14)";
  ctx.lineWidth = 4;
  roundRect(ctx, x, y, zoneWidth, zoneHeight, 24);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawReferenceSkeleton(ctx, referencePose, width, height, emphasized = false) {
  ctx.save();
  ctx.strokeStyle = emphasized ? "#0891b2" : "#0ea5e9";
  ctx.fillStyle = emphasized ? "#f59e0b" : "#ffffff";
  ctx.shadowBlur = emphasized ? 20 : 8;
  ctx.shadowColor = emphasized ? "#0891b2" : "#0ea5e9";
  ctx.lineWidth = emphasized ? 8 : 5;
  ctx.setLineDash(emphasized ? [] : [10, 10]);

  REFERENCE_CONNECTIONS.forEach(([start, end]) => {
    const a = referencePose[start];
    const b = referencePose[end];
    if (!a || !b) return;
    ctx.beginPath();
    ctx.moveTo(a.x * width, a.y * height);
    ctx.lineTo(b.x * width, b.y * height);
    ctx.stroke();
  });

  ctx.setLineDash([]);
  Object.values(referencePose).forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x * width, point.y * height, emphasized ? 8 : 6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function fitReferencePoseToCanvas(referencePose, width, height, paddingRatio = 0.1) {
  const points = Object.entries(referencePose).map(([key, point]) => ({
    key,
    x: point.x,
    y: point.y
  }));

  const box = getBoundingBox(points);
  const poseWidth = Math.max(0.001, box.maxX - box.minX);
  const poseHeight = Math.max(0.001, box.maxY - box.minY);

  const paddedWidth = width * (1 - paddingRatio * 2);
  const paddedHeight = height * (1 - paddingRatio * 2);
  const scale = Math.min(paddedWidth / (poseWidth * width), paddedHeight / (poseHeight * height));

  const scaledPoseWidth = poseWidth * width * scale;
  const scaledPoseHeight = poseHeight * height * scale;
  const offsetX = (width - scaledPoseWidth) / 2;
  const offsetY = (height - scaledPoseHeight) / 2;

  const fittedPose = {};
  points.forEach(({ key, x, y }) => {
    const normalizedX = ((x - box.minX) * width * scale + offsetX) / width;
    const normalizedY = ((y - box.minY) * height * scale + offsetY) / height;
    fittedPose[key] = { x: normalizedX, y: normalizedY };
  });

  return fittedPose;
}

function drawLiveSkeleton(ctx, landmarks, width, height, postureStatus) {
  const color =
    postureStatus === "correct"
      ? "#16a34a"
      : postureStatus === "incorrect"
        ? "#dc2626"
        : "#ca8a04";

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;

  REFERENCE_CONNECTIONS.forEach(([start, end]) => {
    const a = landmarks[start];
    const b = landmarks[end];
    if (!a || !b) return;
    ctx.beginPath();
    ctx.moveTo(a.x * width, a.y * height);
    ctx.lineTo(b.x * width, b.y * height);
    ctx.stroke();
  });

  landmarks.forEach((point, index) => {
    if (!REQUIRED_LANDMARKS.includes(index) && !REFERENCE_CONNECTIONS.flat().includes(index)) {
      return;
    }
    ctx.beginPath();
    ctx.arc(point.x * width, point.y * height, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
