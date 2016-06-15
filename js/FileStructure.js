(function(µ,SMOD,GMOD,HMOD,SC){
	
	var NodePatch=GMOD("NodePatch");
	
	SC=SC({
		File:"File"
	});
	
	var FSTRUC=µ.Class(NodePatch.Basic,{
		init:function(name,fsStats)
		{
			this.mega();
			
			this.name=name;
			this.isFile=typeof fsStats.isFile=="function"?fsStats.isFile():fsStats.isFile;
			this.size=fsStats.size;
			this.atime=fsStats.atime;
			this.mtime=fsStats.mtime;
			this.ctime=fsStats.ctime;
		},
		addChildren:function(children)
		{
			return children.map(child=>this.addChild(child));
		},
		getPath:function()
		{
			var path="";
			var struct=this;
			while(struct)
			{
				path="/"+struct.name+path;
				struct=struct.parent;
			}
			return path;
		},
		toJSON:function()
		{
			return {
				name:this.name,
				isFile:this.isFile,
				size:this.size,
				atime:this.atime,
				mtime:this.mtime,
				ctime:this.ctime,
				children:this.children
			};
		}
	});
	
	FSTRUC.get=function(file)
	{
		return SC.File.stringToFile(file).stat()
		.then(function(stats)
		{
			var rtn=new FSTRUC(this.getFileName(),stats);
			if(!rtn.isFile)
			{
				return this.listFiles()
				.then(function(files)
				{
					return Promise.all(files.map(f=>FSTRUC.get(this.clone().changePath(f))))
					.then(function(children)
					{
						rtn.addChildren(children);
						rtn.size=children.map(c=>c.size).reduce((a,b)=>a+b,0);
						return rtn;
					});
				})
			}
			else return rtn;
		});
	};
	
	module.exports=SMOD("FileStructure",FSTRUC);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);