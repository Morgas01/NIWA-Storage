var BACKUP_REQUEST_TIMEOUT=120000;

var SC=µ.shortcut({
	File:"File",
	FileUtil:"File.util",
	FStruct:require.bind(null,"../js/FileStructure"),
	treeCompare:"NodePatch.treeCompare",
	crc:"util.crc32",
	it:"iterate",
	itAs:"iterateAsync",
	Storage:require.bind(null,"../js/storage")
});
var storages=require("../lib/storageManager");

var backupRequests=new Map();
var BACKUP_RUNNING={};


var compareFileStructure=function(old,fresh)
{
	return	old.size	== fresh.size
	&&		old.isFile	== fresh.isFile;
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


module.exports={
	request:function(param)
	{
		var storage = storages.get(param.data.id)
		if(!storage)
		{
			param.status=400;
			return Promise.reject(`"storage ${param.data.id} does not exist"`);
		}
		else if(backupRequests.has(storage.ID))
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
				SC.itAs(storage.backups,(k,p)=>SC.FStruct.get(p).then(c=>fileStructures.backupStructures[k]=c)).catch(r=>Promise.reject(r.pop()))
			])
			.then(function()
			{
				var changes={
					storage:SC.treeCompare(storage.structure,fileStructures.storage,"name",compareFileStructure),
					backupChanges:{}
				}
				SC.it(fileStructures.backupStructures,(k,c)=>changes.backupChanges[k]=SC.treeCompare(c,fileStructures.storage,"name",compareFileStructure));
				var backupTask={
					storage:storage,
					storageStructure:fileStructures.storage,
					changes:changes,
					token:SC.crc(JSON.stringify(changes)+Date.now()),
					normalizedChanges:{
						storageName:storage.name,
						storage:normalizeChanges(changes.storage),
						backupChanges:{}
					}
				};
				SC.it(changes.backupChanges,(k,c)=>backupTask.normalizedChanges.backupChanges[k]=normalizeChanges(c));
				backupRequests.set(param.data.id,backupTask);
				backupTask.timer=setTimeout(function(){backupRequests.delete(storage.ID)},BACKUP_REQUEST_TIMEOUT);
				backupTask.timer.unref();

				return {
					token:backupTask.token,
					changes:backupTask.normalizedChanges
				};
			});
		}
	},
	confirm:function(param)
	{

		var backupTask=backupRequests.get(param.data.id);
		if(!backupTask||backupTask.token!=param.data.token)
		{
			param.status=401;
			return Promise.reject("401 Unauthorized");
		}
		else
		{
			backupTask.token=BACKUP_RUNNING;
			clearTimeout(backupTask.timer);

			var storage=storages.get(param.data.id)
			if(storage)
			{
				storage.structure=backupTask.storageStructure;
				storages.save(storage);

				var backupPromise=executeBackup(backupTask.storage,backupTask.normalizedChanges.backupChanges);
				backupPromise.always(function()
				{
					backupRequests.delete(param.data.id);
				})
				return backupPromise;
			}
			else return Promise.reject({error:"no such storage",id:param.data.id});
		}
	},
	cancel:function(param)
	{
		var backupTask=backupRequests.get(param.data.id);
		if(!backupTask||backupTask.token!=param.data.token)
		{
			param.status=401;
			return Promise.reject("401 Unauthorized");
		}
		else
		{
			clearTimeout(backupTask.timer);
			return backupRequests.delete(param.data.id);
		}
	}
};
var executeBackup=function(storage,changes)
{
	var sourceFolder=new SC.File(storage.path);

	var backupresult={error:null};
	return SC.itAs(changes,function(name,diff)
	{
		µ.logger.info("execute backup for "+name );
		var result=backupresult[name]={
			created:[],
			changed:[],
			deleted:[],
			error:null
		};

		//CREATED
		var outputFolder=new SC.File(storage.backups[name]);

		//DELETED
		return SC.itAs(diff.deleted,function(i,path)
		{
			µ.logger.info("delete "+path);
			var rtn={file:path};
			return outputFolder.clone().changePath(path).remove()
			.then(function()
			{
				µ.logger.info("finished delete "+path);
				rtn.success=true;
				return rtn
			},
			function(error)
			{
				µ.logger.error("failed to delete "+path,error);
				rtn.success=false;
				rtn.error=error;
				return Promise.reject(rtn);
			});
		})
		.then(function(deletedResult)
		{
			result.deleted=deletedResult;
			return result;
		},
		function(deletedResult)
		{
			µ.logger.error(deletedResult);
			if(deletedResult instanceof Array)
			{
				result.deleted=deletedResult;
				result.error=deletedResult[deletedResult.length-1].error;
			}
			else result.error=deletedResult;
			return Promise.reject(result);
		})
		.then(function()
		{
			//CHANGED
			return SC.itAs(diff.changed,function(i,path)
			{
				µ.logger.info("copy changed "+path);
				var target=outputFolder.clone().changePath(path);
				var rtn={file:path};
				return  SC.FileUtil.enshureDir(target.getDir())
				.then(()=>sourceFolder.clone().changePath(path).copy(target.getAbsolutePath(),true))
				.then(function()
				{
					µ.logger.info("finished copy "+path);
					rtn.success=true;
					return rtn
				},
				function(error)
				{
					µ.logger.error("failed to copy "+path,error);
					rtn.success=false;
					rtn.error=error;
					return Promise.reject(rtn);
				});
			})
			.then(
			function(changedResult)
			{
				result.changed=changedResult;
				return result;
			},
			function(changedResult)
			{
				µ.logger.error(changedResult);
				if(changedResult instanceof Array)
				{
					result.changed=changedResult;
					result.error=changedResult[changedResult.length-1].error;
				}
				else result.error=changedResult;
				return Promise.reject(result);
			});
		})
		.then(function()
		{
			return SC.itAs(diff.created,function(i,path)
			{
				µ.logger.info("copy new "+path);
				var target=outputFolder.clone().changePath(path);
				var rtn={file:path};
				return SC.FileUtil.enshureDir(target.getDir())
				.then(()=>sourceFolder.clone().changePath(path).copy(target.getAbsolutePath(),false))
				.then(function()
				{
					µ.logger.info("finished copy "+path);
					rtn.success=true;
					return rtn
				},
				function(error)
				{
					µ.logger.error("failed to copy "+path,error);
					rtn.success=false;
					rtn.error=error;
					if(error==="FILE_EXISTS")
					{
						return rtn;
					}
					else return Promise.reject(rtn);
				});
			}).then(function(createdResult)
			{
				result.created=createdResult;
				return result;
			},
			function(createdResult)
			{
				µ.logger.error(createdResult);
				if(createdResult instanceof Array)
				{
					result.created=createdResult;
					result.error=createdResult[createdResult.length-1].error;
				}
				else result.error=createdResult;
				return Promise.reject(result);
			});
		});
	})
	.then(()=>backupresult,
	e=>{
		µ.logger.error(e);
		backupresult.error=e;
		return backupresult;
	});
};
