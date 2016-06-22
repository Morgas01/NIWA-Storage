
var SC=µ.shortcut({
	File:"File",
	FileUtil:"File.util",
	FStruct:require.bind(null,"../js/FileStructure"),
	Storage:require.bind(null,"../js/storage")
});
var storages=require("../lib/storageManager");

module.exports={
	add:function(param)
	{
		if(!param.data)
		{
			param.status=400;
			return Promise.reject('post: {name:"string",path:"string"}');
		}
		else
		{
			var msg=[];
			return storages.load(SC.Storage,{name:param.data.name})
			.then(function(results)
			{
				if(results.length>0) msg.push("Name already in use");
				return new SC.File(param.data.path).exists()
				.then(function()
				{
						console.log("add 2");
					console.log(msg);
					if(msg.length==0)
					{
						param.data.path=this.getAbsolutePath();
						return SC.FStruct.get(param.data.path).then(function(structure)
						{
							param.data.structure=structure;
							return storages.save(new SC.Storage(param.data));
						});
					}
					else
					{
						param.status=400;
						return Promise.reject(msg.join("\n"));
					}
				},
				function()
				{
					msg.push("path does not exists");
				});
			})
			.catch(function(error)
			{
				µ.logger.error(error);
				return Promise.reject(error);
			});
		}
	},
	list:function()
	{
		return storages.load(SC.Storage,{},"name");
	},
	addBackup:function(param)
	{
		return storages.load(SC.Storage,{ID:param.data.id})
		.then(function(result)
		{
			console.log(result);
			var storage=result[0];
			if(!storage)
			{
				param.status=400;
				return Promise.reject(`storage ${param.data.id} does not exist`);
			}
			else if (param.data.name in storage.backups)
			{
				param.status=400;
				return Promise.reject(`storage ${param.data.id} does already has backup with this name (${param.data.name})`);
			}
			else
			{
				return new SC.File(param.data.path).exists()
				.then(function()
				{
					storage.backups[param.data.name]=this.getAbsolutePath();
					return storages.save([storage]);
				},
				function()
				{
					param.status=400;
					return Promise.reject("path does not exists");
				});
			}
		});
	}
};