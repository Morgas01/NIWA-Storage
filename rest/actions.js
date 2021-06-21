
let jobManager=require("../util/jobManager"); //start job events

let SC=µ.shortcut({
	ServiceResult:"ServiceResult",
});

module.exports={
	copy:function(param)
	{
		if(!param.data)
		{
			return new SC.ServiceResult({status:400,data:'post: {paths:[paths],target:path,targetStorage:"name"}'});
		}
		else
		{
			let data=JSON.parse(param.data);
			return jobManager.copyToDirectory(data.paths,data.target,data.targetStorage);
		}
	}
};
