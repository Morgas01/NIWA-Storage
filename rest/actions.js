
let SC=µ.shortcut({
	ServiceResult:"ServiceResult",
	jobManager:require.bind(null,"../util/jobManager")
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
			return SC.jobManager.copyToDirectory(param.data.structures,param.data.target,param.data.targetStorage);
		}
	}
};
