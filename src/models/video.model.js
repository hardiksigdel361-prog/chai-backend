import mongoose, {Schema} from "mongoose";

import jwtoken from "jsonwebtoken"

import bcrypt from "bcryptjs"
const videoSchema = new Schema(
    {
       videoFile: {
            type: String, // cloudinary url
            required: true
       },
        thumbnail: {
            type: String, // cloudinary url
            required: true
       },
        title: {
            type: String, 
            required: true
       },
       description : {
            type: String, 
            required: true
       },
       durationn : {
            type: Number, 
            required: true,
        },
        views:{
            type: Number,
            default: 0
         },
         isPublished:{
            type: Boolean,
            default: true
         },
         owner:{
            type: Schema.Types.ObjectId,
            ref: "User"
         }
       },   
       {
        timestamps: true     
    } ,  


 videoSchema.plugin(mongooseAggregatePaginate),
 videoSchema.pre("save",async function () {
    if(!this.isModified("password")) return next();

    this.password = bcrypt.hash(this.password, 10)
    next()
 }),

 videoSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
   }
)
videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)