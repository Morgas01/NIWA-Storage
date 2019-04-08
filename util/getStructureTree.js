
let createStructure=require("./createStructure")

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
		let structure=await createStructure(file);

		if(structure.type==="Directory")
		{
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