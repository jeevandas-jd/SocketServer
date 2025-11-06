
const User = require('../../models/authentication/User');


const Transaction = require('../../models/transactionModel');



const buyToken = async (req, res) => {

    try{
        const {ammount} = req.body;
    const userId = req.user.id;

    const User= await User.findById(userId);
    if(!User){
        return res.status(404).json({message:"User not found"});
    }
    User.token= User.token + ammount;
    await User.save();
 }
    catch(error){
        console.error(error);
        res.status(500).json({message:"Server error", error:error.message});
    }
}

module.exports={buyToken};