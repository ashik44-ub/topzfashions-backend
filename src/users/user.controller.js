const generateToken = require("../middleware/generateToken");
const { errorResponse, successResponse } = require("../utils/responseHanlder");
const User = require("./user.model");
const sendEmail = require('../utils/sendEmail');



const userRegister = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // ১. ইমেইল আগে থেকেই আছে কি না চেক করা
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser.isVerified) {
            return res.status(400).send({ message: "Email already registered!" });
        }

        // ২. ৬ ডিজিটের OTP তৈরি করা
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpire = new Date(Date.now() + 3 * 60 * 1000); // ১০ মিনিট মেয়াদ

        // ৩. ইউজার তৈরি বা আপডেট করা (যদি আগে ভেরিফাই না করে থাকে)
        let user = await User.findOne({ email });
        if (user) {
            user.username = username;
            user.password = password; // পাসওয়ার্ড হ্যাশ করে নেওয়া ভালো
            user.otp = otp;
            user.otpExpire = otpExpire;
        } else {
            user = new User({ username, email, password, otp, otpExpire });
        }

        await user.save();

        // ৪. ইমেইল পাঠানো (Nodemailer ফাংশন কল করা)
        await sendEmail({
            email: user.email,
            subject: "Your Registration OTP - Topz Fashions",
            otp: otp // এখানে 'message' এর বদলে শুধু 'otp' পাঠান
        });

        res.status(200).send({
            success: true,
            message: "OTP sent to your email. Please verify!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Registration Failed!" });
    }
};

const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).send({ message: "User not found!" });

        // OTP এবং মেয়াদের সময় চেক করা
        if (user.otp !== otp || new Date() > user.otpExpire) {
            return res.status(400).send({ message: "Invalid or Expired OTP!" });
        }

        // সব ঠিক থাকলে ইউজারকে ভেরিফাইড করা
        user.isVerified = true;
        user.otp = undefined; // ক্লিনআপ
        user.otpExpire = undefined;
        await user.save();

        res.status(200).send({ success: true, message: "Account verified successfully!" });

    } catch (error) {
        res.status(500).send({ message: "Verification Failed!" });
    }
};

