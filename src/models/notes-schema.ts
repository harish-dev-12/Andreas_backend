import { Schema, model } from "mongoose";

const notesSchema = new Schema({
    identifier: {type: String,unique: true},
    text: { type: String, required: true },
    projectid: { type: Schema.Types.ObjectId, required: true, ref: "projects" },
}, { timestamps: true })

export const notesModel = model("notes", notesSchema)