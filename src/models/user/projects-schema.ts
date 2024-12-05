//write schema here for projects collection with fields like name, user_id, created_at, updated_at, avatarId optional
import { Schema, model } from "mongoose";

const projectsSchema = new Schema({
    projectName: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "users" },
    projectimageLink: { type: String, required: true },
    projectstartDate: { type: String, required: true },
    projectendDate: { type: String, required: true },
    description: { type: Boolean, required: true },
    attachments: { type: String, required: false },
    status: { type: String, required: false },
    notes: { type: String, required: false },
}, { timestamps: true })

export const projectsModel = model("projects", projectsSchema)