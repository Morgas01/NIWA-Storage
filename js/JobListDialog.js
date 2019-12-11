(function(µ,SMOD,GMOD,HMOD,SC){

	let TableConfig=GMOD("gui.TableConfig");
	let Dialog=GMOD("gui.Dialog");

	SC=SC({
		Table:"gui.Table",
		cDate:"converter/date",
		dateFormat:"date/format",
		JobsLiveData:"JobsLiveData"
	});

	let tableConfig=new TableConfig([
		{
			fn:function state(element,data)
			{
				element.dataset.state=data.state
			},
			styleClass:"state"
		},
		{
			fn:function title(element,data)
			{
				element.textContent=data.name;
			},
			styleClass:"title"
		},
		{
			fn:function messages(element,data)
			{
				let progress=element.children[0];
				if(!progress)
				{
					progress=document.createElement("PROGRESS");
					element.appendChild(progress);
				}
				progress.max=data.progressMax;
				progress.value=data.progress;

				let wrapper=element.children[1];
				if(!wrapper)
				{
					wrapper=document.createElement("DIV");
					wrapper.classList.add("messages");
					element.appendChild(wrapper);
				}
				for(let i=wrapper.children.length;i<data.messages.length;i++)
				{
					let message=data.messages[i];

					let entry=document.createElement("DIV");
					entry.classList.add("message");
					if(message.message.startsWith("CRC NOT ok"))
					{
						entry.classList.add("crc-error");
						wrapper.classList.add("has-crc-error");
					}

					let text=document.createElement("SPAN");
					text.classList.add("text");
					if(typeof message.message === "string")
					{
						text.textContent=message.message;
					}
					else
					{
						text.textContent=JSON.stringify(message.message);
					}
					entry.appendChild(text);

					let time=document.createElement("SPAN");
					time.classList.add("time");
					time.textContent=SC.dateFormat(SC.cDate.from(message.time),SC.dateFormat.exactTime);
					entry.appendChild(time);

					wrapper.insertBefore(entry,wrapper.firstChild);
				}
			}
		},
	]);

	SMOD("JobListDialog",µ.Class(Dialog,{
		constructor:function(param={})
		{
			param.modal=true;
			this.mega(`
			<div class="jobs"></div>
			<button data-action="close"/>ok</button>
			`,param);
			this.content.classList.add("JobListDialog");

			this.liveData=new SC.JobsLiveData();
			this.liveData.addEventListener("liveDataEvent",this,this.onLiveDataEvent);

			this.table=new SC.Table(tableConfig);
		},
		onLiveDataEvent(event)
		{
			switch(event.type)
			{
				case "init":
					event.data.forEach(this.table.add,this.table);
					this.content.querySelector(".jobs").appendChild(this.table.getTable());
					break;
				case "add":
					this.table.add(event.data);
					break;
				case "update":
					this.table.update(event.data);
					break;
				default:
					µ.logger.warn(`unknown event type: ${event.type}`,event);
			}
		}
	}));

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);