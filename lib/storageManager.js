(function(µ,SMOD,GMOD,HMOD,SC){


	var SC=SC({
		File:"File",
		util:"File.util",
		Storage:require.bind(null,"../js/storage"),
		es:"errorSerializer"
	});

	var STORAGE_ROTATION=10;

	var storages=new Map();
	var warnings=new Map();
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
					var errors=result.others.map(other=>({error:SC.es(other.error),file:other.file.getAbsolutePath()}));
					µ.logger.warn({errors:errors},"errors loading file "+file.getAbsolutePath());
					warnings.set(file.getName(),errors);
				}
				storages.set(result.data.name,result.data);
			},
			function(errors)
			{
				errors=errors.map(other=>({error:SC.es(other.error),file:other.file.getAbsolutePath()}));
				µ.logger.warn({errors:errors},"could not load any file");
				warnings.set(file.getName(),errors);
			});
		});
		return Promise.all(files);
	}).catch(µ.logger.error);

	module.exports={
		getWarnings:function()
		{
			var rtn={};
			for(var key of warnings.keys())
			{
				rtn[key]=warnings.get(key);
			}
			return rtn;
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
			warnings.delete(storage.name);
		}
	};

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
