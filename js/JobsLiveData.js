(function(µ,SMOD,GMOD,HMOD,SC){

	let LiveDataSource=GMOD("LiveDataSource");

	SC=SC({});

	let JobsLiveData=µ.Class(LiveDataSource,{
		constructor:function(param={})
		{
			param.url="event/job";
			this.mega(param);
		},
		events:Object.assign({},LiveDataSource.prototype.events,{
			start(event)
			{
				let data=JSON.parse(event.data);
				if(this.parser)data=this.parser(data);

				let id=this.key(data);
				let index=this.data.findIndex(d=>this.key(d)===id);
				if(index!==-1)
				{
					let old=this.data[index];
					old.state=data.state;
					this.reportEvent(new LiveDataSource.LiveDataEvent({type:"update",data:old}));
				}
				else µ.logger.warn(`LiveDataSource [${this.url}] unknown data start [${id}]`);
			},
			message(event)
			{
				let data=JSON.parse(event.data);
				if(this.parser)data=this.parser(data);

				let id=this.key(data);
				let index=this.data.findIndex(d=>this.key(d)===id);
				if(index!==-1)
				{
					let old=this.data[index];
					old.messages=data.messages;
					old.lastProgress=data.lastProgress;
					old.lastProgressDate=data.lastProgressDate;
					old.progress=data.progress;
					old.progressDate=data.progressDate;

					this.reportEvent(new LiveDataSource.LiveDataEvent({type:"update",data:old}));
				}
				else µ.logger.warn(`LiveDataSource [${this.url}] unknown data message [${id}]`);
			},
			end(event)
			{

				let data=JSON.parse(event.data);
				if(this.parser)data=this.parser(data);

				let id=this.key(data);
				let index=this.data.findIndex(d=>this.key(d)===id);
				if(index!==-1)
				{
					let old=this.data[index];
					old.state=data.state;
					old.messages=data.messages;
					old.lastProgress=data.lastProgress;
					old.lastProgressDate=data.lastProgressDate;
					old.progress=data.progress;
					old.progressDate=data.progressDate;

					this.reportEvent(new LiveDataSource.LiveDataEvent({type:"update",data:old}));
				}
				else µ.logger.warn(`LiveDataSource [${this.url}] unknown data message [${id}]`);
			}
		})
	});

	SMOD("JobsLiveData",JobsLiveData);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);