
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
			if(storages.has(param.data.name))
			{
				param.status=400;
				return "Name already in use";
			}
			else
			{
				return new SC.File(param.data.path).exists()
				.then(function()
				{
					param.data.path=this.getAbsolutePath();
					return SC.FStruct.get(param.data.path).then(function(structure)
					{
						param.data.structure=structure;
						return storages.save(new SC.Storage(param.data));
					});
				},
				function()
				{
					param.status=400;
					return "path does not exists";
				});
			}
			var msg=[];
			return storages.get(param.data.name)
			.then(function(results)
			{
				if(results.length>0) msg.push("Name already in use");
				return new SC.File(param.data.path).exists()
				.then(function()
				{
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
	warnings:function()
	{
		return storages.getWarnings();
	},
	list:function()
	{
		return storages.getAll();
	},
	addBackup:function(param)
	{
		var storage=storages.get(param.data.id)
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
				return storages.save(storage);
			},
			function()
			{
				param.status=400;
				return Promise.reject("path does not exists");
			});
		}
	}
};
