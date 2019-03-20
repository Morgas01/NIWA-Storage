(function(µ,SMOD,GMOD,HMOD,SC){


	SC=SC({
		File:"File",
		util:"File/util",
		Storage:require.bind(null,"../lib/Storage"),
		es:"errorSerializer",
		getStructure:require.bind(null,"./getStructure"),
		Node:"NodePatch",
		compare:"NodePatch.Compare",
    	niwaAppWorkDir:"niwaAppWorkDir",
		ServiceResult:"ServiceResult",
	});

	let STORAGE_ROTATION=10;
	let REQUEST_TIMEOUT=120000;

	let storages=new Map();
	let warnings=new Map();
	let pendingRequest=new Map();
	let storageFolder=new SC.File(SC.niwaAppWorkDir);

	//scan and load storages
	let initialized=storageFolder.listFiles()
	.then(files=>
	{
		files=files.filter(f=>/\.json$/.test(f));
		µ.logger.info("Scanned files : %j", files);
		files=files.map(function(file)
		{
			file=storageFolder.clone().changePath(file);
			return SC.util.getRotatedFile(file,data=>SC.Storage.fromJSON(JSON.parse(data)))
			.then(function(result)
			{
				if(result.others.length>0)
				{
					let errors=result.others.map(other=>({error:SC.es(other.error),file:other.file.getAbsolutePath()}));
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

	let structureCompare=function(a,b)
	{
		return a.size==b.size&&a.type==b.type;
	};
	let transformCompare=function(compare)
	{
		let rtn={
			missing:[],
			changed:[],
			new:[]
		};

		SC.Node.traverse(compare,function(node)
		{
			if(node.isMissing()) rtn.missing.push(node.oldNode.getPath());
			else if(node.isNew()) rtn.new.push(node.newNode.getPath());
			else if(node.isChanged()) rtn.changed.push(node.newNode.getPath());
		});

		return rtn;
	};

	let manager=module.exports={
		getWarnings:function()
		{
			return initialized.then(()=>
			{
				let rtn={};
				for(let key of warnings.keys())
				{
					rtn[key]=warnings.get(key);
				}
				return rtn;
			});
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
			return initialized.then(()=>
			{
				return Array.from(storages.values());
			});
		},
		save:function(storage)
		{
			let file=storageFolder.clone().changePath(storage.name+".json");
			storages.set(storage.name,storage);

			return file.exists()
			.then(()=>SC.util.rotateFile(file,STORAGE_ROTATION),µ.constantFunctions.pass)
			.then(()=>file.write(JSON.stringify(storage)))
			.then(()=>
			{
				warnings.delete(storage.name);
			});
		},
		add:function(name,path)
		{
			if(storages.has(name))
			{
				return new SC.ServiceResult({status:400,data:"Name already in use"});
			}
			else
			{
				return new SC.File(path).exists()
				.then(function()
				{
					path=this.getAbsolutePath();
					return SC.getStructure(path).then(function(structure)
					{
						return manager.save(new SC.Storage({name,path,structure}));
					});
				},
				function()
				{
					return new SC.ServiceResult({status:400,data:"path does not exists"});
				});
			}
		},
		update:async function(storage)
		{
			let request={
				type:"update",
				storage:storage,
				structure:await SC.getStructure(storage.path)
			};

			let compare=SC.compare.create(request.structure,storage.structure,s=>s.name,structureCompare);
			compare=transformCompare(compare);
			if(compare.new.length>0||compare.changed.length>0||compare.missing.length>0)
			{
				do
				{
					request.token=Date.now().toString(36);
				}
				while(pendingRequest.has(request.token));
				pendingRequest.set(request.token,request);
				request.timer=setTimeout(function()
				{
					pendingRequest.delete(request.token);
				},REQUEST_TIMEOUT);
			}
			return {token:request.token,compare:compare};
		},
		confirmUpdate:function(token)
		{
			let request=pendingRequest.get(token);
			if(!request||request.type!="update") throw "no request for token";//TODO

			pendingRequest.delete(token);
			clearTimeout(request.timer);
			request.storage.structure=request.structure;

			return manager.save(request.storage);
		}
	};

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
