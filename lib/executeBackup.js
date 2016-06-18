var SC=µ.shortcut({
	Promise:"Promise",
	File:"File",
	FileUtil:"File.util",
	crc:"util.crc32",
	itAs:"iterateAsync"
});

module.exports=function(storage,changes)
{
	var sourceFolder=new SC.File(storage.path);
	
	return SC.itAs(changes,function(i,diff)
	{
		µ.logger.info("execute backup for "+diff.name );
		
		var backupresult={
			name:diff.name,
			created:[],
			changed:[],
			deleted:[],
			error:null
		};
		
		//CREATED
		var outputFolder=new SC.File(diff.name);
		
		//DELETED
		return SC.itAs(diff.changes.deleted,function(i,path)
		{
			µ.logger.info("delete "+path);
			var rtn={file:path};
			return outputFolder.clone().changePath(path).remove()
			.then(function()
			{
				console.log(arguments);
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
			backupresult.deleted=deletedResult;
			return backupresult;
		},
		function(deletedResult)
		{
			if(deletedResult instanceof Array)
			{
				backupresult.deleted=deletedResult;
				backupresult.error=deletedResult[deletedResult.length-1].error;
			}
			else backupresult.error=deletedResult;
			return Promise.reject(backupresult);
		})
		.then(function()
		{
			//CHANGED
			return SC.itAs(diff.changes.changed,function(i,path)
			{
				µ.logger.info("copy changed "+path);
				var target=outputFolder.clone().changePath(path);
				var rtn={file:path};
				return  SC.FileUtil.enshureDir(target.clone().changePath(".."))
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
				backupresult.changed=changedResult;
				return backupresult;
			},
			function(changedResult)
			{
				if(changedResult instanceof Array)
				{
					backupresult.changed=changedResult;
					backupresult.error=changedResult[changedResult.length-1].error;
				}
				else backupresult.error=changedResult;
				return Promise.reject(backupresult);
			});
		})
		.then(function()
		{
			return SC.itAs(diff.changes.created,function(i,path)
			{
				µ.logger.info("copy new "+path);
				var target=outputFolder.clone().changePath(path);
				var rtn={file:path};
				return SC.FileUtil.enshureDir(target.clone().changePath(".."))
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
				backupresult.created=createdResult;
				return backupresult;
			},
			function(createdResult)
			{
				if(createdResult instanceof Array)
				{
					backupresult.created=createdResult;
					backupresult.error=createdResult[createdResult.length-1].error;
				}
				else backupresult.error=createdResult;
				return Promise.reject(backupresult);
			});
		});
	});
};