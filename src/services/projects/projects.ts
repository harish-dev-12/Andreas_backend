import { Response } from "express"
import path from "path"
import fs from 'fs';
import { fileURLToPath } from 'url'
import { deleteFile } from "src/configF/multer"
import { httpStatusCode } from "src/lib/constant"
import { errorResponseHandler } from "src/lib/errors/error-response-handler"
import { projectsModel } from "src/models/user/projects-schema"
import { usersModel } from "src/models/user/user-schema"
import { notesModel } from "src/models/notes-schema"
import { attachmentsModel } from "src/models/attachments-schema"
import { queryBuilder } from "../../utils";
import { customAlphabet } from "nanoid"
import { flaskTextToVideo, flaskAudioToVideo, flaskTranslateVideo } from "src/utils";
import mongoose from "mongoose";
// Set up __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const getAllProjectService = async (payload: any) => {
    const page = parseInt(payload.page as string) || 1;
    const limit = parseInt(payload.limit as string) || 0;
    const offset = (page - 1) * limit;

    let { query, sort } = queryBuilder(payload, ['1']); // Assuming queryBuilder helps create initial query and sort objects.

    // Add state filtering logic
    if (payload.state) {
        if (payload.state === "ongoing") {
            (query as any).status = { $ne: "1" }; 
        } else if (payload.state === "completed") {
            (query as any).status = "1"; 
        }
    }

    const totalDataCount = Object.keys(query).length < 1 ? await projectsModel.countDocuments() : await projectsModel.countDocuments(query);

    const results = await projectsModel
        .find(query)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .select("-__v");

    return {
        page,
        limit,
        success: results.length > 0,
        total: totalDataCount,
        data: results.length > 0 ? results : [],
    };
};

export const getUserProjectsService = async (payload: any, res: Response) => {
    const { id } = payload
    const user = await usersModel.findById(id)
    if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res)

    const page = parseInt(payload.page as string) || 1;
    const limit = parseInt(payload.limit as string) || 0;
    const offset = (page - 1) * limit;

    let { query, sort } = queryBuilder(payload, ['1']); 

    if (payload.state) {
        if (payload.state === "ongoing") {
            (query as any).status = { $ne: "1" }; 
        } else if (payload.state === "completed") {
            (query as any).status = "1"; 
        }
    }

     (query as any).userId = id;

    const totalDataCount = Object.keys(query).length < 1 ? await projectsModel.countDocuments() : await projectsModel.countDocuments(query);
    const results = await projectsModel
    .find(query)
    .sort(sort)
    .skip(offset)
    .limit(limit)
    .select("-__v");
    
    if (results.length === 0) {
       return errorResponseHandler("Project not found for this user", httpStatusCode.NOT_FOUND, res);
    }else{
        return {
            page,
            limit,
            success: results.length > 0,
            total: totalDataCount,
            data: results.length > 0 ? results : [],
        };
    }


}

export const createProjectService = async (payload: any, res: Response) => {
        const currentUserId = payload.currentUser
        payload.createdby = currentUserId;
        const identifier = customAlphabet('0123456789', 3);
        payload.identifier = identifier();

        const project = await new projectsModel({
            ...payload,
        }).save();

        if (payload.notes) {
            const newNote = new notesModel({
                text: payload.notes,  // The text field of the note
                projectid: project._id,  // Referencing the project by its _id
                identifier: customAlphabet('0123456789', 5)(),  // Optional: Create a unique identifier for the note
            });

            // Save the note
            const createdNote = await newNote.save();
    
        }

        if (payload.attachments) {
            const newNote = new attachmentsModel({
                url: payload.attachments,  // The text field of the note
                projectid: project._id,  // Referencing the project by its _id
                createdby:currentUserId,
                identifier: customAlphabet('0123456789', 5)(),  // Optional: Create a unique identifier for the note
            });

            // Save the note
            const createdNote = await newNote.save();
    
        }
        return {
            success: true,
            message: "Project created successfully"
            
        }
};



