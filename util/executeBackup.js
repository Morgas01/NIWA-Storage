var SC=µ.shortcut({
	File:"File",
	FileUtil:"File/util"
});

/* TODO
module.exports=function(storage,changes)
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
*/