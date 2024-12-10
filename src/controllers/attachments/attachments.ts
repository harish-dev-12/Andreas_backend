import { Request, Response } from "express";
import mongoose from "mongoose";
import { httpStatusCode } from "src/lib/constant";
import { errorParser } from "src/lib/errors/error-response-handler";
import { getAattachmentsService ,deleteAattachmentService, createattachmentService} from "src/services/attachments/attachments";
import { formatZodErrors } from "src/validation/format-zod-errors";




export const getAattattachment = async (req: Request, res: Response) => {
    try {
        const response = await getAattachmentsService(req.params.id, res)
        return res.status(httpStatusCode.OK).json(response)
    } catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}


export const deleteAattachment = async (req: Request, res: Response) => {
    try {
        const response = await deleteAattachmentService(req.params.id, res)
        return res.status(httpStatusCode.OK).json(response)
    } catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}


export const createattachment = async (req: Request, res: Response) => {
    try {
        const response = await createattachmentService({ id:req.params.id, ...req.body}, res)
        return res.status(httpStatusCode.CREATED).json(response)
    } catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}