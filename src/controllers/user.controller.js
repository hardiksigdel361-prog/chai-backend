import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken
    const refreshToken = user.generateRefreshToken

    user.refreshToken = refreshToken

    return { accessToken, refreshTokkken }

  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token")
  }
}
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  console.log("BODY:", req.body);
  console.log("FILES:", req.files);

  // Validation
  if (
    [fullName, email, username, password].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check existing user
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  // FILE PATHS (FIXED)
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  console.log("avatarLocalPath:", avatarLocalPath);
  console.log("coverImageLocalPath:", coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // Upload
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!avatar) {
    throw new ApiError(400, "Avatar upload failed");
  }

  // Create user
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "User creation failed");
  }

  return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered successfully")
  );
});

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  // find the user
  // password check
  // access and refresh token
  // send cookie

  const { email, username, password } = req.body

  if (username || !email) {
    throw new ApiError(400, "username or password is required")
  }

  const user = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (!user) {
    throw new ApiError(404, "User does not exist")

  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user crendentials")
  }


  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

  const loggedInUSer = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true
  }

  return res.ststus(200)
    .cookie("accessToken", options)
    .cookie("refreshToken", refreshToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUSer.accesstoken.refreshtoken

        },
        "User logged In Successfully"
      )
    )
})



const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: 1 // this remove the field from document
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }


  return (res)
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))

})


const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToen =req.cookies.refreshToken || req.body.refreshToken
  await user.save({ validateBeforeSave: false })
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.ACCESS_TOKEN_SECRET
    )
  
    const user = await User.findById(decodedToken?._id)
    if (!user) {
      throw new ApiError(401, "Invalid refresh token")
    }
  
    if (!incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used")
  
    }
  
    const options = {
      httpOnly: true,
      secure: true
    }
    const{accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
  
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {accessToken, refreshToken: newRefreshToken},
        "Access Token Refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(401, error?.message ||"Invalid refresh token" )
  }
})

const changeCurrentPassword = asyncHandler(async(req,res) =>{
  const {olsPassword, newPassword} = req.body 

  const user = await User.findById(req.user?._id)
  const isPasswordCorrect  = awaituser.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect){
    throw new ApiError(400, "Invalid old password")
  }

  user.password = newPassword
  await user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
 return res
 .status(200)
 .json(200, req.user, "current user fetched successfully")

})

const updateAccountDetails = asyncHandler(async(req, res) => {
  const {fullName, email} = req.body

  if (!fullname || !email){
    throw new ApiError(400, "All fields are required")
      }

    const User =await User.findByIdAndUpdate(
      req.user?._id,
    {
      $set: {
        fullName,
        email: email
      }
    },
    {new: true}

    ).select("-password")

    return res
  .status(200)
  .json(
    new ApiResponse(200, user, "Avatar image updated successfully")
  )

    return res
    .status(200)
    .json(newApiResponse(200, user, "Account details updated successfully"))
})

const updateUserCoverImage = asyncHandler(async(req, res) => 
  {
  const coverImageLocalPath =  req.file?.path

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing")
  }

  const coverTmage = await uploadOnCloudinary(coverImageLocalPath)
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,

    {
      $set:{
        coverImage: coverImage.url 
      }
    },

    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200, user, "Cover image updated successfully")
  )
})

 const updateUserAvatar=asyncHandler(async(req,res)=>
  {
  const avatarLocalPath = req.file?.path

  if (!avatarLocalPath){
    throw new ApiError(400, "Avatar file is missing")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(avatar.url){
    throw new ApiError(400, "Errpr while uploading on avatar")

  }

  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar: avatar.url
      }
    },
    {new: true}
  ).select("-password")
})

const getUserChannelProfile = asyncHandler(async(req, res) => {
  const {usernamereq} = req.params

  if (!username?.trim()){
    throw new ApiError(400, "username is missing")
  }
const channel = await User.aggregate([
  {
    $match: {
      username: username?.toLowerCase()
    }
  },
  {
    $lookup: {
      from: "Subscription",
      localField: "_id",
      foreignField: "channel",
      as: "subscriber"
    }
  },
  {
    $lookup: {
      from: "Subscription",
      localField: "_id",
      foreignField: "subscriber",
      as: "subscribedTo"
    }
  },
  {
    $addFields: {
      subscribersCount: {
        $size: "$subscribers"
      },
      channelsSubscribedToCount: {
        $size: "$subscribedTo"
      },
      isSubscribed: { 
      $cond: {
        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
        then: true,
        else: false
      }
      }}
  },
  {
    $project: {
      fullName: 1,
      username: 1,
      subscribersCount: 1,
      channelIsSubscribed: 1,
      isSubscribed: 1,
      avatar: 1,
      CoverImage: 1,
      email: 1
    }
  }
])
if (!channel?.length) {
  throw new ApiError(404, "channel doesnot exists")
}

return res
.status(200)
.json(
  newApiResponse(200, channel[0], "User channel fetched successfully")
)
})

const getWatchHistory = asyncHandler(async(req, res) => {
  const user = await User.aggregate([
   {
    $match: {
      _id: new mongoose.Types.ObjectId(req.user._id)
    }
   },
   {
    $lookup: {
      from: "videos",
      localField: "watchHistory",
      foreignField: "_id",
      as: "watchHistory",
      pipeline: [
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
            pipeline: [
              {
                $project: {
                  fulName: 1,
                  username: 1,
                  avatar: 1
                }
              },
              {
               $addFields:{
                   owner:{
                    $first: "$owner"
                   }
               } 
              }
            ]
          }
        }
      ]
    }
   }
  ])

return res
.ststus(200)
.json(
  new ApiResponse(
    200,
    user[0].watchHistory,
    "Watch history fetched successfully" 
  )
)  
})


export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};