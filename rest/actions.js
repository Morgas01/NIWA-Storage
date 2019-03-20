
let jobManager=require("../util/jobManager"); //start job events

let SC=µ.shortcut({
	ServiceResult:"ServiceResult",
});

module.exports={
	copy:function(param)
	{
		if(!param.data)
		{
			return new SC.ServiceResult({status:400,data:'post: {structures:{[ID]:[paths]},target:path,targetStorage:"name"}'});
		}
		else
		{
			return jobManager.copyToDirectory(param.data.structures,param.data.target,param.data.targetStorage);
		}
	}
};