(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		File:"File",
		util:"File/util",
		Storage:require.bind(null,"../lib/Storage"),
		es:"errorSerializer",
		createStructure:require.bind(null,"../util/createStructure"),
		ServiceResult:"ServiceResult",
		storageManager:require.bind(null,"../util/storageManager"),
    	niwaAppWorkDir:"niwaAppWorkDir",
	});

	module.exports=async function(param)
	{
		if(!param.data||!param.data.path)
		{
			return new SC.ServiceResult({status:400,data:'post: {path:"string"[,storage:"name"]}'})
		}
		let dir=new SC.File(SC.niwaAppWorkDir).changePath(param.data.path);
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
		else if(param.data.storage)
		{
			let found=storages.find(s=>s.name===param.data.storage);
			if(found)
			{
				return {
					path,
					content:SC.NodePatch.traverseTo(found.structure,path.slice(found.path.length+1),{key:"name",separator:SC.File.separator}),
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

