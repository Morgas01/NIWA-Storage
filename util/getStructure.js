
let SC=µ.shortcut({
	File:"File",
	Structure:require.bind(null,"../lib/Structure"),
});

let getStructure=async function(path)
{
	let todo=[{parent:null,file:SC.File.stringToFile(path)}];
	let root=null;

	for(let {parent,file} of todo)
	{
		let stat=await file.stat();
		let param={
			name:file.getName(),
			atime:stat.atime,
			mtime:stat.mtime,
		};
		let structure=null;
		if(stat.isFile())
		{
			param.size=stat.size;
			structure=new SC.Structure.File(param);
		}
		else
		{
			structure=new SC.Structure.Directory(param);
			for(let entry of await file.listFiles())
			{
				todo.push({parent:structure,file:file.clone().changePath(entry)});
			}
		}
		if(parent!=null) parent.addChild(structure);
		else root=structure
	}

	return root;
};

module.exports=getStructure;