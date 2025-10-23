const Pilot = require("../../models/authentication/PilotUser");
const pilot=require("../../models/authentication/PilotUser")



// update pilot isLive status
exports.UpdatePilotStatus=async(req,res)=>{
    try{
        ;
        const pilotId=req.user.id;
        console.log("Pilot ID from token:", pilotId);

        const PilotUser=await pilot.findById(pilotId);
        if(!PilotUser){
            return res.status(404).json({message:"Pilot not found"});
        }
        const currentStatus=PilotUser.isLive;
        console.log("Current isLive status:", currentStatus);

        const isLive=!currentStatus; // toggle status

        PilotUser.isLive=isLive;
        if (isLive){
            PilotUser.onBench = true;
        } 
        if(!isLive){
            PilotUser.onBench = false;
        }// if pilot is live, then not on bench
        await PilotUser.save();
        console.log("Updated isLive status:", PilotUser.isLive);

        res.status(200).json({message:"Pilot status updated successfully",isLive:PilotUser.isLive});

    }catch(err){
        console.log(err);
        res.status(500).json({error:err.message});
    }
};