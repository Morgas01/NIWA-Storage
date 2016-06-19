var BACKUP_REQUEST_TIMEOUT=120000;
var STORAGE_ROTATION=3;

var SC=µ.shortcut({
	Promise:"Promise",
	File:"File",
	FileUtil:"File.util",
	FStruct:()=>require("../js/FileStructure"),
	treeCompare:"NodePatch.treeCompare",
	crc:"util.crc32",
	executeBackup:()=>require("../lib/executeBackup"),
	it:"iterate",
	itAs:"iterateAsync"
});
//*
var storage_a=require("../storages/A");
var mapStructure=function(s)
{
	var rtn=new SC.FStruct(s.name,s);
	for(var c of s.children) rtn.addChild(mapStructure(c));
	return rtn;
}
storage_a.structure=mapStructure(storage_a.structure);
var storages=new Map([["A",storage_a]]);
/*/
var storages=new Map();
//*/
var backupRequests=new Map();
var BACKUP_RUNNING={};

module.exports={
	add:function(param)
	{
		var msg=[];
		if(storages.has(param.data.name)) msg.push("Name already in use");
		return new SC.File(param.data.path).exists()
		.catch(function()
		{
			msg.push("path does not exists");
		})
		.then(function()
		{
			if(msg.length==0)
			{
				param.data.path=this.getAbsolutePath();
				param.data.backups={};
				storages.set(param.data.name,param.data);
				return SC.FStruct.get(param.data.path).then(function(structure)
				{
					param.data.structure=structure;
					return saveStorage(param.data);
				});
			}
			else
			{
				param.status=400;
				return Promise.reject(msg.join("\n"));
			}
		});
	},
	list:function()
	{
		var rtn=[];
		for(v of storages.values())rtn.push(v);
		return rtn;
	},
	addBackup:function(param)
	{
		var storage=storages.get(param.data.id);
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
				return saveStorage(storage);
			},
			function()
			{
				param.status=400;
				return Promise.reject("path does not exists");
			});
		}
	},
	doBackup:function(param)
	{
		var storage=storages.get(param.data.id);
		if(!storage)
		{
			param.status=400;
			return Promise.reject(`"storage ${param.data.id} does not exist"`);
		}
		else if(backupRequests.has(storage))
		{
			param.status=409;
			return Promise.reject(`"storage ${param.data.id} is busy"`);
		}
		else
		{
			var fileStructures={
				storage:null,
				backupStructures:{}
			};
			return Promise.all([
				SC.FStruct.get(storage.path).then(c=>fileStructures.storage=c),
				SC.itAs(storage.backups,(k,p)=>SC.FStruct.get(p).then(c=>fileStructures.backupStructures[k]=c))
			])
			.then(function()
			{
				var changes={
					storage:SC.treeCompare(storage.structure,fileStructures.storage,"name",compareFileStructure),
					backupChanges:{}
				}
				SC.it(fileStructures.backupStructures,(k,c)=>changes.backupChanges[k]=SC.treeCompare(c,fileStructures.storage,"name",compareFileStructure));
				var backupTask={
					changes:changes,
					token:SC.crc(JSON.stringify(changes)+Date.now()),
					normalizedChanges:{
						storageName:storage.name,
						storage:normalizeChanges(changes.storage),
						backupChanges:{}	
					}
				};
				SC.it(changes.backupChanges,(k,c)=>backupTask.normalizedChanges.backupChanges[k]=normalizeChanges(c));
				backupRequests.set(storage,backupTask);
				backupTask.timer=setTimeout(function(){backupRequests.delete(storage)},BACKUP_REQUEST_TIMEOUT);
				backupTask.timer.unref();
				
				return {
					id:storage.name,
					token:backupTask.token,
					changes:backupTask.normalizedChanges
				};
			}).catch(µ.logger.error);
		}
	},
	executeBackup:function(param)
	{
		
		var storage=storages.get(param.data.id);
		var backupTask=backupRequests.get(storage);
		if(!storage)
		{
			param.status=400;
			return Promise.reject(`storage ${param.data.id} does not exist`);
		}
		else if(!backupTask||backupTask.token!=param.data.token)
		{
			param.status=401;
			return Promise.reject("401 Unauthorized");
		}
		else
		{
			backupTask.token=BACKUP_RUNNING;
			clearTimeout(backupTask.timer);
			SC.executeBackup(storage,backupTask.normalizedChanges.backupChanges)
			.then(function(result)
			{
				µ.logger.info(result,"finished backup")
			},
			function(result)
			{
				µ.logger.error(result,"failed backup")
			});
			return "ok";
		}
	},
	cancelBackup:function(param)
	{
		
		var storage=storages.get(param.data.id);
		var backupTask=backupRequests.get(storage);
		if(!storage)
		{
			param.status=400;
			return Promise.reject(`storage ${param.data.id} does not exist`);
		}
		else if(!backupTask||backupTask.token!=param.data.token)
		{
			param.status=401;
			return Promise.reject("401 Unauthorized");
		}
		else
		{
			clearTimeout(backupTask.timer);
			return backupRequests.delete(storage);
		}
	}
};
var saveStorage=function(storage)
{
	return new SC.File("storages").changePath(storage.name+".json")
	.exists()
	.then(function()
	{
		return SC.FileUtil.rotateFile(this,STORAGE_ROTATION);
	},µ.constantFunctions.pass)
	.then(function()
	{
		this.write(JSON.stringify(storage,null,"\t"));
	}).then(function(){return this.getAbsolutePath()});
};
var compareFileStructure=function(old,fresh)
{
	return	old.size	== fresh.size
	&&		old.isFile	== fresh.isFile
	/*&&		""+old.atime	== ""+fresh.atime
	&&		""+old.mtime	== ""+fresh.mtime
	&&		""+old.ctime	== ""+fresh.ctime
	*/;
};
var normalizeChanges=function(compare)
{
	return {
		created:compare.created.map(c=>c.fresh).reduce((a,f)=>
		{
			if(!f.isFile)
			{
				a.push.apply(a,f.children);
			}
			else a.push(f);
			return a;
		},[]).map(f=>f.getPath().split("/").slice(2).join("/")).sort(),
		changed:compare.changed.filter(c=>c.fresh.isFile).map(c=>c.fresh.getPath().split("/").slice(2).join("/")).sort(),
		deleted:compare.deleted.map(c=>c.old).reduce((a,f)=>
		{
			if(!f.isFile)
			{
				a.push.apply(a,f.children);
			}
			else a.push(f);
			return a;
		},[]).map(f=>f.getPath().split("/").slice(2).join("/")).sort(),
	};
};