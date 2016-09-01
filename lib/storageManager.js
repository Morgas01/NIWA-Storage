(function(µ,SMOD,GMOD,HMOD,SC){


	var SC=SC({
		File:"File",
		util:"File.util",
		Storage:require.bind(null,"../js/storage")
	});

	var STORAGE_ROTATION=10;

	var storages=new Map();
	var warings=new Map();
	var storageFolder=new SC.File(__dirname).changePath("../storages");

	SC.util.enshureDir(storageFolder)
	.then(()=>storageFolder.listFiles())
	.then(files=>
	{
		files=files.filter(f=>/\.json$/.test(f));
		µ.logger.info("Scanned files : %j", files);
		files=files.map(function(file)
		{
			file=storageFolder.clone().changePath(file);
			return SC.util.getRotatedFile(file,data=>(new SC.Storage()).fromJSON(JSON.parse(data)))
			.then(function(result)
			{
				if(result.others.length>0)
				{
					var errors=result.others.map(other=>({error:other.error,file:other.file.getAbsolutePath()}));
					µ.logger.warn({errors:errors},"errors loading file "+file.getAbsolutePath());
					warings.set(file.getName(),errors);
				}
				storages.set(result.data.name,result.data);
			},
			function(errors)
			{
				errors=errors.map(other=>({error:other.error,file:other.file.getAbsolutePath()}));
				µ.logger.warn({errors:errors},"could not load any file");
				warings.set(file.getName(),errors);
			});
		});
		return Promise.all(files);
	}).catch(µ.logger.error);

	module.exports={
		warnings:function()
		{
			return warnings;
		},
		has:function(name)
		{
			return storages.has(name);
		},
		get:function(name)
		{
			return storages.get(name);
		},
		getAll:function()
		{
			return Array.from(storages.values());
		},
		save:function(storage)
		{
			var file=storageFolder.clone().changePath(storage.name+".json");
			storages.set(storage.name,storage);
			file.exists().then(()=>SC.util.rotateFile(file,STORAGE_ROTATION),µ.constantFunctions.pass).then(()=>file.write(JSON.stringify(storage)));
		}
	};

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