export const updateAProjectService = async (payload: any, res: Response) => {
    const currentUserId = payload.currentUser;
console.log("currentUserId",currentUserId)

    const project = await projectsModel.findById(payload.id);
    if (!project) return errorResponseHandler("Project not found", httpStatusCode.NOT_FOUND, res);

    payload.attachments = payload.attachments.map((file: string) => ({
        filePath: file,
        uploadedBy: currentUserId,
    }));

    const updatedProject = await projectsModel.findByIdAndUpdate(payload.id,{ ...payload },{ new: true});

    return {
        success: true,
        message: "Project updated successfully",
        data: updatedProject,
    };

};


export const getAprojectService = async (id: string, res: Response) => {
   
    const project = await projectsModel.findById(id).populate("userId", "fullName email") .populate({path: "attachments.uploadedBy",select: "fullName email",});
        if (!project) return errorResponseHandler("Project not found", httpStatusCode.NOT_FOUND, res);
        return {
            success: true,
            message: "Project retrieved successfully",
            data: project
            
        };

};



export const deleteAProjectService = async (id: string, res: Response) => {
    const user = await projectsModel.findById(id);
    if (!user) return errorResponseHandler("project not found", httpStatusCode.NOT_FOUND, res);

    // Delete user projects ----
    await projectsModel.findByIdAndDelete(id)

    return {
        success: true,
        message: "Project deleted successfully"
        
    }
}




////////////////////////////////////////////////////////////////////////////////////////////////////


export const deleteProjectService = async (payload: any, res: Response, session: mongoose.ClientSession) => {
    const { id } = payload;
    const project = await projectsModel.findById(id).session(session);
    if (!project) return errorResponseHandler("Project not found", httpStatusCode.NOT_FOUND, res);
    const response = await projectsModel.findByIdAndDelete(id)
    return {
        success: true,
        message: "Project deleted successfully",
        data: response
    }
}

export const convertTextToVideoService = async (payload: any, res: Response,
    // session: mongoose.ClientSession

) => {
    const { id, ...rest } = payload;

    const user = await usersModel.findById(id)
    if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);

    const WORDS_PER_MINUTE = 150;
    const SECONDS_PER_CREDIT = 10;
    const words = rest.text.trim().split(/\s+/).length;
    const videoLengthSeconds = Math.ceil(words / WORDS_PER_MINUTE * 60);
    const creditsExhausted = Math.ceil(videoLengthSeconds / SECONDS_PER_CREDIT);

    if (user.creditsLeft < creditsExhausted) return errorResponseHandler(`Insufficient credits. Required: ${creditsExhausted}, Available: ${user.creditsLeft}`, httpStatusCode.BAD_REQUEST, res);
    const convertedVideo = await flaskTextToVideo({ duration: videoLengthSeconds, email: user.email, ...rest }, res);

    if (convertedVideo) {
        // Add to projects collections
        const newProject = new projectsModel({
            projectVideoLink: convertedVideo,
            userId: id,
            projectName: rest.text.trim().slice(0, 10),
            projectAvatar: rest.projectAvatar,
            text: rest.text,
            textLanguage: rest.textLanguage,
            preferredVoice: rest.preferredVoice,
            subtitles: rest.subtitles,
            subtitlesLanguage: rest.subtitlesLanguage,
            duration: videoLengthSeconds
        })
        await newProject.save(
            // { session }
        );

        // Update user credits
        const updatedUser = await usersModel.findByIdAndUpdate(id, { $inc: { creditsLeft: -creditsExhausted } }, {
            new: true,
            // session
        });

        if (!updatedUser) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);

        // Commit transaction here
        // await session.commitTransaction()
        return {
            success: true,
            message: "Text converted to video successfully",
            data: {
                creditsUsed: creditsExhausted,
                creditsRemaining: updatedUser.creditsLeft,
                estimatedLength: videoLengthSeconds,
                videoUrl: convertedVideo
            }
        }
    }
    else {
        // await session.abortTransaction(); // Rollback if video conversion fails
        return errorResponseHandler("An error occurred during the API call", httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }
}

