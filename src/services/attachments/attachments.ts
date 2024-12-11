
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


export const getAattachmentsService = async (id: string, res: Response) => {
   
    const attachments = await attachmentsModel
            .find({ projectid: id })  // Find all notes where projectid matches the given id
            .populate("createdby");
            
            if (!attachments) return errorResponseHandler("Attachmnets not found", httpStatusCode.NOT_FOUND, res);

        return {
            success: true,
            message: "Attachmnets retrieved successfully",
            data: attachments
            
        };

};


export const deleteAattachmentService = async (id: string, res: Response) => {

    const attachments = await attachmentsModel.findById(id);
    if (!attachments) return errorResponseHandler("Attachments not found", httpStatusCode.NOT_FOUND, res);

     await attachmentsModel.findByIdAndDelete(id)

    return {
        success: true,
        message: "Attachments deleted successfully"
        
    }
}

export const createattachmentService = async (payload: any, res: Response) => {
    const currentUserId = payload.currentUser

    console.log("currentUserId",currentUserId);
        const newAttachments= new attachmentsModel({
            url: payload.url,  // The text field of the note
            projectid: payload.id,  // Referencing the project by its _id
            createdby:currentUserId,
            identifier: customAlphabet('0123456789', 5)(),  // Optional: Create a unique identifier for the note
        });

        // Save the note
        const createdAttachments = await newAttachments.save();

    return {
        success: true,
        message: "Attachments created successfully"
        
    }

};
