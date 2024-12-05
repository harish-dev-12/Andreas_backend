import { Router } from "express";
import {
    login,
    getDashboardStats,
    sendLatestUpdates,
    newPassswordAfterOTPVerified,
    getAllUsers,
    getAUser,
    getIncomeData,
    deleteAUser,
    addCreditsManually,
    //  updateDashboardStats
} from "../controllers/admin/admin";


import { 
    getUserProjects, 
    createProject,
    getAProject,
    deleteAProject,
    updateAProject,
    translateVideo,
    deleteProject,
    getAllProjects

} from "src/controllers/projects/projects";

// import { checkAdminAuth } from "../middleware/check-auth";
import { upload } from "../configF/multer";
import { checkMulter } from "../lib/errors/error-response-handler"
import { forgotPassword } from "src/controllers/admin/admin";
import { verifyOtpPasswordReset } from "src/controllers/user/user";
import { sendNotificationToUser, sendNotificationToUsers } from "src/controllers/notifications/notifications";
import { postAvatar, getAvatar, deleteAvatar } from "src/controllers/admin/avatar";
import { checkAuth } from "src/middleware/check-auth";



const router = Router();

router.post("/login", login)
router.patch("/forgot-password", forgotPassword)
router.post("/verify-otp", verifyOtpPasswordReset)
router.patch("/new-password-otp-verified", newPassswordAfterOTPVerified)
router.get("/users", checkAuth, getAllUsers)
router.get("/dashboard", checkAuth, getDashboardStats)

router.route("/projects").post(checkAuth, createProject).get(checkAuth, getAllProjects)
router.route("/project/:id").get(checkAuth, getAProject).delete(checkAuth, deleteAProject).patch(checkAuth, updateAProject)


router.post("/send-latest-updates", checkAuth, sendLatestUpdates)
router.post("/send-notification", checkAuth, sendNotificationToUsers)
router.post("/send-notification-to-specific-users", checkAuth, sendNotificationToUser)


router.route("/users/:id").get(checkAuth, getAUser).delete(checkAuth, deleteAUser)
router.post("/users/add-credit/:id", checkAuth, addCreditsManually)
router.get("/income", checkAuth, getIncomeData)


router.post("/avatars",checkAuth, postAvatar)
router.get("/avatars", checkAuth, getAvatar)
router.delete("/avatars/:id", checkAuth, deleteAvatar)


// router.get("/verify-session", verifySession);
// router.patch("/update-password", passwordReset)
// router.patch("/forgot-password", forgotPassword)
// router.patch("/new-password-email-sent", newPassswordAfterEmailSent)
// router.put("/edit-info", upload.single("profilePic"), checkMulter, editAdminInfo)
// router.get("/info", getAdminInfo)

// Protected routes
// router.route("/dashboard").get(getDashboardStats).put(updateDashboardStats);
// router.route("/card").post(upload.single("image"), checkMulter, createCard).get(getCards)
// router.route("/card/:id").delete(deleteACard).patch(changeCardStatus)
// router.route("/cards-per-spinner").get(getCardsPerSpinner).patch(updateCardsPerSpinner)


export { router }