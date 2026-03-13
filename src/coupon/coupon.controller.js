const Coupon = require('./couponcode.model');

const createCoupon = async (req, res) => {
    try {
        // ১. req.body থেকে startDate ডেসট্রাকচার করুন
        const { code, discountValue, discountType, startDate, expiryDate, isActive, minAmount, description } = req.body;

        // ২. রিকোয়ার্ড ফিল্ড চেক (startDate সহ)
        if (!code || !discountValue || !startDate || !expiryDate) {
            return res.status(400).json({ 
                success: false, 
                message: "Code, Value, Start Date, and Expiry Date are required!" 
            });
        }

        // ৩. নতুন কুপন অবজেক্ট তৈরি
        const newCoupon = new Coupon({
            code: code.trim().toUpperCase(), 
            discountValue: Number(discountValue),
            discountType: discountType || 'percentage',
            startDate: new Date(startDate), // এটি সেভ করা নিশ্চিত করুন
            expiryDate: new Date(expiryDate), 
            isActive: isActive !== undefined ? isActive : true,
            minAmount: Number(minAmount) || 0,
            description: description || ""
        });

        const savedCoupon = await newCoupon.save();
        
        res.status(201).json({ 
            success: true,
            message: "Coupon Created Successfully!", 
            data: savedCoupon 
        });

    } catch (error) {
        console.error("Create Coupon Error:", error);
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: "Coupon code already exists!" 
            });
        }
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// const applyCoupon = async (req, res) => {
//     try {
//         const { code, cartTotal } = req.body; // ফ্রন্টএন্ড থেকে কার্ট টোটাল পাঠানো ভালো

//         if (!code) {
//             return res.status(400).json({ success: false, message: "Please provide a coupon code!" });
//         }

//         // ১. কুপনটি ডাটাবেসে আছে কি না এবং Active কি না দেখা
//         const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), isActive: true });
        
//         if (!coupon) {
//             return res.status(404).json({ success: false, message: "Invalid or inactive coupon code!" });
//         }

//         // ২. মেয়াদের তারিখ চেক করা (Expiry Date Check)
//         const currentDate = new Date();
//         if (currentDate > new Date(coupon.expiryDate)) {
//             return res.status(400).json({ success: false, message: "This coupon has expired!" });
//         }

//         // ৩. মিনিমাম অর্ডারের শর্ত চেক করা (যদি ফ্রন্টএন্ড থেকে cartTotal পাঠানো হয়)
//         if (cartTotal && cartTotal < coupon.minAmount) {
//             return res.status(400).json({ 
//                 success: false, 
//                 message: `Minimum order of Tk. ${coupon.minAmount} required for this coupon!` 
//             });
//         }

//         // ৪. সব ঠিক থাকলে সাকসেস রেসপন্স
//         res.status(200).json({ 
//             success: true,
//             message: "Coupon Applied Successfully!", 
//             discountValue: coupon.discountValue, 
//             discountType: coupon.discountType,
//             minAmount: coupon.minAmount
//         });

//     } catch (error) {
//         console.error("Apply Coupon Error:", error);
//         res.status(500).json({ success: false, message: "An error occurred while applying the coupon." });
//     }
// };

const applyCoupon = async (req, res) => {
    try {
        const { code, cartTotal } = req.body; 

        if (!code) {
            return res.status(400).json({ success: false, message: "Please provide a coupon code!" });
        }

        // ১. কুপনটি খুঁজে বের করা (isActive: true ফিল্টার ছাড়াই খুঁজি যাতে সঠিক এরর মেসেজ দেওয়া যায়)
        const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
        
        if (!coupon || !coupon.isActive) {
            return res.status(404).json({ success: false, message: "Invalid or inactive coupon code!" });
        }

        const currentDate = new Date();

        // ২. শুরুর তারিখ চেক করা (Start Date Check) - নতুন যোগ করা হলো
        if (currentDate < new Date(coupon.startDate)) {
            return res.status(400).json({ 
                success: false, 
                message: `This coupon will be valid from ${new Date(coupon.startDate).toLocaleDateString('en-GB')}` 
            });
        }

        // ৩. মেয়াদের তারিখ চেক করা (Expiry Date Check)
        if (currentDate > new Date(coupon.expiryDate)) {
            return res.status(400).json({ success: false, message: "This coupon has expired!" });
        }

        // ৪. মিনিমাম অর্ডারের শর্ত চেক করা
        if (cartTotal && cartTotal < coupon.minAmount) {
            return res.status(400).json({ 
                success: false, 
                message: `Minimum order of Tk. ${coupon.minAmount} required for this coupon!` 
            });
        }

        // ৫. সব ঠিক থাকলে ডিসকাউন্ট ডাটা পাঠানো
        res.status(200).json({ 
            success: true,
            message: "Coupon Applied Successfully!", 
            discountValue: coupon.discountValue, 
            discountType: coupon.discountType,
            minAmount: coupon.minAmount
        });

    } catch (error) {
        console.error("Apply Coupon Error:", error);
        res.status(500).json({ success: false, message: "An error occurred while applying the coupon." });
    }
};
const allcoupon = async (req, res) => {
    try {
        // আপনার মডেলের নাম অনুযায়ী (ধরি Coupon)
        const coupons = await Coupon.find().sort({ createdAt: -1 }); 
        res.status(200).json(coupons);
    } catch (error) {
        res.status(500).json({ message: "Error fetching coupons", error: error.message });
    }
}

const couponCode = async (req, res) => {
    try {
        const coupon = await Coupon.findOne({ code: req.params.code });
        if (!coupon) {
            return res.status(404).json({ message: "Coupon is not Found" });
        }
        res.json(coupon);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        
        // আইডি দিয়ে কুপন খুঁজে ডিলিট করা
        const deletedCoupon = await Coupon.findByIdAndDelete(id);

        if (!deletedCoupon) {
            return res.status(404).json({ 
                success: false, 
                message: "Coupon not found!" 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: "Coupon deleted successfully!" 
        });

    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// ৩. ফাংশনগুলো এক্সপোর্ট
module.exports = { createCoupon, applyCoupon, couponCode, allcoupon, deleteCoupon };