const mongoose = require('mongoose');
const cron = require('node-cron');

const couponSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true, 
        uppercase: true, 
        trim: true 
    }, 
    discountType: { 
        type: String, 
        enum: ['percentage', 'fixed'], 
        default: 'percentage' 
    },
    discountValue: { 
        type: Number, 
        required: true 
    },
    startDate: { 
        type: Date, 
        required: true 
    },
    expiryDate: { 
        type: Date, 
        required: true 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    minAmount: { 
        type: Number, 
        default: 0 
    },
    description: { 
        type: String 
    }
}, { timestamps: true });

// কুপন মডেল তৈরি
const Coupon = mongoose.model('Coupon', couponSchema);

// --- অটোমেটিক এক্সপায়ার লজিক (Cron Job) ---
// প্রতিদিন রাত ১২টা ১ মিনিটে চেক করবে
cron.schedule('1 0 * * *', async () => {
    try {
        const currentDate = new Date();
        
        // expiryDate পার হয়ে গেছে কিন্তু এখনো isActive true আছে এমন কুপনগুলো খুঁজবে
        const result = await Coupon.updateMany(
            { 
                expiryDate: { $lt: currentDate }, 
                isActive: true 
            },
            { 
                $set: { isActive: false } 
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`[Cron Job]: ${result.modifiedCount}টি কুপন মেয়াদ শেষ হওয়ায় ইনঅ্যাক্টিভ করা হয়েছে।`);
        }
    } catch (error) {
        console.error("[Cron Job Error]:", error);
    }
});

module.exports = Coupon;