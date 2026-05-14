const mongoose = require('mongoose');
require('dotenv').config();

// 1. Updated Chat Schema with Name and Email Fields
const chatSchema = new mongoose.Schema({
    name: {type: String, required: true},
    phoneNumber: {type: String, required: true},
    email: {type: String, required: true},
    role: {type: String, required: true},
    message: {type: String, required: true},
    timestamp: {type: Date, default: Date.now}
});

const Chat = mongoose.model('Chat', chatSchema);

//2. Database Connection Function
const connectDB = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');
    } catch(err){
        console.error(`❌ MongoDB Connection Failed: ${err.message}`);
        process.exit(1);
    }
};

    
module.exports = { connectDB, Chat };