import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloud } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"

const generateAccessTokenAndRefreshToken = async (userId) => {
    
    try {
        const user=await User.findById(userId)
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating access and refresh tokens");
        
    }
}

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

// Login the user
const loginUser = asyncHandler(async (req, res) => {
    // take values from user
    // all values to be filled are necessary
    // check user existed in db or not, if not then tell the user to register first
    // after registring send user access token

    // Taking values from user
    const { username, password, email } = req.body;
    if (!(username || email)) {
        throw new ApiError(400, "Username and email is necessary");
    }

    // Check for user 
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(400, "User Not found");

    }

    // Check For Password if it is coreect or not
    const passwordValid = await User.isPasswordCorrect(password);
    console.log(passwordValid);

    if (!passwordValid) {
        throw new ApiError(401, "Entered Password is wrong check again");
    }

    // Getting access and refresh token from generating method
    const {accessToken, refreshToken}= await generateAccessTokenAndRefreshToken(user._id);

    const logedInUser=await User.findById(user_id).select("-password", "-refreshToken");

    // options for cookies security which is saved in server only
    const options={
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: logedInUser, accessToken, refreshToken
            },
            "Logged in Successfully"
        )
    )
})

// Logging out the user
const logOutUser=asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(req.user._id, {
        $set: {refreshToken: ""}
    })
    const options={
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie(accessToken, options)
    .clearCookie(refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {},
            "User Logged Out Successfully"
        )
    )
})

export { registerUser, loginUser, logOutUser }