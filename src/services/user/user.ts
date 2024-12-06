import { Request, Response } from "express"
import { errorResponseHandler } from "../../lib/errors/error-response-handler"
import { usersModel } from "../../models/user/user-schema"
import bcrypt from "bcryptjs"
import { adminModel } from "../../models/admin/admin-schema";
import { generatePasswordResetToken, generatePasswordResetTokenByPhone, getPasswordResetTokenByToken } from "../../utils/mails/token"
import { sendPasswordResetEmail } from "../../utils/mails/mail"
import { generatePasswordResetTokenByPhoneWithTwilio } from "../../utils/sms/sms"
import { httpStatusCode } from "../../lib/constant"
import { passwordResetTokenModel } from "../../models/password-token-schema"
import { projectsModel } from "src/models/user/projects-schema";
import { customAlphabet } from "nanoid"
import { increaseReferredCountAndCredits } from "src/utils"
import { sendNotificationToUserService } from "../notifications/notifications"
import mongoose from "mongoose"


export const signupService = async (payload: any, res: Response) => {
    const countryCode = "+45";
    const emailExists  = await usersModel.findOne({ email: payload.email })
    if (emailExists ) return errorResponseHandler("Email already exists", httpStatusCode.BAD_REQUEST, res)
    const phoneExists = await usersModel.findOne({ phoneNumber: `${countryCode}${payload.phoneNumber}` });
    if (phoneExists ) return errorResponseHandler("phone Number already exists", httpStatusCode.BAD_REQUEST, res)

    payload.phoneNumber = `${countryCode}${payload.phoneNumber}`;
    const newPassword = bcrypt.hashSync(payload.password, 10)
    payload.password = newPassword
    const genId = customAlphabet('1234567890', 8)
    const identifier = customAlphabet('0123456789', 3)
    
    payload.myReferralCode = `${process.env.NEXT_PUBLIC_APP_URL}/signup?referralCode=${genId()}`
    payload.identifier = identifier()
    // if(payload.referralCode) {
    //     const referredBy = await usersModel.findOne({ myReferralCode: `${process.env.NEXT_PUBLIC_APP_URL}/signup?referralCode=${payload.referralCode}` })
    //     if (referredBy) {
    //         payload.referredBy = referredBy._id           //Set my referred by
    //         await increaseReferredCountAndCredits(referredBy._id)   //Increase referred count of the person who referred me
    //         await sendNotificationToUserService({ title: "Referral", message: "Congrats! A new user has signed up with your referral code", ids: [referredBy._id.toString()] }, res)   //Sending THE NOTIFICATION TO THE USER WHO REFERRED ME
    //     }
    // }
    new usersModel({ ...payload, email: payload.email.toLowerCase().trim() }).save()
    return { success: true, message: "Client signup successfull" }
}

export const loginService = async (payload: any, res: Response) => {
    const { email, phoneNumber, password } = payload
    const query = email ? { email } : { phoneNumber };
    const client = await usersModel.findOne(query).select('+password')
    if (!client) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res)
    const isPasswordValid = bcrypt.compareSync(password, client.password)
    if (!isPasswordValid) return errorResponseHandler("Invalid password", httpStatusCode.UNAUTHORIZED, res)
    const clientObject: any = client.toObject()
    delete clientObject.password
    return { success: true, message: "Login successful", data: clientObject }
}

export const forgotPasswordService = async (payload: any, res: Response) => {
    const { email, phoneNumber, password } = payload
    const query = email ? { email } : { phoneNumber };

    const client = await usersModel.findOne(query)
    if (!client) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res)

    if (email) {
        const passwordResetToken = await generatePasswordResetToken(email)
        if (passwordResetToken !== null) {
            await sendPasswordResetEmail(email, passwordResetToken.token)
            return { success: true, message: "Password reset email sent with otp" }
        }

    }
    else {
        const generatePasswordResetTokenBysms = await generatePasswordResetTokenByPhone(phoneNumber)

        if (generatePasswordResetTokenBysms !== null) {
            await generatePasswordResetTokenByPhoneWithTwilio(phoneNumber, generatePasswordResetTokenBysms.token)
            return { success: true, message: "Password reset sms sent with otp" }
        }
    }
}

export const verifyOtpPasswordResetService = async (token: string, res: Response) => {
    const existingToken = await getPasswordResetTokenByToken(token)
    if (!existingToken) return errorResponseHandler("Invalid token", httpStatusCode.BAD_REQUEST, res)

    const hasExpired = new Date(existingToken.expires) < new Date()
    if (hasExpired) return errorResponseHandler("OTP expired", httpStatusCode.BAD_REQUEST, res)
    return { success: true, message: "Token verified successfully" }
}