const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required!" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found with this email!" });
        }

        // নতুন OTP এবং টাইম তৈরি
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpire = new Date(Date.now() + 3 * 60 * 1000); // ৩ মিনিট (আপনার রেজিস্ট্রেশন টাইমের সাথে মিল রেখে)

        // ডাটাবেসে আপডেট (লক্ষ্য করুন: রেজিস্ট্রেশনে আপনি 'otpExpire' নাম ব্যবহার করেছেন, তাই এখানেও সেটিই দিন)
        user.otp = otp;
        user.otpExpire = otpExpire; 
        await user.save();

        console.log("Sending Resend OTP to:", user.email);
        
        // রেজিস্ট্রেশন ফাংশনের মতো এখানেও 'Object' আকারে ডাটা পাঠান
        await sendEmail({
            email: user.email,
            subject: "Your New OTP - Topz Fashions",
            otp: otp 
        });

        return res.status(200).json({
            success: true,
            message: "A new OTP has been sent to your email!"
        });

    } catch (error) {
        console.error("Resend OTP Error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        // ১. ইমেইল আছে কি না চেক করা
        if (!email) {
            return res.status(400).json({ message: "Email is required!" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        // ২. ওটিপি তৈরি
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpire = new Date(Date.now() + 5 * 60 * 1000); // ৩ মিনিটের বদলে ৫ মিনিট দিতে পারেন নিরাপদ থাকার জন্য
        
        await user.save();

        // ৩. ইমেইল পাঠানো (অবজেক্ট আকারে পাঠানো হচ্ছে যেহেতু আপনার sendEmail এটিই গ্রহণ করে)
        await sendEmail({
            email: user.email,
            subject: "Reset Your Password - Topz Fashions",
            otp: otp
        });

        res.status(200).json({ 
            success: true,
            message: "OTP sent to your email!" 
        });

    } catch (error) {
        console.error("Forgot Password Error:", error.message);
        res.status(500).json({ message: "Something went wrong, please try again!" });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        
        // ১. ইউজারকে খুঁজে বের করা এবং ওটিপি চেক করা
        const user = await User.findOne({ 
            email, 
            otp, 
            otpExpire: { $gt: Date.now() } 
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // ২. পাসওয়ার্ড আপডেট (আপনার মডেল অনুযায়ী এটি অটো হ্যাস হবে যদি প্রি-সেভ হুক থাকে)
        user.password = newPassword; 

        // ৩. সবচেয়ে গুরুত্বপূর্ণ অংশ: ইউজারকে ভেরিফাইড মার্ক করা
        user.isVerified = true; 
        
        // ৪. ওটিপি ডাটা ক্লিনআপ
        user.otp = undefined;
        user.otpExpire = undefined;
        
        await user.save();

        res.status(200).json({ 
            success: true,
            message: "Password reset successful! Your account is now verified." 
        });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const userLoggedIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        // পাসওয়ার্ড কম্পেয়ার করার সময় bcrypt এরর দিচ্ছে কি না তা চেক করুন
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).send({ message: "Invalid user password" });
        }

        // টোকেন জেনারেট করার সময় এরর হলে এটি ধরবে
        const token = await generateToken(user._id);
        if (!token) {
            throw new Error("Token generation failed");
        }

        // কুকি সেট করা
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,      // HTTPS এ ট্রু হতে হবে
            sameSite: "none"   // ছোট হাতের অক্ষরে লেখা ভালো
        });

        return res.status(200).send({
            message: "Logged in successfully",
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage, // বানান ঠিক করা হয়েছে
                bio: user.bio,
                profession: user.profession
            }
        });

    } catch (error) {
        // এই কনসোল লগটি Vercel Logs এ দেখা যাবে আসল সমস্যা ধরার জন্য
        console.error("Error Login User:", error.message);
        res.status(500).send({ 
            message: "Login failed", 
            error: error.message // ডেভেলপমেন্টের জন্য এটি পাঠাতে পারেন আসল ভুল দেখতে
        });
    }
}

// logout router code
const userlogout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        });
        successResponse(res, 200, "Logged Out Successfully")
    } catch (error) {
        errorResponse(res, 500, "logged out failed", error)
    }
}

// get all pawar jonno route
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, 'email role username').sort({ createdAt: -1 });
        return successResponse(res, 200, "All Users Fetch Success", data = users)
    } catch (error) {
        return errorResponse(res, 500, "Failed to Fetch Users")
    }
}

// delete users
const deleteUser = async (req, res) => {
    const { id } = req.params
    try {
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return errorResponse(res, 404, "User not found")
        }
        return successResponse(res, 200, "User Deleted Successfully")
    } catch (error) {
        errorResponse(res, 500, "Delete user Failed", error)
    }
}

// user update route
const updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    try {
        const updatedUser = await User.findByIdAndUpdate(id, { role }, { new: true });
        if (!updatedUser) {
            return errorResponse(res, 500, "user not Update")
        }
        return successResponse(res, 200, "user Role Updated Successfully")
    } catch (error) {
        errorResponse(res, 500, " user update Failed", error)
    }
}

//edit user profile
// const editUserProfile = async (req, res) => {
//     const { id } = req.params;
//     // ১. এখানে dob এবং gender যোগ করতে হবে
//     const { username, profileImage, bio, profession, dob, gender } = req.body; 

//     try {
//         const updateFields = {
//             username,
//             profileImage,
//             bio,
//             profession,
//             dob,    // ২. এই ফিল্ডগুলো ডাটাবেসে পাঠানোর জন্য যোগ করুন
//             gender
//         };

//         const updateUser = await User.findByIdAndUpdate(id, updateFields, { new: true });

//         if (!updateUser) {
//             return errorResponse(res, 404, "User profile not updated");
//         }

//         // ৩. গুরুত্বপূর্ণ: সাকসেস রেসপন্সের সাথে আপডেট হওয়া ইউজার ডাটা (updateUser) পাঠাতে হবে
//         return res.status(200).send({
//             message: "User Profile Updated Successfully",
//             user: updateUser // এটি ফ্রন্টএন্ডে Redux আপডেট করতে সাহায্য করবে
//         });

