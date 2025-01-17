import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { deleteOnCloud, uploadOnCloud } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"

const generateAccessTokenAndRefreshToken = async (userId) => {

    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens");

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
        throw new ApiError(404, "User Not found");

    }

    // Check For Password if it is coreect or not
    const passwordValid = await user.isPasswordCorrect(password);
    // console.log(passwordValid);

    if (!passwordValid) {
        throw new ApiError(401, "Entered Password is wrong check again");
    }

    // Getting access and refresh token from generating method
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    const logedInUser = await User.findById(user._id).select("-password -refreshToken");

    // options for cookies security which is saved in server only
    const options = {
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
const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: "" } },
        { new: true }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User Logged Out Successfully"
            )
        )
})

// Generating the new Access Token after its expiration
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = await req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unautorize Request");
    }

    try {
        const decodeToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodeToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh Token Request");
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used");

        }
        const { accessToken, NewRefreshToken } = await generateAccessTokenAndRefreshToken(user._id);
        const options = {
            httpOnly: true,
            secure: true
        }
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", NewRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: NewRefreshToken },
                    "Access Token Refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");

    }
})

// Changing the password
const changeUserPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id)
    const correctPassword = await user.isPasswordCorrect(oldPassword);
    if (!correctPassword) {
        throw new ApiError(400, "Invalid old Password");
    }
    user.password = newPassword;
    user.save({ validateBeforeSave: false });
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password Changed Successfully"))
})

// Getting Current User
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current User Fetched Successfully"))
})

// Updating User Account Profile
const updateAccount = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body;
    if (!fullname || !email) {
        throw new ApiError(401, "Field is Necessary");

    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        { $set: { fullname, email } },
        { new: true }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account Updated successfully"))
})

// Updating Avatar image
const avatarUpdate = asyncHandler(async (req, res) => {//Yet did not add route for that
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar File Required");
    }
    const avatar = await uploadOnCloud(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError("Error while uploading image");
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "User Not Found")
    }
    
    //Deleting old avatar from cloudinary
    const oldAvatarLaocalPath = req.user?.avatar.url;
    const deleteAvatar = await deleteOnCloud(oldAvatarLaocalPath);

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { avatar: avatar.url }
        },
        { new: true }
    ).select("-password -refreshToken")
    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "File updated successfully"))
})

// Updating Cover image
const coverImageUpdate = asyncHandler(async (req, res) => {//Yet did not add route and middleware for that
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image File Required");
    }

    //Deleting old cover image from cloudinary
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "User Not Found")
    }
    const oldCoverImage = user?.coverImage;
    const deleteCoverImage = await deleteOnCloud(oldCoverImage);
    
    const coverImage = await uploadOnCloud(coverImageLocalPath);
    if (!coverImage.url) {
        throw new ApiError("Error while uploading image");

    }
    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { coverImage: coverImage.url }
        },
        { new: true }
    ).select("-password -refreshToken")
    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "File updated successfully"))
})

export { registerUser, loginUser, logOutUser, refreshAccessToken, changeUserPassword, getCurrentUser, updateAccount, avatarUpdate, coverImageUpdate }