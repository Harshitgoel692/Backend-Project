import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloud } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"

// Registering the user
const registerUser = asyncHandler(async (req, res) => {

    // Taking user information 
    const { fullname, email, password, username } = req.body;

    // Checking if any necessary field is empty or not
    if (
        [fullname, email, password, username].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are necesaary");
    }

    // Checing if user already exist or not
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "Username or email already exist!!!!");
    }

    // Adding cover image and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;

    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.body.coverImage[0].path;
    }
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is necessary");
    }

    // Uploading file on cloudinary
    const avatar = await uploadOnCloud(avatarLocalPath);
    const coverImage = await uploadOnCloud(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is necessary");
    }

    // Adding user to database
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        username: username.toLowerCase(),
        password
    })

    // Checking if user added on db or not and removing the confidential infos from it
    const userCreated = await User.findById(user._id).select("-password -refreshToken");
    if (!userCreated) {
        throw new ApiError(500, "Something went wrong while registering");
    }

    // return the response
    return res.status(201).json(
        new ApiResponse(200, userCreated, "User Registered Successfully")
    )
})

export { registerUser }