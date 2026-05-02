import threading
import time
import cv2
import customtkinter as ctk
from PIL import Image
from .database import log_session
from .hardware import fetch_heart_rate, run_hardware_handshake
from .inactivity_monitor import send_sms_message
from .config import HR_MIN, HR_MAX

try:
    import mediapipe as mp
    MP_POSE = mp.solutions.pose
    MP_DRAWING = mp.solutions.drawing_utils
except Exception:
    MP_POSE = None
    MP_DRAWING = None


class SilverFitApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("SilverFit AI")
        self.geometry("1024x768")

        # Bright white + lime theme
        ctk.set_appearance_mode("light")
        ctk.set_default_color_theme("green")

        self.configure(fg_color="#F7FFF7")

        self.colors = {
            "bg": "#F7FFF7",
            "card": "#FFFFFF",
            "lime": "#B7FF00",
            "lime_hover": "#A2E600",
            "title": "#222222",
            "muted": "#5F6B60",
            "ok": "#1E8E3E",
            "warn": "#D97706",
            "bad": "#C62828",
        }

        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        # Header
        self.header = ctk.CTkLabel(
            self,
            text="SilverFit AI",
            font=ctk.CTkFont(size=40, weight="bold"),
            text_color=self.colors["title"],
        )
        self.header.grid(row=0, column=0, pady=20)

        # Main Frame for content
        self.main_frame = ctk.CTkFrame(
            self,
            fg_color=self.colors["bg"],
            corner_radius=0,
        )
        self.main_frame.grid(row=1, column=0, padx=40, pady=20, sticky="nsew")
        self.main_frame.grid_columnconfigure(0, weight=1)

        self.exercise_active = False
        self.session_paused = False
        self.current_hr = 0
        self.hr_history = []
        self.wrong_moves = 0
        self.total_frames = 0
        self.out_of_range_started_at = None
        self.emergency_sent = False
        self.capture = None
        self.pose = None
        self.mp_pose = MP_POSE
        self.mp_drawing = MP_DRAWING
        self.pose_backend = "mediapipe" if self.mp_pose is not None else "fallback"
        self.last_motion_score = None

        self.show_landing_page()

    def show_landing_page(self):
        self.clear_frame()

        card = ctk.CTkFrame(
            self.main_frame,
            fg_color=self.colors["card"],
            corner_radius=20,
            border_width=2,
            border_color="#E6EFE6",
        )
        card.pack(expand=True, fill="both", padx=80, pady=40)

        badge = ctk.CTkLabel(
            card,
            text="TODAY'S WELLNESS",
            font=ctk.CTkFont(size=16, weight="bold"),
            text_color=self.colors["title"],
            fg_color=self.colors["lime"],
            corner_radius=12,
            padx=14,
            pady=6,
        )
        badge.pack(pady=(40, 20))

        headline = ctk.CTkLabel(
            card,
            text="Start your exercise session today",
            font=ctk.CTkFont(size=44, weight="bold"),
            text_color=self.colors["title"],
        )
        headline.pack(pady=(0, 16))

        subtitle = ctk.CTkLabel(
            card,
            text="Build stronger muscles and better balance in a safe way.",
            font=ctk.CTkFont(size=22),
            text_color=self.colors["muted"],
        )
        subtitle.pack(pady=(0, 40))

        start_btn = ctk.CTkButton(
            card,
            text="Start Session",
            font=ctk.CTkFont(size=28, weight="bold"),
            height=70,
            width=320,
            corner_radius=16,
            fg_color=self.colors["lime"],
            hover_color=self.colors["lime_hover"],
            text_color="#1A1A1A",
            command=self.start_system_check,
        )
        start_btn.pack(pady=(0, 12))

        helper = ctk.CTkLabel(
            card,
            text="We will run a quick system check before exercise.",
            font=ctk.CTkFont(size=18),
            text_color=self.colors["muted"],
        )
        helper.pack(pady=(0, 30))

    def start_system_check(self):
        self.show_loading_screen()
        threading.Thread(target=self.perform_handshake, daemon=True).start()

    def show_loading_screen(self):
        self.clear_frame()
        card = ctk.CTkFrame(
            self.main_frame,
            fg_color=self.colors["card"],
            corner_radius=20,
            border_width=2,
            border_color="#E6EFE6",
        )
        card.pack(expand=True, fill="both", padx=120, pady=80)

        self.loading_label = ctk.CTkLabel(
            card,
            text="Running system check...\nPlease wait.",
            font=ctk.CTkFont(size=34, weight="bold"),
            text_color=self.colors["title"],
        )
        self.loading_label.pack(expand=True)

    def perform_handshake(self):
        all_ok, status = run_hardware_handshake()
        # Use after to update GUI from thread
        self.after(1000, self.show_handshake_results, all_ok, status)

    def show_handshake_results(self, all_ok, status):
        self.clear_frame()

        card = ctk.CTkFrame(
            self.main_frame,
            fg_color=self.colors["card"],
            corner_radius=20,
            border_width=2,
            border_color="#E6EFE6",
        )
        card.pack(expand=True, fill="both", padx=80, pady=40)

        title_text = "System Ready!" if all_ok else "Attention Needed"
        title_color = self.colors["ok"] if all_ok else self.colors["warn"]

        title = ctk.CTkLabel(
            card,
            text=title_text,
            font=ctk.CTkFont(size=36, weight="bold"),
            text_color=title_color,
        )
        title.pack(pady=30)

        for key, value in status.items():
            color = self.colors["ok"] if value["ok"] else self.colors["bad"]
            symbol = "OK" if value["ok"] else "X"

            lbl = ctk.CTkLabel(
                card,
                text=f"{symbol} {key}: {value['msg']}",
                font=ctk.CTkFont(size=24),
                text_color=color,
            )
            lbl.pack(pady=10)

        if all_ok:
            start_btn = ctk.CTkButton(
                card,
                text="Start Exercise",
                font=ctk.CTkFont(size=30, weight="bold"),
                height=80,
                width=300,
                corner_radius=16,
                fg_color=self.colors["lime"],
                hover_color=self.colors["lime_hover"],
                text_color="#1A1A1A",
                command=self.start_exercise,
            )
            start_btn.pack(pady=50)
        else:
            retry_btn = ctk.CTkButton(
                card,
                text="Retry Connection",
                font=ctk.CTkFont(size=24, weight="bold"),
                height=60,
                width=250,
                corner_radius=14,
                fg_color=self.colors["lime"],
                hover_color=self.colors["lime_hover"],
                text_color="#1A1A1A",
                command=self.start_system_check,
            )
            retry_btn.pack(pady=(40, 12))

            continue_anyway = ctk.CTkButton(
                card,
                text="Continue Anyway (Testing)",
                font=ctk.CTkFont(size=18),
                fg_color="#FFFFFF",
                hover_color="#F5FFF5",
                border_width=2,
                border_color="#CFD8CF",
                text_color=self.colors["title"],
                command=self.start_exercise,
            )
            continue_anyway.pack(pady=10)

    def start_exercise(self):
        self.clear_frame()
        card = ctk.CTkFrame(
            self.main_frame,
            fg_color=self.colors["card"],
            corner_radius=20,
            border_width=2,
            border_color="#E6EFE6",
        )
        card.pack(expand=True, fill="both", padx=24, pady=24)
        card.grid_columnconfigure(0, weight=3)
        card.grid_columnconfigure(1, weight=2)
        card.grid_rowconfigure(0, weight=1)

        video_wrap = ctk.CTkFrame(card, fg_color="#F4F9F4", corner_radius=16)
        video_wrap.grid(row=0, column=0, padx=20, pady=20, sticky="nsew")
        video_wrap.grid_rowconfigure(0, weight=1)
        video_wrap.grid_columnconfigure(0, weight=1)

        self.video_label = ctk.CTkLabel(video_wrap, text="")
        self.video_label.grid(row=0, column=0, sticky="nsew", padx=8, pady=8)

        panel = ctk.CTkFrame(card, fg_color="#FFFFFF", corner_radius=16, border_width=1, border_color="#E6EFE6")
        panel.grid(row=0, column=1, padx=(0, 20), pady=20, sticky="nsew")

        title = ctk.CTkLabel(
            panel,
            text="Live Exercise Session",
            font=ctk.CTkFont(size=28, weight="bold"),
            text_color=self.colors["title"],
        )
        title.pack(pady=(20, 12))

        self.hr_label = ctk.CTkLabel(
            panel,
            text="Heart Rate: -- bpm",
            font=ctk.CTkFont(size=24, weight="bold"),
            text_color=self.colors["title"],
        )
        self.hr_label.pack(pady=10)

        self.safety_label = ctk.CTkLabel(
            panel,
            text=f"Safe Range: {HR_MIN}-{HR_MAX} bpm",
            font=ctk.CTkFont(size=18),
            text_color=self.colors["muted"],
        )
        self.safety_label.pack(pady=6)

        tracking_mode = "MediaPipe Pose" if self.pose_backend == "mediapipe" else "Motion Fallback"
        self.tracking_label = ctk.CTkLabel(
            panel,
            text=f"Tracking: {tracking_mode}",
            font=ctk.CTkFont(size=16),
            text_color=self.colors["muted"],
        )
        self.tracking_label.pack(pady=4)

        self.moves_label = ctk.CTkLabel(
            panel,
            text="Wrong Moves: 0",
            font=ctk.CTkFont(size=20),
            text_color=self.colors["title"],
        )
        self.moves_label.pack(pady=8)

        self.feedback_label = ctk.CTkLabel(
            panel,
            text="Feedback: Align your shoulders and keep breathing.",
            wraplength=320,
            justify="left",
            font=ctk.CTkFont(size=18),
            text_color=self.colors["muted"],
        )
        self.feedback_label.pack(padx=18, pady=(14, 18))

        end_btn = ctk.CTkButton(
            panel,
            text="End Session",
            font=ctk.CTkFont(size=20, weight="bold"),
            fg_color=self.colors["lime"],
            hover_color=self.colors["lime_hover"],
            text_color="#1A1A1A",
            command=self.end_exercise_session,
        )
        end_btn.pack(pady=(10, 8))

        back_btn = ctk.CTkButton(
            panel,
            text="Back to Home",
            font=ctk.CTkFont(size=16),
            fg_color="#FFFFFF",
            hover_color="#F5FFF5",
            border_width=1,
            border_color="#CFD8CF",
            text_color=self.colors["title"],
            command=self.back_to_home,
        )
        back_btn.pack(pady=(0, 20))

        self.exercise_active = True
        self.session_paused = False
        self.current_hr = 0
        self.hr_history = []
        self.wrong_moves = 0
        self.total_frames = 0
        self.out_of_range_started_at = None
        self.emergency_sent = False
        self.last_motion_score = None

        if self.pose_backend == "mediapipe":
            self.pose = self.mp_pose.Pose(
                static_image_mode=False,
                model_complexity=1,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5,
            )
        self.capture = cv2.VideoCapture(0)

        threading.Thread(target=self.hr_worker, daemon=True).start()
        self.update_video_frame()

    def hr_worker(self):
        while self.exercise_active:
            hr = fetch_heart_rate()
            if hr is not None:
                self.current_hr = hr
                self.hr_history.append(hr)
                if len(self.hr_history) > 3600:
                    self.hr_history = self.hr_history[-3600:]
            time.sleep(1)

    def update_video_frame(self):
        if not self.exercise_active or self.capture is None:
            return

        ok, frame = self.capture.read()
        if not ok:
            self.feedback_label.configure(text="Feedback: Unable to read webcam frame.")
            self.after(120, self.update_video_frame)
            return

        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        if self.pose_backend == "mediapipe" and self.pose:
            results = self.pose.process(rgb)
            pose_ok, tip = self.evaluate_pose(results)
        else:
            results = None
            pose_ok, tip = self.evaluate_pose_fallback(frame)

        if not pose_ok:
            self.wrong_moves += 1
        self.total_frames += 1

        if results and results.pose_landmarks:
            self.mp_drawing.draw_landmarks(
                frame,
                results.pose_landmarks,
                self.mp_pose.POSE_CONNECTIONS,
            )

        self.feedback_label.configure(text=f"Feedback: {tip}")
        self.moves_label.configure(text=f"Wrong Moves: {self.wrong_moves}")
        self.update_safety_guard()

        show = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(show)
        ctk_img = ctk.CTkImage(light_image=img, dark_image=img, size=(640, 420))
        self.video_label.configure(image=ctk_img)
        self.video_label.image = ctk_img

        self.after(50, self.update_video_frame)

    def evaluate_pose(self, results):
        if not results or not results.pose_landmarks:
            return False, "Please position your full body inside the camera."

        lm = results.pose_landmarks.landmark
        left_shoulder = lm[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value]
        right_shoulder = lm[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
        left_hip = lm[self.mp_pose.PoseLandmark.LEFT_HIP.value]
        right_hip = lm[self.mp_pose.PoseLandmark.RIGHT_HIP.value]

        vis_ok = (
            left_shoulder.visibility > 0.6
            and right_shoulder.visibility > 0.6
            and left_hip.visibility > 0.6
            and right_hip.visibility > 0.6
        )
        if not vis_ok:
            return False, "Move slightly back so shoulders and hips are clearly visible."

        shoulder_level_diff = abs(left_shoulder.y - right_shoulder.y)
        hip_level_diff = abs(left_hip.y - right_hip.y)
        torso_height = ((left_hip.y + right_hip.y) / 2) - ((left_shoulder.y + right_shoulder.y) / 2)

        if shoulder_level_diff > 0.12:
            return False, "Try to keep your shoulders level."
        if hip_level_diff > 0.12:
            return False, "Keep your hips balanced and centered."
        if torso_height < 0.15:
            return False, "Stand taller and open your chest."

        return True, "Great posture. Keep this form."

    def evaluate_pose_fallback(self, frame):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        motion = cv2.Laplacian(gray, cv2.CV_64F).var()

        if self.last_motion_score is None:
            self.last_motion_score = motion
            return True, "Session running. Keep your body centered in view."

        delta = abs(motion - self.last_motion_score)
        self.last_motion_score = (0.8 * self.last_motion_score) + (0.2 * motion)

        if delta < 5:
            return False, "Try to move a bit more clearly and keep your full body visible."
        if delta > 300:
            return False, "Slow down slightly for safer, controlled movement."
        return True, "Nice pace. Keep your movement smooth and steady."

    def update_safety_guard(self):
        hr = self.current_hr
        if hr > 0:
            in_range = HR_MIN <= hr <= HR_MAX
            color = self.colors["ok"] if in_range else self.colors["bad"]
            self.hr_label.configure(text=f"Heart Rate: {hr} bpm", text_color=color)

            now = time.time()
            if in_range:
                self.out_of_range_started_at = None
            else:
                if self.out_of_range_started_at is None:
                    self.out_of_range_started_at = now

                elapsed = now - self.out_of_range_started_at
                if elapsed >= 6 and not self.emergency_sent:
                    self.trigger_emergency(hr)
        else:
            self.hr_label.configure(text="Heart Rate: -- bpm", text_color=self.colors["title"])

    def trigger_emergency(self, hr):
        self.emergency_sent = True
        self.session_paused = True
        self.exercise_active = False
        self.cleanup_exercise_resources()

        self.clear_frame()
        card = ctk.CTkFrame(
            self.main_frame,
            fg_color="#FFF7F7",
            corner_radius=20,
            border_width=2,
            border_color="#FFD5D5",
        )
        card.pack(expand=True, fill="both", padx=120, pady=80)

        title = ctk.CTkLabel(
            card,
            text="Session Paused for Safety",
            font=ctk.CTkFont(size=38, weight="bold"),
            text_color=self.colors["bad"],
        )
        title.pack(pady=(40, 18))

        msg = ctk.CTkLabel(
            card,
            text=f"Heart rate stayed out of safe range for 6+ seconds.\nCurrent HR: {hr} bpm",
            font=ctk.CTkFont(size=24),
            text_color=self.colors["title"],
        )
        msg.pack(pady=(0, 18))

        info = ctk.CTkLabel(
            card,
            text="Emergency SMS is being sent to family contacts.",
            font=ctk.CTkFont(size=18),
            text_color=self.colors["muted"],
        )
        info.pack(pady=(0, 28))

        btn = ctk.CTkButton(
            card,
            text="Back to Home",
            font=ctk.CTkFont(size=20, weight="bold"),
            fg_color=self.colors["lime"],
            hover_color=self.colors["lime_hover"],
            text_color="#1A1A1A",
            command=self.show_landing_page,
        )
        btn.pack(pady=(0, 30))

        alert_body = (
            "SilverFit Emergency Alert: Exercise was paused because heart rate stayed outside "
            f"safe range ({HR_MIN}-{HR_MAX} bpm). Current HR: {hr} bpm."
        )
        threading.Thread(target=send_sms_message, args=(alert_body,), daemon=True).start()

    def end_exercise_session(self):
        was_active = self.exercise_active
        self.exercise_active = False
        self.cleanup_exercise_resources()

        if not was_active and self.session_paused:
            return

        avg_hr = int(sum(self.hr_history) / len(self.hr_history)) if self.hr_history else 0
        mistake_ratio = (self.wrong_moves / self.total_frames) if self.total_frames else 0
        score = max(0, round(10 - (mistake_ratio * 10), 1))
        summary = f"Session completed. Avg HR: {avg_hr} bpm. Score: {score}/10."

        log_session(
            avg_hr=avg_hr,
            calories=0.0,
            wrong_moves=self.wrong_moves,
            ai_report=summary,
        )

        self.clear_frame()
        card = ctk.CTkFrame(
            self.main_frame,
            fg_color=self.colors["card"],
            corner_radius=20,
            border_width=2,
            border_color="#E6EFE6",
        )
        card.pack(expand=True, fill="both", padx=120, pady=80)

        done = ctk.CTkLabel(
            card,
            text="Session Complete",
            font=ctk.CTkFont(size=36, weight="bold"),
            text_color=self.colors["ok"],
        )
        done.pack(pady=(30, 16))

        details = ctk.CTkLabel(
            card,
            text=(
                f"Average HR: {avg_hr} bpm\n"
                f"Wrong Moves: {self.wrong_moves}\n"
                f"Pose Score: {score}/10"
            ),
            font=ctk.CTkFont(size=24),
            text_color=self.colors["title"],
        )
        details.pack(pady=(0, 18))

        hint = ctk.CTkLabel(
            card,
            text="Great consistency. Keep exercising regularly for stronger muscles and balance.",
            font=ctk.CTkFont(size=18),
            text_color=self.colors["muted"],
            wraplength=640,
        )
        hint.pack(pady=(0, 26))

        home_btn = ctk.CTkButton(
            card,
            text="Back to Home",
            font=ctk.CTkFont(size=20, weight="bold"),
            fg_color=self.colors["lime"],
            hover_color=self.colors["lime_hover"],
            text_color="#1A1A1A",
            command=self.show_landing_page,
        )
        home_btn.pack(pady=(0, 30))

    def back_to_home(self):
        self.exercise_active = False
        self.session_paused = False
        self.cleanup_exercise_resources()
        self.show_landing_page()

    def cleanup_exercise_resources(self):
        if self.capture is not None:
            self.capture.release()
            self.capture = None
        if self.pose is not None:
            self.pose.close()
            self.pose = None

    def clear_frame(self):
        for widget in self.main_frame.winfo_children():
            widget.destroy()


def start_app():
    app = SilverFitApp()
    app.mainloop()
