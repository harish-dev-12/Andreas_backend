
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
import { queryBuilder } from "../../utils";
import { customAlphabet } from "nanoid"
import { flaskTextToVideo, flaskAudioToVideo, flaskTranslateVideo } from "src/utils";
import mongoose from "mongoose";


export const getAnotesService = async (id: string, res: Response) => {
    const projects = await projectsModel.findById(id);
    if (!projects)
      return errorResponseHandler("project not found",httpStatusCode.NOT_FOUND,res);
    const notes = await notesModel
            .find({ projectid: id }) ; // Find all notes where projectid matches the given id
            // .populate("projectid");
            
            if (!notes) return errorResponseHandler("notes not found", httpStatusCode.NOT_FOUND, res);
        return {
            success: true,
            message: "Notes retrieved successfully",
            data: notes
            
        };

};


export const deleteANoteService = async (id: string, res: Response) => {
    const note = await notesModel.findById(id);
    if (!note) return errorResponseHandler("notes not found", httpStatusCode.NOT_FOUND, res);

     await notesModel.findByIdAndDelete(id)

    return {
        success: true,
        message: "Notes deleted successfully"
        
    }
}

export const createNoteService = async (payload: any, res: Response) => {
    const project = await projectsModel.findById(payload.id);

    if (!project) return errorResponseHandler("project not found", httpStatusCode.NOT_FOUND, res);
        const newNote = new notesModel({
            text: payload.text,  
            projectid: payload.id, 
            identifier: customAlphabet('0123456789', 5)(), 
        });

        // Save the note
        const createdNote = await newNote.save();

    return {
        success: true,
        message: "Notes created successfully"
        
    }

};
