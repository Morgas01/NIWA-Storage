
let SC=µ.shortcut({
	File:"File",
	FileUtil:"File/util",
	ServiceResult:"ServiceResult",
	storageManager:require.bind(null,"../util/storageManager")
});

module.exports={
	add:function(param)
	{
		if(!param.data)
		{
			return new SC.ServiceResult({status:400,data:'post: {name:"string",path:"string"}'});
		}
		else
		{
			let data=JSON.parse(param.data);
			return SC.storageManager.add(data.name,data.path);
		}
	},
	warnings:function()
	{
		return SC.storageManager.getWarnings();
	},
	list:function()
	{
		return SC.storageManager.getAll();
	},
	update:function(param)
	{
		let storage=SC.storageManager.get(param.data.name)
		if(!storage)
		{
			return new SC.ServiceResult({status:400,data:`storage ${param.data.name} does not exist`});
		}
		else
		{
			return SC.storageManager.update(storage);
		}
	},
	confirm:function(param)
	{
		switch(param.path[0])
		{
			case "update":
				return SC.storageManager.confirmUpdate(param.data.token);
			default:
				return new SC.ServiceResult({status:400,data:`cannot confirm ${param.path[0]}`});
		}
	},
	getDir:function(param)
	{

		let storage=SC.storageManager.get(param.data.name)
		if(!storage)
		{
			return new SC.ServiceResult({status:400,data:`storage ${param.data.name} does not exist`});
		}
		else
		{
			return SC.storageManager.getDir(storage,param.data.path);
		}
	}
};
