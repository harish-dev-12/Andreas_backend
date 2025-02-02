import { Router } from "express";
import express from "express";
import { login, signup, forgotPassword, verifyOtpPasswordReset, newPassswordAfterOTPVerified, getDashboardStats, passwordReset, getUserInfo, editUserInfo, getUserInfoByEmail } from "../controllers/user/user";
import { getAllNotificationsOfUser, markAllNotificationsAsRead } from "src/controllers/notifications/notifications";
import { getUserProjects, convertTextToVideo, convertAudioToVideo, translateVideo, deleteProject, getAProject } from "src/controllers/projects/projects";
import { checkAuth } from "src/middleware/check-auth";
import { getAvatar } from "src/controllers/admin/avatar";
import { 
    getAnotes,

} from "src/controllers/notes/notes";

import { 
    getAattattachment

} from "src/controllers/attachments/attachments";

const router = Router();


router.post("/signup", signup)
router.post("/login", login)
router.patch("/forgot-password", forgotPassword)
router.get("/dashboard", checkAuth, getDashboardStats)
router.get("/:id/projects", checkAuth, getUserProjects)
router.route("/:id").get(checkAuth, getUserInfo).put(checkAuth, editUserInfo)
router.route("/project/:id").get(checkAuth, getAProject)
router.route("/notes/:id").get(checkAuth, getAnotes)
router.route("/attachments/:id").get(checkAuth, getAattattachment)

router.get('/avatars', checkAuth, getAvatar)
router.route("/:id/notifications").get(checkAuth, getAllNotificationsOfUser).put(checkAuth, markAllNotificationsAsRead)
router.get("/email/:email", checkAuth, getUserInfoByEmail)

router.post("/:id/text-to-video", checkAuth, convertTextToVideo)
router.post("/:id/audio-to-video", checkAuth, convertAudioToVideo)
router.post("/:id/video-translation", checkAuth, translateVideo)
router.delete("/projects/:id", checkAuth, deleteProject)


export { router }