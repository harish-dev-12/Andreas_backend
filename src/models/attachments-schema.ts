import { Schema, model } from "mongoose";

const attachmentsSchema = new Schema({
    identifier: {type: String,unique: true},
    url: { type: String, required: true },
    projectid: { type: Schema.Types.ObjectId, required: true, ref: "projects" },
    createdby: { type: Schema.Types.ObjectId, required: true, ref: "users" },
}, { timestamps: true })

export const attachmentsModel = model("attachments", attachmentsSchema)