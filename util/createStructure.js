
let SC=µ.shortcut({
	File:"File",
	Structure:require.bind(null,"../lib/Structure"),
});

let createStructure=async function(path)
{
	let file=SC.File.stringToFile(path);

	let stat=await file.stat();
	let param={
		name:file.getName(),
		atime:stat.atime,
		mtime:stat.mtime,
	};
	if(stat.isFile())
	{
		param.size=stat.size;
		return new SC.Structure.File(param);
	}
	else
	{
		return new SC.Structure.Directory(param);
	}
};

module.exports=createStructure;