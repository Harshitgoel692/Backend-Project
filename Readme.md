# 🎥 Video Hosting Platform

A full-stack video hosting application built with **Node.js**, **Express.js**, and **MongoDB**. This project emulates core functionalities of platforms like YouTube, allowing users to upload, stream, and interact with video content.

## 🚀 Features

- **User Authentication**: Secure sign-up and login using JWT and bcrypt.
- **Video Upload & Streaming**: Users can upload videos, which are stored and streamed efficiently.
- **Comment System**: Nested comments enable users to engage in discussions.
- **Subscriptions**: Users can subscribe to other channels to receive updates.
- **Search Functionality**: Search for videos by title or description.
- **Responsive Design**: Frontend built with HTML, CSS, and JavaScript for a seamless user experience.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, bcrypt
- **API Testing**: Postman
- **Version Control**: Git, GitHub

## 📁 Project Structure

Backend-Project/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── utils/
├── public/
│   └── temp/
├── .gitignore
├── package.json
└── README.md

## ⚙️ Installation & Setup

1. **Clone the repository**:

    git clone https://github.com/Harshitgoel692/Backend-Project.git
    cd Backend-Project

2. **Install dependencies**:

    npm install

3. **Configure environment variables**:

    Create a `.env` file in the root directory and add the following:
    
    PORT=5000 MONGODB_URI=your_mongodb_connection_string JWT_SECRET=your_jwt_secret


4. **Start the server**:

   npm start

   The server will run on `http://localhost:5000`.

## 🧪 API Endpoints

- **User Routes**:
- `POST /api/auth/register`: Register a new user.
- `POST /api/auth/login`: Authenticate user and return token.

- **Video Routes**:
- `POST /api/videos`: Upload a new video.
- `GET /api/videos`: Retrieve all videos.
- `GET /api/videos/:id`: Retrieve a specific video.

- **Comment Routes**:
- `POST /api/comments/:videoId`: Add a comment to a video.
- `GET /api/comments/:videoId`: Retrieve comments for a video.

## 🧑‍💻 Author

- **Harshit Goel**
- [GitHub](https://github.com/Harshitgoel692)
- [LinkedIn](https://www.linkedin.com/in/harshit-goel-29289b200/)