export const convertaAudioToVideoService = async (payload: any, res: Response, session: mongoose.ClientSession) => {
    const { id, ...rest } = payload;

    const user = await usersModel.findById(id).session(session);
    if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);

    const duration = rest.audioLength
    const SECONDS_PER_CREDIT = 10;
    const creditsExhausted = Math.floor(duration / SECONDS_PER_CREDIT)
    if (user.creditsLeft < creditsExhausted) return errorResponseHandler(`Insufficient credits. Required: ${creditsExhausted}, Available: ${user.creditsLeft}`, httpStatusCode.BAD_REQUEST, res)
    const convertedVideo = await flaskAudioToVideo({ duration, email: user.email, ...rest }, res);
    if (convertedVideo) {
        // Add to projects collections
        const newProject = new projectsModel({
            userId: id,
            projectVideoLink: convertedVideo,
            audio: rest.audio,
            projectName: Math.random().toString(36).substring(7),
            projectAvatar: rest.projectAvatar,
            subtitles: rest.subtitles,
            subtitlesLanguage: rest.subtitlesLanguage,
            duration
        })
        await newProject.save({ session });

        // Update user credits
        const updatedUser = await usersModel.findByIdAndUpdate(id, { $inc: { creditsLeft: -creditsExhausted } }, { new: true, session });

        if (!updatedUser) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);

        // Commit transaction here
        await session.commitTransaction()
        return {
            success: true,
            message: "Audio converted to video successfully",
            data: {
                creditsUsed: creditsExhausted,
                creditsRemaining: updatedUser.creditsLeft,
                estimatedLength: duration,
                videoUrl: convertedVideo
            }
        }
    }
    else {
        await session.abortTransaction(); // Rollback if video conversion fails
        return errorResponseHandler("An error occurred during the API call", httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }
}

export const translateVideoService = async (payload: any, res: Response, session: mongoose.ClientSession) => {
    const { id, ...rest } = payload;

    const user = await usersModel.findById(id).session(session);
    if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);

    const SECONDS_PER_CREDIT = 10;
    const creditsExhausted = Math.floor(rest.videoLength / SECONDS_PER_CREDIT)
    if (user.creditsLeft < creditsExhausted) return errorResponseHandler(`Insufficient credits. Required: ${creditsExhausted}, Available: ${user.creditsLeft}`, httpStatusCode.BAD_REQUEST, res)
    const convertedVideo = await flaskTranslateVideo({ duration: rest.videoLength, email: user.email, ...rest }, res);
    if (convertedVideo) {
        // Add to projects collections
        const newProject = new projectsModel({
            userId: id,
            projectVideoLink: convertedVideo,
            video: rest.video,
            originalText: rest.originalText,
            translatedText: rest.translatedText,
            projectName: Math.random().toString(36).substring(7),
            projectAvatar: rest.projectAvatar,
            subtitles: rest.subtitles,
            subtitlesLanguage: rest.subtitlesLanguage,
            duration: rest.videoLength
        })
        await newProject.save({ session });

        // Update user credits
        const updatedUser = await usersModel.findByIdAndUpdate(id, { $inc: { creditsLeft: -creditsExhausted } }, { new: true, session });

        if (!updatedUser) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);

        // Commit transaction here
        await session.commitTransaction()
        return {
            success: true,
            message: "Video translated to video successfully",
            data: {
                creditsUsed: creditsExhausted,
                creditsRemaining: updatedUser.creditsLeft,
                estimatedLength: rest.videoLength,
                videoUrl: convertedVideo
            }
        }
    }
    else {
        await session.abortTransaction(); // Rollback if video conversion fails
        return errorResponseHandler("An error occurred during the API call", httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }
}