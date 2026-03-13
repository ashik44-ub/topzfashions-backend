const Timer = require('./bestdeals.model'); 

// ১. গেট টাইমার (ইউজার সাইডের জন্য)
const getTimer = async (req, res) => {
  try {
    const timerData = await Timer.findOne();
    if (!timerData) {
      return res.status(404).json({ message: "No active sale found!" });
    }
    res.status(200).json(timerData);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ২. আপডেট টাইমার (অ্যাডমিন ড্যাশবোর্ডের জন্য)
const updateTimer = async (req, res) => {
  // এখানে 'image' ডিস্ট্রাকচার করা হয়েছে
  const { endDate, title, discountPercentage, isActive, image } = req.body;

  try {
    const updatedTimer = await Timer.findOneAndUpdate(
      {}, 
      { 
        endDate, 
        title, 
        discountPercentage, 
        isActive,
        image, // ডাটাবেসে সেভ করা হচ্ছে
        updatedAt: Date.now() 
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Timer updated successfully!",
      data: updatedTimer
    });
  } catch (error) {
    res.status(400).json({ message: "Update failed", error: error.message });
  }
};

module.exports = { getTimer, updateTimer };