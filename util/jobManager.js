(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		Job:require.bind(null,"../lib/Job"),
		Task:"Task",
		File:"File",
		fileUtil:"File/util",
		storageManager:require.bind(null,"./storageManager"),
		Promise:"Promise",
		es:"errorSerializer",
		caught:"caught"
	});

	let extractChecksum=/.*[\[\(]([0-9a-fA-F]{8})[\)\]]/;
	let nextJobID=0;

	let updateJob=worker.eventSource("job",()=>jobManager.jobs);

	let jobManager={
		jobs:[],
		copyToDirectory(structures,target,targetStorage)
		{
			let job=new SC.Job({ID:nextJobID++,name:"copy to "+targetStorage+"/"+target.join("/"),action:"copy",structures,target,targetStorage});
			this.jobs.push(job);
			updateJob("add",job);
			this._trigger();
			return {jobID:job.ID};
		},
		async _trigger()
		{
			µ.logger.debug("enter _trigger");

			for(let job of this.jobs)
			{
				if(job.state===SC.Task.states.PENDING)
				{
					SC.caught(()=>this.executeJob(job));
					return;
				}
			}
		},
		executeJob(job)
		{
			µ.logger.debug("enter executeJob");
			switch (job.action)
			{
				case "copy":
					this.executeCopyJob(job);
			}
		},
		executeCopyJob(job)
		{
			µ.logger.debug("enter executeCopyJob");

			job.setState(SC.Task.RUNNING);
			updateJob("start",job);

			let targetStorage=SC.storageManager.get(job.targetStorage);
			let targetDir=new SC.File(targetStorage.path).changePath(...job.target);
			return SC.fileUtil.enshureDir(targetDir)
			.then(async ()=>
			{
				µ.logger.debug("target dir exists");
				let todo=[];
				for(let name in job.structures)
				{
					let storage=SC.storageManager.get(name);
					for(let path of job.structures[name])
					{
						let file=new SC.File(storage.path).changePath(...path);
						todo.push({
							source:file,
							target:targetDir.clone().changePath(file.getName())
						});
					}
				}

				while(todo.length>0)
				{
					let {source,target}=todo.shift();
					job.addMessage("copying "+source.getAbsolutePath());
					updateJob("message",job);
					try
					{
						let isDirectory=(await source.stat()).isDirectory();
						if(isDirectory)
						{
							job.addMessage("flatten directory");
							updateJob("message",job);

							todo.unshift(...(await source.listFiles()).map(f=>({
								source:source.clone().changePath(f),
								target:target.clone().changePath(f)
							})));

							continue;
						}
						await SC.fileUtil.enshureDir(target.getDir())
						await source.copy(target);

						job.addMessage(`finished copy. checking CRC`);
						updateJob("message",job);

						let [sourceCRC,targetCRC]= await Promise.all([
							this.getCRC(source),
							this.calcCRC(target)
						]);

						if(sourceCRC===targetCRC)
						{
							job.addMessage(`CRC ok [${targetCRC}]`);
							updateJob("message",job);
						}
						else
						{
							job.addMessage(`CRC NOT (${sourceCRC}!=${targetCRC})`);
							updateJob("message",job);
						}

					}
					catch(e)
					{
						µ.logger.warn("copyJob error: ",e);
						job.addMessage("failed: "+SC.es(e));
						updateJob("message",job);
					}
				}

				µ.logger.debug("finish");
				job.setState(SC.Task.states.DONE);
				job.addMessage("success");
				updateJob("end",job);
			})
			.catch(e=>
			{
				µ.logger.debug("error",e);
				job.setState(SC.Task.states.FAILED)
				job.addMessage(SC.es(e));
				updateJob("end",job);
			});
		},
		async getCRC(file)
		{
			//TODO check storage structure
			let match=file.getFileName().match(extractChecksum);
			if(!match)
			{
				return SC.fileUtil.calcCRC(file);
			}
			return match[1].toUpperCase();
		},
		/*async*/calcCRC(file)
		{
			return SC.fileUtil.calcCRC(file);
		}
	};

	module.exports=jobManager;

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);