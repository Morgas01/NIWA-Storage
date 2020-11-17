
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
		if(!param.data)
		{
			return new SC.ServiceResult({status:400,data:'post: {name:"string"}'});
		}
		let data=JSON.parse(param.data);
		let storage=SC.storageManager.get(data.name);
		if(!storage)
		{
			return new SC.ServiceResult({status:400,data:`storage ${data.name} does not exist`});
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
				if(!param.data)
				{
					return new SC.ServiceResult({status:400,data:'post: {token:"string"}'});
				}
				let data=JSON.parse(param.data);
				return SC.storageManager.confirmUpdate(data.token);
			default:
				return new SC.ServiceResult({status:400,data:`cannot confirm ${param.path[0]}`});
		}
	},
	getDir:function(param)
	{

		if(!param.data)
		{
			return new SC.ServiceResult({status:400,data:'post: {name:"string",path:"string"}'});
		}
		let data=JSON.parse(param.data);
		let storage=SC.storageManager.get(data.name);
		if(!storage)
		{
			return new SC.ServiceResult({status:400,data:`storage ${data.name} does not exist`});
		}
		else
		{
			return SC.storageManager.getDir(storage,data.path);
		}
	}
};
