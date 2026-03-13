const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: String,
  bio: { type: String, maxlength: 200 },
  profession: String,
  // --- নতুন যোগ করা ফিল্ড ---
  dob: { type: String }, 
  gender: { type: String },
  // -----------------------
  role: {
    type: String,
    default: 'user'
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  otp: { 
    type: String 
  },
  otpExpire: { 
    type: Date 
  },
  createdAt: { type: Date, default: Date.now }
});

// hash password (আগের মতোই থাকবে)
userSchema.pre('save', async function() {
    const user = this;
    if (!user.isModified('password')) return;
    try {
        const hashPassword = await bcrypt.hash(user.password, 10);
        user.password = hashPassword;
    } catch (error) {
        throw error;
    }
});

userSchema.methods.comparePassword = function (candidatePassword){
  return bcrypt.compare(candidatePassword, this.password)
}

const User = model('User', userSchema);
module.exports = User;