export const newPassswordAfterOTPVerifiedService = async (payload: { password: string, otp: string }, res: Response) => {
    const { password, otp } = payload
    const existingToken = await getPasswordResetTokenByToken(otp)
    if (!existingToken) return errorResponseHandler("Invalid OTP", httpStatusCode.BAD_REQUEST, res)

        // console.log("existingToken", existingToken);

    const hasExpired = new Date(existingToken.expires) < new Date()
    if (hasExpired) return errorResponseHandler("OTP expired", httpStatusCode.BAD_REQUEST, res)

    let existingClient:any;

    if (existingToken.email) {
        existingClient = await adminModel.findOne({ email: existingToken.email });
        if (!existingClient) {
            existingClient = await usersModel.findOne({ email: existingToken.email });
        }
        if (!existingClient) return errorResponseHandler('User not found', httpStatusCode.NOT_FOUND, res);

    }
    else if (existingToken.phoneNumber) {

        existingClient = await usersModel.findOne({ phoneNumber: existingToken.phoneNumber });
        if (!existingClient) {
            existingClient = await usersModel.findOne({ phoneNumber: existingToken.phoneNumber });
        }
        if (!existingClient) return errorResponseHandler('User not found', httpStatusCode.NOT_FOUND, res);

    }

    // console.log('existingClient',existingClient)

    const hashedPassword = await bcrypt.hash(password, 10)

    if(existingClient.role =='admin'){
        const response = await adminModel.findByIdAndUpdate(existingClient._id, { password: hashedPassword }, { new: true })
    }else{
        const response = await usersModel.findByIdAndUpdate(existingClient._id, { password: hashedPassword }, { new: true }) 
    }



    // await passwordResetTokenModel.findByIdAndDelete(existingToken._id)

    return {
        success: true,
        message: "Password updated successfully"
    }
}

export const passwordResetService = async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body
    const getAdmin = await usersModel.findById(req.params.id).select("+password")
    if (!getAdmin) return errorResponseHandler("Admin not found", httpStatusCode.NOT_FOUND, res)

    const passwordMatch = bcrypt.compareSync(currentPassword, getAdmin.password)
    if (!passwordMatch) return errorResponseHandler("Current password invalid", httpStatusCode.BAD_REQUEST, res)
    const hashedPassword = bcrypt.hashSync(newPassword, 10)
    const response = await usersModel.findByIdAndUpdate(req.params.id, { password: hashedPassword })
    return {
        success: true,
        message: "Password updated successfully",
        data: response
    }
}

export const getUserInfoService = async (id: string, res: Response) => {
    const user = await usersModel.findById(id);
    if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);
  
    const userProjects = await projectsModel.find({ userId: id }).select("-__v");
  
    return {
        success: true,
        message: "User retrieved successfully",
        data: {
            user,
            projects: userProjects.length > 0 ? userProjects : [],
        }
    };
}

export const getUserInfoByEmailService = async (email: string, res: Response) => {
    const client = await usersModel.findOne({ email })
    if (!client) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res)
    return {
        success: true,
        message: "Client info fetched successfully",
        data: client
    }
}

export const editUserInfoService = async (id: string, payload: any, res: Response) => {
    const user = await usersModel.findById(id);
    if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);
    const countryCode = "+45";
    payload.phoneNumber = `${countryCode}${payload.phoneNumber}`;
    const updateduser = await usersModel.findByIdAndUpdate(id,{ ...payload },{ new: true});

    return {
        success: true,
        message: "User updated successfully",
        data: updateduser,
    };
}



// Dashboard
export const getDashboardStatsService = async (payload: any, res: Response) => {
    //Ongoing project count
    const userId = payload.userId

    const ongoingProjectCount = await projectsModel.countDocuments({ userId, status: { $ne: "1" } })

    const completedProjectCount = await projectsModel.countDocuments({ userId,status: "1" })

    const workingProjectDetails = await projectsModel.find({ userId, status: { $ne: "1" } }).select("projectName projectimageLink status"); // Adjust the fields as needed
    

    const response = {
        success: true,
        message: "Dashboard stats fetched successfully",
        data: {
            ongoingProjectCount,
            completedProjectCount,
             workingProjectDetails,
        }
    }

    return response
}