//     } catch (error) {
//         return errorResponse(res, 500, "User profile Update Failed", error);
//     }
// };

// const editUserProfile = async (req, res) => {
//     const { id } = req.params;
//     const { username, profileImage, bio, profession, dob, gender, email } = req.body; 

//     try {
//         // ১. ইমেইল পরিবর্তন করতে চাইলে সেটি ইউনিক কি না চেক করা
//         if (email) {
//             const existingUser = await User.findOne({ email, _id: { $ne: id } });
//             if (existingUser) {
//                 return res.status(400).json({ message: "এই ইমেইলটি ইতিমধ্যে অন্য একজন ব্যবহার করছেন!" });
//             }
//         }

//         const updateFields = {
//             username,
//             profileImage,
//             bio,
//             profession,
//             dob,
//             gender,
//             email // ২. ইমেইল ফিল্ডটি এখানে যোগ করা হয়েছে
//         };

//         // ৩. ডাটাবেস আপডেট করা
//         const updateUser = await User.findByIdAndUpdate(
//             id, 
//             { $set: updateFields }, 
//             { new: true, runValidators: true } 
//         );

//         if (!updateUser) {
//             return res.status(404).json({ message: "ইউজার পাওয়া যায়নি বা আপডেট হয়নি" });
//         }

//         return res.status(200).send({
//             message: "User Profile & Email Updated Successfully",
//             user: updateUser 
//         });

//     } catch (error) {
//         console.error("Update Error:", error);
//         return res.status(500).json({ message: "সার্ভারে সমস্যা হয়েছে", error: error.message });
//     }
// };

const editUserProfile = async (req, res) => {
    const { id } = req.params;
    const { username, profileImage, bio, profession, dob, gender, email, oldPassword, newPassword } = req.body;

    try {
        // ১. ইউজারকে খুঁজে বের করা
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ২. পাসওয়ার্ড পরিবর্তনের লজিক (যদি নতুন পাসওয়ার্ড দেওয়া হয়)
        if (newPassword) {
            if (!oldPassword) {
                return res.status(400).json({ message: "Old password is required to set a new one" });
            }
            // পুরনো পাসওয়ার্ড চেক করা
            const isMatch = await user.comparePassword(oldPassword);
            if (!isMatch) {
                return res.status(400).json({ message: "Current password does not match" });
            }
            // নতুন পাসওয়ার্ড সেট করা (এটি pre-save হুকের মাধ্যমে হ্যাশ হবে)
            user.password = newPassword;
        }

        // ৩. ইমেইল পরিবর্তনের লজিক (ইউনিকনেস চেকসহ)
        if (email && email !== user.email) {
            const emailExist = await User.findOne({ email });
            if (emailExist) {
                return res.status(400).json({ message: "Email already in use by another account" });
            }
            user.email = email;
        }

        // ৪. অন্যান্য ফিল্ড আপডেট
        user.username = username || user.username;
        user.profileImage = profileImage || user.profileImage;
        user.bio = bio || user.bio;
        user.profession = profession || user.profession;
        user.dob = dob || user.dob;
        user.gender = gender || user.gender;

        // ৫. ডাটাবেসে সেভ করা (এটিই সবচেয়ে নিরাপদ পদ্ধতি)
        const updatedUser = await user.save();

        // রেসপন্স থেকে পাসওয়ার্ড সরিয়ে ফেলা
        const userResponse = updatedUser.toObject();
        delete userResponse.password;

        return res.status(200).json({
            message: "Profile updated successfully",
            user: userResponse
        });

    } catch (error) {
        console.error("Update Error:", error);
        return res.status(500).json({ message: "Update Failed", error: error.message });
    }
};

module.exports = {
    userRegister,
    userLoggedIn,
    userlogout,
    getAllUsers,
    deleteUser,
    updateUserRole,
    editUserProfile,
    verifyOTP,
    forgotPassword,
    resetPassword,
    resendOTP
}