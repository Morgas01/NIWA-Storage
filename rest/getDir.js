(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		File:"File",
		util:"File/util",
		Storage:require.bind(null,"../lib/Storage"),
		es:"errorSerializer",
		createStructure:require.bind(null,"../util/createStructure"),
		ServiceResult:"ServiceResult",
		storageManager:require.bind(null,"../util/storageManager"),
    	NodePatch:"NodePatch"
	});

	//gets directory info from filesystem or storage structure
	module.exports=async function(param)
	{
		let data=JSON.parse(param.data||"null");
		if(!data||!data.path)
		{
			return new SC.ServiceResult({status:400,data:'post: {path:"string"[,storage:"name"]}'})
		}
		let dir=new SC.File(worker.shed).changePath(data.path);
		let path=dir.getAbsolutePath();
		let storages=(await SC.storageManager.getAll()).filter(s=>path===s.path||path.startsWith(s.path+SC.File.separator));
		if(await dir.exists().then(()=>true,()=>false))
		{
			return {
				path,
				content:await Promise.all((await dir.listFiles()).map(async name=>SC.createStructure(dir.clone().changePath(name)))),
				storages:storages.map(s=>s.name)
			};
		}
		else if(data.storage)
		{
			let found=storages.find(s=>s.name===data.storage);
			if(found)
			{
				let pathSteps=path.slice(found.path.length+1).split(SC.File.separator);
				if(pathSteps[0]==="") pathSteps.shift();
				if(pathSteps[pathSteps.length-1]==="") pathSteps.pop();
				let dir=SC.NodePatch.traverseTo(found.structure,pathSteps,{key:"name"});
				return {
					path,
					content:dir.children,
					storages:[found.name]
				};
			}
		}
		return {
			path,
			content:null,
			storages:[]
		};
	};

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);

